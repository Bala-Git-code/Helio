process.env.NODE_ENV = 'test';
require('dotenv').config();
const assert = require('assert');
const mongoose = require('mongoose');
const connectDB = require('../config/db');

// Models
const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const Medication = require('../models/Medication');
const DoseInstance = require('../models/DoseInstance');
const ReminderPlan = require('../models/ReminderPlan');
const ReminderAttempt = require('../models/ReminderAttempt');
const RefillLedgerEvent = require('../models/RefillLedgerEvent');
const MedicationAttentionItem = require('../models/MedicationAttentionItem');
const JobState = require('../models/JobState');

// Services
const scheduleEngine = require('../services/medication/ScheduleEngine');
const doseInstanceEngine = require('../services/medication/DoseInstanceEngine');
const doseStateMachine = require('../services/medication/DoseStateMachine');
const reminderPlanningEngine = require('../services/medication/ReminderPlanningEngine');
const deliveryOrchestrator = require('../services/medication/DeliveryOrchestrator');
const responseProcessingEngine = require('../services/medication/ResponseProcessingEngine');
const followUpEngine = require('../services/medication/FollowUpEngine');
const escalationEngine = require('../services/medication/EscalationPolicyEngine');
const voiceIntentEngine = require('../services/medication/VoiceIntentEngine');

async function cleanDB(userId, medId) {
  await User.deleteMany({ _id: userId });
  await PatientProfile.deleteMany({ userId });
  await Medication.deleteMany({ userId });
  await DoseInstance.deleteMany({ patientId: userId });
  await ReminderPlan.deleteMany({ patientId: userId });
  await RefillLedgerEvent.deleteMany({ patientId: userId });
  await MedicationAttentionItem.deleteMany({ patientId: userId });
  await JobState.deleteMany({});
}

async function runSuite() {
  console.log('=== STARTING MEDICATION INTELLIGENCE RUNTIME INTEGRATION TESTS ===');
  await connectDB();

  // Create mock patient and medication IDs
  const patientId = new mongoose.Types.ObjectId();
  const medId = new mongoose.Types.ObjectId();

  try {
    await cleanDB(patientId, medId);

    // 1. Create Patient User & Patient Profile
    console.log('[Test] Creating mock patient and profile...');
    await User.create({
      _id: patientId,
      name: 'Integration Test Patient',
      email: `test_${Date.now()}@helio.care`,
      password: 'password123',
      role: 'patient'
    });

    await PatientProfile.create({
      userId: patientId,
      displayName: 'Integration Test Patient',
      phone: '+919999999999',
      familyMembers: [
        { name: 'Caregiver Sis', relationship: 'Sister', phone: '+918888888888' }
      ]
    });

    // 2. Schedule Engine tests (Timezone Local Dosing)
    console.log('[Test] Asserting ScheduleEngine timezone-safety...');
    const dummyMed = new Medication({
      userId: patientId,
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Daily',
      times: ['08:00', '20:00'],
      startDate: new Date('2026-07-06T00:00:00Z'),
      active: true
    });

    // Generate occurrences for 2026-07-06 UTC
    const startWin = new Date('2026-07-06T00:00:00Z');
    const endWin = new Date('2026-07-06T23:59:59Z');
    
    // In UTC timezone
    const utcOccurrences = scheduleEngine.getNextOccurrences(dummyMed, startWin, endWin, 'UTC');
    assert.strictEqual(utcOccurrences.length, 2, 'Should generate exactly 2 daily slots in UTC');
    assert.strictEqual(utcOccurrences[0].localTime, '08:00');
    assert.strictEqual(utcOccurrences[0].expectedTime.getUTCHours(), 8);

    // In India Standard Time (UTC+5:30)
    const istOccurrences = scheduleEngine.getNextOccurrences(dummyMed, startWin, endWin, 'Asia/Kolkata');
    assert.strictEqual(istOccurrences.length, 2, 'Should generate 2 daily slots in Asia/Kolkata');
    
    // Verify that the actual UTC date of the 08:00 local time slot corresponds to 02:30 UTC (8:00 - 5:30)
    assert.strictEqual(istOccurrences[0].expectedTime.getUTCHours(), 2);
    assert.strictEqual(istOccurrences[0].expectedTime.getUTCMinutes(), 30);
    console.log('  -> ScheduleEngine calculations match local offsets perfectly.');

    // 3. Dose Instance Engine (Rolling Horizonal Generation)
    console.log('[Test] Asserting DoseInstanceEngine generation horizon & idempotency...');
    
    // Save medication
    dummyMed._id = medId;
    await dummyMed.save();

    // Run rolling generator for 7 days
    const firstRunCount = await doseInstanceEngine.generateRollingInstances(patientId, 7);
    assert.ok(firstRunCount > 0, 'Doses must be generated');

    // Run again - verify idempotency
    const secondRunCount = await doseInstanceEngine.generateRollingInstances(patientId, 7);
    const totalDosesCount = await DoseInstance.countDocuments({ patientId });
    
    // Verify that double running does not duplicate the rows
    assert.strictEqual(totalDosesCount, firstRunCount, 'Dose instance rolling generation must be 100% idempotent');
    console.log(`  -> DoseInstanceEngine generated ${firstRunCount} unique scheduled items successfully.`);

    // 4. Dose State Machine Transitions
    console.log('[Test] Asserting DoseStateMachine constraints...');
    const testDose = await DoseInstance.findOne({ patientId });
    assert.ok(testDose, 'Target test dose slot must exist');
    assert.strictEqual(testDose.status, 'SCHEDULED');

    // Make valid transition
    await doseStateMachine.transition(testDose._id, 'DUE');
    let reloadedDose = await DoseInstance.findById(testDose._id);
    assert.strictEqual(reloadedDose.status, 'DUE');

    // Make invalid transition (should throw)
    let threwTransitionError = false;
    try {
      await doseStateMachine.transition(testDose._id, 'SCHEDULED'); // DUE -> SCHEDULED is illegal
    } catch (err) {
      threwTransitionError = true;
    }
    assert.ok(threwTransitionError, 'DoseStateMachine must reject illegal transitions');
    console.log('  -> DoseStateMachine enforced transition safety constraints.');

    // 5. Reminder Planning & Dispatch
    console.log('[Test] Asserting ReminderPlanningEngine and DeliveryOrchestrator...');
    
    // Set dose expectedTime in past to make it due for reminder dispatch
    reloadedDose.expectedTime = new Date(Date.now() - 5 * 60 * 1000);
    await reloadedDose.save();

    // Plan reminders
    const plannedCount = await reminderPlanningEngine.planReminders();
    const plannedPlan = await ReminderPlan.findOne({ doseInstanceId: reloadedDose._id });
    assert.ok(plannedPlan, 'ReminderPlan should be created for due dose instance');
    assert.strictEqual(plannedPlan.status, 'PENDING');

    // Dispatch reminders
    await deliveryOrchestrator.processDueReminders();
    const sentAttempt = await ReminderAttempt.findOne({ reminderPlanId: plannedPlan._id });
    assert.ok(sentAttempt, 'ReminderAttempt must be logged');
    
    const updatedPlan = await ReminderPlan.findById(plannedPlan._id);
    assert.strictEqual(updatedPlan.status, 'PRIMARY_SENT');
    console.log('  -> Reminder plan created and sent successfully.');

    // 6. Response Processing Engine & supply ledger increments
    console.log('[Test] Asserting ResponseProcessingEngine and supply ledgers...');
    
    // Set initial medication quantity to 10
    dummyMed.quantity = 10;
    await dummyMed.save();

    // Mark the dose as Taken
    await responseProcessingEngine.processResponse({
      patientId,
      doseInstanceId: reloadedDose._id,
      intent: 'TAKEN',
      source: 'manual'
    });

    const finalDose = await DoseInstance.findById(reloadedDose._id);
    assert.ok(['TAKEN_ON_TIME', 'TAKEN_LATE'].includes(finalDose.status), 'Dose status must be TAKEN');

    // Check medicine quantity was decremented in database
    const finalMed = await Medication.findById(medId);
    assert.strictEqual(finalMed.quantity, 9, 'Quantity must be decremented by 1');

    // Check refill ledger log was added
    const ledgerLog = await RefillLedgerEvent.findOne({ medicationId: medId, action: 'DOSE_CONSUMED_CONFIRMED' });
    assert.ok(ledgerLog, 'Auditable supply ledger consumption log must exist');
    console.log('  -> Response engine marked taken and adjusted supply logs successfully.');

    // 7. Follow Up Engine & Missed timeouts
    console.log('[Test] Asserting FollowUpEngine timeouts and caregiver alert evaluation...');
    
    // Let's create another due dose and plan reminder
    const secondDose = await DoseInstance.findOne({ patientId, status: 'SCHEDULED' });
    if (secondDose) {
      secondDose.expectedTime = new Date(Date.now() - 30 * 60 * 1000); // 30 mins ago
      await secondDose.save();

      await reminderPlanningEngine.planReminders();
      const secondPlan = await ReminderPlan.findOne({ doseInstanceId: secondDose._id });
      assert.ok(secondPlan, 'Second reminder plan must exist');

      // Set plan status directly to PRIMARY_SENT, nextActionAt in past, and attempts at max to force Missed
      secondPlan.status = 'PRIMARY_SENT';
      secondPlan.attemptsCount = secondPlan.maxAttempts; // force threshold breach
      secondPlan.nextActionAt = new Date(Date.now() - 5 * 60 * 1000);
      await secondPlan.save();

      // Trigger followups
      await followUpEngine.processFollowUps();

      const missedDose = await DoseInstance.findById(secondDose._id);
      assert.strictEqual(missedDose.status, 'MISSED', 'Unanswered reminder plan must transition to MISSED status');
      console.log('  -> FollowUpEngine successfully transitioned unanswered plan to MISSED.');
    }

    // Create a temporary upcoming dose for Metformin for voice testing
    await DoseInstance.create({
      patientId,
      medicationId: medId,
      scheduleVersion: 1,
      expectedTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      localTime: '22:00',
      timezone: 'UTC',
      dosage: '500mg',
      form: 'tablet',
      status: 'SCHEDULED',
      idempotencyKey: `voice_test_${patientId}_${medId}_${Date.now()}`
    });

    const result = await voiceIntentEngine.interpretTranscript(patientId, 'I just took my Metformin medicine');
    assert.strictEqual(result.success, true);
    assert.strictEqual(result.command.intent, 'TAKEN');
    assert.strictEqual(result.command.medName, 'Metformin');
    console.log('  -> VoiceIntentEngine successfully parsed transcript body.');

    console.log('\n*** ALL INTEGRATION TESTS PASSED 100% SUCCESSFULLY ***');
    await cleanDB(patientId, medId);
  } catch (err) {
    console.error('\n❌ INTEGRATION TEST SUITE ENCOUNTERED A FAILURE:');
    console.error(err);
    await cleanDB(patientId, medId);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed cleanly.');
  }
}

runSuite();

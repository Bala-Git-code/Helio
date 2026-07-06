const ReminderPlan = require('../../models/ReminderPlan');
const DoseInstance = require('../../models/DoseInstance');
const Medication = require('../../models/Medication');
const ReminderAttempt = require('../../models/ReminderAttempt');
const DoseStateMachine = require('./DoseStateMachine');
const adherenceEngine = require('./AdherenceEngine');
const escalationEngine = require('./EscalationPolicyEngine');
const { eventSystem } = require('../eventSystem');

class FollowUpEngine {
  /**
   * Scans reminder plans for unanswered prompts and performs follow-ups or missed determinations
   */
  async processFollowUps() {
    const now = new Date();
    console.log(`[FollowUpEngine] Checking unanswered reminder plans at ${now.toISOString()}...`);

    const pendingFollowUps = await ReminderPlan.find({
      status: 'PRIMARY_SENT',
      nextActionAt: { $lte: now }
    });

    let count = 0;

    for (const plan of pendingFollowUps) {
      const dose = await DoseInstance.findById(plan.doseInstanceId);
      if (!dose || ['TAKEN_ON_TIME', 'TAKEN_LATE', 'SKIPPED', 'CANCELLED'].includes(dose.status)) {
        plan.status = 'COMPLETED';
        await plan.save();
        continue;
      }

      const med = await Medication.findById(dose.medicationId);
      if (!med) continue;

      if (plan.attemptsCount < plan.maxAttempts) {
        // Send Follow-Up Reminder
        plan.attemptsCount += 1;
        plan.nextActionAt = new Date(Date.now() + (med.reminderPreferences?.followUpTimingMinutes || 15) * 60 * 1000);
        await plan.save();

        await this.dispatchFollowUp(plan, dose, med);
        count++;
      } else {
        // Exceeded max attempts without response: DETERMINE MISSED DOSE
        plan.status = 'FAILED';
        await plan.save();

        console.log(`[FollowUpEngine] Dose ${dose._id} marked MISSED due to lack of response after ${plan.attemptsCount} attempts.`);

        // Transition to MISSED
        await DoseStateMachine.transition(dose._id, 'MISSED', {
          actorId: dose.patientId,
          reason: 'Non-response timeout'
        });

        // Recalculate adherence
        await adherenceEngine.recalculatePatientScore(dose.patientId);

        // Evaluate caregiver escalation and doctor attention alerts
        await escalationEngine.evaluateEscalations(dose);
      }
    }

    console.log(`[FollowUpEngine] Follow-up cycles processed. Sent ${count} follow-ups.`);
    return count;
  }

  async dispatchFollowUp(plan, dose, med) {
    const channel = plan.primaryChannel || 'app';
    const profile = await require('../../models/PatientProfile').findOne({ userId: plan.patientId });
    const phone = profile?.phone || '';

    let attemptStatus = 'FAILED';
    let providerMessageId = '';

    if (channel === 'whatsapp' && phone) {
      try {
        const response = await require('./WhatsAppProviderAdapter').sendTemplateMessage(phone, 'medication_followup_reminder', [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: med.name },
              { type: 'text', text: String(plan.attemptsCount) }
            ]
          }
        ]);
        attemptStatus = response.success ? 'SENT' : 'FAILED';
        providerMessageId = response.messageId || '';
      } catch (err) {
        attemptStatus = 'FAILED';
      }
    } else {
      attemptStatus = 'DELIVERED';
      providerMessageId = `inapp-followup.${Date.now()}`;
      
      await require('../../models/Notification').create({
        userId: plan.patientId,
        category: 'reminder',
        title: `Follow-Up: Dosing Overdue - ${med.name}`,
        message: `This is a follow-up reminder for your scheduled dose of ${med.name}. Please confirm intake.`,
        priority: 'high'
      });
    }

    await ReminderAttempt.create({
      reminderPlanId: plan._id,
      channel,
      providerMessageId,
      deliveryStatus: attemptStatus,
      error: attemptStatus === 'FAILED' ? 'Meta Cloud API callback fail' : ''
    });
  }
}

module.exports = new FollowUpEngine();

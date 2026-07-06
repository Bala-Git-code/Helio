const mongoose = require('mongoose');
const DoseStateMachine = require('./DoseStateMachine');
const DoseInstance = require('../../models/DoseInstance');
const Medication = require('../../models/Medication');
const ReminderPlan = require('../../models/ReminderPlan');
const refillEngine = require('./RefillEngine');
const OutboxService = require('./OutboxService');
const { eventSystem } = require('../eventSystem');

class ResponseProcessingEngine {
  /**
   * Safe transaction runner with fallback for standalone local MongoDB deployments.
   */
  async runTransaction(fn) {
    let session = null;
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (err) {
      session = null;
    }

    let isReplicaSetError = false;
    try {
      const result = await fn(session);
      if (session) {
        await session.commitTransaction();
      }
      return result;
    } catch (err) {
      if (session) {
        try {
          await session.abortTransaction();
        } catch (abortErr) {
          // ignore abort failures
        }
      }
      if (err.message && err.message.includes('Transaction numbers are only allowed')) {
        isReplicaSetError = true;
      } else {
        throw err;
      }
    } finally {
      if (session) {
        try {
          session.endSession();
        } catch (endErr) {
          // ignore session close failures
        }
      }
    }

    if (isReplicaSetError) {
      console.warn('[ResponseProcessingEngine] MongoDB standalone detected (transactions not supported). Running without session transaction.');
      return await fn(null);
    }
  }

  /**
   * Normalizes inbound commands from apps, web, voice or WhatsApp and runs state transitions inside transaction outbox
   */
  async processResponse(command = {}) {
    const { 
      patientId, 
      doseInstanceId, 
      intent, // 'TAKEN', 'SNOOZE', 'SKIP'
      source = 'manual', 
      note = '', 
      reason = '', 
      durationMinutes = 15,
      actorId = null
    } = command;

    console.log(`[ResponseProcessingEngine] Processing response command for dose ${doseInstanceId}: INTENT ${intent}`);

    return await this.runTransaction(async (session) => {
      const dose = session 
        ? await DoseInstance.findById(doseInstanceId).session(session)
        : await DoseInstance.findById(doseInstanceId);

      if (!dose) {
        throw new Error(`Dose instance ${doseInstanceId} not found.`);
      }

      const med = session
        ? await Medication.findById(dose.medicationId).session(session)
        : await Medication.findById(dose.medicationId);

      if (!med) {
        throw new Error(`Medication not found.`);
      }

      const now = new Date();
      let finalState = '';

      if (intent === 'TAKEN') {
        const expectedTime = new Date(dose.expectedTime);
        const diffMs = now.getTime() - expectedTime.getTime();
        const delayMinutes = Math.max(0, Math.round(diffMs / 60000));
        finalState = delayMinutes > 60 ? 'TAKEN_LATE' : 'TAKEN_ON_TIME';

        // 1. Transition state
        await DoseStateMachine.transition(dose._id, finalState, {
          actorId: actorId || patientId,
          role: actorId ? 'doctor' : 'patient',
          note,
          delayMinutes,
          takenAt: now,
          session
        });

        // 2. Adjust supply ledger counts
        await refillEngine.recordDoseConsumption(dose.patientId, dose.medicationId, med.dosage, {
          actorId: actorId || patientId,
          reason: 'Confirmed dose consumption',
          session
        });

        // 3. Mark reminder plan completed
        await ReminderPlan.findOneAndUpdate(
          { doseInstanceId: dose._id },
          { $set: { status: 'COMPLETED' } },
          { session }
        );

        // 4. Publish Event to Outbox
        await OutboxService.publishEvent(
          'dose.state.changed',
          'DoseInstance',
          dose._id,
          dose.patientId,
          {
            toState: finalState,
            takenAt: now,
            delayMinutes,
            note,
            reason: 'Dose taken registered',
            source,
            intent
          },
          session
        );

      } else if (intent === 'SKIP') {
        finalState = 'SKIPPED';
        // 1. Transition state
        await DoseStateMachine.transition(dose._id, 'SKIPPED', {
          actorId: actorId || patientId,
          role: actorId ? 'doctor' : 'patient',
          note,
          reason,
          session
        });

        // 2. Mark reminder plan completed
        await ReminderPlan.findOneAndUpdate(
          { doseInstanceId: dose._id },
          { $set: { status: 'COMPLETED' } },
          { session }
        );

        // 3. Publish Event to Outbox
        await OutboxService.publishEvent(
          'dose.state.changed',
          'DoseInstance',
          dose._id,
          dose.patientId,
          {
            toState: 'SKIPPED',
            note,
            reason,
            source,
            intent
          },
          session
        );

      } else if (intent === 'SNOOZE') {
        finalState = 'SNOOZED';
        // 1. Transition state
        await DoseStateMachine.transition(dose._id, 'SNOOZED', {
          actorId: actorId || patientId,
          role: actorId ? 'doctor' : 'patient',
          note: `Snoozed for ${durationMinutes} minutes. ${note}`,
          session
        });

        // 2. Update parent medication snooze parameters
        med.snoozedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
        med.snoozeDuration = durationMinutes;
        await med.save({ session });

        // 3. Reschedule reminder plan timings
        await ReminderPlan.findOneAndUpdate(
          { doseInstanceId: dose._id },
          { 
            $set: { 
              status: 'SNOOZED', 
              nextActionAt: new Date(Date.now() + durationMinutes * 60 * 1000) 
            } 
          },
          { session }
        );

        // 4. Publish Event to Outbox
        await OutboxService.publishEvent(
          'dose.state.changed',
          'DoseInstance',
          dose._id,
          dose.patientId,
          {
            toState: 'SNOOZED',
            durationMinutes,
            note,
            source,
            intent
          },
          session
        );
      }

      // Trigger updates
      eventSystem.emitEvent('patient.medication.response.received', {
        patientId: dose.patientId,
        medicationId: dose.medicationId,
        doseInstanceId: dose._id,
        intent
      });

      return dose;
    });
  }
}

module.exports = new ResponseProcessingEngine();

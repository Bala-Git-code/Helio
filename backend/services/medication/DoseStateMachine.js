const DoseInstance = require('../../models/DoseInstance');
const AuditLog = require('../../models/AuditLog');
const { eventSystem } = require('../eventSystem');

const VALID_TRANSITIONS = {
  'SCHEDULED': ['UPCOMING', 'DUE', 'CANCELLED', 'SCHEDULE_CHANGED', 'MISSED'],
  'UPCOMING': ['DUE', 'REMINDER_SENT', 'PENDING_CONFIRMATION', 'SNOOZED', 'SKIPPED', 'CANCELLED', 'SCHEDULE_CHANGED', 'MISSED'],
  'DUE': ['REMINDER_SENT', 'PENDING_CONFIRMATION', 'SNOOZED', 'SKIPPED', 'MISSED', 'TAKEN_ON_TIME', 'TAKEN_LATE', 'CANCELLED'],
  'REMINDER_SENT': ['PENDING_CONFIRMATION', 'SNOOZED', 'SKIPPED', 'MISSED', 'TAKEN_ON_TIME', 'TAKEN_LATE', 'CANCELLED'],
  'PENDING_CONFIRMATION': ['TAKEN_ON_TIME', 'TAKEN_LATE', 'SNOOZED', 'SKIPPED', 'MISSED', 'CANCELLED'],
  'SNOOZED': ['REMINDER_SENT', 'PENDING_CONFIRMATION', 'TAKEN_LATE', 'SKIPPED', 'MISSED', 'SNOOZED', 'CANCELLED'],
  'TAKEN_ON_TIME': [],
  'TAKEN_LATE': [],
  'SKIPPED': [],
  'MISSED': [],
  'CANCELLED': [],
  'SCHEDULE_CHANGED': [],
  'PROCESSING_ERROR': ['SCHEDULED', 'DUE', 'MISSED', 'CANCELLED']
};

class DoseStateMachine {
  isValidTransition(fromState, toState, force = false) {
    if (force) return true;
    if (fromState === toState) return true;
    const allowed = VALID_TRANSITIONS[fromState];
    return allowed ? allowed.includes(toState) : false;
  }

  async transition(doseInstanceId, toState, options = {}) {
    const { actorId, role = 'patient', note = '', reason = '', force = false, delayMinutes = 0, takenAt = null, session = null } = options;

    const dose = session 
      ? await DoseInstance.findById(doseInstanceId).session(session)
      : await DoseInstance.findById(doseInstanceId);

    if (!dose) {
      throw new Error(`Dose instance with ID ${doseInstanceId} not found.`);
    }

    const fromState = dose.status;

    if (!this.isValidTransition(fromState, toState, force)) {
      throw new Error(`Illegal state transition from ${fromState} to ${toState}`);
    }

    // Atomic update
    dose.status = toState;
    if (takenAt) dose.takenAt = takenAt;
    if (delayMinutes) dose.delayMinutes = delayMinutes;
    if (reason) dose.skipReason = reason;
    if (note) dose.notes = note;
    await dose.save({ session });

    console.log(`[DoseStateMachine] Transitioned dose ${dose._id} from ${fromState} -> ${toState}`);

    // Audit logs
    const auditData = {
      actorId: actorId || dose.patientId,
      action: `DOSE_STATE_TRANSITION`,
      details: {
        doseInstanceId: dose._id,
        medicationId: dose.medicationId,
        fromState,
        toState,
        role,
        note,
        reason,
        force
      }
    };
    if (session) {
      await AuditLog.create([auditData], { session });
    } else {
      await AuditLog.create(auditData);
    }

    // Decouple through domain events
    eventSystem.emitEvent('dose.state.changed', {
      doseInstanceId: dose._id,
      patientId: dose.patientId,
      medicationId: dose.medicationId,
      fromState,
      toState,
      occurredAt: new Date()
    });

    return dose;
  }
}

module.exports = new DoseStateMachine();

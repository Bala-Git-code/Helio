const RefillLedgerEvent = require('../../models/RefillLedgerEvent');
const Medication = require('../../models/Medication');
const OutboxService = require('./OutboxService');

class RefillEngine {
  /**
   * Log dose consumption and decrement medicine stock
   */
  async recordDoseConsumption(patientId, medicationId, dosage, options = {}) {
    const { session = null, actorId = null, reason = '' } = options;
    const key = `consume_${patientId}_${medicationId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Create ledger entry
    const ledgerData = {
      patientId,
      medicationId,
      quantityDelta: -1,
      action: 'DOSE_CONSUMED_CONFIRMED',
      actorId: actorId || patientId,
      reason: reason || 'Dose intake logged',
      idempotencyKey: key
    };

    if (session) {
      await RefillLedgerEvent.create([ledgerData], { session });
    } else {
      await RefillLedgerEvent.create(ledgerData);
    }

    // Update parent Medication stock
    const med = session
      ? await Medication.findById(medicationId).session(session)
      : await Medication.findById(medicationId);

    if (med && med.quantity > 0) {
      med.quantity = Math.max(0, med.quantity - 1);
      await med.save({ session });

      // Check if stock has depleted below threshold
      if (med.quantity <= (med.refillThreshold || 5)) {
        await this.triggerLowStockOutbox(patientId, med, session);
      }
    }
  }

  /**
   * Add new stock of pills
   */
  async recordRefill(patientId, medicationId, quantity, options = {}) {
    const { session = null, actorId = null, reason = '' } = options;
    const key = `refill_${patientId}_${medicationId}_${Date.now()}`;
    
    const ledgerData = {
      patientId,
      medicationId,
      quantityDelta: quantity,
      action: 'REFILL_ADDED',
      actorId: actorId || patientId,
      reason: reason || 'Refill supply added',
      idempotencyKey: key
    };

    if (session) {
      await RefillLedgerEvent.create([ledgerData], { session });
    } else {
      await RefillLedgerEvent.create(ledgerData);
    }

    const med = session
      ? await Medication.findById(medicationId).session(session)
      : await Medication.findById(medicationId);

    if (med) {
      med.quantity = (med.quantity || 0) + Number(quantity);
      await med.save({ session });
    }
  }

  async triggerLowStockOutbox(patientId, med, session = null) {
    // Write outbox event to process low-stock warnings asynchronously
    await OutboxService.publishEvent(
      'refill.attention.created',
      'Medication',
      med._id,
      patientId,
      {
        patientId,
        medicationName: med.name,
        quantity: med.quantity
      },
      session
    );
  }
}

module.exports = new RefillEngine();

const QueueJob = require('../../models/QueueJob');
const OutboxEvent = require('../../models/OutboxEvent');
const DoseInstance = require('../../models/DoseInstance');
const Medication = require('../../models/Medication');
const PatientProfile = require('../../models/PatientProfile');
const AuditLog = require('../../models/AuditLog');

class ReconciliationService {
  constructor() {
    this.running = false;
    this.interval = null;
    this.retentionDays = 7; // Configurable data retention period
  }

  start() {
    if (this.running) return;
    this.running = true;
    console.log(`[ReconciliationService] Started periodic system reconciliation worker.`);
    
    // Run reconciliation every 2 minutes
    this.interval = setInterval(() => {
      this.reconcileAll().catch((err) => {
        console.error(`[ReconciliationService] Error during reconciliation cycle:`, err);
      });
    }, 2 * 60 * 1000);

    // Trigger immediate run
    setImmediate(() => this.reconcileAll());
  }

  stop() {
    this.running = false;
    if (this.interval) clearInterval(this.interval);
    console.log(`[ReconciliationService] Stopped reconciliation worker.`);
  }

  async reconcileAll() {
    console.log(`[ReconciliationService] Running reconciliation cycle...`);
    
    await this.recoverExpiredLeases();
    await this.repairDataIntegrity();
    await this.applyDataRetentionPolicy();
    
    console.log(`[ReconciliationService] Reconciliation cycle complete.`);
  }

  /**
   * Unlocks any job or outbox event stuck in processing state due to crashes or partitions.
   */
  async recoverExpiredLeases() {
    const now = new Date();

    // 1. Recover QueueJobs
    const stuckJobs = await QueueJob.updateMany(
      {
        status: 'processing',
        lockedUntil: { $lte: now }
      },
      {
        $set: {
          status: 'pending',
          lockedUntil: null,
          lockedBy: null,
          lastError: 'Lease expired during worker execution (stuck job recovered)'
        }
      }
    );

    if (stuckJobs.modifiedCount > 0) {
      console.warn(`[ReconciliationService] Recovered ${stuckJobs.modifiedCount} stuck QueueJobs.`);
    }

    // 2. Recover OutboxEvents
    const stuckEvents = await OutboxEvent.updateMany(
      {
        processingState: 'processing',
        leaseExpiration: { $lte: now }
      },
      {
        $set: {
          processingState: 'pending',
          leaseExpiration: null,
          leaseOwner: null,
          lastError: 'Lease expired during outbox dispatch (stuck event recovered)'
        }
      }
    );

    if (stuckEvents.modifiedCount > 0) {
      console.warn(`[ReconciliationService] Recovered ${stuckEvents.modifiedCount} stuck OutboxEvents.`);
    }
  }

  /**
   * Scans database collections for clinical inconsistencies or data mismatches.
   */
  async repairDataIntegrity() {
    // 1. Check for DoseInstances without medication details
    const orphanDoses = await DoseInstance.find({ status: { $ne: 'CANCELLED' } }).lean();
    for (const dose of orphanDoses) {
      const med = await Medication.findById(dose.medicationId);
      if (!med) {
        // Safe to mark as CANCELLED as it represents an orphaned deleted medication
        await DoseInstance.findByIdAndUpdate(dose._id, {
          $set: { status: 'CANCELLED', notes: 'Auto-cancelled during reconciliation: Orphan medication deleted' }
        });
        console.warn(`[ReconciliationService] Auto-cancelled orphan DoseInstance: ${dose._id}`);
      }
    }

    // 2. Check for missing scheduleVersion
    const missingVersions = await DoseInstance.updateMany(
      { scheduleVersion: null },
      { $set: { scheduleVersion: 1 } }
    );
    if (missingVersions.modifiedCount > 0) {
      console.log(`[ReconciliationService] Repaired scheduleVersion on ${missingVersions.modifiedCount} DoseInstances.`);
    }

    // 3. Scan for unprocessed outbox events stuck in 'pending' longer than 10 minutes
    const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
    const stuckPendingOutbox = await OutboxEvent.updateMany(
      {
        processingState: 'pending',
        createdAt: { $lte: tenMinsAgo }
      },
      {
        $set: { availableAt: new Date() } // force poller retry immediately
      }
    );
    if (stuckPendingOutbox.modifiedCount > 0) {
      console.warn(`[ReconciliationService] Re-queued ${stuckPendingOutbox.modifiedCount} stuck pending outbox events.`);
    }
  }

  /**
   * Purges historic data to maintain privacy, limit storage bloat, and comply with standards.
   */
  async applyDataRetentionPolicy() {
    const purgeThreshold = new Date();
    purgeThreshold.setDate(purgeThreshold.getDate() - this.retentionDays);

    // 1. Delete completed QueueJobs
    const purgedJobs = await QueueJob.deleteMany({
      status: 'completed',
      updatedAt: { $lte: purgeThreshold }
    });

    if (purgedJobs.deletedCount > 0) {
      console.log(`[ReconciliationService] Purged ${purgedJobs.deletedCount} completed QueueJobs.`);
    }

    // 2. Delete completed OutboxEvents
    const purgedEvents = await OutboxEvent.deleteMany({
      processingState: 'completed',
      updatedAt: { $lte: purgeThreshold }
    });

    if (purgedEvents.deletedCount > 0) {
      console.log(`[ReconciliationService] Purged ${purgedEvents.deletedCount} completed OutboxEvents.`);
    }

    // 3. Purge older audit log aggregates (optional, depends on security rules)
    // We keep audit logs unless strictly instructed, but let's keep them here.
  }
}

module.exports = new ReconciliationService();

const DoseInstance = require('../../models/DoseInstance');
const ReminderPlan = require('../../models/ReminderPlan');
const Medication = require('../../models/Medication');

class ReminderPlanningEngine {
  /**
   * Plan reminders for any upcoming dose instances that don't have a plan yet
   */
  async planReminders() {
    console.log(`[ReminderPlanningEngine] Scanning for unplanned dose instances...`);

    // Fetch scheduled/upcoming dose instances in the next 24 hours
    const horizon = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const eligibleDoses = await DoseInstance.find({
      status: { $in: ['SCHEDULED', 'UPCOMING', 'DUE'] },
      expectedTime: { $lte: horizon }
    });

    let count = 0;

    for (const dose of eligibleDoses) {
      // Check if plan already exists
      const existing = await ReminderPlan.findOne({ doseInstanceId: dose._id });
      if (existing) continue;

      const med = await Medication.findById(dose.medicationId);
      if (!med) continue;

      // Extract reminder preferences
      const preferences = med.reminderPreferences || {};
      const leadTime = preferences.leadTimeMinutes || 0;
      const channels = preferences.channels && preferences.channels.length > 0 ? preferences.channels : ['app'];

      const scheduledTime = new Date(dose.expectedTime.getTime() - leadTime * 60 * 1000);

      try {
        await ReminderPlan.create({
          doseInstanceId: dose._id,
          patientId: dose.patientId,
          scheduledTime,
          nextActionAt: scheduledTime,
          status: 'PENDING',
          primaryChannel: channels[0],
          attemptsCount: 0,
          maxAttempts: preferences.maxFollowUpAttempts || 3,
          quietHoursApplied: false
        });
        count++;
      } catch (err) {
        if (err.code !== 11000) {
          console.error(`[ReminderPlanningEngine] Failed to create reminder plan for dose ${dose._id}`, err);
        }
      }
    }

    console.log(`[ReminderPlanningEngine] Finished planning. Created ${count} reminder plans.`);
    return count;
  }
}

module.exports = new ReminderPlanningEngine();

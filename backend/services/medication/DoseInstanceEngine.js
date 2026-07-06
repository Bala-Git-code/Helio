const Medication = require('../../models/Medication');
const PatientProfile = require('../../models/PatientProfile');
const DoseInstance = require('../../models/DoseInstance');
const scheduleEngine = require('./ScheduleEngine');

class DoseInstanceEngine {
  /**
   * Run the rolling generation window for a patient or all patients
   */
  async generateRollingInstances(patientId = null, horizonDays = 7) {
    console.log(`[DoseInstanceEngine] Starting rolling dose generation for patientId: ${patientId || 'ALL'}`);

    const startWindow = new Date();
    // Allow capturing any instances starting from today
    startWindow.setHours(0, 0, 0, 0);
    const endWindow = new Date(startWindow);
    endWindow.setDate(endWindow.getDate() + horizonDays);

    const query = { active: true };
    if (patientId) {
      query.userId = patientId;
    }

    const medications = await Medication.find(query);
    let count = 0;

    for (const med of medications) {
      // Find patient profile to check timezone
      const profile = await PatientProfile.findOne({ userId: med.userId });
      const timezone = profile?.phone ? 'Asia/Kolkata' : 'UTC'; // default to Indian standard time if profile exists, or UTC

      const occurrences = scheduleEngine.getNextOccurrences(med, startWindow, endWindow, timezone);

      for (const occ of occurrences) {
        const expectedTime = occ.expectedTime;
        const localTime = occ.localTime;
        const version = med.scheduleVersion || 1;
        const key = `${med.userId}_${med._id}_${version}_${expectedTime.getTime()}`;

        try {
          await DoseInstance.findOneAndUpdate(
            { idempotencyKey: key },
            {
              $setOnInsert: {
                patientId: med.userId,
                medicationId: med._id,
                scheduleVersion: version,
                expectedTime,
                localTime,
                timezone,
                dosage: med.dosage,
                form: med.form || 'tablet',
                status: 'SCHEDULED',
                idempotencyKey: key
              }
            },
            { upsert: true, new: true }
          );
          count++;
        } catch (err) {
          // If collision occurs in concurrent execution, safe to ignore
          if (err.code !== 11000) {
            console.error(`[DoseInstanceEngine] Failed to create dose instance for key ${key}`, err);
          }
        }
      }
    }

    console.log(`[DoseInstanceEngine] Dose generation complete. Generated/synced ${count} slots.`);
    return count;
  }
}

module.exports = new DoseInstanceEngine();

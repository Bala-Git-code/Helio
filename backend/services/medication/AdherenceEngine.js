const DoseInstance = require('../../models/DoseInstance');
const PatientProfile = require('../../models/PatientProfile');
const Medication = require('../../models/Medication');

class AdherenceEngine {
  /**
   * Recalculates a patient's overall adherence score and updates their profile healthScore.
   */
  async recalculatePatientScore(patientId) {
    console.log(`[AdherenceEngine] Recalculating score for patient ${patientId}...`);

    // Fetch all dose instances from the past 30 days
    const rangeStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const doseInstances = await DoseInstance.find({
      patientId,
      expectedTime: { $gte: rangeStart },
      status: { $ne: 'CANCELLED' } // exclude cancelled doses
    });

    if (doseInstances.length === 0) {
      await this.saveScoreToProfile(patientId, 100);
      return 100;
    }

    // Exclude as-needed medications from adherence denominator
    // Find as-needed medication IDs
    const asNeededMeds = await Medication.find({
      userId: patientId,
      frequency: { $in: ['as-needed', 'As Needed'] }
    }).select('_id').lean();
    
    const asNeededIds = new Set(asNeededMeds.map(m => m._id.toString()));

    const regularInstances = doseInstances.filter(dose => !asNeededIds.has(dose.medicationId.toString()));

    if (regularInstances.length === 0) {
      await this.saveScoreToProfile(patientId, 100);
      return 100;
    }

    const takenCount = regularInstances.filter(dose => 
      dose.status === 'TAKEN_ON_TIME' || dose.status === 'TAKEN_LATE'
    ).length;

    const totalEligible = regularInstances.length;

    const calculatedScore = Math.round((takenCount / totalEligible) * 100);

    await this.saveScoreToProfile(patientId, calculatedScore);
    return calculatedScore;
  }

  async saveScoreToProfile(patientId, score) {
    const profile = await PatientProfile.findOne({ userId: patientId });
    if (profile) {
      profile.healthScore = score;
      await profile.save();
      console.log(`[AdherenceEngine] Patient ${patientId} healthScore updated to: ${score}%`);
    }
  }
}

module.exports = new AdherenceEngine();

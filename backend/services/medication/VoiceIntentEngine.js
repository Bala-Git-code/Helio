const DoseInstance = require('../../models/DoseInstance');
const Medication = require('../../models/Medication');

class VoiceIntentEngine {
  /**
   * Parse speech transcript and match candidate doses or actions
   */
  async interpretTranscript(patientId, transcriptText) {
    const text = (transcriptText || '').toLowerCase().trim();
    console.log(`[VoiceIntentEngine] Interpreting transcript: "${text}"`);

    let intent = 'UNKNOWN';
    let targetMedName = '';
    let snoozeMinutes = 15;
    let skipReason = '';

    // Match intent
    if (text.includes('take') || text.includes('took') || text.includes('log') || text.includes('mark') || text.includes('done')) {
      intent = 'TAKEN';
    } else if (text.includes('snooze') || text.includes('delay') || text.includes('later')) {
      intent = 'SNOOZE';
      // Try to extract minutes
      const minMatch = text.match(/(\d+)\s*minutes/);
      if (minMatch) {
        snoozeMinutes = parseInt(minMatch[1], 10);
      }
    } else if (text.includes('skip') || text.includes('omit')) {
      intent = 'SKIP';
      if (text.includes('sick')) {
        skipReason = 'Side effect / feeling sick';
      } else if (text.includes('forgot')) {
        skipReason = 'Forgot / away from home';
      } else {
        skipReason = 'Patient requested skip';
      }
    }

    // Try to match medicine name from active list
    const medications = await Medication.find({ userId: patientId, active: true });
    for (const med of medications) {
      if (text.includes(med.name.toLowerCase())) {
        targetMedName = med.name;
      }
    }

    if (intent === 'UNKNOWN') {
      return {
        success: false,
        message: 'Could not understand command. Try: "Took my Metformin", "Snooze for 15 minutes", or "Skip next Lisinopril".',
        requiresConfirmation: false
      };
    }

    // Find candidate today's doses
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const query = {
      patientId,
      expectedTime: { $gte: todayStart, $lt: todayEnd },
      status: { $in: ['SCHEDULED', 'UPCOMING', 'DUE', 'REMINDER_SENT', 'PENDING_CONFIRMATION', 'SNOOZED'] }
    };

    const candidates = await DoseInstance.find(query).populate('medicationId');
    
    // Filter by matched name if any
    let filtered = candidates;
    if (targetMedName) {
      filtered = candidates.filter(c => c.medicationId && c.medicationId.name.toLowerCase() === targetMedName.toLowerCase());
    }

    if (filtered.length === 0) {
      return {
        success: false,
        message: `No active pending doses found${targetMedName ? ` for ${targetMedName}` : ''} today.`,
        requiresConfirmation: false
      };
    }

    // Handle Ambiguity: If multiple doses exist and user didn't specify
    if (filtered.length > 1 && !targetMedName) {
      const namesList = [...new Set(filtered.map(c => c.medicationId?.name))].join(' or ');
      return {
        success: false,
        message: `Ambiguity detected: You have multiple doses pending today. Did you mean ${namesList}?`,
        requiresConfirmation: false
      };
    }

    // Resolve target candidate
    const targetDose = filtered[0];

    return {
      success: true,
      requiresConfirmation: true,
      command: {
        patientId,
        doseInstanceId: targetDose._id,
        intent,
        source: 'voice',
        medName: targetDose.medicationId?.name,
        localTime: targetDose.localTime,
        snoozeMinutes,
        reason: skipReason
      },
      message: `Do you want to confirm marking ${targetDose.medicationId?.name} expected at ${targetDose.localTime} as ${intent.toLowerCase()}?`
    };
  }
}

module.exports = new VoiceIntentEngine();

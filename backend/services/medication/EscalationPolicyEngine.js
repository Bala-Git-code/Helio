const PatientProfile = require('../../models/PatientProfile');
const MedicationAttentionItem = require('../../models/MedicationAttentionItem');
const Medication = require('../../models/Medication');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const whatsappAdapter = require('./WhatsAppProviderAdapter');
const { eventSystem } = require('../eventSystem');

class EscalationPolicyEngine {
  /**
   * Evaluate missed doses and compliance drops, and trigger caregiver or doctor alerts
   */
  async evaluateEscalations(doseInstance) {
    const { patientId, medicationId, expectedTime, localTime } = doseInstance;
    console.log(`[EscalationPolicyEngine] Evaluating risk escalations for patient ${patientId} missed dose.`);

    const patient = await User.findById(patientId);
    const profile = await PatientProfile.findOne({ userId: patientId });
    const med = await Medication.findById(medicationId);

    if (!patient || !profile || !med) return;

    // 1. CAREGIVER ESCALATION
    const familyMembers = profile.familyMembers || [];
    for (const member of familyMembers) {
      if (member.phone) {
        const text = `🚨 HELIO CAREGIVER WARNING: ${patient.name} has missed their scheduled dose of ${med.name} (${doseInstance.dosage}) expected at ${localTime}. Please coordinate with them directly.`;
        try {
          await whatsappAdapter.sendTemplateMessage(member.phone, 'caregiver_escalation_alert', [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: patient.name },
                { type: 'text', text: med.name },
                { type: 'text', text: localTime }
              ]
            }
          ]);
          console.log(`[EscalationPolicyEngine] Caregiver alert dispatched to ${member.name} (${member.phone}).`);
        } catch (err) {
          console.warn(`[EscalationPolicyEngine] Failed to dispatch caregiver warning text to ${member.name}`, err);
        }
      }
    }

    // 2. CLINICIAN ATTENTION ALERT
    const score = profile.healthScore || 100;
    if (score < 80) {
      // Find if open item already exists
      const existing = await MedicationAttentionItem.findOne({
        patientId,
        medicationId,
        status: 'OPEN'
      });

      if (!existing) {
        const severity = score < 60 ? 'High' : 'Moderate';
        const evidence = `Patient adherence score has declined to ${score}%. Medication: ${med.name}. Last missed slot: ${localTime}.`;
        
        await MedicationAttentionItem.create({
          patientId,
          medicationId,
          reason: 'Sustained Non-Adherence',
          severity,
          evidence,
          status: 'OPEN'
        });

        // Trigger notifications to linked doctors
        const linkedDoctors = profile.doctorAccess || [];
        for (const docId of linkedDoctors) {
          await Notification.create({
            userId: docId,
            category: 'doctor',
            title: `⚠️ Alert: Patient Non-Adherence - ${patient.name}`,
            message: `${patient.name}'s adherence score dropped to ${score}%. Intervention recommended.`,
            priority: 'high'
          });
        }

        console.log(`[EscalationPolicyEngine] MedicationAttentionItem created for patient ${patient.name} due to low adherence.`);
      }
    }
  }
}

module.exports = new EscalationPolicyEngine();

import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Medication } from '../models/Medication.js';
import { AdherenceLog } from '../models/AdherenceLog.js';
import { DoctorPatientLink } from '../models/DoctorPatientLink.js';

/**
 * Boot-time database auto-seeder.
 * Ensures sample Doctor (doctor@helio.health) and Patient (patient@helio.health)
 * exist in MongoDB with active consent link and sample adherence history.
 */
export const autoSeedDatabase = async () => {
  try {
    console.log('[HELIO Auto-Seeder] Checking database initialization status...');

    const patientEmail = 'patient@helio.health';
    const doctorEmail = 'doctor@helio.health';

    let patient = await User.findOne({ email: patientEmail });
    let doctor = await User.findOne({ email: doctorEmail });

    const passwordHash = await bcrypt.hash('HelioDemo2026!', 10);

    if (!patient) {
      console.log('[HELIO Auto-Seeder] Seeding Demo Patient (Sarah Jenkins)...');
      patient = await User.create({
        name: 'Sarah Jenkins (Demo Patient)',
        email: patientEmail,
        passwordHash,
        role: 'PATIENT',
        phone: '+1-555-0192',
        specialty: '',
        licenseNumber: '',
        caregiverContact: {
          name: 'James Jenkins',
          phone: '+1-555-0193',
          email: 'james.jenkins@example.com',
          relationship: 'Spouse',
        },
        medicalHistory: [
          { condition: 'Type 2 Diabetes Mellitus', diagnosedYear: 2019 },
          { condition: 'Hypertension', diagnosedYear: 2021 },
        ],
      });
    }

    if (!doctor) {
      console.log('[HELIO Auto-Seeder] Seeding Demo Doctor (Dr. Marcus Reid)...');
      doctor = await User.create({
        name: 'Dr. Marcus Reid (Demo Doctor)',
        email: doctorEmail,
        passwordHash,
        role: 'DOCTOR',
        phone: '+1-555-0847',
        specialty: 'Endocrinology & Metabolic Medicine',
        licenseNumber: 'MD-88421',
      });
    }

    // Ensure active Doctor-Patient consent link exists
    const existingLink = await DoctorPatientLink.findOne({
      doctorId: doctor._id,
      patientId: patient._id,
    });

    if (!existingLink) {
      console.log('[HELIO Auto-Seeder] Creating active consent link between Doctor & Patient...');
      await DoctorPatientLink.create({
        doctorId: doctor._id,
        patientId: patient._id,
        status: 'ACTIVE',
        inviteCode: 'HELIO-DEMO-CONSENT-2026',
        grantedAt: new Date(),
        notes: 'Enterprise Demo Pre-authorized Consent Link',
      });
    }

    // Ensure Medications and Adherence Logs exist for Patient
    const existingMedsCount = await Medication.countDocuments({ patientId: patient._id });
    if (existingMedsCount === 0) {
      console.log('[HELIO Auto-Seeder] Seeding active medications for Demo Patient...');
      const demoMeds = await Medication.insertMany([
        {
          patientId: patient._id,
          name: 'Metformin',
          dosage: '500mg',
          frequency: 'TWICE_DAILY',
          timesPerDay: 2,
          scheduleTimes: ['08:00', '20:00'],
          totalQuantity: 60,
          remainingQuantity: 43,
          refillThreshold: 10,
          instructions: 'Take with meals to reduce GI side effects.',
          status: 'ACTIVE',
        },
        {
          patientId: patient._id,
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'ONCE_DAILY',
          timesPerDay: 1,
          scheduleTimes: ['08:00'],
          totalQuantity: 30,
          remainingQuantity: 18,
          refillThreshold: 7,
          instructions: 'Take in the morning. Monitor blood pressure weekly.',
          status: 'ACTIVE',
        },
        {
          patientId: patient._id,
          name: 'Atorvastatin',
          dosage: '20mg',
          frequency: 'ONCE_DAILY',
          timesPerDay: 1,
          scheduleTimes: ['21:00'],
          totalQuantity: 30,
          remainingQuantity: 6,
          refillThreshold: 7,
          instructions: 'Take in the evening. Avoid grapefruit juice.',
          status: 'ACTIVE',
        },
      ]);

      console.log('[HELIO Auto-Seeder] Generating 14-day adherence history...');
      const now = new Date();
      const adherenceSeedData = [];

      for (const med of demoMeds) {
        for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
          const timesPerDay = med.timesPerDay || 1;
          for (let dose = 0; dose < timesPerDay; dose++) {
            const scheduledTime = new Date(now);
            scheduledTime.setDate(now.getDate() - daysAgo);
            scheduledTime.setHours(dose === 0 ? 8 : 20, 0, 0, 0);

            const isTaken = Math.random() > 0.13;
            adherenceSeedData.push({
              patientId: patient._id,
              medicationId: med._id,
              scheduledTime,
              takenAt: isTaken ? scheduledTime : null,
              status: isTaken ? 'TAKEN' : 'MISSED',
              confirmationChannel: ['APP', 'WHATSAPP', 'VOICE'][Math.floor(Math.random() * 3)],
              notes: isTaken ? 'Confirmed via app' : 'Missed scheduled dose',
              voiceLogged: false,
            });
          }
        }
      }

      if (adherenceSeedData.length > 0) {
        await AdherenceLog.insertMany(adherenceSeedData);
      }
    }

    console.log('[HELIO Auto-Seeder] Auto-seeding check complete. Demo accounts fully provisioned.');
  } catch (err) {
    console.error('[HELIO Auto-Seeder Error]', err.message);
  }
};

export default autoSeedDatabase;

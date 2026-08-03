import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

import { User } from './models/User.js';
import { Medication } from './models/Medication.js';
import { AdherenceLog } from './models/AdherenceLog.js';
import { DoctorPatientLink } from './models/DoctorPatientLink.js';
import { Prescription } from './models/Prescription.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    let mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/helio';
    console.log('[Seed] Connecting to MongoDB...');

    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 6000 });
    } catch (primaryErr) {
      console.warn('[Seed] Primary MONGO_URI failed, attempting local MongoDB fallback...');
      mongoUri = 'mongodb://127.0.0.1:27017/helio';
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 6000 });
    }

    console.log('[Seed] Connected to database.');

    // Clear existing collections
    await Promise.all([
      User.deleteMany({}),
      Medication.deleteMany({}),
      AdherenceLog.deleteMany({}),
      DoctorPatientLink.deleteMany({}),
      Prescription.deleteMany({}),
    ]);

    console.log('[Seed] Cleared existing dataset.');

    const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

    // Create Patient User with Caregiver Contact
    const patient = await User.create({
      name: 'Sarah Jenkins',
      email: 'patient@helio.health',
      passwordHash: defaultPasswordHash,
      role: 'PATIENT',
      phone: '+15550192834',
      dateOfBirth: new Date('1988-04-12'),
      caregiverContact: {
        name: 'David Jenkins',
        phone: '+15550199900',
        email: 'david.caregiver@helio.health',
        relationship: 'Spouse',
      },
      medicalHistory: [
        { condition: 'Type 2 Diabetes', diagnosedYear: 2020 },
        { condition: 'Hypertension', diagnosedYear: 2021 },
      ],
    });

    // Create Doctor User
    const doctor = await User.create({
      name: 'Dr. Marcus Vance',
      email: 'doctor@helio.health',
      passwordHash: defaultPasswordHash,
      role: 'DOCTOR',
      phone: '+15550199988',
      specialty: 'Endocrinology & Internal Medicine',
      licenseNumber: 'MD-992014-CA',
    });

    // Create Admin User
    await User.create({
      name: 'HELIO Administrator',
      email: 'admin@helio.health',
      passwordHash: defaultPasswordHash,
      role: 'ADMIN',
    });

    console.log('[Seed] Created default accounts:');
    console.log(' - Patient: patient@helio.health / Password123!');
    console.log(' - Doctor:  doctor@helio.health / Password123!');
    console.log(' - Admin:   admin@helio.health / Password123!');

    // Create Doctor-Patient Consent Link
    await DoctorPatientLink.create({
      doctorId: doctor._id,
      patientId: patient._id,
      status: 'ACTIVE',
      grantedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });

    // Create Sample Medications
    const metformin = await Medication.create({
      patientId: patient._id,
      doctorId: doctor._id,
      name: 'Metformin HCl',
      dosage: '500mg',
      frequency: 'TWICE_DAILY',
      timesPerDay: 2,
      scheduleTimes: ['08:00', '20:00'],
      dailyTimings: ['08:00', '20:00'],
      totalQuantity: 60,
      remainingQuantity: 12, // Low supply trigger
      refillThreshold: 14,
      instructions: 'Take 1 tablet twice daily with food.',
      status: 'ACTIVE',
      prescribedBy: doctor._id,
    });

    const lisinopril = await Medication.create({
      patientId: patient._id,
      doctorId: doctor._id,
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'ONCE_DAILY',
      timesPerDay: 1,
      scheduleTimes: ['09:00'],
      dailyTimings: ['09:00'],
      totalQuantity: 30,
      remainingQuantity: 25,
      refillThreshold: 7,
      instructions: 'Take 1 tablet in the morning.',
      status: 'ACTIVE',
      prescribedBy: doctor._id,
    });

    // Create Sample Adherence Logs (5-day compliant streak sample)
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    await AdherenceLog.create([
      {
        patientId: patient._id,
        medicationId: metformin._id,
        scheduledTime: new Date(now - 5 * oneDay),
        takenAt: new Date(now - 5 * oneDay),
        status: 'TAKEN',
        confirmationChannel: 'APP',
      },
      {
        patientId: patient._id,
        medicationId: metformin._id,
        scheduledTime: new Date(now - 4 * oneDay),
        takenAt: new Date(now - 4 * oneDay),
        status: 'TAKEN',
        confirmationChannel: 'APP',
      },
      {
        patientId: patient._id,
        medicationId: metformin._id,
        scheduledTime: new Date(now - 3 * oneDay),
        takenAt: new Date(now - 3 * oneDay),
        status: 'TAKEN',
        confirmationChannel: 'WHATSAPP',
        notes: 'Confirmed via WhatsApp Interactive Button',
      },
      {
        patientId: patient._id,
        medicationId: metformin._id,
        scheduledTime: new Date(now - 2 * oneDay),
        takenAt: new Date(now - 2 * oneDay),
        status: 'TAKEN',
        confirmationChannel: 'VOICE',
        notes: 'Logged via Web Speech API Voice Command',
      },
      {
        patientId: patient._id,
        medicationId: metformin._id,
        scheduledTime: new Date(now - 1 * oneDay),
        takenAt: new Date(now - 1 * oneDay),
        status: 'TAKEN',
        confirmationChannel: 'APP',
      },
    ]);

    // Create Sample Prescription
    await Prescription.create({
      doctorId: doctor._id,
      patientId: patient._id,
      medicationName: 'Metformin HCl',
      dosage: '500mg',
      frequency: 'TWICE_DAILY',
      durationDays: 30,
      instructions: 'Maintain daily dose with meals. Monitor blood glucose weekly.',
      status: 'ACTIVE',
      auditTrail: [
        {
          action: 'PRESCRIPTION_CREATED',
          performedBy: doctor._id,
          notes: 'Initial 30-day prescription issued during endocrinology consultation.',
        },
      ],
    });

    console.log('[Seed] Successfully seeded initial patient with caregiver, doctor, medications, logs, and streak history!');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err.message);
    process.exit(1);
  }
};

seedDatabase();

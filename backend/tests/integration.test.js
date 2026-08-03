import dotenv from 'dotenv';
dotenv.config();
import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';

process.env.NODE_ENV = 'test';

import app from '../server.js';
import { User } from '../models/User.js';
import { Medication } from '../models/Medication.js';
import { AdherenceLog } from '../models/AdherenceLog.js';
import { DoctorPatientLink } from '../models/DoctorPatientLink.js';
import { OutboxEvent } from '../models/OutboxEvent.js';
import { QueueJob } from '../models/QueueJob.js';
import { publishOutboxEvents } from '../services/outboxPublisher.js';

jest.setTimeout(40000);

describe('HELIO Backend Architecture & Integration Test Suite', () => {
  let patientToken = '';
  let doctorToken = '';
  let patientId = '';
  let doctorId = '';
  let medicationId = '';

  beforeAll(async () => {
    // Disconnect if any pending connection
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/helio';
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('1. Authentication & Role Guards', () => {
    it('should register a new patient user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test Patient',
          email: `testpatient_${Date.now()}@helio.health`,
          password: 'Password123!',
          role: 'PATIENT',
          phone: '+15550001111',
        });

      if (res.statusCode !== 201) console.error('Register Patient Error Body:', res.status, res.body);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      patientToken = res.body.token;
      patientId = res.body.user.id;
    });

    it('should register a new doctor user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Dr. Test Physician',
          email: `testdoctor_${Date.now()}@helio.health`,
          password: 'Password123!',
          role: 'DOCTOR',
          specialty: 'Cardiology',
          licenseNumber: 'MD-TEST-99',
        });

      if (res.statusCode !== 201) console.error('Register Doctor Error Body:', res.body);

      expect(res.statusCode).toBe(201);
      expect(res.body.token).toBeDefined();
      doctorToken = res.body.token;
      doctorId = res.body.user.id;
    });

    it('should reject access with an invalid JWT token', async () => {
      const res = await request(app)
        .get('/api/v1/patient/medications')
        .set('Authorization', 'Bearer invalid_token_xyz');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should block PATIENT from accessing DOCTOR-only routes', async () => {
      const res = await request(app)
        .get('/api/v1/doctor/patients')
        .set('Authorization', `Bearer ${patientToken}`);

      if (res.statusCode !== 403) console.error('Block Patient Error:', res.status, res.body);
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('2. Medication CRUD & Adherence Score Calculation', () => {
    it('should create a new medication for patient', async () => {
      const res = await request(app)
        .post('/api/v1/patient/medications')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          name: 'Lisinopril Test',
          dosage: '10mg',
          frequency: 'ONCE_DAILY',
          timesPerDay: 1,
          scheduleTimes: ['08:00'],
          totalQuantity: 30,
          refillThreshold: 7,
          skipInteractionCheck: true,
        });

      if (res.statusCode !== 201) console.error('Create Medication Error Body:', res.body);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBeDefined();
      medicationId = res.body.data._id;
    });

    it('should log a dose TAKEN and calculate compliance stats & streak', async () => {
      const logRes = await request(app)
        .post('/api/v1/patient/adherence')
        .set('Authorization', `Bearer ${patientToken}`)
        .send({
          medicationId,
          status: 'TAKEN',
          confirmationChannel: 'APP',
        });

      if (logRes.statusCode !== 201) console.error('Log Dose Error Body:', logRes.body);

      expect(logRes.statusCode).toBe(201);
      expect(logRes.body.success).toBe(true);

      const statsRes = await request(app)
        .get('/api/v1/patient/adherence/stats')
        .set('Authorization', `Bearer ${patientToken}`);

      expect(statsRes.statusCode).toBe(200);
      expect(statsRes.body.data.complianceScore).toBeGreaterThanOrEqual(0);
      expect(statsRes.body.data.currentStreak).toBeGreaterThanOrEqual(1);
    });
  });

  describe('3. Consent-Based Access Security', () => {
    it('should block doctor from issuing prescription if DoctorPatientLink is not ACTIVE', async () => {
      const res = await request(app)
        .post('/api/v1/doctor/prescriptions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId,
          medicationName: 'Aspirin',
          dosage: '81mg',
          frequency: 'ONCE_DAILY',
          durationDays: 30,
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain('Consent-Based Access Security');
    });

    it('should allow doctor access once DoctorPatientLink is ACTIVE', async () => {
      await DoctorPatientLink.create({
        doctorId,
        patientId,
        status: 'ACTIVE',
        grantedAt: new Date(),
      });

      const res = await request(app)
        .post('/api/v1/doctor/prescriptions')
        .set('Authorization', `Bearer ${doctorToken}`)
        .send({
          patientId,
          medicationName: 'Atorvastatin',
          dosage: '20mg',
          frequency: 'ONCE_DAILY',
          durationDays: 30,
          bypassSafetyCheck: true,
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });
  });

  describe('4. Transactional Outbox & Queue Job Worker Dispatch', () => {
    it('should publish OutboxEvent to QueueJob atomically', async () => {
      const event = await OutboxEvent.create({
        eventType: 'REFILL_ALERT',
        payload: {
          patientId,
          medicationName: 'Lisinopril Test',
          remainingQuantity: 5,
        },
        idempotencyKey: `test_outbox_${Date.now()}`,
        status: 'PENDING',
      });

      await publishOutboxEvents();

      const updatedEvent = await OutboxEvent.findById(event._id);
      expect(updatedEvent.status).toBe('PUBLISHED');

      const job = await QueueJob.findOne({ jobType: 'REFILL_ALERT' });
      expect(job).toBeDefined();
      expect(job.payload.medicationName).toBe('Lisinopril Test');
    });
  });
});

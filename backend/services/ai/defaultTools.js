const { ToolRegistry, SideEffects } = require('./ToolRegistry');
const Medication = require('../../models/Medication');
const Appointment = require('../../models/Appointment');

// Register getPatientMedications tool
ToolRegistry.register({
  name: 'getPatientMedications',
  description: 'Fetches active medications for the patient.',
  sideEffectClassification: SideEffects.READ_ONLY,
  executionTimeout: 5000,
  inputSchema: {
    type: 'object',
    properties: {
      patientId: { type: 'string', description: 'The unique patient identifier.' }
    },
    required: ['patientId']
  },
  execute: async (args, context) => {
    // Ensure tenant-scoping isolation
    const patientId = args.patientId;
    if (context.user && context.user.role !== 'admin' && String(context.user._id) !== String(patientId)) {
      // Doctor check
      const consentService = require('../consentService');
      const isGranted = await consentService.verifyDoctorAccess(context.user._id, patientId);
      if (!isGranted) {
        throw new Error('Unauthorized: Patient medical files access denied.');
      }
    }

    const meds = await Medication.find({ userId: patientId, active: true });
    return meds.map(m => ({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      times: m.times,
      notes: m.notes
    }));
  }
});

// Register getPatientAppointments tool
ToolRegistry.register({
  name: 'getPatientAppointments',
  description: 'Fetches scheduled consultations/appointments for the patient.',
  sideEffectClassification: SideEffects.READ_ONLY,
  executionTimeout: 5000,
  inputSchema: {
    type: 'object',
    properties: {
      patientId: { type: 'string', description: 'The unique patient identifier.' }
    },
    required: ['patientId']
  },
  execute: async (args, context) => {
    const patientId = args.patientId;
    if (context.user && context.user.role !== 'admin' && String(context.user._id) !== String(patientId)) {
      const consentService = require('../consentService');
      const isGranted = await consentService.verifyDoctorAccess(context.user._id, patientId);
      if (!isGranted) {
        throw new Error('Unauthorized: Patient medical files access denied.');
      }
    }

    const appointments = await Appointment.find({ patientId });
    return appointments.map(a => ({
      doctorName: a.doctorName,
      specialty: a.specialty,
      date: a.date,
      time: a.time,
      status: a.status
    }));
  }
});

module.exports = ToolRegistry;

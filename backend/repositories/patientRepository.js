const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const Medication = require('../models/Medication');
const Appointment = require('../models/Appointment');
const HealthRecord = require('../models/HealthRecord');
const DoctorNote = require('../models/DoctorNote');

class PatientRepository {
  async getPatientCompleteDetails(patientId) {
    const patient = await User.findById(patientId).select('-password');
    const profile = await PatientProfile.findOne({ userId: patientId });
    const medications = await Medication.find({ userId: patientId }).sort({ createdAt: -1 });
    const appointments = await Appointment.find({ userId: patientId }).sort({ date: 1 });
    const records = await HealthRecord.find({ userId: patientId }).sort({ date: -1 });
    const notes = await DoctorNote.find({ patientId }).sort({ createdAt: -1 });

    return {
      patient: {
        id: patient?._id,
        name: patient?.name,
        email: patient?.email,
        accessCode: profile?.accessCode,
        healthScore: profile?.healthScore,
        allergies: profile?.allergies,
        conditions: profile?.conditions,
        bloodType: profile?.bloodType,
        dateOfBirth: profile?.dateOfBirth,
        vitals: profile?.vitals
      },
      medications,
      appointments,
      records,
      notes
    };
  }

  async findPatientsByDirectory(patientIds, search = '', filter = {}, sort = 'name-asc') {
    // 1. Gather profiles and user accounts
    const profileQuery = { userId: { $in: patientIds } };
    
    // Apply filters
    if (filter.bloodType && filter.bloodType !== 'all') {
      profileQuery.bloodType = filter.bloodType;
    }
    if (filter.riskLevel && filter.riskLevel !== 'all') {
      if (filter.riskLevel === 'high') profileQuery.healthScore = { $lt: 75 };
      if (filter.riskLevel === 'moderate') profileQuery.healthScore = { $gte: 75, $lt: 85 };
      if (filter.riskLevel === 'low') profileQuery.healthScore = { $gte: 85 };
    }
    if (filter.condition && filter.condition !== 'all') {
      profileQuery.conditions = { $in: [new RegExp(filter.condition, 'i')] };
    }

    const patientProfiles = await PatientProfile.find(profileQuery);
    const matchingUserIds = patientProfiles.map(p => p.userId);

    const userQuery = { _id: { $in: matchingUserIds } };
    if (search.trim()) {
      userQuery.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const users = await User.find(userQuery).select('-password');
    const finalUserIds = users.map(u => u._id.toString());

    // 2. Format outcomes
    const filteredProfiles = patientProfiles.filter(p => finalUserIds.includes(p.userId.toString()));

    const list = filteredProfiles.map(profile => {
      const u = users.find(userObj => userObj._id.toString() === profile.userId.toString());
      
      // Calculate mock metrics for directory high-fidelity compliance
      const adherence = profile.healthScore ? Math.min(Math.max(profile.healthScore + 2, 0), 100) : 84;
      const lastVisit = '2026-06-25';
      const notesCount = 3;

      return {
        id: profile.userId,
        name: u?.name || 'Linked Patient',
        accessCode: profile.accessCode,
        age: profile.dateOfBirth ? Math.abs(new Date(Date.now() - new Date(profile.dateOfBirth).getTime()).getUTCFullYear() - 1970) : 36,
        gender: profile.displayName ? 'Female' : 'Male', // fallback
        bloodGroup: profile.bloodType || 'O+',
        riskLevel: profile.healthScore < 75 ? 'High' : (profile.healthScore < 85 ? 'Moderate' : 'Low'),
        treatment: profile.carePlan || 'Standard Care Regimen',
        doctor: 'Dr. Gregory House',
        lastVisit,
        nextAppointment: '2026-07-04',
        adherence,
        healthScore: profile.healthScore || 84,
        notesCount
      };
    });

    // 3. Sort list
    return list.sort((a, b) => {
      if (sort === 'name-asc') return a.name.localeCompare(b.name);
      if (sort === 'name-desc') return b.name.localeCompare(a.name);
      if (sort === 'adherence-desc') return b.adherence - a.adherence;
      if (sort === 'score-desc') return b.healthScore - a.healthScore;
      return 0;
    });
  }
}

module.exports = new PatientRepository();

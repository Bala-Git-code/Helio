const doctorRepository = require('../repositories/doctorRepository');
const Appointment = require('../models/Appointment');
const Medication = require('../models/Medication');

class DoctorService {
  async getDoctorDashboardData(doctorId) {
    const doctor = await doctorRepository.findById(doctorId);
    const patientIds = await doctorRepository.findAssignedPatientIds(doctorId);
    const unreadCount = await doctorRepository.getUnreadAlertsCount(doctorId);
    const notifications = await doctorRepository.getNotifications(doctorId);

    // Fetch live scheduled appointments count
    const appointmentsToday = await Appointment.find({
      doctorName: new RegExp(doctor.name, 'i'),
      status: 'scheduled'
    });

    const activeMeds = await Medication.find({
      userId: { $in: patientIds }
    });

    // Suboptimal adherence count
    const lowAdherenceCount = activeMeds.filter(m => {
      if (m.adherence?.target > 0) {
        return (m.adherence.taken / m.adherence.target) < 0.8;
      }
      return false;
    }).length;

    return {
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialty: doctor.specialty || 'General Practitioner',
        department: doctor.department || 'Internal Medicine',
        hospital: 'Helio General Hospital'
      },
      stats: {
        patientsCount: patientIds.length,
        appointmentsToday: appointmentsToday.length,
        unreadNotifications: unreadCount,
        criticalAlertsCount: lowAdherenceCount + 1 // adherence alerts + mock SOS flag
      },
      appointments: appointmentsToday.map(apt => ({
        id: apt._id,
        patientId: apt.userId,
        date: apt.date,
        time: apt.time,
        notes: apt.notes,
        status: apt.status
      })),
      notifications: notifications.slice(0, 10)
    };
  }
}

module.exports = new DoctorService();

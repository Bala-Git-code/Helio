const ReminderPlan = require('../../models/ReminderPlan');
const ReminderAttempt = require('../../models/ReminderAttempt');
const DoseInstance = require('../../models/DoseInstance');
const Medication = require('../../models/Medication');
const PatientProfile = require('../../models/PatientProfile');
const Notification = require('../../models/Notification');
const whatsappAdapter = require('./WhatsAppProviderAdapter');
const { eventSystem } = require('../eventSystem');

class DeliveryOrchestrator {
  /**
   * Scans and dispatches due reminders
   */
  async processDueReminders() {
    const now = new Date();
    console.log(`[DeliveryOrchestrator] Scanning for due reminders at ${now.toISOString()}...`);

    // Find plans due for action
    const duePlans = await ReminderPlan.find({
      status: { $in: ['PENDING', 'SNOOZED'] },
      nextActionAt: { $lte: now }
    });

    let processedCount = 0;

    for (const plan of duePlans) {
      // distributed lock: atomically transition status to lock plan
      const lockedPlan = await ReminderPlan.findOneAndUpdate(
        { _id: plan._id, status: plan.status },
        { $set: { status: 'PRIMARY_SENT' }, $inc: { attemptsCount: 1 } },
        { new: true }
      );

      if (!lockedPlan) continue; // Acquired by another worker

      try {
        await this.dispatchReminder(lockedPlan);
        processedCount++;
      } catch (err) {
        console.error(`[DeliveryOrchestrator] Failed to dispatch plan ${plan._id}`, err);
        // Rollback plan next action to retry in 5 minutes
        lockedPlan.status = 'PENDING';
        lockedPlan.nextActionAt = new Date(Date.now() + 5 * 60 * 1000);
        await lockedPlan.save();
      }
    }

    console.log(`[DeliveryOrchestrator] Processing finished. Dispatched ${processedCount} reminders.`);
    return processedCount;
  }

  /**
   * Evaluates quiet hours for a patient
   */
  isWithinQuietHours(profile, timezone) {
    if (!profile.quietHoursStart || !profile.quietHoursEnd) return false;

    // Get current local time in target timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      minute: 'numeric',
      hour12: false
    });
    const [h, m] = formatter.format(now).split(':').map(Number);
    const currentMins = h * 60 + m;

    const [sh, sm] = profile.quietHoursStart.split(':').map(Number);
    const [eh, em] = profile.quietHoursEnd.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;

    if (startMins < endMins) {
      return currentMins >= startMins && currentMins <= endMins;
    } else {
      // Overlap midnight (e.g. 22:00 to 06:00)
      return currentMins >= startMins || currentMins <= endMins;
    }
  }

  async dispatchReminder(plan) {
    const dose = await DoseInstance.findById(plan.doseInstanceId);
    if (!dose || ['TAKEN_ON_TIME', 'TAKEN_LATE', 'SKIPPED', 'CANCELLED'].includes(dose.status)) {
      // Dose is already terminal, complete the plan
      plan.status = 'COMPLETED';
      await plan.save();
      return;
    }

    const med = await Medication.findById(dose.medicationId);
    if (!med || !med.active) {
      plan.status = 'FAILED';
      await plan.save();
      return;
    }

    const profile = await PatientProfile.findOne({ userId: plan.patientId });
    const phone = profile?.phone || '';
    const timezone = dose.timezone || 'UTC';

    // Verify quiet hours
    let isQuiet = false;
    if (profile && this.isWithinQuietHours(profile, timezone)) {
      isQuiet = true;
      plan.quietHoursApplied = true;
    }

    // Determine target channel
    const channel = plan.primaryChannel || 'app';

    let attemptStatus = 'FAILED';
    let providerMessageId = '';
    let errorMessage = '';

    if (channel === 'whatsapp' && phone) {
      try {
        const textMessage = `Helio Care: Reminder for your scheduled ${dose.dosage} dose of ${med.name} at ${dose.localTime}. Open your portal to confirm.`;
        
        // Dispatches templates or standard notification message
        const response = await whatsappAdapter.sendTemplateMessage(phone, 'medication_due_reminder', [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: med.name },
              { type: 'text', text: dose.localTime }
            ]
          }
        ]);

        attemptStatus = response.success ? 'SENT' : 'FAILED';
        providerMessageId = response.messageId || '';
      } catch (err) {
        errorMessage = err.message;
        attemptStatus = 'FAILED';
      }
    } else {
      // In-app notifications
      try {
        await Notification.create({
          userId: plan.patientId,
          category: 'reminder',
          title: `Medication Dose Due: ${med.name}`,
          message: `It is time for your scheduled ${dose.dosage} dose of ${med.name} (${med.form}).`,
          priority: 'high'
        });
        attemptStatus = 'DELIVERED';
        providerMessageId = `inapp.${Date.now()}.${Math.random().toString(36).substring(7)}`;
      } catch (err) {
        errorMessage = err.message;
        attemptStatus = 'FAILED';
      }
    }

    // Persist attempt status
    await ReminderAttempt.create({
      reminderPlanId: plan._id,
      channel,
      providerMessageId,
      deliveryStatus: attemptStatus,
      error: errorMessage
    });

    // Update dose state to REMINDER_SENT
    dose.status = 'REMINDER_SENT';
    await dose.save();

    // Schedule next action time slot for follow-up verification (e.g. 15 minutes later)
    const followUpDelay = med.reminderPreferences?.followUpTimingMinutes || 15;
    plan.nextActionAt = new Date(Date.now() + followUpDelay * 60 * 1000);
    await plan.save();

    // Trigger local listeners
    eventSystem.emitEvent('reminder.dispatch.requested', {
      reminderPlanId: plan._id,
      patientId: plan.patientId,
      channel,
      providerMessageId
    });
  }
}

module.exports = new DeliveryOrchestrator();

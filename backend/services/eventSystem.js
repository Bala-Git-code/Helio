const EventEmitter = require('events');

class ClinicalEventSystem extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20);
  }

  emitEvent(eventName, payload) {
    console.log(`[EventSystem] Emitting event: ${eventName}`);
    this.emit(eventName, payload);
  }
}

const eventSystem = new ClinicalEventSystem();

// Event names constants
const EVENTS = {
  DOCUMENT_UPLOADED: 'document:uploaded',
  OCR_COMPLETED: 'ocr:completed',
  EXTRACTION_COMPLETED: 'extraction:completed',
  TIMELINE_UPDATED: 'timeline:updated',
  MEDICINE_CREATED: 'medicine:created',
  REMINDER_GENERATED: 'reminder:generated',
  DOCTOR_NOTIFIED: 'doctor:notified',
  PATIENT_NOTIFIED: 'patient:notified'
};

module.exports = {
  eventSystem,
  EVENTS
};

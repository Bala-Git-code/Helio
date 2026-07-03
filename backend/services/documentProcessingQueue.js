const ocrService = require('./ocrService');
const aiGatewayService = require('./aiGatewayService');
const { eventSystem, EVENTS } = require('./eventSystem');
const MedicalDocument = require('../models/MedicalDocument');
const HealthRecord = require('../models/HealthRecord');
const Medication = require('../models/Medication');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');

class DocumentProcessingQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;

    // Register Loose Listeners on Event System
    eventSystem.on(EVENTS.DOCUMENT_UPLOADED, (payload) => {
      this.enqueue(payload.documentId, payload.userId);
    });

    eventSystem.on(EVENTS.OCR_COMPLETED, async (payload) => {
      await AuditLog.create({
        actorId: payload.userId,
        action: 'DOCUMENT_OCR_COMPLETE',
        details: { documentId: payload.documentId }
      });
    });

    eventSystem.on(EVENTS.EXTRACTION_COMPLETED, async (payload) => {
      await AuditLog.create({
        actorId: payload.userId,
        action: 'DOCUMENT_AI_EXTRACTION_COMPLETE',
        details: { documentId: payload.documentId }
      });
    });
  }

  enqueue(documentId, userId) {
    console.log(`[Queue] Enqueued document ID: ${documentId} for user ID: ${userId}`);
    this.queue.push({ documentId, userId });
    this.processQueue();
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const task = this.queue.shift();

    try {
      await this.processItem(task.documentId, task.userId);
    } catch (err) {
      console.error(`[Queue] Failed processing document: ${task.documentId}`, err);
    } finally {
      this.isProcessing = false;
      // Trigger next task loop
      setImmediate(() => this.processQueue());
    }
  }

  async processItem(documentId, userId) {
    console.log(`[Queue] Starting background process for document: ${documentId}`);

    const doc = await MedicalDocument.findById(documentId);
    if (!doc) return;

    // 1. Update status
    doc.ocrStatus = 'processing';
    doc.aiStatus = 'processing';
    doc.extractionStatus = 'pending';
    await doc.save();

    // 2. Execute OCR Text Extraction
    const text = await ocrService.extractText(doc.originalFile.name, doc.originalFile.mimeType);
    doc.ocrStatus = 'completed';
    await doc.save();
    
    eventSystem.emitEvent(EVENTS.OCR_COMPLETED, { documentId, userId });

    // 3. Execute AI Entities Parsing (Mocking AI extraction pipeline outputs)
    const lowerText = text.toLowerCase();
    let extractedDiagnosis = 'Routine Care';
    let summary = 'Diagnostic record compilation.';
    let tags = [doc.documentType];

    if (doc.documentType === 'prescription') {
      extractedDiagnosis = 'Hypertension Care';
      summary = 'Lisinopril 10mg once daily prescribed for blood pressure regulation.';
      tags.push('cardio', 'prescription');
      
      // Auto sync medicine reminder entries
      await Medication.create({
        userId: doc.patientId,
        name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        times: ['08:00'],
        notes: 'AI Scheduled Reminder'
      });

      eventSystem.emitEvent(EVENTS.MEDICINE_CREATED, { userId, name: 'Lisinopril' });
      eventSystem.emitEvent(EVENTS.REMINDER_GENERATED, { userId, name: 'Lisinopril' });
    } else if (doc.documentType === 'lab') {
      extractedDiagnosis = 'Wellness Audit';
      summary = 'Fasting Glucose (104 mg/dL) shows slight elevation.';
      tags.push('blood-test', 'diabetic');
    }

    doc.aiStatus = 'completed';
    doc.extractionStatus = 'completed';
    doc.summary = summary;
    doc.tags = tags;

    // 4. Create timeline link
    const record = await HealthRecord.create({
      userId: doc.patientId,
      type: doc.documentType === 'prescription' ? 'prescription' : 'lab',
      title: doc.originalFile.name,
      summary: summary,
      date: new Date()
    });

    doc.timelineReference = record._id;
    await doc.save();

    eventSystem.emitEvent(EVENTS.TIMELINE_UPDATED, { userId, recordId: record._id });
    eventSystem.emitEvent(EVENTS.EXTRACTION_COMPLETED, { documentId, userId });

    // 5. Notify patient
    await Notification.create({
      userId: doc.patientId,
      category: 'system',
      title: 'Medical Intelligence Extraction Complete',
      message: `Your uploaded file "${doc.originalFile.name}" has been processed. Timeline and reminders updated.`,
      priority: 'medium'
    });

    eventSystem.emitEvent(EVENTS.PATIENT_NOTIFIED, { userId });
  }
}

module.exports = new DocumentProcessingQueue();

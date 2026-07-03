const documentRepository = require('../repositories/documentRepository');
const storageService = require('../services/storageService');
const { eventSystem, EVENTS } = require('../services/eventSystem');
const AuditLog = require('../models/AuditLog');
const MedicalDocument = require('../models/MedicalDocument');

class DocumentController {
  async uploadDocument(req, res, next) {
    try {
      const { title, documentType, hospital, doctor } = req.body;
      
      // Simulating file parse buffer
      const buffer = Buffer.from(req.body.base64Content || 'HELIO_DOCUMENT', 'base64');
      const fileName = title || `document-${Date.now()}.pdf`;

      // Upload to abstract storage layer
      const uploadResult = await storageService.uploadFile(fileName, buffer);

      // Create model entry
      const doc = await documentRepository.save({
        patientId: req.user._id,
        doctorId: req.user.role === 'doctor' ? req.user._id : undefined,
        hospital: hospital || 'Helio Clinic',
        documentType: documentType || 'other',
        uploadedBy: req.user._id,
        originalFile: {
          path: uploadResult.url,
          name: fileName,
          mimeType: 'application/pdf'
        },
        ocrStatus: 'pending',
        aiStatus: 'pending',
        extractionStatus: 'pending'
      });

      // Audit log upload action
      await AuditLog.create({
        actorId: req.user._id,
        action: 'DOCUMENT_UPLOAD',
        details: { documentId: doc._id }
      });

      // Fire Asynchronous processing events
      eventSystem.emitEvent(EVENTS.DOCUMENT_UPLOADED, { documentId: doc._id, userId: req.user._id });

      res.status(201).json({ success: true, document: doc });
    } catch (err) {
      next(err);
    }
  }

  async searchDocuments(req, res, next) {
    try {
      const { query, type } = req.query;
      const patientId = req.user.role === 'patient' ? req.user._id : req.query.patientId;

      if (!patientId) {
        return res.status(400).json({ success: false, message: 'Patient ID is required.' });
      }

      const list = await documentRepository.findByPatient(patientId);
      
      let filtered = [...list];
      if (query) {
        const q = query.toLowerCase();
        filtered = filtered.filter(d => 
          (d.originalFile?.name || '').toLowerCase().includes(q) ||
          (d.summary || '').toLowerCase().includes(q) ||
          (d.hospital || '').toLowerCase().includes(q)
        );
      }
      if (type) {
        filtered = filtered.filter(d => d.documentType === type);
      }

      await AuditLog.create({
        actorId: req.user._id,
        action: 'DOCUMENT_SEARCH',
        details: { query, resultsCount: filtered.length }
      });

      res.json({ success: true, documents: filtered });
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req, res, next) {
    try {
      const doc = await documentRepository.findAnyById(req.params.id);
      res.json({ success: true, currentVersion: doc.currentVersion, history: doc.versions });
    } catch (err) {
      next(err);
    }
  }

  async shareDocument(req, res, next) {
    try {
      const code = `H-SHARE-${Math.random().toString(36).substring(3, 9).toUpperCase()}`;
      
      await AuditLog.create({
        actorId: req.user._id,
        action: 'DOCUMENT_SHARE_GENERATE',
        details: { documentId: req.body.documentId, code }
      });

      res.json({ success: true, code, url: `/share/document/${req.body.documentId}?code=${code}` });
    } catch (err) {
      next(err);
    }
  }

  async updateVersion(req, res, next) {
    try {
      const { summary, changes } = req.body;
      const doc = await documentRepository.pushVersion(req.params.id, req.body.title, summary, req.user._id, changes);
      
      await AuditLog.create({
        actorId: req.user._id,
        action: 'DOCUMENT_VERSION_UPDATE',
        details: { documentId: doc._id, newVersion: doc.currentVersion }
      });

      res.json({ success: true, document: doc });
    } catch (err) {
      next(err);
    }
  }

  async rollbackVersion(req, res, next) {
    try {
      const { version } = req.body;
      const doc = await documentRepository.rollbackToVersion(req.params.id, parseInt(version, 10), req.user._id);

      await AuditLog.create({
        actorId: req.user._id,
        action: 'DOCUMENT_ROLLBACK',
        details: { documentId: doc._id, rolledBackTo: version }
      });

      res.json({ success: true, document: doc });
    } catch (err) {
      next(err);
    }
  }

  async downloadDocument(req, res, next) {
    try {
      const doc = await documentRepository.findActiveById(req.params.id);
      
      // Simulate file download stream
      res.setHeader('Content-Type', doc.originalFile.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${doc.originalFile.name}"`);
      
      await AuditLog.create({
        actorId: req.user._id,
        action: 'DOCUMENT_DOWNLOAD',
        details: { documentId: doc._id }
      });

      res.send(Buffer.from('HELIO_INTELLIGENT_DOCUMENT_EXPORT_STREAM'));
    } catch (err) {
      next(err);
    }
  }

  async deleteDocument(req, res, next) {
    try {
      await documentRepository.softDelete(req.params.id);
      
      await AuditLog.create({
        actorId: req.user._id,
        action: 'DOCUMENT_SOFT_DELETE',
        details: { documentId: req.params.id }
      });

      res.json({ success: true, message: 'Document soft-deleted successfully.' });
    } catch (err) {
      next(err);
    }
  }

  async restoreDocument(req, res, next) {
    try {
      await documentRepository.restore(req.params.id);
      
      await AuditLog.create({
        actorId: req.user._id,
        action: 'DOCUMENT_RESTORE',
        details: { documentId: req.params.id }
      });

      res.json({ success: true, message: 'Document restored successfully.' });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new DocumentController();

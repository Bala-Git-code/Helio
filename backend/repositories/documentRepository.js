const MedicalDocument = require('../models/MedicalDocument');

class DocumentRepository {
  async findActiveById(id) {
    return MedicalDocument.findOne({ _id: id, isDeleted: false });
  }

  async findAnyById(id) {
    return MedicalDocument.findById(id);
  }

  async save(documentData) {
    if (documentData._id || documentData.id) {
      const id = documentData._id || documentData.id;
      return MedicalDocument.findByIdAndUpdate(id, documentData, { new: true });
    }
    return MedicalDocument.create(documentData);
  }

  async findByPatient(patientId, includeDeleted = false) {
    const query = { patientId };
    if (!includeDeleted) {
      query.isDeleted = false;
    }
    return MedicalDocument.find(query).sort({ createdAt: -1 });
  }

  async softDelete(id) {
    return MedicalDocument.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
  }

  async restore(id) {
    return MedicalDocument.findByIdAndUpdate(id, { isDeleted: false }, { new: true });
  }

  async pushVersion(id, title, summary, userId, changes) {
    const doc = await MedicalDocument.findById(id);
    if (!doc) throw new Error('Document not found');

    // Archive current before updating version
    doc.versions.push({
      version: doc.currentVersion,
      title: doc.originalFile?.name || 'Untitled Document',
      summary: doc.summary || '',
      updatedBy: userId,
      updatedAt: new Date(),
      changes: changes || `Version ${doc.currentVersion} snapshot`
    });

    doc.currentVersion += 1;
    doc.summary = summary;
    
    return doc.save();
  }

  async rollbackToVersion(id, versionNumber, userId) {
    const doc = await MedicalDocument.findById(id);
    if (!doc) throw new Error('Document not found');

    const historical = doc.versions.find(v => v.version === versionNumber);
    if (!historical) throw new Error(`Version ${versionNumber} not found in history`);

    // Snapshot before rollback
    doc.versions.push({
      version: doc.currentVersion,
      title: doc.originalFile?.name || 'Untitled Document',
      summary: doc.summary || '',
      updatedBy: userId,
      updatedAt: new Date(),
      changes: `Rollback target backup (prior to Version ${versionNumber})`
    });

    doc.currentVersion += 1;
    doc.summary = historical.summary;

    return doc.save();
  }
}

module.exports = new DocumentRepository();

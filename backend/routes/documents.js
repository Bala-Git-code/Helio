const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { verifyDocumentConsent } = require('../middleware/documentConsent');
const documentController = require('../controllers/documentController');
const { 
  validateDocumentUpload, 
  validateShareConfig 
} = require('../validators/documentValidator');

// Protect all sub-routes with active JWT authentication
router.use(protect);

// 1. UPLOAD & SEARCH
router.post('/upload', validateDocumentUpload, documentController.uploadDocument);
router.get('/search', documentController.searchDocuments);

// 2. FILE SPECIFICS (Guarded by document consent checks)
router.get('/download/:id', verifyDocumentConsent, documentController.downloadDocument);
router.delete('/delete/:id', verifyDocumentConsent, documentController.deleteDocument);
router.post('/restore/:id', verifyDocumentConsent, documentController.restoreDocument);

// 3. VERSION HISTORY
router.get('/history/:id', verifyDocumentConsent, documentController.getHistory);
router.put('/version/:id', verifyDocumentConsent, documentController.updateVersion);
router.post('/rollback/:id', verifyDocumentConsent, documentController.rollbackVersion);

// 4. SECURE SHARING ACCESS
router.post('/share', validateShareConfig, verifyDocumentConsent, documentController.shareDocument);

module.exports = router;

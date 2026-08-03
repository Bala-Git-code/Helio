import express from 'express';
import multer from 'multer';
import { authenticateJwt } from '../middleware/authMiddleware.js';
import { chatWithGemini, analyzeDocumentWithVision } from '../services/geminiService.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticateJwt);

// POST /api/v1/ai/chat - Contextual AI Medical Assistant via Gemini Flash
router.post('/chat', async (req, res, next) => {
  try {
    const { prompt, history } = req.body;

    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Query prompt is required.' });
    }

    const aiResponse = await chatWithGemini({
      prompt,
      contextHistory: history || [],
      userRole: req.user.role,
    });

    res.json({
      success: true,
      data: aiResponse,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/ai/analyze-document - Multimodal Prescription/Lab OCR via Gemini Vision
router.post('/analyze-document', upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) {
      // If no file uploaded, handle demo mock payload or error
      return res.status(400).json({ success: false, error: 'Image or document file is required.' });
    }

    const analysis = await analyzeDocumentWithVision({
      fileBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
    });

    res.json({
      success: true,
      data: analysis,
    });
  } catch (err) {
    next(err);
  }
});

export default router;

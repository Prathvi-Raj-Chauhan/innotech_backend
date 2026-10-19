import express from 'express';
import multer from 'multer';
import { analyzeDeviceImage } from '../services/aiRecognitionService.js';
import { authenticateJwt } from '../middlewares/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

/**
 * @route   POST /api/v1/ai/recognize-device
 * @desc    Upload device photo to analyze with AI/YOLO and prefill recycling fields
 * @access  Private
 */
router.post('/recognize-device', authenticateJwt, upload.single('image'), async (req, res) => {
  try {
    const file = req.file;
    const { hintCategory } = req.body;

    const analysis = await analyzeDeviceImage({
      imageBuffer: file ? file.buffer : null,
      filename: file ? file.originalname : req.body.filename,
      mimetype: file ? file.mimetype : 'image/jpeg',
      hintCategory
    });

    return res.status(200).json(analysis);
  } catch (error) {
    console.error('[AI recognize-device error]:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze device photo.',
      error: error.message
    });
  }
});

export default router;

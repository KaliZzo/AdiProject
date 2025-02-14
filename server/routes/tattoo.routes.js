const express = require('express');
const router = express.Router();
const multer = require('multer');
const imageAnalysisService = require('../services/imageAnalysis.service');
const gptService = require('../services/gpt.service');
const artistService = require('../services/artist.service');
const driveService = require('../services/drive.service');

// Configure multer for image upload
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Analyze tattoo image and find matching artists
router.post('/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // העלאה לדרייב
    const uploadedFile = await driveService.uploadImage(
      req.file.buffer,
      req.file.originalname
    );

    // ניתוח התמונה
    const visionAnalysis = await imageAnalysisService.analyzeImage(req.file.buffer);
    console.log('Vision Analysis:', visionAnalysis); // לוג לדיבוג

    // וידוא שיש תוצאות לפני המשך העיבוד
    if (!visionAnalysis || !visionAnalysis.imageContent || !visionAnalysis.imageContent.detectedLabels) {
      throw new Error('Invalid vision analysis result');
    }

    // ניתוח סגנון הקעקוע
    const styleAnalysis = await gptService.analyzeTattooStyle(
      req.file.buffer.toString('base64'),
      visionAnalysis
    );

    // מציאת אמנים מתאימים
    const artists = await artistService.findMatchingArtists(
      styleAnalysis.style,
      visionAnalysis
    );

    res.json({
      success: true,
      imageUrl: uploadedFile.webViewLink,
      visionAnalysis,
      styleAnalysis,
      artists: artists.map(artist => ({
        ...artist,
        similarWorks: artist.similarWorks.map(work => ({
          ...work,
          imageUrl: work.google_drive_file_id 
            ? `https://drive.google.com/file/d/${work.google_drive_file_id}/view`
            : work.image_url
        }))
      }))
    });

  } catch (error) {
    console.error('Error in /analyze route:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing image',
      error: error.message
    });
  }
});

// Route חדש לקבלת קעקוע דומה מתיקיית האמן
router.get('/artist/:artistId/similar', async (req, res) => {
  try {
    const { artistId } = req.params;
    const { analysis } = req.query; // מקבל את הניתוח המקורי

    const similarTattoo = await artistService.findSimilarTattoo(
      artistId,
      JSON.parse(analysis)
    );

    res.json({
      success: true,
      similarTattoo
    });

  } catch (error) {
    console.error('Error finding similar tattoo:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding similar tattoo',
      error: error.message
    });
  }
});

module.exports = router; 
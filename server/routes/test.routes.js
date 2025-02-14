const express = require('express');
const router = express.Router();
const driveService = require('../services/drive.service');

// Route לבדיקת תיקייה
router.get('/check-folder', async (req, res) => {
  try {
    const { folderId } = req.body;
    
    if (!folderId) {
      return res.status(400).json({
        success: false,
        message: 'Folder ID is required'
      });
    }
    
    // בדיקת התיקייה
    const folderContents = await driveService.getFolderContents(folderId);
    
    res.json({
      success: true,
      contents: folderContents
    });
    
  } catch (error) {
    console.error('Error checking folder:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking folder',
      error: error.message
    });
  }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const preferenceService = require('../services/preference.service');

// Get all preferred artists
router.get('/', async (req, res) => {
  try {
    const preferredArtists = await preferenceService.getPreferredArtists();
    res.json({
      success: true,
      preferredArtists
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching preferred artists',
      error: error.message
    });
  }
});

// Set artist preference
router.post('/:artistId', async (req, res) => {
  try {
    const { artistId } = req.params;
    const { isPreferred, startTime, endTime } = req.body;
    
    const preference = await preferenceService.setArtistPreference(
      artistId, 
      isPreferred, 
      startTime, 
      endTime
    );
    
    res.json({
      success: true,
      preference
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error setting artist preference',
      error: error.message
    });
  }
});

// Remove artist preference
router.delete('/:artistId', async (req, res) => {
  try {
    const { artistId } = req.params;
    const result = await preferenceService.removeArtistPreference(artistId);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing artist preference',
      error: error.message
    });
  }
});

module.exports = router; 
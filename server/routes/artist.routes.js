const express = require('express');
const router = express.Router();
const db = require('../config/db.config');
const driveService = require('../services/drive.service');

// Get all artists
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM artists ORDER BY created_at DESC');
    res.json({
      success: true,
      artists: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching artists',
      error: error.message
    });
  }
});

// Get artist by ID
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM artists WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Artist not found'
      });
    }
    res.json({
      success: true,
      artist: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching artist',
      error: error.message
    });
  }
});

// Get artists by style
router.get('/style/:style', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM artists WHERE $1 = ANY(styles)',
      [req.params.style]
    );
    res.json({
      success: true,
      artists: rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching artists by style',
      error: error.message
    });
  }
});

// Add new artist
router.post('/', async (req, res) => {
  const { name, styles, portfolio_link } = req.body;
  try {
    const { rows } = await db.query(
      'INSERT INTO artists (name, styles, portfolio_link) VALUES ($1, $2, $3) RETURNING *',
      [name, styles, portfolio_link]
    );
    res.json({
      success: true,
      artist: rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating artist',
      error: error.message
    });
  }
});

// חיפוש עבודות דומות
router.post('/similar-works', async (req, res) => {
  try {
    const { folderId, analysis } = req.body;

    if (!folderId || !analysis) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters'
      });
    }

    const similarWorks = await driveService.searchSimilarImages(folderId, analysis);

    res.json({
      success: true,
      similarWorks
    });

  } catch (error) {
    console.error('Error finding similar works:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding similar works',
      error: error.message
    });
  }
});

module.exports = router; 
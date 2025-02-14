const express = require('express');
const router = express.Router();
const chatService = require('../services/chat.service');

// Get chat history
router.get('/history', async (req, res) => {
  try {
    const history = await chatService.getConversationHistory();
    res.json({
      success: true,
      history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chat history',
      error: error.message
    });
  }
});

// Save new chat message
router.post('/message', async (req, res) => {
  try {
    const { userMessage, assistantResponse, imageUrl, analyzedStyle } = req.body;
    const savedMessage = await chatService.saveConversation(
      userMessage,
      assistantResponse,
      imageUrl,
      analyzedStyle
    );
    res.json({
      success: true,
      message: savedMessage
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving message',
      error: error.message
    });
  }
});

module.exports = router; 
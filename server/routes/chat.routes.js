const express = require('express');
const router = express.Router();
const chatService = require('../services/chat.service');

// Get chat history with pagination
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;
    
    const history = await chatService.getConversationHistory(limit, offset);
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

// Get a specific conversation by ID
router.get('/conversation/:id', async (req, res) => {
  try {
    const conversation = await chatService.getConversationById(req.params.id);
    
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    res.json({
      success: true,
      conversation
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching conversation',
      error: error.message
    });
  }
});

// Delete a specific conversation
router.delete('/conversation/:id', async (req, res) => {
  try {
    const deleted = await chatService.deleteConversation(req.params.id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Conversation deleted successfully',
      deleted
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting conversation',
      error: error.message
    });
  }
});

// Clear all chat history
router.delete('/history', async (req, res) => {
  try {
    await chatService.clearAllConversations();
    res.json({
      success: true,
      message: 'All conversations cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing conversations',
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
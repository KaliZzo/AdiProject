const db = require('../config/db.config');

class ChatService {
  async saveConversation(userMessage, assistantResponse, imageUrl = null, analyzedStyle = null) {
    try {
      const { rows } = await db.query(
        `INSERT INTO chat_history 
         (user_message, assistant_response, image_url, analyzed_style) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
        [userMessage, assistantResponse, imageUrl, analyzedStyle]
      );
      return rows[0];
    } catch (error) {
      console.error('Error saving conversation:', error);
      throw error;
    }
  }

  async getConversationHistory() {
    try {
      const { rows } = await db.query(
        'SELECT * FROM chat_history ORDER BY created_at DESC'
      );
      return rows;
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  }
}

module.exports = new ChatService(); 
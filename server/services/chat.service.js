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

  async getConversationHistory(limit = 20, offset = 0) {
    try {
      const { rows } = await db.query(
        'SELECT * FROM chat_history ORDER BY created_at DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );
      return rows;
    } catch (error) {
      console.error('Error getting conversation history:', error);
      throw error;
    }
  }

  async getConversationById(id) {
    try {
      const { rows } = await db.query(
        'SELECT * FROM chat_history WHERE id = $1',
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error('Error getting conversation by id:', error);
      throw error;
    }
  }

  async deleteConversation(id) {
    try {
      const { rows } = await db.query(
        'DELETE FROM chat_history WHERE id = $1 RETURNING *',
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }

  async clearAllConversations() {
    try {
      await db.query('DELETE FROM chat_history');
      return { success: true };
    } catch (error) {
      console.error('Error clearing all conversations:', error);
      throw error;
    }
  }
}

module.exports = new ChatService(); 
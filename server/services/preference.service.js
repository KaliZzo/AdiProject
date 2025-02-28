const db = require('../config/db.config');

class PreferenceService {
  async getPreferredArtists() {
    try {
      const { rows } = await db.query(`
        SELECT p.*, a.name, a.styles 
        FROM artist_preferences p
        JOIN artists a ON p.artist_id = a.id
        WHERE p.is_preferred = TRUE
        ORDER BY p.created_at DESC
      `);
      return rows;
    } catch (error) {
      console.error('Error getting preferred artists:', error);
      throw error;
    }
  }

  async setArtistPreference(artistId, isPreferred, startTime = null, endTime = null) {
    try {
      // Check if preference already exists
      const { rows: existing } = await db.query(
        'SELECT * FROM artist_preferences WHERE artist_id = $1',
        [artistId]
      );

      if (existing.length > 0) {
        // Update existing preference
        const { rows } = await db.query(
          `UPDATE artist_preferences 
           SET is_preferred = $2, 
               priority_start_time = $3, 
               priority_end_time = $4,
               updated_at = CURRENT_TIMESTAMP
           WHERE artist_id = $1
           RETURNING *`,
          [artistId, isPreferred, startTime, endTime]
        );
        return rows[0];
      } else {
        // Create new preference
        const { rows } = await db.query(
          `INSERT INTO artist_preferences 
           (artist_id, is_preferred, priority_start_time, priority_end_time) 
           VALUES ($1, $2, $3, $4) 
           RETURNING *`,
          [artistId, isPreferred, startTime, endTime]
        );
        return rows[0];
      }
    } catch (error) {
      console.error('Error setting artist preference:', error);
      throw error;
    }
  }

  async removeArtistPreference(artistId) {
    try {
      const { rows } = await db.query(
        'DELETE FROM artist_preferences WHERE artist_id = $1 RETURNING *',
        [artistId]
      );
      return rows[0];
    } catch (error) {
      console.error('Error removing artist preference:', error);
      throw error;
    }
  }

  async isArtistPreferred(artistId) {
    try {
      // Get current time
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0];

      const { rows } = await db.query(
        `SELECT * FROM artist_preferences 
         WHERE artist_id = $1 AND is_preferred = TRUE
         AND (
           (priority_start_time IS NULL AND priority_end_time IS NULL) OR
           (
             priority_start_time <= $2 AND priority_end_time >= $2
           )
         )`,
        [artistId, currentTime]
      );
      
      return rows.length > 0;
    } catch (error) {
      console.error('Error checking if artist is preferred:', error);
      return false;
    }
  }
}

module.exports = new PreferenceService(); 
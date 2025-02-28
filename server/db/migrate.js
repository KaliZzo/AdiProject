const db = require('../config/db.config');

async function runMigration() {
  try {
    console.log('Starting database migration...');
    
    // Create artist_preferences table
    await db.query(`
      CREATE TABLE IF NOT EXISTS artist_preferences (
        id SERIAL PRIMARY KEY,
        artist_id INTEGER REFERENCES artists(id),
        is_preferred BOOLEAN DEFAULT TRUE,
        priority_start_time TIME,
        priority_end_time TIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration(); 
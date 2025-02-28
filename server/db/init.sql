-- Create tables
CREATE TABLE IF NOT EXISTS artists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    styles TEXT[],
    portfolio_link VARCHAR(255),
    availability_schedule jsonb,
    google_drive_folder_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS portfolio_items (
    id SERIAL PRIMARY KEY,
    artist_id INTEGER REFERENCES artists(id),
    image_url VARCHAR(255) NOT NULL,
    style VARCHAR(100),
    tags TEXT[],
    google_drive_file_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS chat_history (
    id SERIAL PRIMARY KEY,
    user_message TEXT,
    assistant_response TEXT,
    image_url VARCHAR(255),
    analyzed_style TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- טבלה חדשה לזמינות
CREATE TABLE IF NOT EXISTS artist_availability (
    id SERIAL PRIMARY KEY,
    artist_id INTEGER REFERENCES artists(id),
    date DATE NOT NULL,
    time_slots jsonb NOT NULL, -- מערך של slots פנויים
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- New table for artist preferences
CREATE TABLE IF NOT EXISTS artist_preferences (
    id SERIAL PRIMARY KEY,
    artist_id INTEGER REFERENCES artists(id),
    is_preferred BOOLEAN DEFAULT TRUE,
    priority_start_time TIME,
    priority_end_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 
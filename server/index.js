const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// Routes
const tattooRoutes = require('./routes/tattoo.routes');
const artistRoutes = require('./routes/artist.routes');
const chatRoutes = require('./routes/chat.routes');
const testRoutes = require('./routes/test.routes');
const preferenceRoutes = require('./routes/preference.routes');

// Route middlewares
app.use('/api/tattoo', tattooRoutes);
app.use('/api/artists', artistRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/test', testRoutes);
app.use('/api/preferences', preferenceRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
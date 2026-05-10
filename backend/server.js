const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const tripRoutes = require('./routes/trips');
const cityRoutes = require('./routes/cities');
const itineraryRoutes = require('./routes/itineraries');
const activityRoutes = require('./routes/activities');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/itineraries', itineraryRoutes);
app.use('/api/activities', activityRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Traveloop API is running', timestamp: new Date() });
});

app.listen(PORT, () => {
  console.log(`🚀 Traveloop Server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📍 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`📍 Trips API: http://localhost:${PORT}/api/trips`);
  console.log(`📍 Cities API: http://localhost:${PORT}/api/cities`);
  console.log(`📍 Itineraries API: http://localhost:${PORT}/api/itineraries`);
  console.log(`📍 Activities API: http://localhost:${PORT}/api/activities`);
});
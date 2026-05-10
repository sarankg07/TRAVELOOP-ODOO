const pool = require('../config/db');

const tripController = {
  // Get all trips for logged-in user
  async getUserTrips(req, res) {
    try {
      const result = await pool.query(
        'SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC',
        [req.user.id]
      );
      res.json(result.rows);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Create a new trip
  async createTrip(req, res) {
    try {
      const { name, start_date, end_date, total_budget } = req.body;
      
      const result = await pool.query(
        `INSERT INTO trips (user_id, name, start_date, end_date, total_budget, status) 
         VALUES ($1, $2, $3, $4, $5, 'planning') 
         RETURNING *`,
        [req.user.id, name, start_date, end_date, total_budget || 0]
      );
      
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get single trip by ID
  async getTripById(req, res) {
    try {
      const result = await pool.query(
        'SELECT * FROM trips WHERE id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Update a trip
  async updateTrip(req, res) {
    try {
      const { name, start_date, end_date, total_budget, status } = req.body;
      
      const result = await pool.query(
        `UPDATE trips 
         SET name = $1, start_date = $2, end_date = $3, total_budget = $4, status = $5, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $6 AND user_id = $7 
         RETURNING *`,
        [name, start_date, end_date, total_budget, status, req.params.id, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found' });
      }
      
      res.json(result.rows[0]);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Delete a trip
  async deleteTrip(req, res) {
    try {
      const result = await pool.query(
        'DELETE FROM trips WHERE id = $1 AND user_id = $2 RETURNING *',
        [req.params.id, req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Trip not found' });
      }
      
      res.json({ message: 'Trip deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  },

  // Get dashboard analytics
  async getAnalytics(req, res) {
    try {
      // Get total trips count
      const tripsResult = await pool.query(
        'SELECT COUNT(*) as total_trips, COALESCE(SUM(total_budget), 0) as total_budget FROM trips WHERE user_id = $1',
        [req.user.id]
      );
      
      // Get cities count
      const citiesResult = await pool.query(
        `SELECT COUNT(DISTINCT c.id) as total_cities 
         FROM cities c 
         JOIN trips t ON c.trip_id = t.id 
         WHERE t.user_id = $1`,
        [req.user.id]
      );
      
      // Get recent trips
      const recentTrips = await pool.query(
        'SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
        [req.user.id]
      );
      
      res.json({
        total_trips: parseInt(tripsResult.rows[0].total_trips),
        total_budget: parseFloat(tripsResult.rows[0].total_budget),
        total_cities: parseInt(citiesResult.rows[0].total_cities),
        recent_trips: recentTrips.rows
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  }
};

module.exports = tripController;
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const pool = require('../config/db');

router.use(authMiddleware);

// Get all activities for an itinerary day
router.get('/itinerary/:itineraryId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM activities WHERE itinerary_id = $1 ORDER BY start_time ASC',
      [req.params.itineraryId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create activity
router.post('/', async (req, res) => {
  try {
    const { itinerary_id, name, start_time, end_time, cost, location, type } = req.body;
    
    const result = await pool.query(
      `INSERT INTO activities (itinerary_id, name, start_time, end_time, cost, location, type) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING *`,
      [itinerary_id, name, start_time, end_time, cost, location, type || 'activity']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update activity
router.put('/:id', async (req, res) => {
  try {
    const { name, start_time, end_time, cost, location, type, is_booked } = req.body;
    
    const result = await pool.query(
      `UPDATE activities 
       SET name = $1, start_time = $2, end_time = $3, cost = $4, location = $5, type = $6, is_booked = $7 
       WHERE id = $8 
       RETURNING *`,
      [name, start_time, end_time, cost, location, type, is_booked, req.params.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete activity
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM activities WHERE id = $1', [req.params.id]);
    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
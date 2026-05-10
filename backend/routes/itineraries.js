const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const pool = require('../config/db');

router.use(authMiddleware);

// Get all itinerary days for a city
router.get('/city/:cityId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM itineraries WHERE city_id = $1 ORDER BY day_number ASC',
      [req.params.cityId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create itinerary day
router.post('/', async (req, res) => {
  try {
    const { city_id, day_number, date, notes } = req.body;
    
    const result = await pool.query(
      `INSERT INTO itineraries (city_id, day_number, date, notes) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [city_id, day_number, date, notes]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update itinerary day
router.put('/:id', async (req, res) => {
  try {
    const { day_number, date, notes } = req.body;
    
    const result = await pool.query(
      `UPDATE itineraries 
       SET day_number = $1, date = $2, notes = $3 
       WHERE id = $4 
       RETURNING *`,
      [day_number, date, notes, req.params.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete itinerary day
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM itineraries WHERE id = $1', [req.params.id]);
    res.json({ message: 'Day deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
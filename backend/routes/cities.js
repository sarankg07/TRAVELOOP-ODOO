const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const pool = require('../config/db');

router.use(authMiddleware);

// Get all cities for a trip
router.get('/trip/:tripId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM cities WHERE trip_id = $1 ORDER BY order_index ASC',
      [req.params.tripId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add city to trip
router.post('/', async (req, res) => {
  try {
    const { trip_id, name, country, arrival_date, departure_date, order_index } = req.body;
    
    const result = await pool.query(
      `INSERT INTO cities (trip_id, name, country, arrival_date, departure_date, order_index) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [trip_id, name, country, arrival_date, departure_date, order_index || 0]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update city
router.put('/:id', async (req, res) => {
  try {
    const { name, country, arrival_date, departure_date, order_index } = req.body;
    
    const result = await pool.query(
      `UPDATE cities 
       SET name = $1, country = $2, arrival_date = $3, departure_date = $4, order_index = $5 
       WHERE id = $6 
       RETURNING *`,
      [name, country, arrival_date, departure_date, order_index, req.params.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete city
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM cities WHERE id = $1', [req.params.id]);
    res.json({ message: 'City deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
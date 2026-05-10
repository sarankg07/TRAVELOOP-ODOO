const pool = require('../config/db');

class Trip {
  static async create({ user_id, name, start_date, end_date, total_budget }) {
    const result = await pool.query(
      'INSERT INTO trips (user_id, name, start_date, end_date, total_budget) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, name, start_date, end_date, total_budget]
    );
    return result.rows[0];
  }

  static async findByUser(user_id) {
    const result = await pool.query(
      'SELECT * FROM trips WHERE user_id = $1 ORDER BY created_at DESC',
      [user_id]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM trips WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async update(id, updates) {
    const { name, start_date, end_date, total_budget, status } = updates;
    const result = await pool.query(
      'UPDATE trips SET name = $1, start_date = $2, end_date = $3, total_budget = $4, status = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
      [name, start_date, end_date, total_budget, status, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    await pool.query('DELETE FROM trips WHERE id = $1', [id]);
    return true;
  }

  static async getAnalytics(user_id) {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_trips,
        SUM(total_budget) as total_budget,
        COUNT(DISTINCT c.name) as total_cities,
        (SELECT COUNT(*) FROM activities WHERE itinerary_id IN (SELECT id FROM itineraries WHERE city_id IN (SELECT id FROM cities WHERE trip_id IN (SELECT id FROM trips WHERE user_id = $1)))) as total_activities
      FROM trips 
      WHERE user_id = $1
    `, [user_id]);
    return result.rows[0];
  }
}

module.exports = Trip;
const { pool } = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT w.*, i.name AS item_name, i.unit
      FROM waste_logs w
      JOIN inventory_items i ON w.item_id = i.id
      ORDER BY w.waste_date DESC, w.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { item_id, quantity, reason, waste_date } = req.body;
  try {
    const itemRes = await pool.query('SELECT unit_cost FROM inventory_items WHERE id=$1', [item_id]);
    if (itemRes.rows.length === 0) return res.status(404).json({ error: 'Item not found' });

    const unit_cost = parseFloat(itemRes.rows[0].unit_cost);
    const total_cost = quantity * unit_cost;

    const result = await pool.query(
      `INSERT INTO waste_logs (item_id, quantity, unit_cost, total_cost, reason, waste_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [item_id, quantity, unit_cost, total_cost, reason, waste_date || new Date(), req.user.id]
    );

    // Decrease stock
    await pool.query(
      'UPDATE inventory_items SET current_stock = current_stock - $1

 WHERE id = $2',
      [quantity, item_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM waste_logs WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Waste log not found' });
    res.json({ message: 'Waste log deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

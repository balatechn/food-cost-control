const { pool } = require('../config/db');

// GET /api/units
exports.getAll = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT u.*, (SELECT count(*) FROM inventory_items i WHERE LOWER(i.unit) = LOWER(u.abbreviation) OR LOWER(i.unit) = LOWER(u.name)) AS item_count FROM units u ORDER BY u.name'
    );
    res.json(rows);
  } catch (err) {
    console.error('getUnits error:', err);
    res.status(500).json({ error: 'Failed to fetch units' });
  }
};

// POST /api/units
exports.create = async (req, res) => {
  const { name, abbreviation } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO units (name, abbreviation) VALUES ($1, $2) RETURNING *',
      [name.trim().toLowerCase(), abbreviation?.trim() || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Unit already exists' });
    }
    console.error('createUnit error:', err);
    res.status(500).json({ error: 'Failed to create unit' });
  }
};

// PUT /api/units/:id
exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, abbreviation } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE units SET name = $1, abbreviation = $2 WHERE id = $3 RETURNING *',
      [name.trim().toLowerCase(), abbreviation?.trim() || null, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Unit not found' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Unit name already exists' });
    }
    console.error('updateUnit error:', err);
    res.status(500).json({ error: 'Failed to update unit' });
  }
};

// DELETE /api/units/:id
exports.remove = async (req, res) => {
  const { id } = req.params;
  try {
    const unit = await pool.query('SELECT name, abbreviation FROM units WHERE id = $1', [id]);
    if (!unit.rows.length) return res.status(404).json({ error: 'Unit not found' });

    const { name, abbreviation } = unit.rows[0];
    const usage = await pool.query(
      'SELECT count(*) FROM inventory_items WHERE LOWER(unit) = LOWER($1) OR LOWER(unit) = LOWER($2)',
      [name, abbreviation]
    );
    if (parseInt(usage.rows[0].count) > 0) {
      return res.status(400).json({ error: `Cannot delete — ${usage.rows[0].count} item(s) use this unit` });
    }

    await pool.query('DELETE FROM units WHERE id = $1', [id]);
    res.json({ message: 'Unit deleted' });
  } catch (err) {
    console.error('deleteUnit error:', err);
    res.status(500).json({ error: 'Failed to delete unit' });
  }
};

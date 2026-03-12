const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');
const { validationResult } = require('express-validator');

exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, full_name, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, password, full_name, role } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, full_name, role, created_at`,
      [username, email, passwordHash, full_name, role || 'controller']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username or email already exists' });
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { username, email, full_name, role, password } = req.body;
  try {
    let result;
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      result = await pool.query(
        `UPDATE users SET username=$1, email=$2, full_name=$3, role=$4, password_hash=$5, updated_at=NOW()
         WHERE id=$6
         RETURNING id, username, email, full_name, role, created_at`,
        [username, email, full_name, role, passwordHash, req.params.id]
      );
    } else {
      result = await pool.query(
        `UPDATE users SET username=$1, email=$2, full_name=$3, role=$4, updated_at=NOW()
         WHERE id=$5
         RETURNING id, username, email, full_name, role, created_at`,
        [username, email, full_name, role, req.params.id]
      );
    }
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Username or email already exists' });
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    const result = await pool.query('DELETE FROM users WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

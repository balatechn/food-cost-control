const { pool } = require('../config/db');
const { validationResult } = require('express-validator');

exports.getAll = async (req, res) => {
  try {
    const { category, search, low_stock } = req.query;
    let query = `
      SELECT i.*, s.name AS supplier_name
      FROM inventory_items i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND i.category = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      query += ` AND i.name ILIKE $${params.length}`;
    }
    if (low_stock === 'true') {
      query += ` AND i.current_stock <= i.min_stock_level`;
    }

    query += ' ORDER BY i.name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.*, s.name AS supplier_name
       FROM inventory_items i LEFT JOIN suppliers s ON i.supplier_id = s.id
       WHERE i.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, category, unit, unit_cost, current_stock, min_stock_level, supplier_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO inventory_items (name, category, unit, unit_cost, current_stock, min_stock_level, supplier_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, category, unit, unit_cost, current_stock || 0, min_stock_level || 0, supplier_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, category, unit, unit_cost, current_stock, min_stock_level, supplier_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE inventory_items
       SET name=$1, category=$2, unit=$3, unit_cost=$4, current_stock=$5, min_stock_level=$6, supplier_id=$7, updated_at=NOW()
       WHERE id=$8 RETURNING *`,
      [name, category, unit, unit_cost, current_stock, min_stock_level, supplier_id, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM inventory_items WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addPurchase = async (req, res) => {
  const { item_id, quantity, unit_cost, supplier_id, invoice_no, purchase_date } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const total_cost = quantity * unit_cost;

    await client.query(
      `INSERT INTO purchases (supplier_id, item_id, quantity, unit_cost, total_cost, invoice_no, purchase_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [supplier_id, item_id, quantity, unit_cost, total_cost, invoice_no, purchase_date || new Date(), req.user.id]
    );

    await client.query(
      `INSERT INTO stock_transactions (item_id, transaction_type, quantity, unit_cost, total_cost, reference_no, transaction_date, created_by)
       VALUES ($1,'purchase',$2,$3,$4,$5,$6,$7)`,
      [item_id, quantity, unit_cost, total_cost, invoice_no, purchase_date || new Date(), req.user.id]
    );

    await client.query(
      `UPDATE inventory_items SET current_stock = current_stock + $1, unit_cost = $2, updated_at = NOW() WHERE id = $3`,
      [quantity, unit_cost, item_id]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Purchase recorded' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.issueStock = async (req, res) => {
  const { item_id, quantity, department } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const itemRes = await client.query('SELECT unit_cost, current_stock FROM inventory_items WHERE id=$1', [item_id]);
    if (itemRes.rows.length === 0) throw new Error('Item not found');

    const item = itemRes.rows[0];
    if (parseFloat(item.current_stock) < quantity) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const total_cost = quantity * parseFloat(item.unit_cost);

    await client.query(
      `INSERT INTO stock_issues (item_id, quantity, unit_cost, total_cost, department, issue_date, created_by)
       VALUES ($1,$2,$3,$4,$5,CURRENT_DATE,$6)`,
      [item_id, quantity, item.unit_cost, total_cost, department || 'kitchen', req.user.id]
    );

    await client.query(
      `INSERT INTO stock_transactions (item_id, transaction_type, quantity, unit_cost, total_cost, transaction_date, created_by)
       VALUES ($1,'issue',$2,$3,$4,CURRENT_DATE,$5)`,
      [item_id, quantity, item.unit_cost, total_cost, req.user.id]
    );

    await client.query(
      `UPDATE inventory_items SET current_stock = current_stock - $1, updated_at = NOW() WHERE id = $2`,
      [quantity, item_id]
    );

    await client.query('COMMIT');
    res.status(201).json({ message: 'Stock issued' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.getTransactions = async (req, res) => {
  try {
    const { item_id, type, from_date, to_date } = req.query;
    let query = `
      SELECT st.*, i.name AS item_name, i.unit
      FROM stock_transactions st
      JOIN inventory_items i ON st.item_id = i.id
      WHERE 1=1
    `;
    const params = [];

    if (item_id) { params.push(item_id); query += ` AND st.item_id = $${params.length}`; }
    if (type) { params.push(type); query += ` AND st.transaction_type = $${params.length}`; }
    if (from_date) { params.push(from_date); query += ` AND st.transaction_date >= $${params.length}`; }
    if (to_date) { params.push(to_date); query += ` AND st.transaction_date <= $${params.length}`; }

    query += ' ORDER BY st.transaction_date DESC, st.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

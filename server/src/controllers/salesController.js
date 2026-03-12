const { pool } = require('../config/db');
const { validationResult } = require('express-validator');

exports.getAll = async (req, res) => {
  try {
    const { from_date, to_date, recipe_id } = req.query;
    let query = `
      SELECT s.*, r.name AS item_name, r.recipe_cost
      FROM sales s JOIN recipes r ON s.recipe_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (from_date) { params.push(from_date); query += ` AND s.sale_date >= $${params.length}`; }
    if (to_date) { params.push(to_date); query += ` AND s.sale_date <= $${params.length}`; }
    if (recipe_id) { params.push(recipe_id); query += ` AND s.recipe_id = $${params.length}`; }

    query += ' ORDER BY s.sale_date DESC, s.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { recipe_id, quantity_sold, sale_date } = req.body;
  try {
    const recipeRes = await pool.query('SELECT selling_price, recipe_cost FROM recipes WHERE id=$1', [recipe_id]);
    if (recipeRes.rows.length === 0) return res.status(404).json({ error: 'Recipe not found' });

    const recipe = recipeRes.rows[0];
    const sale_price = parseFloat(recipe.selling_price);
    const total_amount = sale_price * quantity_sold;
    const theoretical_cost = parseFloat(recipe.recipe_cost) * quantity_sold;

    const result = await pool.query(
      `INSERT INTO sales (recipe_id, quantity_sold, sale_price, total_amount, theoretical_cost, sale_date, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [recipe_id, quantity_sold, sale_price, total_amount, theoretical_cost, sale_date || new Date(), req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDailySummary = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        sale_date,
        SUM(total_amount) AS total_sales,
        SUM(theoretical_cost) AS total_theoretical_cost,
        SUM(quantity_sold) AS total_items_sold
      FROM sales
      WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY sale_date
      ORDER BY sale_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM sales WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Sale not found' });
    res.json({ message: 'Sale deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

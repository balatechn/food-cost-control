const { pool } = require('../config/db');
const { validationResult } = require('express-validator');

exports.getAll = async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM recipes WHERE 1=1';
    const params = [];

    if (category) { params.push(category); query += ` AND category = $${params.length}`; }
    if (search) { params.push(`%${search}%`); query += ` AND name ILIKE $${params.length}`; }

    query += ' ORDER BY name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const recipeResult = await pool.query('SELECT * FROM recipes WHERE id = $1', [req.params.id]);
    if (recipeResult.rows.length === 0) return res.status(404).json({ error: 'Recipe not found' });

    const ingredientsResult = await pool.query(
      `SELECT ri.*, i.name AS ingredient_name, i.unit AS item_unit, i.unit_cost AS current_unit_cost
       FROM recipe_ingredients ri
       JOIN inventory_items i ON ri.item_id = i.id
       WHERE ri.recipe_id = $1`,
      [req.params.id]
    );

    res.json({ ...recipeResult.rows[0], ingredients: ingredientsResult.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, category, selling_price, instructions, ingredients } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Calculate recipe cost from ingredients
    let recipeCost = 0;
    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        const itemRes = await client.query('SELECT unit_cost FROM inventory_items WHERE id = $1', [ing.item_id]);
        if (itemRes.rows.length > 0) {
          ing.ingredient_cost = parseFloat(itemRes.rows[0].unit_cost) * ing.quantity;
          recipeCost += ing.ingredient_cost;
        }
      }
    }

    const foodCostPct = selling_price > 0 ? ((recipeCost / selling_price) * 100).toFixed(2) : 0;

    const recipeResult = await client.query(
      `INSERT INTO recipes (name, category, selling_price, recipe_cost, food_cost_pct, instructions)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [name, category, selling_price, recipeCost.toFixed(2), foodCostPct, instructions]
    );

    const recipeId = recipeResult.rows[0].id;

    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        await client.query(
          `INSERT INTO recipe_ingredients (recipe_id, item_id, quantity, unit, ingredient_cost)
           VALUES ($1,$2,$3,$4,$5)`,
          [recipeId, ing.item_id, ing.quantity, ing.unit, ing.ingredient_cost.toFixed(2)]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json(recipeResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.update = async (req, res) => {
  const { name, category, selling_price, instructions, ingredients } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let recipeCost = 0;
    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        const itemRes = await client.query('SELECT unit_cost FROM inventory_items WHERE id = $1', [ing.item_id]);
        if (itemRes.rows.length > 0) {
          ing.ingredient_cost = parseFloat(itemRes.rows[0].unit_cost) * ing.quantity;
          recipeCost += ing.ingredient_cost;
        }
      }
    }

    const foodCostPct = selling_price > 0 ? ((recipeCost / selling_price) * 100).toFixed(2) : 0;

    const result = await client.query(
      `UPDATE recipes SET name=$1, category=$2, selling_price=$3, recipe_cost=$4, food_cost_pct=$5, instructions=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [name, category, selling_price, recipeCost.toFixed(2), foodCostPct, instructions, req.params.id]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Replace ingredients
    await client.query('DELETE FROM recipe_ingredients WHERE recipe_id = $1', [req.params.id]);
    if (ingredients && ingredients.length > 0) {
      for (const ing of ingredients) {
        await client.query(
          `INSERT INTO recipe_ingredients (recipe_id, item_id, quantity, unit, ingredient_cost)
           VALUES ($1,$2,$3,$4,$5)`,
          [req.params.id, ing.item_id, ing.quantity, ing.unit, ing.ingredient_cost.toFixed(2)]
        );
      }
    }

    await client.query('COMMIT');
    res.status(200).json(result.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.remove = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM recipes WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Recipe not found' });
    res.json({ message: 'Recipe deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

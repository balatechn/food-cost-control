const { pool } = require('../config/db');
const { validationResult } = require('express-validator');
const XLSX = require('xlsx');

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

exports.sampleExcel = async (req, res) => {
  try {
    // Fetch inventory items for reference
    const itemRes = await pool.query('SELECT name, unit, unit_cost FROM inventory_items ORDER BY name');

    const sampleData = [
      { 'Recipe Name': 'Grilled Chicken Salad', 'Category': 'Main Course', 'Selling Price': 350, 'Instructions': 'Grill chicken, toss with fresh greens and dressing' },
      { 'Recipe Name': 'Tomato Soup', 'Category': 'Appetizer', 'Selling Price': 180, 'Instructions': 'Blend roasted tomatoes with cream and herbs' },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [{ wch: 28 }, { wch: 18 }, { wch: 14 }, { wch: 50 }];

    // Reference sheet with inventory items
    const refData = itemRes.rows.map(r => ({ 'Item Name': r.name, 'Unit': r.unit, 'Unit Cost': parseFloat(r.unit_cost) }));
    const wsRef = XLSX.utils.json_to_sheet(refData.length ? refData : [{ 'Item Name': '', 'Unit': '', 'Unit Cost': '' }]);
    wsRef['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 12 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Recipes');
    XLSX.utils.book_append_sheet(wb, wsRef, 'Inventory Items');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="recipes_sample_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    console.error('sampleExcel error:', err);
    res.status(500).json({ error: 'Failed to generate sample file' });
  }
};

exports.bulkUpload = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (!rows.length) return res.status(400).json({ error: 'Excel file is empty' });

    const results = { created: 0, updated: 0, errors: [] };
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const name = (row['Recipe Name'] || '').toString().trim();
        const category = (row['Category'] || '').toString().trim();
        const sellingPrice = parseFloat(row['Selling Price']) || 0;
        const instructions = (row['Instructions'] || '').toString().trim();
        if (!name) { results.errors.push(`Row ${rowNum}: Recipe Name is required`); continue; }
        if (sellingPrice <= 0) { results.errors.push(`Row ${rowNum}: Selling Price must be > 0`); continue; }
        const existing = await client.query('SELECT id FROM recipes WHERE LOWER(name) = LOWER($1)', [name]);
        if (existing.rows.length > 0) {
          await client.query(
            'UPDATE recipes SET category=$1, selling_price=$2, instructions=$3, updated_at=NOW() WHERE id=$4',
            [category || null, sellingPrice, instructions || null, existing.rows[0].id]
          );
          results.updated++;
        } else {
          await client.query(
            'INSERT INTO recipes (name, category, selling_price, recipe_cost, food_cost_pct, instructions) VALUES ($1,$2,$3,0,0,$4)',
            [name, category || null, sellingPrice, instructions || null]
          );
          results.created++;
        }
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
    res.json({
      message: `Import complete: ${results.created} created, ${results.updated} updated` + (results.errors.length ? `, ${results.errors.length} warning(s)` : ''),
      created: results.created, updated: results.updated, errors: results.errors,
    });
  } catch (err) {
    console.error('bulkUpload error:', err);
    res.status(500).json({ error: 'Failed to process file: ' + err.message });
  }
};

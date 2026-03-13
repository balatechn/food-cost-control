const { pool } = require('../config/db');
const XLSX = require('xlsx');

// GET /api/categories
exports.getAll = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT c.*, (SELECT count(*) FROM inventory_items i WHERE i.category = c.name) AS item_count FROM categories c ORDER BY c.name'
    );
    res.json(rows);
  } catch (err) {
    console.error('getCategories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};

// POST /api/categories
exports.create = async (req, res) => {
  const { name, description } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name.trim().toLowerCase(), description?.trim() || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Category already exists' });
    }
    console.error('createCategory error:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
};

// PUT /api/categories/:id
exports.update = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    // Get old name for updating inventory_items
    const old = await pool.query('SELECT name FROM categories WHERE id = $1', [id]);
    if (!old.rows.length) return res.status(404).json({ error: 'Category not found' });

    const oldName = old.rows[0].name;
    const newName = name.trim().toLowerCase();

    const { rows } = await pool.query(
      'UPDATE categories SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [newName, description?.trim() || null, id]
    );

    // Update inventory items that reference the old category name
    if (oldName !== newName) {
      await pool.query('UPDATE inventory_items SET category = $1 WHERE category = $2', [newName, oldName]);
    }

    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Category name already exists' });
    }
    console.error('updateCategory error:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

// DELETE /api/categories/:id
exports.remove = async (req, res) => {
  const { id } = req.params;
  try {
    const cat = await pool.query('SELECT name FROM categories WHERE id = $1', [id]);
    if (!cat.rows.length) return res.status(404).json({ error: 'Category not found' });

    // Check if any items use this category
    const usage = await pool.query('SELECT count(*) FROM inventory_items WHERE category = $1', [cat.rows[0].name]);
    if (parseInt(usage.rows[0].count) > 0) {
      return res.status(400).json({ error: `Cannot delete — ${usage.rows[0].count} item(s) use this category` });
    }

    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('deleteCategory error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
};

// GET /api/categories/sample-excel
exports.sampleExcel = async (req, res) => {
  try {
    const sampleData = [
      { 'Category Name': 'frozen_goods', 'Description': 'Frozen food items' },
      { 'Category Name': 'canned_food', 'Description': 'Canned and preserved items' },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [{ wch: 25 }, { wch: 35 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Categories');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="categories_sample_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    console.error('sampleExcel error:', err);
    res.status(500).json({ error: 'Failed to generate sample file' });
  }
};

// POST /api/categories/bulk-upload
exports.bulkUpload = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (!rows.length) return res.status(400).json({ error: 'Excel file is empty' });

    const results = { created: 0, skipped: 0, errors: [] };
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2;
        const name = (row['Category Name'] || '').toString().trim().toLowerCase();
        const description = (row['Description'] || '').toString().trim();
        if (!name) { results.errors.push(`Row ${rowNum}: Category Name is required`); continue; }
        const existing = await client.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1)', [name]);
        if (existing.rows.length > 0) {
          results.skipped++;
        } else {
          await client.query('INSERT INTO categories (name, description) VALUES ($1, $2)', [name, description || null]);
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
      message: `Import complete: ${results.created} created, ${results.skipped} already exist` + (results.errors.length ? `, ${results.errors.length} warning(s)` : ''),
      created: results.created, skipped: results.skipped, errors: results.errors,
    });
  } catch (err) {
    console.error('bulkUpload error:', err);
    res.status(500).json({ error: 'Failed to process file: ' + err.message });
  }
};

const { pool } = require('../config/db');
const { validationResult } = require('express-validator');
const XLSX = require('xlsx');

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

// GET /api/inventory/sample-excel — download sample template
exports.sampleExcel = async (req, res) => {
  try {
    // Fetch valid categories and units for reference sheet
    const catRes = await pool.query('SELECT name FROM categories ORDER BY name');
    const unitRes = await pool.query('SELECT name, abbreviation FROM units ORDER BY name');
    const supRes = await pool.query('SELECT name FROM suppliers ORDER BY name');

    const categories = catRes.rows.map(r => r.name);
    const units = unitRes.rows.map(r => r.abbreviation || r.name);
    const suppliers = supRes.rows.map(r => r.name);

    // Main sheet with sample rows
    const sampleData = [
      { 'Item Name': 'Chicken Breast', Category: 'poultry', Unit: 'kg', 'Unit Cost': 8.50, 'Min Stock Level': 5, Supplier: '' },
      { 'Item Name': 'Olive Oil', Category: 'dry_goods', Unit: 'L', 'Unit Cost': 12.00, 'Min Stock Level': 3, Supplier: '' },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, { wch: 15 }, { wch: 10 }, { wch: 12 }, { wch: 16 }, { wch: 25 },
    ];

    // Reference sheet with valid values
    const maxLen = Math.max(categories.length, units.length, suppliers.length);
    const refData = [];
    for (let i = 0; i < maxLen; i++) {
      refData.push({
        'Valid Categories': categories[i] || '',
        'Valid Units': units[i] || '',
        'Suppliers': suppliers[i] || '',
      });
    }
    const wsRef = XLSX.utils.json_to_sheet(refData);
    wsRef['!cols'] = [{ wch: 20 }, { wch: 15 }, { wch: 25 }];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Items');
    XLSX.utils.book_append_sheet(wb, wsRef, 'Reference');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="inventory_sample_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (err) {
    console.error('sampleExcel error:', err);
    res.status(500).json({ error: 'Failed to generate sample file' });
  }
};

// POST /api/inventory/bulk-upload — import items from Excel
exports.bulkUpload = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

    if (!rows.length) return res.status(400).json({ error: 'Excel file is empty' });

    // Fetch valid categories, units, and suppliers for validation
    const [catRes, unitRes, supRes] = await Promise.all([
      pool.query('SELECT name FROM categories'),
      pool.query('SELECT name, abbreviation FROM units'),
      pool.query('SELECT id, name FROM suppliers'),
    ]);
    const validCategories = new Set(catRes.rows.map(r => r.name.toLowerCase()));
    const validUnits = new Set(unitRes.rows.flatMap(r => [r.name.toLowerCase(), (r.abbreviation || '').toLowerCase()].filter(Boolean)));
    const supplierMap = new Map(supRes.rows.map(r => [r.name.toLowerCase(), r.id]));

    const results = { created: 0, updated: 0, errors: [] };
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // Excel row number (1-indexed + header)
        const name = (row['Item Name'] || '').toString().trim();
        const category = (row['Category'] || '').toString().trim().toLowerCase();
        const unit = (row['Unit'] || '').toString().trim();
        const unitCost = parseFloat(row['Unit Cost']) || 0;
        const minStock = parseFloat(row['Min Stock Level']) || 0;
        const supplierName = (row['Supplier'] || '').toString().trim();

        // Validate required fields
        if (!name) { results.errors.push(`Row ${rowNum}: Item Name is required`); continue; }
        if (!category) { results.errors.push(`Row ${rowNum}: Category is required`); continue; }
        if (!unit) { results.errors.push(`Row ${rowNum}: Unit is required`); continue; }

        // Validate against master data
        if (!validCategories.has(category)) {
          results.errors.push(`Row ${rowNum}: Invalid category "${category}"`);
          continue;
        }
        if (!validUnits.has(unit.toLowerCase())) {
          results.errors.push(`Row ${rowNum}: Invalid unit "${unit}"`);
          continue;
        }

        // Resolve supplier
        let supplierId = null;
        if (supplierName) {
          supplierId = supplierMap.get(supplierName.toLowerCase()) || null;
          if (!supplierId) {
            results.errors.push(`Row ${rowNum}: Supplier "${supplierName}" not found (item still imported without supplier)`);
          }
        }

        // Check if item already exists (by name) — update if so
        const existing = await client.query('SELECT id FROM inventory_items WHERE LOWER(name) = LOWER($1)', [name]);

        if (existing.rows.length > 0) {
          await client.query(
            'UPDATE inventory_items SET category=$1, unit=$2, unit_cost=$3, min_stock_level=$4, supplier_id=$5, updated_at=NOW() WHERE id=$6',
            [category, unit, unitCost, minStock, supplierId, existing.rows[0].id]
          );
          results.updated++;
        } else {
          await client.query(
            'INSERT INTO inventory_items (name, category, unit, unit_cost, current_stock, min_stock_level, supplier_id) VALUES ($1,$2,$3,$4,0,$5,$6)',
            [name, category, unit, unitCost, minStock, supplierId]
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
      message: `Import complete: ${results.created} created, ${results.updated} updated` +
        (results.errors.length ? `, ${results.errors.length} warning(s)` : ''),
      created: results.created,
      updated: results.updated,
      errors: results.errors,
    });
  } catch (err) {
    console.error('bulkUpload error:', err);
    res.status(500).json({ error: 'Failed to process file: ' + err.message });
  }
};

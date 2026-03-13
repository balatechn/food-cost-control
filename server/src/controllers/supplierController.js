const { pool } = require('../config/db');
const XLSX = require('xlsx');

exports.getAll = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM suppliers ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const { name, contact_person, phone, email, address } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO suppliers (name, contact_person, phone, email, address)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, contact_person, phone, email, address]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  const { name, contact_person, phone, email, address } = req.body;
  try {
    const result = await pool.query(
      `UPDATE suppliers SET name=$1, contact_person=$2, phone=$3, email=$4, address=$5
       WHERE id=$6 RETURNING *`,
      [name, contact_person, phone, email, address, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM suppliers WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.sampleExcel = async (req, res) => {
  try {
    const sampleData = [
      { 'Company Name': 'Fresh Farms Co.', 'Contact Person': 'John Smith', 'Phone': '+91-9876543210', 'Email': 'john@freshfarms.com', 'Address': '123 Market Road, Mumbai' },
      { 'Company Name': 'Premium Meats Ltd.', 'Contact Person': 'Raj Kumar', 'Phone': '+91-9123456789', 'Email': 'raj@premiummeats.in', 'Address': '45 Industrial Area, Delhi' },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 18 }, { wch: 25 }, { wch: 35 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Suppliers');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="suppliers_sample_template.xlsx"');
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
        const name = (row['Company Name'] || '').toString().trim();
        const contact_person = (row['Contact Person'] || '').toString().trim();
        const phone = (row['Phone'] || '').toString().trim();
        const email = (row['Email'] || '').toString().trim();
        const address = (row['Address'] || '').toString().trim();
        if (!name) { results.errors.push(`Row ${rowNum}: Company Name is required`); continue; }
        const existing = await client.query('SELECT id FROM suppliers WHERE LOWER(name) = LOWER($1)', [name]);
        if (existing.rows.length > 0) {
          await client.query('UPDATE suppliers SET contact_person=$1, phone=$2, email=$3, address=$4 WHERE id=$5',
            [contact_person, phone, email, address, existing.rows[0].id]);
          results.updated++;
        } else {
          await client.query('INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES ($1,$2,$3,$4,$5)',
            [name, contact_person, phone, email, address]);
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

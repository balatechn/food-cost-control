require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function migrateMasters() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create categories table
    await client.query(
      'CREATE TABLE IF NOT EXISTS categories (' +
      '  id SERIAL PRIMARY KEY,' +
      '  name VARCHAR(100) UNIQUE NOT NULL,' +
      '  description VARCHAR(255),' +
      '  created_at TIMESTAMP DEFAULT NOW(),' +
      '  updated_at TIMESTAMP DEFAULT NOW()' +
      ')'
    );

    // Seed from existing hardcoded categories
    const cats = ['meat','poultry','seafood','vegetables','fruits','dairy','beverages','dry_goods','spices','bakery','other'];
    for (const c of cats) {
      await client.query('INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [c]);
    }

    // Create units table
    await client.query(
      'CREATE TABLE IF NOT EXISTS units (' +
      '  id SERIAL PRIMARY KEY,' +
      '  name VARCHAR(50) UNIQUE NOT NULL,' +
      '  abbreviation VARCHAR(20),' +
      '  created_at TIMESTAMP DEFAULT NOW()' +
      ')'
    );

    // Seed units
    const units = [
      ['kilogram','kg'],['gram','g'],['liter','L'],['milliliter','ml'],
      ['piece','pcs'],['dozen','doz'],['packet','pkt'],['bottle','btl'],
      ['can','can'],['box','box'],['bag','bag'],['bunch','bnch'],['each','ea']
    ];
    for (const [n, a] of units) {
      await client.query('INSERT INTO units (name, abbreviation) VALUES ($1,$2) ON CONFLICT (name) DO NOTHING', [n, a]);
    }

    // Drop CHECK constraint on inventory_items.category so dynamic categories work
    const constraints = await client.query(
      "SELECT conname FROM pg_constraint WHERE conrelid = 'inventory_items'::regclass AND contype = 'c' AND conname LIKE '%category%'"
    );
    for (const row of constraints.rows) {
      await client.query('ALTER TABLE inventory_items DROP CONSTRAINT ' + row.conname);
      console.log('Dropped constraint:', row.conname);
    }

    await client.query('COMMIT');

    const catCount = await pool.query('SELECT count(*) FROM categories');
    const unitCount = await pool.query('SELECT count(*) FROM units');
    console.log('Categories:', catCount.rows[0].count, 'Units:', unitCount.rows[0].count);
    console.log('Master tables migration done!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrateMasters();

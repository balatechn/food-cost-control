const { pool } = require('../config/db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(200),
        role VARCHAR(50) NOT NULL DEFAULT 'controller'
          CHECK (role IN ('admin', 'controller', 'store_manager')),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Suppliers table
    await client.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        contact_person VARCHAR(200),
        phone VARCHAR(50),
        email VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Inventory Items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS inventory_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        category VARCHAR(100) NOT NULL
          CHECK (category IN ('meat','poultry','seafood','vegetables','fruits','dairy','beverages','dry_goods','spices','bakery','other')),
        unit VARCHAR(50) NOT NULL,
        unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
        current_stock NUMERIC(12,3) NOT NULL DEFAULT 0,
        min_stock_level NUMERIC(12,3) DEFAULT 0,
        supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Stock Transactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_transactions (
        id SERIAL PRIMARY KEY,
        item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
        transaction_type VARCHAR(50) NOT NULL
          CHECK (transaction_type IN ('opening','purchase','issue','closing','adjustment')),
        quantity NUMERIC(12,3) NOT NULL,
        unit_cost NUMERIC(12,2),
        total_cost NUMERIC(14,2),
        reference_no VARCHAR(100),
        notes TEXT,
        transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Purchases
    await client.query(`
      CREATE TABLE IF NOT EXISTS purchases (
        id SERIAL PRIMARY KEY,
        supplier_id INTEGER REFERENCES suppliers(id),
        item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
        quantity NUMERIC(12,3) NOT NULL,
        unit_cost NUMERIC(12,2) NOT NULL,
        total_cost NUMERIC(14,2) NOT NULL,
        invoice_no VARCHAR(100),
        purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Recipes
    await client.query(`
      CREATE TABLE IF NOT EXISTS recipes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        category VARCHAR(100),
        selling_price NUMERIC(12,2) NOT NULL DEFAULT 0,
        recipe_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
        food_cost_pct NUMERIC(6,2) NOT NULL DEFAULT 0,
        instructions TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Recipe Ingredients
    await client.query(`
      CREATE TABLE IF NOT EXISTS recipe_ingredients (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
        quantity NUMERIC(12,3) NOT NULL,
        unit VARCHAR(50) NOT NULL,
        ingredient_cost NUMERIC(12,2) NOT NULL DEFAULT 0
      );
    `);

    // Sales
    await client.query(`
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
        quantity_sold INTEGER NOT NULL DEFAULT 1,
        sale_price NUMERIC(12,2) NOT NULL,
        total_amount NUMERIC(14,2) NOT NULL,
        theoretical_cost NUMERIC(12,2) DEFAULT 0,
        sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Stock Issues
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_issues (
        id SERIAL PRIMARY KEY,
        item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
        quantity NUMERIC(12,3) NOT NULL,
        unit_cost NUMERIC(12,2),
        total_cost NUMERIC(14,2),
        department VARCHAR(100) DEFAULT 'kitchen',
        issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Waste Logs
    await client.query(`
      CREATE TABLE IF NOT EXISTS waste_logs (
        id SERIAL PRIMARY KEY,
        item_id INTEGER NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
        quantity NUMERIC(12,3) NOT NULL,
        unit_cost NUMERIC(12,2),
        total_cost NUMERIC(14,2),
        reason VARCHAR(200),
        waste_date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query('COMMIT');
    console.log('Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

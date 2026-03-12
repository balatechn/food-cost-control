const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Seed Users
    const adminHash = await bcrypt.hash('Nzt@2026!!', 10);
    const defaultHash = await bcrypt.hash('admin123', 10);
    await client.query(`
      INSERT INTO users (username, email, password_hash, full_name, role) VALUES
      ('bala', 'bala.techn@gmail.com', $1, 'Bala - Super Admin', 'admin'),
      ('controller', 'controller@foodcontrol.com', $2, 'F&B Controller', 'controller'),
      ('store_mgr', 'store@foodcontrol.com', $2, 'Store Manager', 'store_manager')
      ON CONFLICT (username) DO NOTHING;
    `, [adminHash, defaultHash]);

    // Seed Suppliers
    await client.query(`
      INSERT INTO suppliers (name, contact_person, phone, email) VALUES
      ('Fresh Farms Co.', 'John Smith', '+1-555-0101', 'john@freshfarms.com'),
      ('Ocean Catch Seafood', 'Maria Lopez', '+1-555-0102', 'maria@oceancatch.com'),
      ('Premium Meats Ltd.', 'Robert Brown', '+1-555-0103', 'robert@premiummeats.com'),
      ('Global Spice Trade', 'Priya Patel', '+1-555-0104', 'priya@globalspice.com'),
      ('Dairy Direct', 'Emily White', '+1-555-0105', 'emily@dairydirect.com')
      ON CONFLICT DO NOTHING;
    `);

    // Seed Inventory Items
    await client.query(`
      INSERT INTO inventory_items (name, category, unit, unit_cost, current_stock, min_stock_level, supplier_id) VALUES
      ('Chicken Breast', 'poultry', 'kg', 8.50, 45, 10, 3),
      ('Beef Tenderloin', 'meat', 'kg', 24.00, 20, 5, 3),
      ('Salmon Fillet', 'seafood', 'kg', 18.50, 15, 5, 2),
      ('Shrimp (16/20)', 'seafood', 'kg', 22.00, 12, 5, 2),
      ('Roma Tomatoes', 'vegetables', 'kg', 3.20, 30, 10, 1),
      ('Fresh Basil', 'spices', 'bunch', 1.50, 20, 8, 1),
      ('Olive Oil Extra Virgin', 'dry_goods', 'liter', 12.00, 10, 3, 4),
      ('Arborio Rice', 'dry_goods', 'kg', 5.50, 25, 8, 4),
      ('Parmesan Cheese', 'dairy', 'kg', 28.00, 8, 3, 5),
      ('Heavy Cream', 'dairy', 'liter', 4.50, 15, 5, 5),
      ('Mixed Salad Greens', 'vegetables', 'kg', 6.00, 12, 5, 1),
      ('Pasta Spaghetti', 'dry_goods', 'kg', 2.80, 30, 10, 4),
      ('Garlic', 'vegetables', 'kg', 7.00, 8, 3, 1),
      ('Onion', 'vegetables', 'kg', 1.80, 40, 15, 1),
      ('Butter', 'dairy', 'kg', 9.00, 10, 4, 5),
      ('White Wine (cooking)', 'beverages', 'liter', 8.00, 6, 2, 4),
      ('Flour All Purpose', 'dry_goods', 'kg', 1.20, 50, 15, 4),
      ('Sugar', 'dry_goods', 'kg', 1.50, 40, 10, 4),
      ('Eggs', 'dairy', 'dozen', 3.50, 20, 8, 5),
      ('Lemon', 'fruits', 'kg', 4.00, 10, 4, 1)
      ON CONFLICT DO NOTHING;
    `);

    // Seed Recipes
    await client.query(`
      INSERT INTO recipes (name, category, selling_price, recipe_cost, food_cost_pct, instructions) VALUES
      ('Grilled Chicken Caesar', 'Main Course', 18.00, 5.85, 32.50, 'Grill chicken breast, toss with romaine, croutons, parmesan, Caesar dressing'),
      ('Beef Tenderloin Steak', 'Main Course', 38.00, 10.80, 28.42, 'Season and sear tenderloin, serve with roasted vegetables'),
      ('Salmon Risotto', 'Main Course', 28.00, 9.25, 33.04, 'Pan-sear salmon, prepare Arborio rice risotto with parmesan'),
      ('Shrimp Pasta', 'Main Course', 24.00, 7.60, 31.67, 'Sauté shrimp with garlic, toss with spaghetti in white wine sauce'),
      ('Margherita Pizza', 'Main Course', 16.00, 3.80, 23.75, 'Stretch dough, top with tomato sauce, mozzarella, fresh basil'),
      ('Garden Salad', 'Starter', 12.00, 2.40, 20.00, 'Mix fresh greens with vinaigrette dressing'),
      ('Tomato Basil Soup', 'Starter', 10.00, 2.10, 21.00, 'Roast tomatoes, blend with basil and cream'),
      ('Crème Brûlée', 'Dessert', 12.00, 2.55, 21.25, 'Bake custard with vanilla, caramelize top'),
      ('Tiramisu', 'Dessert', 14.00, 3.20, 22.86, 'Layer mascarpone cream with espresso-soaked ladyfingers'),
      ('Mushroom Risotto', 'Main Course', 22.00, 6.50, 29.55, 'Cook Arborio rice with mushrooms, parmesan, white wine')
      ON CONFLICT DO NOTHING;
    `);

    // Seed Recipe Ingredients
    await client.query(`
      INSERT INTO recipe_ingredients (recipe_id, item_id, quantity, unit, ingredient_cost) VALUES
      (1, 1, 0.200, 'kg', 1.70),
      (1, 11, 0.150, 'kg', 0.90),
      (1, 9, 0.030, 'kg', 0.84),
      (1, 7, 0.020, 'liter', 0.24),
      (1, 20, 0.050, 'kg', 0.20),
      (2, 2, 0.250, 'kg', 6.00),
      (2, 15, 0.030, 'kg', 0.27),
      (2, 7, 0.020, 'liter', 0.24),
      (2, 14, 0.050, 'kg', 0.09),
      (3, 3, 0.180, 'kg', 3.33),
      (3, 8, 0.120, 'kg', 0.66),
      (3, 9, 0.040, 'kg', 1.12),
      (3, 15, 0.025, 'kg', 0.23),
      (3, 16, 0.050, 'liter', 0.40),
      (4, 4, 0.150, 'kg', 3.30),
      (4, 12, 0.150, 'kg', 0.42),
      (4, 13, 0.010, 'kg', 0.07),
      (4, 7, 0.020, 'liter', 0.24),
      (4, 16, 0.040, 'liter', 0.32),
      (5, 5, 0.150, 'kg', 0.48),
      (5, 6, 0.020, 'bunch', 0.03),
      (5, 17, 0.200, 'kg', 0.24),
      (5, 7, 0.015, 'liter', 0.18),
      (6, 11, 0.200, 'kg', 1.20),
      (6, 5, 0.100, 'kg', 0.32),
      (6, 7, 0.030, 'liter', 0.36),
      (6, 20, 0.030, 'kg', 0.12),
      (7, 5, 0.300, 'kg', 0.96),
      (7, 6, 0.030, 'bunch', 0.05),
      (7, 10, 0.100, 'liter', 0.45),
      (7, 14, 0.050, 'kg', 0.09),
      (8, 10, 0.150, 'liter', 0.68),
      (8, 19, 0.250, 'dozen', 0.88),
      (8, 18, 0.030, 'kg', 0.05),
      (9, 10, 0.120, 'liter', 0.54),
      (9, 19, 0.200, 'dozen', 0.70),
      (9, 18, 0.040, 'kg', 0.06),
      (10, 8, 0.150, 'kg', 0.83),
      (10, 9, 0.040, 'kg', 1.12),
      (10, 15, 0.025, 'kg', 0.23),
      (10, 16, 0.060, 'liter', 0.48),
      (10, 14, 0.040, 'kg', 0.07)
      ON CONFLICT DO NOTHING;
    `);

    // Seed Sales (last 30 days)
    const salesValues = [];
    const recipes = [
      { id: 1, price: 18, cost: 5.85 },
      { id: 2, price: 38, cost: 10.80 },
      { id: 3, price: 28, cost: 9.25 },
      { id: 4, price: 24, cost: 7.60 },
      { id: 5, price: 16, cost: 3.80 },
      { id: 6, price: 12, cost: 2.40 },
      { id: 7, price: 10, cost: 2.10 },
      { id: 8, price: 12, cost: 2.55 },
      { id: 9, price: 14, cost: 3.20 },
      { id: 10, price: 22, cost: 6.50 },
    ];

    for (let d = 30; d >= 0; d--) {
      for (const r of recipes) {
        const qty = Math.floor(Math.random() * 15) + 3;
        const dateStr = `CURRENT_DATE - INTERVAL '${d} days'`;
        salesValues.push(
          `(${r.id}, ${qty}, ${r.price}, ${(qty * r.price).toFixed(2)}, ${(qty * r.cost).toFixed(2)}, ${dateStr})`
        );
      }
    }
    await client.query(`
      INSERT INTO sales (recipe_id, quantity_sold, sale_price, total_amount, theoretical_cost, sale_date)
      VALUES ${salesValues.join(',\n')}
      ON CONFLICT DO NOTHING;
    `);

    // Seed Stock Transactions (purchases over last 30 days)
    await client.query(`
      INSERT INTO stock_transactions (item_id, transaction_type, quantity, unit_cost, total_cost, transaction_date) VALUES
      (1, 'purchase', 50, 8.50, 425.00, CURRENT_DATE - INTERVAL '28 days'),
      (2, 'purchase', 25, 24.00, 600.00, CURRENT_DATE - INTERVAL '28 days'),
      (3, 'purchase', 20, 18.50, 370.00, CURRENT_DATE - INTERVAL '28 days'),
      (5, 'purchase', 40, 3.20, 128.00, CURRENT_DATE - INTERVAL '25 days'),
      (8, 'purchase', 30, 5.50, 165.00, CURRENT_DATE - INTERVAL '20 days'),
      (9, 'purchase', 10, 28.00, 280.00, CURRENT_DATE - INTERVAL '18 days'),
      (12, 'purchase', 35, 2.80, 98.00, CURRENT_DATE - INTERVAL '15 days'),
      (1, 'purchase', 40, 8.50, 340.00, CURRENT_DATE - INTERVAL '14 days'),
      (3, 'purchase', 15, 18.50, 277.50, CURRENT_DATE - INTERVAL '10 days'),
      (10, 'purchase', 20, 4.50, 90.00, CURRENT_DATE - INTERVAL '7 days'),

      (1, 'issue', 30, 8.50, 255.00, CURRENT_DATE - INTERVAL '27 days'),
      (2, 'issue', 15, 24.00, 360.00, CURRENT_DATE - INTERVAL '27 days'),
      (3, 'issue', 10, 18.50, 185.00, CURRENT_DATE - INTERVAL '26 days'),
      (5, 'issue', 20, 3.20, 64.00, CURRENT_DATE - INTERVAL '24 days'),
      (8, 'issue', 15, 5.50, 82.50, CURRENT_DATE - INTERVAL '19 days'),
      (12, 'issue', 20, 2.80, 56.00, CURRENT_DATE - INTERVAL '14 days'),
      (1, 'issue', 25, 8.50, 212.50, CURRENT_DATE - INTERVAL '13 days'),
      (3, 'issue', 8, 18.50, 148.00, CURRENT_DATE - INTERVAL '9 days'),
      (10, 'issue', 12, 4.50, 54.00, CURRENT_DATE - INTERVAL '6 days')
      ON CONFLICT DO NOTHING;
    `);

    // Seed Purchases
    await client.query(`
      INSERT INTO purchases (supplier_id, item_id, quantity, unit_cost, total_cost, invoice_no, purchase_date) VALUES
      (3, 1, 50, 8.50, 425.00, 'INV-001', CURRENT_DATE - INTERVAL '28 days'),
      (3, 2, 25, 24.00, 600.00, 'INV-002', CURRENT_DATE - INTERVAL '28 days'),
      (2, 3, 20, 18.50, 370.00, 'INV-003', CURRENT_DATE - INTERVAL '28 days'),
      (1, 5, 40, 3.20, 128.00, 'INV-004', CURRENT_DATE - INTERVAL '25 days'),
      (4, 8, 30, 5.50, 165.00, 'INV-005', CURRENT_DATE - INTERVAL '20 days'),
      (5, 9, 10, 28.00, 280.00, 'INV-006', CURRENT_DATE - INTERVAL '18 days'),
      (4, 12, 35, 2.80, 98.00, 'INV-007', CURRENT_DATE - INTERVAL '15 days'),
      (3, 1, 40, 8.50, 340.00, 'INV-008', CURRENT_DATE - INTERVAL '14 days'),
      (2, 3, 15, 18.50, 277.50, 'INV-009', CURRENT_DATE - INTERVAL '10 days'),
      (5, 10, 20, 4.50, 90.00, 'INV-010', CURRENT_DATE - INTERVAL '7 days')
      ON CONFLICT DO NOTHING;
    `);

    // Seed Waste Logs
    await client.query(`
      INSERT INTO waste_logs (item_id, quantity, unit_cost, total_cost, reason, waste_date) VALUES
      (1, 2.5, 8.50, 21.25, 'Expired - temperature abuse', CURRENT_DATE - INTERVAL '20 days'),
      (5, 3.0, 3.20, 9.60, 'Over-ripe, spoiled', CURRENT_DATE - INTERVAL '15 days'),
      (3, 1.0, 18.50, 18.50, 'Improper storage', CURRENT_DATE - INTERVAL '12 days'),
      (11, 1.5, 6.00, 9.00, 'Wilted greens', CURRENT_DATE - INTERVAL '8 days'),
      (10, 2.0, 4.50, 9.00, 'Curdled, past use-by', CURRENT_DATE - INTERVAL '5 days'),
      (6, 5.0, 1.50, 7.50, 'Wilted', CURRENT_DATE - INTERVAL '3 days'),
      (19, 1.0, 3.50, 3.50, 'Cracked', CURRENT_DATE - INTERVAL '1 day')
      ON CONFLICT DO NOTHING;
    `);

    // Seed Stock Issues
    await client.query(`
      INSERT INTO stock_issues (item_id, quantity, unit_cost, total_cost, department, issue_date) VALUES
      (1, 15, 8.50, 127.50, 'kitchen', CURRENT_DATE - INTERVAL '5 days'),
      (2, 8, 24.00, 192.00, 'kitchen', CURRENT_DATE - INTERVAL '5 days'),
      (3, 6, 18.50, 111.00, 'kitchen', CURRENT_DATE - INTERVAL '5 days'),
      (5, 10, 3.20, 32.00, 'kitchen', CURRENT_DATE - INTERVAL '4 days'),
      (8, 8, 5.50, 44.00, 'kitchen', CURRENT_DATE - INTERVAL '4 days'),
      (9, 3, 28.00, 84.00, 'kitchen', CURRENT_DATE - INTERVAL '3 days'),
      (12, 10, 2.80, 28.00, 'kitchen', CURRENT_DATE - INTERVAL '3 days'),
      (4, 5, 22.00, 110.00, 'kitchen', CURRENT_DATE - INTERVAL '2 days'),
      (10, 6, 4.50, 27.00, 'kitchen', CURRENT_DATE - INTERVAL '2 days'),
      (15, 4, 9.00, 36.00, 'kitchen', CURRENT_DATE - INTERVAL '1 day')
      ON CONFLICT DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('Seed data inserted successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Seeding failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();

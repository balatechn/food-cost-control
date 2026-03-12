const { pool } = require('../config/db');

exports.dailyFoodCost = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        d.day::date AS date,
        COALESCE(SUM(si.total_cost), 0) AS actual_cost,
        COALESCE(SUM(s_agg.daily_theo_cost), 0) AS theoretical_cost,
        COALESCE(SUM(s_agg.daily_sales), 0) AS total_sales,
        CASE WHEN COALESCE(SUM(s_agg.daily_sales), 0) > 0
          THEN ROUND(COALESCE(SUM(si.total_cost), 0) / SUM(s_agg.daily_sales) * 100, 2)
          ELSE 0 END AS food_cost_pct
      FROM generate_series(CURRENT_DATE - INTERVAL '29 days', CURRENT_DATE, '1 day') AS d(day)
      LEFT JOIN stock_issues si ON si.issue_date = d.day::date
      LEFT JOIN (
        SELECT sale_date, SUM(theoretical_cost) AS daily_theo_cost, SUM(total_amount) AS daily_sales
        FROM sales GROUP BY sale_date
      ) s_agg ON s_agg.sale_date = d.day::date
      GROUP BY d.day ORDER BY d.day
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.inventoryReport = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        i.name, i.category, i.unit, i.unit_cost, i.current_stock,
        (i.current_stock * i.unit_cost) AS stock_value,
        i.min_stock_level,
        CASE WHEN i.current_stock <= i.min_stock_level THEN true ELSE false END AS low_stock,
        s.name AS supplier_name
      FROM inventory_items i
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      ORDER BY i.category, i.name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.purchaseReport = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const startDate = from_date || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const endDate = to_date || new Date().toISOString().slice(0, 10);

    const result = await pool.query(`
      SELECT
        p.purchase_date, p.invoice_no, s.name AS supplier_name,
        i.name AS item_name, p.quantity, p.unit_cost, p.total_cost
      FROM purchases p
      JOIN inventory_items i ON p.item_id = i.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.purchase_date BETWEEN $1 AND $2
      ORDER BY p.purchase_date DESC
    `, [startDate, endDate]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.wasteReport = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const startDate = from_date || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const endDate = to_date || new Date().toISOString().slice(0, 10);

    const result = await pool.query(`
      SELECT
        w.waste_date, i.name AS item_name, i.category,
        w.quantity, w.unit_cost, w.total_cost, w.reason
      FROM waste_logs w
      JOIN inventory_items i ON w.item_id = i.id
      WHERE w.waste_date BETWEEN $1 AND $2
      ORDER BY w.waste_date DESC
    `, [startDate, endDate]);

    const totalWaste = result.rows.reduce((sum, r) => sum + parseFloat(r.total_cost), 0);

    res.json({ items: result.rows, totalWasteCost: totalWaste });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.menuProfitability = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.name AS menu_item,
        r.category,
        r.selling_price,
        r.recipe_cost,
        (r.selling_price - r.recipe_cost) AS gross_profit,
        r.food_cost_pct,
        COALESCE(SUM(s.quantity_sold), 0) AS total_sold,
        COALESCE(SUM(s.total_amount), 0) AS total_revenue,
        COALESCE(SUM(s.quantity_sold), 0) * (r.selling_price - r.recipe_cost) AS total_profit
      FROM recipes r
      LEFT JOIN sales s ON s.recipe_id = r.id
        AND s.sale_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY r.id, r.name, r.category, r.selling_price, r.recipe_cost, r.food_cost_pct
      ORDER BY total_profit DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const { pool } = require('../config/db');

exports.getDashboard = async (req, res) => {
  try {
    // KPI: Total food sales (last 30 days)
    const salesResult = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS total_sales
      FROM sales WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'
    `);

    // KPI: Total food cost (issue-based, last 30 days)
    const costResult = await pool.query(`
      SELECT COALESCE(SUM(total_cost), 0) AS total_cost
      FROM stock_issues WHERE issue_date >= CURRENT_DATE - INTERVAL '30 days'
    `);

    // KPI: Inventory value
    const invResult = await pool.query(`
      SELECT COALESCE(SUM(current_stock * unit_cost), 0) AS inventory_value
      FROM inventory_items
    `);

    // KPI: Theoretical cost (last 30 days)
    const theoResult = await pool.query(`
      SELECT COALESCE(SUM(theoretical_cost), 0) AS theoretical_cost
      FROM sales WHERE sale_date >= CURRENT_DATE - INTERVAL '30 days'
    `);

    const totalSales = parseFloat(salesResult.rows[0].total_sales);
    const totalCost = parseFloat(costResult.rows[0].total_cost);
    const inventoryValue = parseFloat(invResult.rows[0].inventory_value);
    const theoreticalCost = parseFloat(theoResult.rows[0].theoretical_cost);

    const foodCostPct = totalSales > 0 ? ((totalCost / totalSales) * 100).toFixed(2) : 0;
    const variancePct = theoreticalCost > 0
      ? (((totalCost - theoreticalCost) / theoreticalCost) * 100).toFixed(2) : 0;

    // Chart: Food cost trend (daily for last 14 days)
    const trendResult = await pool.query(`
      SELECT
        d.day::date AS date,
        COALESCE(SUM(si.total_cost), 0) AS daily_cost,
        COALESCE(SUM(s.total_amount), 0) AS daily_sales
      FROM generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day') AS d(day)
      LEFT JOIN stock_issues si ON si.issue_date = d.day::date
      LEFT JOIN sales s ON s.sale_date = d.day::date
      GROUP BY d.day ORDER BY d.day
    `);

    // Chart: Top selling items
    const topItemsResult = await pool.query(`
      SELECT r.name, SUM(s.quantity_sold) AS total_qty, SUM(s.total_amount) AS total_revenue
      FROM sales s JOIN recipes r ON s.recipe_id = r.id
      WHERE s.sale_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY r.name ORDER BY total_revenue DESC LIMIT 10
    `);

    // Recent transactions
    const recentResult = await pool.query(`
      (SELECT 'sale' AS type, r.name AS item, s.total_amount AS amount, s.sale_date AS date
       FROM sales s JOIN recipes r ON s.recipe_id = r.id
       ORDER BY s.created_at DESC LIMIT 5)
      UNION ALL
      (SELECT 'purchase' AS type, i.name AS item, p.total_cost AS amount, p.purchase_date AS date
       FROM purchases p JOIN inventory_items i ON p.item_id = i.id
       ORDER BY p.created_at DESC LIMIT 5)
      ORDER BY date DESC LIMIT 10
    `);

    // Low stock alerts
    const lowStockResult = await pool.query(`
      SELECT name, current_stock, min_stock_level, unit
      FROM inventory_items
      WHERE current_stock <= min_stock_level
      ORDER BY (current_stock / NULLIF(min_stock_level, 0)) ASC
      LIMIT 10
    `);

    // Inventory consumption (by category, last 30 days)
    const consumptionResult = await pool.query(`
      SELECT i.category, SUM(si.total_cost) AS total_issued
      FROM stock_issues si JOIN inventory_items i ON si.item_id = i.id
      WHERE si.issue_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY i.category ORDER BY total_issued DESC
    `);

    res.json({
      kpis: {
        totalSales,
        totalCost,
        foodCostPct: parseFloat(foodCostPct),
        inventoryValue,
        variancePct: parseFloat(variancePct),
      },
      foodCostTrend: trendResult.rows,
      topSellingItems: topItemsResult.rows,
      recentTransactions: recentResult.rows,
      lowStockAlerts: lowStockResult.rows,
      inventoryConsumption: consumptionResult.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

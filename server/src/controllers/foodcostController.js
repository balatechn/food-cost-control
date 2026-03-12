const { pool } = require('../config/db');

// Issue-Based Food Cost: Opening + Purchases - Closing
exports.getIssueBased = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const startDate = from_date || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const endDate = to_date || new Date().toISOString().slice(0, 10);

    // Opening stock value (beginning of period)
    const openingResult = await pool.query(`
      SELECT COALESCE(SUM(
        CASE WHEN st.transaction_type IN ('opening','purchase','adjustment')
             THEN st.quantity * st.unit_cost
             ELSE -(st.quantity * st.unit_cost) END
      ), 0) AS opening_stock
      FROM stock_transactions st
      WHERE st.transaction_date < $1
    `, [startDate]);

    // Purchases during period
    const purchaseResult = await pool.query(`
      SELECT COALESCE(SUM(total_cost), 0) AS total_purchases
      FROM purchases WHERE purchase_date BETWEEN $1 AND $2
    `, [startDate, endDate]);

    // Total issues during period (this is the actual cost)
    const issueResult = await pool.query(`
      SELECT COALESCE(SUM(total_cost), 0) AS total_issues
      FROM stock_issues WHERE issue_date BETWEEN $1 AND $2
    `, [startDate, endDate]);

    // Closing stock value
    const closingResult = await pool.query(`
      SELECT COALESCE(SUM(current_stock * unit_cost), 0) AS closing_stock
      FROM inventory_items
    `);

    // Sales during period
    const salesResult = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) AS total_sales
      FROM sales WHERE sale_date BETWEEN $1 AND $2
    `, [startDate, endDate]);

    const opening = parseFloat(openingResult.rows[0].opening_stock);
    const purchases = parseFloat(purchaseResult.rows[0].total_purchases);
    const closing = parseFloat(closingResult.rows[0].closing_stock);
    const totalSales = parseFloat(salesResult.rows[0].total_sales);
    const totalIssues = parseFloat(issueResult.rows[0].total_issues);

    const foodCost = opening + purchases - closing;
    const foodCostPct = totalSales > 0 ? ((foodCost / totalSales) * 100).toFixed(2) : 0;

    res.json({
      period: { from: startDate, to: endDate },
      openingStock: opening,
      purchases,
      closingStock: closing,
      foodCost,
      foodCostPct: parseFloat(foodCostPct),
      totalSales,
      totalIssues,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Sales-Based (Theoretical) Food Cost: Recipe Cost × Qty Sold
exports.getSalesBased = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const startDate = from_date || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const endDate = to_date || new Date().toISOString().slice(0, 10);

    const result = await pool.query(`
      SELECT
        r.name AS menu_item,
        SUM(s.quantity_sold) AS total_qty,
        r.recipe_cost,
        SUM(s.quantity_sold) * r.recipe_cost AS theoretical_cost,
        SUM(s.total_amount) AS total_sales,
        CASE WHEN SUM(s.total_amount) > 0
          THEN ROUND((SUM(s.quantity_sold) * r.recipe_cost / SUM(s.total_amount)) * 100, 2)
          ELSE 0 END AS food_cost_pct
      FROM sales s
      JOIN recipes r ON s.recipe_id = r.id
      WHERE s.sale_date BETWEEN $1 AND $2
      GROUP BY r.id, r.name, r.recipe_cost
      ORDER BY theoretical_cost DESC
    `, [startDate, endDate]);

    const totals = result.rows.reduce(
      (acc, row) => ({
        totalTheoreticalCost: acc.totalTheoreticalCost + parseFloat(row.theoretical_cost),
        totalSales: acc.totalSales + parseFloat(row.total_sales),
      }),
      { totalTheoreticalCost: 0, totalSales: 0 }
    );

    const overallPct = totals.totalSales > 0
      ? ((totals.totalTheoreticalCost / totals.totalSales) * 100).toFixed(2) : 0;

    res.json({
      period: { from: startDate, to: endDate },
      items: result.rows,
      totalTheoreticalCost: totals.totalTheoreticalCost,
      totalSales: totals.totalSales,
      overallFoodCostPct: parseFloat(overallPct),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const { pool } = require('../config/db');

exports.getVariance = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;
    const startDate = from_date || new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    const endDate = to_date || new Date().toISOString().slice(0, 10);

    // Theoretical usage: from sales * recipe ingredients
    const theoreticalResult = await pool.query(`
      SELECT
        i.id AS item_id,
        i.name AS item_name,
        i.unit,
        COALESCE(SUM(ri.quantity * s.quantity_sold), 0) AS theoretical_usage,
        COALESCE(SUM(ri.ingredient_cost * s.quantity_sold), 0) AS theoretical_cost
      FROM inventory_items i
      LEFT JOIN recipe_ingredients ri ON ri.item_id = i.id
      LEFT JOIN sales s ON s.recipe_id = ri.recipe_id
        AND s.sale_date BETWEEN $1 AND $2
      GROUP BY i.id, i.name, i.unit
      ORDER BY i.name
    `, [startDate, endDate]);

    // Actual issues
    const actualResult = await pool.query(`
      SELECT
        item_id,
        SUM(quantity) AS actual_issue,
        SUM(total_cost) AS actual_cost
      FROM stock_issues
      WHERE issue_date BETWEEN $1 AND $2
      GROUP BY item_id
    `, [startDate, endDate]);

    const actualMap = {};
    for (const row of actualResult.rows) {
      actualMap[row.item_id] = row;
    }

    const varianceReport = theoreticalResult.rows
      .map((item) => {
        const actual = actualMap[item.item_id] || { actual_issue: 0, actual_cost: 0 };
        const theoretical = parseFloat(item.theoretical_usage);
        const actualQty = parseFloat(actual.actual_issue);
        const theoreticalCost = parseFloat(item.theoretical_cost);
        const actualCost = parseFloat(actual.actual_cost);
        const variance = actualQty - theoretical;
        const varianceCost = actualCost - theoreticalCost;
        const variancePct = theoretical > 0 ? ((variance / theoretical) * 100).toFixed(2) : 0;

        return {
          item_id: item.item_id,
          item_name: item.item_name,
          unit: item.unit,
          theoretical_usage: theoretical,
          actual_issue: actualQty,
          variance,
          variance_pct: parseFloat(variancePct),
          theoretical_cost: theoreticalCost,
          actual_cost: actualCost,
          variance_cost: varianceCost,
        };
      })
      .filter((item) => item.theoretical_usage > 0 || item.actual_issue > 0);

    const totals = varianceReport.reduce(
      (acc, item) => ({
        totalTheoreticalCost: acc.totalTheoreticalCost + item.theoretical_cost,
        totalActualCost: acc.totalActualCost + item.actual_cost,
        totalVarianceCost: acc.totalVarianceCost + item.variance_cost,
      }),
      { totalTheoreticalCost: 0, totalActualCost: 0, totalVarianceCost: 0 }
    );

    res.json({
      period: { from: startDate, to: endDate },
      items: varianceReport,
      totals,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

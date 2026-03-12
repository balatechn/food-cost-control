const { pool } = require('../config/db');

exports.getMenuEngineering = async (req, res) => {
  try {
    // Get all menu items with sales data for last 30 days
    const result = await pool.query(`
      SELECT
        r.id,
        r.name AS menu_item,
        r.category,
        r.selling_price,
        r.recipe_cost,
        (r.selling_price - r.recipe_cost) AS contribution_margin,
        r.food_cost_pct,
        COALESCE(SUM(s.quantity_sold), 0) AS total_sold,
        COALESCE(SUM(s.total_amount), 0) AS total_revenue,
        COALESCE(SUM(s.quantity_sold), 0) * (r.selling_price - r.recipe_cost) AS total_contribution
      FROM recipes r
      LEFT JOIN sales s ON s.recipe_id = r.id
        AND s.sale_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY r.id, r.name, r.category, r.selling_price, r.recipe_cost, r.food_cost_pct
      ORDER BY r.name
    `);

    const items = result.rows;
    if (items.length === 0) return res.json({ items: [], averages: {} });

    // Calculate averages for classification
    const totalItemsSold = items.reduce((sum, i) => sum + parseInt(i.total_sold), 0);
    const avgPopularity = totalItemsSold / items.length;
    const avgContributionMargin =
      items.reduce((sum, i) => sum + parseFloat(i.contribution_margin), 0) / items.length;

    // Classify items
    const classified = items.map((item) => {
      const isHighPopularity = parseInt(item.total_sold) >= avgPopularity * 0.7;
      const isHighMargin = parseFloat(item.contribution_margin) >= avgContributionMargin;

      let classification;
      if (isHighPopularity && isHighMargin) {
        classification = 'Star';
      } else if (isHighPopularity && !isHighMargin) {
        classification = 'Plow Horse';
      } else if (!isHighPopularity && isHighMargin) {
        classification = 'Puzzle';
      } else {
        classification = 'Dog';
      }

      return {
        ...item,
        classification,
        is_high_popularity: isHighPopularity,
        is_high_margin: isHighMargin,
      };
    });

    const summary = {
      stars: classified.filter((i) => i.classification === 'Star').length,
      plowHorses: classified.filter((i) => i.classification === 'Plow Horse').length,
      puzzles: classified.filter((i) => i.classification === 'Puzzle').length,
      dogs: classified.filter((i) => i.classification === 'Dog').length,
    };

    res.json({
      items: classified,
      averages: {
        avgPopularity: Math.round(avgPopularity),
        avgContributionMargin: avgContributionMargin.toFixed(2),
      },
      summary,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

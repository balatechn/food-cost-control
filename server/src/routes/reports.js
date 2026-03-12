const router = require('express').Router();
const controller = require('../controllers/reportController');
const { auth } = require('../middleware/auth');

router.get('/daily-food-cost', auth, controller.dailyFoodCost);
router.get('/inventory', auth, controller.inventoryReport);
router.get('/purchases', auth, controller.purchaseReport);
router.get('/waste', auth, controller.wasteReport);
router.get('/menu-profitability', auth, controller.menuProfitability);

module.exports = router;

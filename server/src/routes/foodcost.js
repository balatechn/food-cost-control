const router = require('express').Router();
const controller = require('../controllers/foodcostController');
const { auth } = require('../middleware/auth');

router.get('/issue-based', auth, controller.getIssueBased);
router.get('/sales-based', auth, controller.getSalesBased);

module.exports = router;

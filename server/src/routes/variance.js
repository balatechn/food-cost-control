const router = require('express').Router();
const controller = require('../controllers/varianceController');
const { auth } = require('../middleware/auth');

router.get('/', auth, controller.getVariance);

module.exports = router;

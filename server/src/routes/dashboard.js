const router = require('express').Router();
const controller = require('../controllers/dashboardController');
const { auth } = require('../middleware/auth');

router.get('/', auth, controller.getDashboard);

module.exports = router;

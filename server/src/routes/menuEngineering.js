const router = require('express').Router();
const controller = require('../controllers/menuEngineeringController');
const { auth } = require('../middleware/auth');

router.get('/', auth, controller.getMenuEngineering);

module.exports = router;

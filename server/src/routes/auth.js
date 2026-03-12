const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('../controllers/authController');
const { auth, authorize } = require('../middleware/auth');

router.post('/login', [
  body('username').notEmpty().trim(),
  body('password').notEmpty(),
], controller.login);

router.post('/register', auth, authorize('admin'), [
  body('username').notEmpty().trim().isLength({ min: 3 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('full_name').notEmpty().trim(),
], controller.register);

router.get('/profile', auth, controller.getProfile);

module.exports = router;

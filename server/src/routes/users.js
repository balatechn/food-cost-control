const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('../controllers/userController');
const { auth, authorize } = require('../middleware/auth');

router.use(auth, authorize('admin'));

router.get('/', controller.getAll);

router.post('/', [
  body('username').notEmpty().trim().isLength({ min: 3 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('full_name').notEmpty().trim(),
  body('role').isIn(['admin', 'controller', 'store_manager']),
], controller.create);

router.put('/:id', [
  body('username').notEmpty().trim().isLength({ min: 3 }),
  body('email').isEmail().normalizeEmail(),
  body('full_name').notEmpty().trim(),
  body('role').isIn(['admin', 'controller', 'store_manager']),
], controller.update);

router.delete('/:id', controller.remove);

module.exports = router;

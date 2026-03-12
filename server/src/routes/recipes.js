const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('../controllers/recipeController');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, controller.getAll);
router.get('/:id', auth, controller.getById);

router.post('/', auth, authorize('admin', 'controller'), [
  body('name').notEmpty().trim(),
  body('selling_price').isNumeric(),
], controller.create);

router.put('/:id', auth, authorize('admin', 'controller'), controller.update);
router.delete('/:id', auth, authorize('admin'), controller.remove);

module.exports = router;

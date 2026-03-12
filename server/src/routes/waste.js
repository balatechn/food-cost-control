const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('../controllers/wasteController');
const { auth } = require('../middleware/auth');

router.get('/', auth, controller.getAll);

router.post('/', auth, [
  body('item_id').isInt(),
  body('quantity').isNumeric(),
  body('reason').notEmpty().trim(),
], controller.create);

router.delete('/:id', auth, controller.remove);

module.exports = router;

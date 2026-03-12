const router = require('express').Router();
const { body } = require('express-validator');
const controller = require('../controllers/salesController');
const { auth } = require('../middleware/auth');

router.get('/', auth, controller.getAll);
router.get('/daily-summary', auth, controller.getDailySummary);

router.post('/', auth, [
  body('recipe_id').isInt(),
  body('quantity_sold').isInt({ min: 1 }),
], controller.create);

router.delete('/:id', auth, controller.remove);

module.exports = router;

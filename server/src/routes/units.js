const express = require('express');
const { body } = require('express-validator');
const { auth, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/unitController');

const router = express.Router();

router.get('/', auth, ctrl.getAll);

router.post('/', auth, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Unit name is required'),
], ctrl.create);

router.put('/:id', auth, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Unit name is required'),
], ctrl.update);

router.delete('/:id', auth, authorize('admin'), ctrl.remove);

module.exports = router;

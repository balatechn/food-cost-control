const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const { auth, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/categoryController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', auth, ctrl.getAll);
router.get('/sample-excel', auth, ctrl.sampleExcel);

router.post('/', auth, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Category name is required'),
], ctrl.create);

router.post('/bulk-upload', auth, authorize('admin'), upload.single('file'), ctrl.bulkUpload);

router.put('/:id', auth, authorize('admin'), [
  body('name').trim().notEmpty().withMessage('Category name is required'),
], ctrl.update);

router.delete('/:id', auth, authorize('admin'), ctrl.remove);

module.exports = router;

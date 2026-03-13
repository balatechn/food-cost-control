const router = require('express').Router();
const { body } = require('express-validator');
const multer = require('multer');
const controller = require('../controllers/recipeController');
const { auth, authorize } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', auth, controller.getAll);
router.get('/sample-excel', auth, controller.sampleExcel);
router.get('/:id', auth, controller.getById);

router.post('/', auth, authorize('admin', 'controller'), [
  body('name').notEmpty().trim(),
  body('selling_price').isNumeric(),
], controller.create);

router.post('/bulk-upload', auth, authorize('admin', 'controller'), upload.single('file'), controller.bulkUpload);
router.put('/:id', auth, authorize('admin', 'controller'), controller.update);
router.delete('/:id', auth, authorize('admin'), controller.remove);

module.exports = router;

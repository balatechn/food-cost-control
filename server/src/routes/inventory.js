const router = require('express').Router();
const { body } = require('express-validator');
const multer = require('multer');
const controller = require('../controllers/inventoryController');
const { auth, authorize } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', auth, controller.getAll);
router.get('/transactions', auth, controller.getTransactions);
router.get('/sample-excel', auth, controller.sampleExcel);
router.get('/:id', auth, controller.getById);

router.post('/', auth, authorize('admin', 'controller', 'store_manager'), [
  body('name').notEmpty().trim(),
  body('category').notEmpty(),
  body('unit').notEmpty(),
  body('unit_cost').isNumeric(),
], controller.create);

router.put('/:id', auth, authorize('admin', 'controller', 'store_manager'), [
  body('name').notEmpty().trim(),
  body('category').notEmpty(),
  body('unit').notEmpty(),
  body('unit_cost').isNumeric(),
], controller.update);

router.delete('/:id', auth, authorize('admin'), controller.remove);

router.post('/purchase', auth, authorize('admin', 'controller', 'store_manager'), [
  body('item_id').isInt(),
  body('quantity').isNumeric(),
  body('unit_cost').isNumeric(),
], controller.addPurchase);

router.post('/issue', auth, authorize('admin', 'controller', 'store_manager'), [
  body('item_id').isInt(),
  body('quantity').isNumeric(),
], controller.issueStock);

router.post('/bulk-upload', auth, authorize('admin', 'controller', 'store_manager'), upload.single('file'), controller.bulkUpload);

module.exports = router;

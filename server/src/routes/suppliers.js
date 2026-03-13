const router = require('express').Router();
const multer = require('multer');
const controller = require('../controllers/supplierController');
const { auth, authorize } = require('../middleware/auth');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', auth, controller.getAll);
router.get('/sample-excel', auth, controller.sampleExcel);
router.post('/', auth, authorize('admin', 'controller', 'store_manager'), controller.create);
router.post('/bulk-upload', auth, authorize('admin', 'controller', 'store_manager'), upload.single('file'), controller.bulkUpload);
router.put('/:id', auth, authorize('admin', 'controller'), controller.update);
router.delete('/:id', auth, authorize('admin'), controller.remove);

module.exports = router;

const router = require('express').Router();
const controller = require('../controllers/supplierController');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, controller.getAll);
router.post('/', auth, authorize('admin', 'controller', 'store_manager'), controller.create);
router.put('/:id', auth, authorize('admin', 'controller'), controller.update);
router.delete('/:id', auth, authorize('admin'), controller.remove);

module.exports = router;

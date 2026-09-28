const express = require('express');
const router = express.Router();
const posterController = require('../controllers/posterController');
const { protect } = require('../middlewares/authMiddleware');
const adminGuard = require('../middlewares/adminGuard');
const upload = require('../middlewares/uploadMiddleware');

// Public: Read-only access
router.get('/categories', posterController.getCategories);
router.get('/', posterController.getPosters);
router.get('/:id', posterController.getPosterById);
router.post('/:id/action', posterController.recordAction);

// Admin-only: Create/modify content
router.post('/categories', protect, adminGuard, posterController.createCategory);
router.post('/', protect, adminGuard, upload.single('image'), posterController.createPoster);

module.exports = router;

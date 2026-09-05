const express = require('express');
const router = express.Router();
const posterController = require('../controllers/posterController');
const upload = require('../middlewares/uploadMiddleware');

router.get('/categories', posterController.getCategories);
router.post('/categories', posterController.createCategory);

router.get('/', posterController.getPosters);
router.post('/', upload.single('image'), posterController.createPoster);

router.get('/:id', posterController.getPosterById);
router.post('/:id/action', posterController.recordAction);

module.exports = router;

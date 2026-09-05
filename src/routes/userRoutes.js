const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// All user routes require authentication
router.use(protect);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/photo', upload.single('photo'), userController.uploadPhoto);

router.get('/creations', userController.getCreations);
router.post('/creations', upload.single('image'), userController.createCreation);

router.get('/saved-templates', userController.getSavedTemplates);
router.post('/saved-templates/:id', userController.saveTemplate);
router.delete('/saved-templates/:id', userController.unsaveTemplate);

module.exports = router;

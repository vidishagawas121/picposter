const express = require('express');
const router = express.Router();
const businessController = require('../controllers/businessController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

// All business routes require authentication
router.use(protect);

router.get('/', businessController.getBusinessInfo);
router.put('/', businessController.updateBusinessInfo);
router.post('/logo', upload.single('logo'), businessController.uploadLogo);
router.delete('/logo/:logoId', businessController.deleteLogo);
router.delete('/logo', businessController.deleteLogo);

module.exports = router;

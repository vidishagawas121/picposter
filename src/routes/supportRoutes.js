const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { optionalAuth, protect } = require('../middlewares/authMiddleware');

router.post('/contact', optionalAuth, supportController.submitContactQuery);
router.get('/queries', protect, supportController.getSupportQueries);

module.exports = router;

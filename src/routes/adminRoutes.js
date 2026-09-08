const express = require('express');
const router = express.Router();
const upload = require('../middlewares/uploadMiddleware');

const adminPosterController = require('../controllers/adminPosterController');
const adminCategoryController = require('../controllers/adminCategoryController');
const adminUserController = require('../controllers/adminUserController');
const adminSupportController = require('../controllers/adminSupportController');
const adminAnalyticsController = require('../controllers/adminAnalyticsController');

// ==========================================
// POSTER MANAGEMENT ROUTES
// ==========================================
router.get('/posters/stats', adminPosterController.getPosterStats);
router.get('/posters', adminPosterController.getPosters);
router.get('/posters/:id', adminPosterController.getPosterById);
router.post('/posters', upload.single('image'), adminPosterController.createPoster);
router.put('/posters/:id', upload.single('image'), adminPosterController.updatePoster);
router.patch('/posters/:id/status', adminPosterController.updatePosterStatus);
router.delete('/posters/:id', adminPosterController.deletePoster);

// ==========================================
// CATEGORY MANAGEMENT ROUTES
// ==========================================
router.patch('/categories/reorder', adminCategoryController.reorderCategories);
router.get('/categories', adminCategoryController.getCategories);
router.get('/categories/:id', adminCategoryController.getCategoryById);
router.post('/categories', upload.single('icon'), adminCategoryController.createCategory);
router.put('/categories/:id', upload.single('icon'), adminCategoryController.updateCategory);
router.patch('/categories/:id/status', adminCategoryController.updateCategoryStatus);
router.delete('/categories/:id', adminCategoryController.deleteCategory);

// ==========================================
// USER MANAGEMENT ROUTES
// ==========================================
router.get('/users', adminUserController.getUsers);
router.get('/users/:id/creations', adminUserController.getUserCreations);
router.get('/users/:id', adminUserController.getUserById);
router.patch('/users/:id/status', adminUserController.updateUserStatus);
router.patch('/users/:id/role', adminUserController.updateUserRole);

// ==========================================
// DASHBOARD & ANALYTICS ROUTES
// ==========================================
router.get('/analytics/overview', adminAnalyticsController.getOverview);
router.get('/analytics/users/growth', adminAnalyticsController.getUserGrowth);
router.get('/analytics/posters/top', adminAnalyticsController.getTopPosters);
router.get('/analytics/categories/distribution', adminAnalyticsController.getCategoryDistribution);
router.get('/analytics/languages/distribution', adminAnalyticsController.getLanguageDistribution);

// ==========================================
// SUPPORT QUERY MANAGEMENT ROUTES
// ==========================================
router.get('/support', adminSupportController.getSupportQueries);
router.get('/support/:id', adminSupportController.getSupportQueryById);
router.patch('/support/:id/status', adminSupportController.updateSupportStatus);
router.delete('/support/:id', adminSupportController.deleteSupportQuery);

module.exports = router;

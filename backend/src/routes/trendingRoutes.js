/**
 * ==============================================================================
 * Calendar Trending Routes for PicPoster
 * ==============================================================================
 * Exposes endpoints for date- and calendar-based trending posters:
 * - GET /api/v1/trending           -> Calendar-prioritized trending feed
 * - GET /api/v1/trending/today     -> Today's festival/event posters
 * - GET /api/v1/trending/upcoming  -> Upcoming festival/event posters (chronological)
 * - GET /api/v1/trending/calendar  -> Festival schedule with poster counts
 * ==============================================================================
 */

const express = require('express');
const router = express.Router();
const trendingController = require('../controllers/trendingController');

// Calendar-based Trending Endpoints
router.get('/today', trendingController.getTodayPosters);
router.get('/upcoming', trendingController.getUpcomingPosters);
router.get('/calendar', trendingController.getFestivalCalendar);
router.get('/', trendingController.getTrendingPosters);

module.exports = router;


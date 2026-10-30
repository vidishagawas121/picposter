/**
 * ==============================================================================
 * Calendar Trending Controller for PicPoster
 * ==============================================================================
 * Dedicated controller for calendar-based trending endpoints.
 * Automatically prioritizes today's and upcoming festival/event posters.
 * ==============================================================================
 */

const CalendarTrendingService = require('../services/calendarTrendingService');
const { sendSuccess } = require('../utils/apiResponse');
const catchAsync = require('../utils/catchAsync');

/**
 * @desc    Get calendar-prioritized trending posters
 * @route   GET /api/v1/trending?page=1&limit=20&category=festival
 * @access  Public
 */
const getTrendingPosters = catchAsync(async (req, res) => {
    const { page, limit, category, language, search, aspectRatio, trendingOnly } = req.query;

    const result = await CalendarTrendingService.getTrendingPosters({
        page,
        limit,
        category,
        language,
        search,
        aspectRatio,
        trendingOnly: trendingOnly !== 'false',
    });

    return sendSuccess(res, 200, 'Trending posters retrieved successfully', result.posters, {
        page: result.page,
        totalPages: result.totalPages,
        totalCount: result.totalCount,
        activeFestivals: result.activeFestivals,
    });
});

/**
 * @desc    Get posters specifically for today's festival / event
 * @route   GET /api/v1/trending/today
 * @access  Public
 */
const getTodayPosters = catchAsync(async (req, res) => {
    const { category, language } = req.query;

    const result = await CalendarTrendingService.getTrendingPosters({
        limit: 50,
        category,
        language,
        trendingOnly: true,
    });

    const todayPosters = result.posters.filter((p) => p.eventStatus === 'today');

    return sendSuccess(res, 200, "Today's event posters retrieved successfully", todayPosters, {
        totalCount: todayPosters.length,
        hasEventToday: todayPosters.length > 0,
    });
});

/**
 * @desc    Get posters for upcoming festivals/events ordered chronologically
 * @route   GET /api/v1/trending/upcoming
 * @access  Public
 */
const getUpcomingPosters = catchAsync(async (req, res) => {
    const { category, language, limit } = req.query;

    const result = await CalendarTrendingService.getTrendingPosters({
        limit: limit || 50,
        category,
        language,
        trendingOnly: true,
    });

    const upcomingPosters = result.posters.filter((p) => p.eventStatus === 'upcoming');

    return sendSuccess(res, 200, 'Upcoming festival posters retrieved successfully', upcomingPosters, {
        totalCount: upcomingPosters.length,
    });
});

/**
 * @desc    Get festival calendar with upcoming dates and poster counts
 * @route   GET /api/v1/trending/calendar
 * @access  Public
 */
const getFestivalCalendar = catchAsync(async (req, res) => {
    const daysAhead = parseInt(req.query.daysAhead, 10) || 60;
    const schedule = await CalendarTrendingService.getFestivalSchedule(new Date(), daysAhead);

    return sendSuccess(res, 200, 'Festival calendar retrieved successfully', schedule, {
        totalEvents: schedule.length,
    });
});

module.exports = {
    getTrendingPosters,
    getTodayPosters,
    getUpcomingPosters,
    getFestivalCalendar,
};


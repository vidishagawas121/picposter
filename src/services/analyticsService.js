const Poster = require('../models/Poster');
const Category = require('../models/Category');
const User = require('../models/User');
const SupportQuery = require('../models/SupportQuery');
const UserCreation = require('../models/UserCreation');

class AnalyticsService {
    /**
     * Get platform overview metrics for admin dashboard summary
     */
    async getOverview() {
        const [
            totalPosters,
            activePosters,
            totalCategories,
            totalUsers,
            verifiedUsers,
            activeUsers,
            pendingSupportQueries,
            totalCreations,
            posterStats,
        ] = await Promise.all([
            Poster.countDocuments(),
            Poster.countDocuments({ isActive: true }),
            Category.countDocuments(),
            User.countDocuments(),
            User.countDocuments({ isVerified: true }),
            User.countDocuments({ isActive: true }),
            SupportQuery.countDocuments({
                status: { $regex: /^pending$/i },
            }),
            UserCreation.countDocuments(),
            Poster.aggregate([
                {
                    $group: {
                        _id: null,
                        totalDownloads: { $sum: '$downloadsCount' },
                        totalShares: { $sum: '$sharesCount' },
                        totalViews: { $sum: '$viewsCount' },
                    },
                },
            ]),
        ]);

        const totalDownloads = posterStats.length > 0 ? posterStats[0].totalDownloads : 0;
        const totalShares = posterStats.length > 0 ? posterStats[0].totalShares : 0;
        const totalViews = posterStats.length > 0 ? posterStats[0].totalViews : 0;

        return {
            totalPosters,
            activePosters,
            totalCategories,
            totalUsers,
            verifiedUsers,
            activeUsers,
            totalDownloads,
            totalShares,
            totalViews,
            pendingSupportQueries,
            totalCreations,
        };
    }

    /**
     * Get user registration growth trend over the specified number of days (e.g. 30 days)
     */
    async getUserGrowth(days = 30) {
        const parsedDays = Math.max(1, Math.min(365, parseInt(days, 10) || 30));
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parsedDays);
        startDate.setHours(0, 0, 0, 0);

        const growthData = await User.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate },
                },
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                    },
                    count: { $sum: 1 },
                    verifiedCount: {
                        $sum: {
                            $cond: [{ $eq: ['$isVerified', true] }, 1, 0],
                        },
                    },
                },
            },
            {
                $sort: { _id: 1 },
            },
            {
                $project: {
                    _id: 0,
                    date: '$_id',
                    count: 1,
                    verifiedCount: 1,
                },
            },
        ]);

        return growthData;
    }

    /**
     * Get top downloaded / shared posters
     */
    async getTopPosters(limit = 10) {
        const parsedLimit = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));

        const posters = await Poster.find({ isActive: true })
            .sort({ downloadsCount: -1, sharesCount: -1 })
            .limit(parsedLimit)
            .select('title imageUrl thumbnailUrl category language downloadsCount sharesCount viewsCount isTrending isPremium');

        return posters;
    }

    /**
     * Get poster distribution across categories
     */
    async getCategoryDistribution() {
        const distribution = await Poster.aggregate([
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    activeCount: {
                        $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
                    },
                    totalDownloads: { $sum: '$downloadsCount' },
                    totalShares: { $sum: '$sharesCount' },
                },
            },
            {
                $sort: { count: -1 },
            },
            {
                $project: {
                    _id: 0,
                    category: '$_id',
                    count: 1,
                    activeCount: 1,
                    totalDownloads: 1,
                    totalShares: 1,
                },
            },
        ]);

        // Also fetch category display names
        const categories = await Category.find().select('name slug iconUrl');
        const categoryMap = new Map();
        categories.forEach((cat) => {
            categoryMap.set(cat.slug.toLowerCase(), cat.name);
        });

        return distribution.map((item) => ({
            ...item,
            categoryName: categoryMap.get((item.category || '').toLowerCase()) || item.category,
        }));
    }

    /**
     * Get downloads and poster count by language
     */
    async getLanguageDistribution() {
        const distribution = await Poster.aggregate([
            {
                $group: {
                    _id: '$language',
                    count: { $sum: 1 },
                    totalDownloads: { $sum: '$downloadsCount' },
                    totalShares: { $sum: '$sharesCount' },
                },
            },
            {
                $sort: { totalDownloads: -1, count: -1 },
            },
            {
                $project: {
                    _id: 0,
                    language: '$_id',
                    count: 1,
                    totalDownloads: 1,
                    totalShares: 1,
                },
            },
        ]);

        return distribution;
    }
}

module.exports = new AnalyticsService();

/**
 * ==============================================================================
 * Calendar Trending Service for PicPoster
 * ==============================================================================
 * Standalone calendar- and date-based trending implementation.
 *
 * Capabilities:
 * 1. Automatic prioritization of Today's festival/event posters.
 * 2. Automatic prioritization of Upcoming festival/event posters (sorted chronologically).
 * 3. Dynamic rollover at 00:00:00 midnight with ZERO manual database updates.
 * 4. Hybrid matching: supports explicit `eventDate` on posters, as well as automatic
 *    keyword/tag/title matching against a comprehensive festival calendar.
 * ==============================================================================
 */

const mongoose = require('mongoose');
const Poster = require('../models/Poster');

/**
 * Multi-year calendar database for recurring Indian and Global festivals / events.
 * Keyed by slug with keywords, fixed solar dates (MM-DD), and variable lunar dates per year.
 */
const FESTIVAL_REGISTRY = [
    // --- Fixed Solar Annual Days ---
    {
        name: 'New Year',
        slug: 'new-year',
        type: 'fixed',
        date: '01-01',
        keywords: ['new year', 'happy new year', 'newyear', 'new year 2026', 'new year celebration', 'nav varsh'],
        category: 'festival',
    },
    {
        name: 'Republic Day',
        slug: 'republic-day',
        type: 'fixed',
        date: '01-26',
        keywords: ['republic day', 'gantantra diwas', '26 january', '26th jan', 'republic day india'],
        category: 'festival',
    },
    {
        name: 'Valentine’s Day',
        slug: 'valentines-day',
        type: 'fixed',
        date: '02-14',
        keywords: ['valentine', 'valentines', 'love', 'valentines day'],
        category: 'festival',
    },
    {
        name: 'International Women’s Day',
        slug: 'womens-day',
        type: 'fixed',
        date: '03-08',
        keywords: ['women', 'womens day', 'women day', 'mahila diwas'],
        category: 'festival',
    },
    {
        name: 'Dr. B.R. Ambedkar Jayanti',
        slug: 'ambedkar-jayanti',
        type: 'fixed',
        date: '04-14',
        keywords: ['ambedkar', 'ambedkar jayanti', 'bhimrao'],
        category: 'festival',
    },
    {
        name: 'Labour Day / Maharashtra Day / Gujarat Day',
        slug: 'labour-day',
        type: 'fixed',
        date: '05-01',
        keywords: ['labour day', 'may day', 'maharashtra day', 'gujarat day', 'kamgar diwas'],
        category: 'festival',
    },
    {
        name: 'World Environment Day',
        slug: 'environment-day',
        type: 'fixed',
        date: '06-05',
        keywords: ['environment day', 'environment', 'save earth', 'paryavaran diwas'],
        category: 'festival',
    },
    {
        name: 'International Yoga Day',
        slug: 'yoga-day',
        type: 'fixed',
        date: '06-21',
        keywords: ['yoga', 'yoga day', 'international yoga day', 'yog diwas'],
        category: 'festival',
    },
    {
        name: 'Independence Day',
        slug: 'independence-day',
        type: 'fixed',
        date: '08-15',
        keywords: ['independence day', '15 august', '15th aug', 'swatantrata diwas', 'azadi'],
        category: 'festival',
    },
    {
        name: 'Teacher’s Day',
        slug: 'teachers-day',
        type: 'fixed',
        date: '09-05',
        keywords: ['teacher', 'teachers day', 'shikshak diwas', 'happy teachers day'],
        category: 'festival',
    },
    {
        name: 'Mahatma Gandhi Jayanti',
        slug: 'gandhi-jayanti',
        type: 'fixed',
        date: '10-02',
        keywords: ['gandhi', 'gandhi jayanti', '2 october', 'bapu'],
        category: 'festival',
    },
    {
        name: 'Halloween',
        slug: 'halloween',
        type: 'fixed',
        date: '10-31',
        keywords: ['halloween', 'spooky', 'trick or treat'],
        category: 'festival',
    },
    {
        name: 'Kannada Rajyotsava / Haryana Day',
        slug: 'rajyotsava',
        type: 'fixed',
        date: '11-01',
        keywords: ['kannada rajyotsava', 'rajyotsava', 'haryana day'],
        category: 'festival',
    },
    {
        name: 'Children’s Day',
        slug: 'childrens-day',
        type: 'fixed',
        date: '11-14',
        keywords: ['children', 'childrens day', 'bal diwas'],
        category: 'festival',
    },
    {
        name: 'Christmas',
        slug: 'christmas',
        type: 'fixed',
        date: '12-25',
        keywords: ['christmas', 'merry christmas', 'xmas', 'santa'],
        category: 'festival',
    },
    {
        name: 'New Year’s Eve',
        slug: 'new-years-eve',
        type: 'fixed',
        date: '12-31',
        keywords: ['new year eve', 'bye 2026', 'alvida', '31st december', 'new years eve'],
        category: 'festival',
    },

    // --- Variable Lunar / Solar Indian Festivals (mapped by year) ---
    {
        name: 'Makar Sankranti / Pongal / Lohri',
        slug: 'makar-sankranti',
        type: 'variable',
        datesByYear: {
            2025: '2025-01-14',
            2026: '2026-01-14',
            2027: '2027-01-14',
            2028: '2028-01-15',
        },
        keywords: ['makar sankranti', 'sankranti', 'pongal', 'lohri', 'uttarayan', 'kite festival'],
        category: 'festival',
    },
    {
        name: 'Maha Shivratri',
        slug: 'maha-shivratri',
        type: 'variable',
        datesByYear: {
            2025: '2025-02-26',
            2026: '2026-02-15',
            2027: '2027-03-06',
            2028: '2028-02-24',
        },
        keywords: ['shivratri', 'maha shivratri', 'shiva', 'har har mahadev', 'bholenath', 'om namah shivay'],
        category: 'festival',
    },
    {
        name: 'Holi / Dhulivandan',
        slug: 'holi',
        type: 'variable',
        datesByYear: {
            2025: '2025-03-14',
            2026: '2026-03-03',
            2027: '2027-03-22',
            2028: '2028-03-11',
        },
        keywords: ['holi', 'happy holi', 'rangpanchami', 'dhulivandan', 'colors festival', 'dhuleti'],
        category: 'festival',
    },
    {
        name: 'Gudi Padwa / Ugadi / Chaitra Navratri',
        slug: 'gudi-padwa',
        type: 'variable',
        datesByYear: {
            2025: '2025-03-30',
            2026: '2026-03-19',
            2027: '2027-04-07',
            2028: '2028-03-27',
        },
        keywords: ['gudi padwa', 'ugadi', 'chaitra navratri', 'hindu new year', 'chetichand'],
        category: 'festival',
    },
    {
        name: 'Ram Navami',
        slug: 'ram-navami',
        type: 'variable',
        datesByYear: {
            2025: '2025-04-06',
            2026: '2026-03-27',
            2027: '2027-04-15',
            2028: '2028-04-04',
        },
        keywords: ['ram navami', 'shree ram', 'ram', 'ayodhya', 'jai shree ram'],
        category: 'festival',
    },
    {
        name: 'Eid-ul-Fitr (Ramadan Eid)',
        slug: 'eid-ul-fitr',
        type: 'variable',
        datesByYear: {
            2025: '2025-03-31',
            2026: '2026-03-20',
            2027: '2027-03-10',
            2028: '2028-02-27',
        },
        keywords: ['eid', 'eid mubarak', 'eid ul fitr', 'ramzan eid', 'ramadan'],
        category: 'festival',
    },
    {
        name: 'Akshaya Tritiya',
        slug: 'akshaya-tritiya',
        type: 'variable',
        datesByYear: {
            2025: '2025-04-30',
            2026: '2026-04-20',
            2027: '2027-05-09',
            2028: '2028-04-27',
        },
        keywords: ['akshaya tritiya', 'gold purchase', 'shubh akshaya tritiya', 'akshatritiya'],
        category: 'festival',
    },
    {
        name: 'Eid-al-Adha (Bakrid)',
        slug: 'eid-al-adha',
        type: 'variable',
        datesByYear: {
            2025: '2025-06-07',
            2026: '2026-05-27',
            2027: '2027-05-16',
            2028: '2028-05-05',
        },
        keywords: ['bakrid', 'eid al adha', 'bakra eid', 'qurbani'],
        category: 'festival',
    },
    {
        name: 'Raksha Bandhan',
        slug: 'raksha-bandhan',
        type: 'variable',
        datesByYear: {
            2025: '2025-08-09',
            2026: '2026-08-28',
            2027: '2027-08-17',
            2028: '2028-08-05',
        },
        keywords: ['rakhi', 'raksha bandhan', 'happy rakhi', 'rakshabandhan', 'brother sister'],
        category: 'festival',
    },
    {
        name: 'Krishna Janmashtami',
        slug: 'janmashtami',
        type: 'variable',
        datesByYear: {
            2025: '2025-08-16',
            2026: '2026-09-04',
            2027: '2027-08-25',
            2028: '2028-08-13',
        },
        keywords: ['janmashtami', 'krishna', 'dahi handi', 'gokulashtami', 'shree krishna', 'kanha'],
        category: 'festival',
    },
    {
        name: 'Ganesh Chaturthi',
        slug: 'ganesh-chaturthi',
        type: 'variable',
        datesByYear: {
            2025: '2025-08-27',
            2026: '2026-09-14',
            2027: '2027-09-04',
            2028: '2028-08-24',
        },
        keywords: ['ganesh', 'ganpati', 'ganesh chaturthi', 'bappa', 'ganpati bappa morya', 'vinayagar'],
        category: 'festival',
    },
    {
        name: 'Navratri / Durga Puja',
        slug: 'navratri',
        type: 'variable',
        datesByYear: {
            2025: '2025-09-22',
            2026: '2026-10-11',
            2027: '2027-10-01',
            2028: '2028-09-20',
        },
        keywords: ['navratri', 'durga puja', 'garba', 'dandiya', 'shubh navratri', 'maa durga'],
        category: 'festival',
    },
    {
        name: 'Dussehra / Vijayadashami',
        slug: 'dussehra',
        type: 'variable',
        datesByYear: {
            2025: '2025-10-02',
            2026: '2026-10-20',
            2027: '2027-10-10',
            2028: '2028-09-29',
        },
        keywords: ['dussehra', 'dasara', 'vijayadashami', 'ravan dahan', 'shubh dussehra'],
        category: 'festival',
    },
    {
        name: 'Karwa Chauth',
        slug: 'karwa-chauth',
        type: 'variable',
        datesByYear: {
            2025: '2025-10-10',
            2026: '2026-10-29',
            2027: '2027-10-19',
            2028: '2028-10-07',
        },
        keywords: ['karwa chauth', 'karva chauth', 'karwachauth'],
        category: 'festival',
    },
    {
        name: 'Dhanteras',
        slug: 'dhanteras',
        type: 'variable',
        datesByYear: {
            2025: '2025-10-18',
            2026: '2026-11-06',
            2027: '2027-10-27',
            2028: '2028-10-16',
        },
        keywords: ['dhanteras', 'shubh dhanteras', 'kuber', 'dhanvantari'],
        category: 'festival',
    },
    {
        name: 'Diwali / Deepavali (Lakshmi Puja)',
        slug: 'diwali',
        type: 'variable',
        datesByYear: {
            2025: '2025-10-20',
            2026: '2026-11-08',
            2027: '2027-10-29',
            2028: '2028-10-17',
        },
        keywords: ['diwali', 'deepavali', 'happy diwali', 'shubh diwali', 'lakshmi puja', 'diwali sale', 'diwali offers'],
        category: 'festival',
    },
    {
        name: 'Govardhan Puja / Padwa',
        slug: 'govardhan-puja',
        type: 'variable',
        datesByYear: {
            2025: '2025-10-22',
            2026: '2026-11-09',
            2027: '2027-10-30',
            2028: '2028-10-18',
        },
        keywords: ['govardhan puja', 'annakut', 'balipratipada'],
        category: 'festival',
    },
    {
        name: 'Bhai Dooj / Bhau Beej',
        slug: 'bhai-dooj',
        type: 'variable',
        datesByYear: {
            2025: '2025-10-23',
            2026: '2026-11-10',
            2027: '2027-10-31',
            2028: '2028-10-19',
        },
        keywords: ['bhai dooj', 'bhau beej', 'bhatra dwitiya'],
        category: 'festival',
    },
    {
        name: 'Chhath Puja',
        slug: 'chhath-puja',
        type: 'variable',
        datesByYear: {
            2025: '2025-10-27',
            2026: '2026-11-15',
            2027: '2027-11-04',
            2028: '2028-10-24',
        },
        keywords: ['chhath', 'chhath puja', 'surya dev', 'arghya'],
        category: 'festival',
    },
    {
        name: 'Guru Nanak Jayanti (Gurpurab)',
        slug: 'guru-nanak-jayanti',
        type: 'variable',
        datesByYear: {
            2025: '2025-11-05',
            2026: '2026-11-24',
            2027: '2027-11-14',
            2028: '2028-11-02',
        },
        keywords: ['guru nanak', 'gurpurab', 'guru nanak jayanti', 'prakash parva'],
        category: 'festival',
    },
];

class CalendarTrendingService {
    /**
     * Resolves the exact Date instance for a festival entry in a given year.
     * @param {Object} festival
     * @param {number} year
     * @returns {Date|null}
     */
    static resolveFestivalDate(festival, year) {
        if (festival.type === 'fixed') {
            const [month, day] = festival.date.split('-').map(Number);
            return new Date(year, month - 1, day, 0, 0, 0, 0);
        }

        if (festival.type === 'variable' && festival.datesByYear) {
            const dateStr = festival.datesByYear[year];
            if (dateStr) {
                const [y, m, d] = dateStr.split('-').map(Number);
                return new Date(y, m - 1, d, 0, 0, 0, 0);
            }
        }

        return null;
    }

    /**
     * Retrieve all active calendar events (Today, Yesterday, and upcoming within N days).
     * Automatically updates as the calendar date advances.
     *
     * @param {Date} [referenceDate=new Date()]
     * @param {number} [upcomingWindowDays=30]
     * @returns {Array<Object>} List of calendar events sorted by date
     */
    static getActiveCalendarEvents(referenceDate = new Date(), upcomingWindowDays = 30) {
        const ref = new Date(referenceDate);
        const currentYear = ref.getFullYear();
        const startOfToday = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0, 0);
        const endOfToday = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59, 999);
        const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
        const endOfUpcoming = new Date(startOfToday.getTime() + (upcomingWindowDays + 1) * 24 * 60 * 60 * 1000 - 1);

        const events = [];

        // Check festivals for both current year and next year (for year-end transitions like Dec -> Jan)
        const yearsToCheck = [currentYear, currentYear + 1];

        for (const festival of FESTIVAL_REGISTRY) {
            for (const yr of yearsToCheck) {
                const eventDate = this.resolveFestivalDate(festival, yr);
                if (!eventDate) continue;

                // Include if within range [yesterday, upcomingWindow]
                if (eventDate >= startOfYesterday && eventDate <= endOfUpcoming) {
                    const diffDays = Math.round((eventDate.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));

                    let status = 'upcoming';
                    if (eventDate >= startOfToday && eventDate <= endOfToday) {
                        status = 'today';
                    } else if (eventDate >= startOfYesterday && eventDate < startOfToday) {
                        status = 'yesterday';
                    }

                    events.push({
                        name: festival.name,
                        slug: festival.slug,
                        date: eventDate,
                        dateString: eventDate.toISOString().split('T')[0],
                        daysRemaining: diffDays,
                        status, // 'today' | 'upcoming' | 'yesterday'
                        isToday: status === 'today',
                        keywords: festival.keywords,
                        category: festival.category,
                    });
                }
            }
        }

        // Sort events chronologically: today first, then closest upcoming
        events.sort((a, b) => a.date.getTime() - b.date.getTime());

        return events;
    }

    /**
     * Matches a poster against the active festival calendar using:
     * 1. Explicit poster.eventDate (if present)
     * 2. Poster title & tags against festival keywords
     * 3. Category matching
     *
     * @param {Object} poster
     * @param {Array<Object>} activeEvents
     * @param {Date} [referenceDate=new Date()]
     * @returns {Object|null} Matching event info or null
     */
    static matchPosterToEvent(poster, activeEvents, referenceDate = new Date()) {
        const ref = new Date(referenceDate);
        const startOfToday = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 0, 0, 0, 0);
        const endOfToday = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate(), 23, 59, 59, 999);

        // 1. Direct match on poster.eventDate if defined
        if (poster.eventDate) {
            const pDate = new Date(poster.eventDate);
            if (!isNaN(pDate.getTime())) {
                const diffDays = Math.round((pDate.getTime() - startOfToday.getTime()) / (24 * 60 * 60 * 1000));
                let status = 'upcoming';
                if (pDate >= startOfToday && pDate <= endOfToday) {
                    status = 'today';
                } else if (diffDays < 0) {
                    status = diffDays === -1 ? 'yesterday' : 'past';
                }
                return {
                    name: poster.title,
                    slug: 'custom-event',
                    date: pDate,
                    dateString: pDate.toISOString().split('T')[0],
                    daysRemaining: diffDays,
                    status,
                    isToday: status === 'today',
                    matchType: 'explicit_date',
                };
            }
        }

        // 2. Keyword and tag matching against active calendar events
        const posterTitle = (poster.title || '').toLowerCase();
        const posterTags = Array.isArray(poster.tags) ? poster.tags.map((t) => t.toLowerCase()) : [];
        const posterCategory = (poster.category || '').toLowerCase();

        for (const event of activeEvents) {
            for (const kw of event.keywords) {
                const kwLower = kw.toLowerCase();

                // Title contains keyword
                if (posterTitle.includes(kwLower)) {
                    return { ...event, matchType: 'title_keyword', matchedKeyword: kw };
                }

                // Any tag matches keyword
                if (posterTags.some((tag) => tag.includes(kwLower) || kwLower.includes(tag))) {
                    return { ...event, matchType: 'tag_keyword', matchedKeyword: kw };
                }
            }

            // Fallback match on slug if category is festival
            if (posterCategory === 'festival' && posterTitle.includes(event.slug.replace(/-/g, ' '))) {
                return { ...event, matchType: 'slug_match' };
            }
        }

        return null;
    }

    /**
     * Compute the dynamic trending priority score for a poster.
     * Higher score = higher ranking.
     *
     * Scoring Rules:
     * - Today's festival/event:       1,000,000 + popularity
     * - Upcoming festival/event:      800,000 - (daysRemaining * 10,000) + popularity
     * - Yesterday's festival/event:   400,000 + popularity
     * - Manual isTrending=true:       200,000 + popularity
     * - General poster:               0 + popularity
     *
     * @param {Object} poster
     * @param {Array<Object>} activeEvents
     * @param {Date} [referenceDate=new Date()]
     * @returns {Object} { score, matchedEvent, eventStatus, daysRemaining, isTrending }
     */
    static computePosterTrendingScore(poster, activeEvents, referenceDate = new Date()) {
        const matchedEvent = this.matchPosterToEvent(poster, activeEvents, referenceDate);

        const downloads = Number(poster.downloadsCount) || 0;
        const shares = Number(poster.sharesCount) || 0;
        const views = Number(poster.viewsCount) || 0;
        // Engagement bonus gives top downloaded posters within the same day a boost
        const engagementBonus = Math.min(5000, downloads * 5 + shares * 10 + views);

        let baseScore = 0;
        let eventStatus = null;
        let daysRemaining = null;
        let isDateTrending = false;

        if (matchedEvent) {
            eventStatus = matchedEvent.status;
            daysRemaining = matchedEvent.daysRemaining;

            if (matchedEvent.status === 'today') {
                // TODAY's event: Absolute Highest Priority (Tier 1)
                baseScore = 1000000;
                isDateTrending = true;
            } else if (matchedEvent.status === 'upcoming') {
                // UPCOMING event: Tier 2 (Closer events get strictly higher scores)
                // Day 1 (tomorrow): ~890,000
                // Day 2:            ~880,000
                // Day 10:           ~800,000
                const dayPenalty = Math.max(0, matchedEvent.daysRemaining * 10000);
                baseScore = Math.max(500000, 900000 - dayPenalty);
                isDateTrending = true;
            } else if (matchedEvent.status === 'yesterday') {
                // Ongoing / Yesterday's event: Tier 3
                baseScore = 400000;
                isDateTrending = true;
            }
        }

        // Manual isTrending boost if not already boosted by calendar
        if (poster.isTrending && baseScore < 200000) {
            baseScore = 200000;
        }

        const totalScore = baseScore + engagementBonus;
        const isEffectiveTrending = Boolean(poster.isTrending || isDateTrending);

        return {
            score: totalScore,
            matchedEvent: matchedEvent ? { name: matchedEvent.name, slug: matchedEvent.slug, date: matchedEvent.dateString } : null,
            eventStatus,
            daysRemaining,
            isTrending: isEffectiveTrending,
            isDateTrending,
        };
    }

    /**
     * Retrieve calendar-prioritized trending posters directly from MongoDB.
     * Automatically prioritizes today's and upcoming festival/event posters based on dates.
     *
     * @param {Object} options
     * @param {number} [options.page=1]
     * @param {number} [options.limit=20]
     * @param {string} [options.category]
     * @param {string} [options.language]
     * @param {string} [options.search]
     * @param {string} [options.aspectRatio]
     * @param {boolean} [options.trendingOnly=true] If true, returns only trending items
     * @param {Date} [options.referenceDate=new Date()]
     * @returns {Promise<{ posters: Array<Object>, totalCount: number, page: number, totalPages: number, activeFestivals: Array<Object> }>}
     */
    static async getTrendingPosters(options = {}) {
        const {
            page = 1,
            limit = 20,
            category,
            language,
            search,
            aspectRatio,
            trendingOnly = true,
            referenceDate = new Date(),
        } = options;

        const parsedPage = Math.max(1, parseInt(page, 10) || 1);
        const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
        const skip = (parsedPage - 1) * parsedLimit;

        // 1. Get active calendar events (today + next 30 days)
        const activeEvents = this.getActiveCalendarEvents(referenceDate, 30);

        // 2. Build MongoDB query filter
        const filter = { isActive: true };

        if (category && category.toLowerCase() !== 'all') {
            filter.category = new RegExp(`^${category.trim()}$`, 'i');
        }

        if (language && language.toLowerCase() !== 'all' && language.toLowerCase() !== 'all languages') {
            filter.language = new RegExp(`^${language.trim()}$`, 'i');
        }

        if (aspectRatio && aspectRatio.toLowerCase() !== 'all') {
            filter.aspectRatio = aspectRatio;
        }

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { title: searchRegex },
                { tags: searchRegex },
                { category: searchRegex },
            ];
        }

        // 3. Fetch candidate posters
        // We fetch active posters and score them in-memory to guarantee exact calendar prioritization
        const allCandidates = await Poster.find(filter)
            .select('title imageUrl thumbnailUrl category language tags aspectRatio isTrending isPremium downloadsCount sharesCount viewsCount eventDate createdAt')
            .lean();

        // 4. Score all candidates using the calendar engine
        const scored = allCandidates.map((poster) => {
            const meta = this.computePosterTrendingScore(poster, activeEvents, referenceDate);
            return {
                ...poster,
                id: poster._id,
                trendingScore: meta.score,
                matchedEvent: meta.matchedEvent,
                eventStatus: meta.eventStatus,
                daysRemaining: meta.daysRemaining,
                isTrending: meta.isTrending,
                isDateTrending: meta.isDateTrending,
            };
        });

        // 5. Filter for trending items if requested
        const filtered = trendingOnly
            ? scored.filter((p) => p.isTrending || p.trendingScore >= 200000)
            : scored;

        // 6. Sort strictly by calendar trending score DESC, then createdAt DESC
        filtered.sort((a, b) => {
            if (b.trendingScore !== a.trendingScore) {
                return b.trendingScore - a.trendingScore;
            }
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        const totalCount = filtered.length;
        const totalPages = Math.ceil(totalCount / parsedLimit) || 1;
        const paginatedPosters = filtered.slice(skip, skip + parsedLimit);

        return {
            posters: paginatedPosters,
            totalCount,
            page: parsedPage,
            totalPages,
            activeFestivals: activeEvents.map((e) => ({
                name: e.name,
                slug: e.slug,
                date: e.dateString,
                status: e.status,
                daysRemaining: e.daysRemaining,
            })),
        };
    }

    /**
     * Get festival calendar schedule with matching poster counts.
     * @param {Date} [referenceDate=new Date()]
     * @param {number} [daysAhead=60]
     */
    static async getFestivalSchedule(referenceDate = new Date(), daysAhead = 60) {
        const events = this.getActiveCalendarEvents(referenceDate, daysAhead);

        const schedule = [];
        for (const ev of events) {
            // Count posters matching this festival
            const regexList = ev.keywords.map((kw) => new RegExp(kw, 'i'));
            const count = await Poster.countDocuments({
                isActive: true,
                $or: [
                    { title: { $in: regexList } },
                    { tags: { $in: regexList } },
                    { eventDate: { $gte: new Date(ev.date.getTime()), $lte: new Date(ev.date.getTime() + 24 * 60 * 60 * 1000 - 1) } },
                ],
            });

            schedule.push({
                festival: ev.name,
                slug: ev.slug,
                date: ev.dateString,
                status: ev.status,
                daysRemaining: ev.daysRemaining,
                postersCount: count,
            });
        }

        return schedule;
    }
}

module.exports = CalendarTrendingService;


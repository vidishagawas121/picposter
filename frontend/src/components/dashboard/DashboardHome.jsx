import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analyticsApi } from '../../api/analyticsApi';
import MetricCard from '../common/MetricCard';
import { formatNumber } from '../../utils/formatters';
import {
  Grid,
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
} from '@mui/material';
import {
  CollectionsRounded,
  CategoryRounded,
  GroupRounded,
  DownloadRounded,
  ShareRounded,
  HeadsetMicRounded,
  TrendingUpRounded,
  AddPhotoAlternateRounded,
  ArrowForwardRounded,
} from '@mui/icons-material';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#3b82f6'];

export const DashboardHome = () => {
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [userGrowth, setUserGrowth] = useState([]);
  const [topPosters, setTopPosters] = useState([]);
  const [categoryDist, setCategoryDist] = useState([]);
  const [langDist, setLangDist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [overviewRes, growthRes, topPostersRes, catDistRes, langDistRes] = await Promise.all([
        analyticsApi.getOverview(),
        analyticsApi.getUserGrowth(30),
        analyticsApi.getTopPosters(5),
        analyticsApi.getCategoryDistribution(),
        analyticsApi.getLanguageDistribution(),
      ]);

      setOverview(overviewRes.data?.data || {});
      setUserGrowth(growthRes.data?.data || []);
      setTopPosters(topPostersRes.data?.data || []);
      setCategoryDist(catDistRes.data?.data || []);
      setLangDist(langDistRes.data?.data || []);
    } catch (err) {
      console.error('Failed to load analytics dashboard data:', err);
      setError('Unable to load some analytics metrics. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12, gap: 2 }}>
        <CircularProgress color="primary" />
        <Typography variant="body2" color="text.secondary">
          Loading platform metrics & analytics...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
      {/* Top Welcome & Quick Actions */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} className="gradient-text">
            Analytics Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Real-time telemetry and management statistics for PicPoster
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddPhotoAlternateRounded />}
            onClick={() => navigate('/posters')}
          >
            Manage Posters
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<CategoryRounded />}
            onClick={() => navigate('/categories')}
          >
            Categories
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {/* Pending Support Banner if any */}
      {overview?.pendingSupportQueries > 0 && (
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/support')}>
              View Queries
            </Button>
          }
          sx={{ borderRadius: 3, border: '1px solid rgba(6, 182, 212, 0.3)' }}
        >
          You have <strong>{overview.pendingSupportQueries}</strong> pending support ticket(s) awaiting response.
        </Alert>
      )}

      {/* Metric Cards Grid */}
      <Grid container spacing={2.5}>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Posters"
            value={formatNumber(overview?.totalPosters)}
            subtitle={`${overview?.activePosters || 0} active templates`}
            icon={CollectionsRounded}
            color="#6366f1"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Users"
            value={formatNumber(overview?.totalUsers)}
            subtitle={`${overview?.verifiedUsers || 0} verified users`}
            icon={GroupRounded}
            color="#ec4899"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Total Downloads"
            value={formatNumber(overview?.totalDownloads)}
            subtitle={`${formatNumber(overview?.totalShares)} shares recorded`}
            icon={DownloadRounded}
            color="#10b981"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <MetricCard
            title="Pending Support"
            value={formatNumber(overview?.pendingSupportQueries)}
            subtitle={`${overview?.totalCategories || 0} categories active`}
            icon={HeadsetMicRounded}
            color="#f59e0b"
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* User Growth Chart */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    User Registrations Trend
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    New user account sign-ups over the last 30 days
                  </Typography>
                </Box>
                <Chip label="Last 30 Days" size="small" variant="outlined" />
              </Box>

              <Box sx={{ width: '100%', height: 280 }}>
                {userGrowth.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      No user registration data in this period
                    </Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#4b5563" fontSize={11} tickLine={false} />
                      <YAxis stroke="#4b5563" fontSize={11} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111827',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 8,
                          color: '#fff',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#userGrowthGrad)"
                        name="Registrations"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Category Distribution Chart */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700}>
                Posters by Category
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Distribution of templates across categories
              </Typography>

              <Box sx={{ width: '100%', height: 280 }}>
                {categoryDist.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      No poster categories available
                    </Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDist}
                        dataKey="count"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                      >
                        {categoryDist.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111827',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 8,
                          color: '#fff',
                        }}
                      />
                      <Legend
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top 5 Downloaded Posters */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Top Downloaded Posters
                </Typography>
                <Button size="small" onClick={() => navigate('/posters')} endIcon={<ArrowForwardRounded />}>
                  View All
                </Button>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.75 }}>
                {topPosters.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                    No posters found
                  </Typography>
                ) : (
                  topPosters.map((poster, idx) => (
                    <Box
                      key={poster._id || idx}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1.5,
                        borderRadius: 2.5,
                        backgroundColor: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          variant="rounded"
                          src={poster.thumbnailUrl || poster.imageUrl}
                          alt={poster.title}
                          sx={{ width: 44, height: 44, borderRadius: 2 }}
                        />
                        <Box>
                          <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: 220 }}>
                            {poster.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {poster.language} · {poster.category}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight={800} color="success.main">
                          {formatNumber(poster.downloadsCount)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Downloads
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Language Breakdown */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={700}>
                Downloads by Language
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Language-wise breakdown of user demand
              </Typography>

              <Box sx={{ width: '100%', height: 260 }}>
                {langDist.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      No language distribution data
                    </Typography>
                  </Box>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={langDist} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <XAxis dataKey="language" stroke="#4b5563" fontSize={11} tickLine={false} />
                      <YAxis stroke="#4b5563" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#111827',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: 8,
                          color: '#fff',
                        }}
                      />
                      <Bar dataKey="totalDownloads" fill="#ec4899" radius={[6, 6, 0, 0]} name="Downloads" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardHome;

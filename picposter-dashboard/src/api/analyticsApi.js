import axiosInstance from './axiosInstance';

export const analyticsApi = {
  getOverview: () => axiosInstance.get('/admin/analytics/overview'),
  getUserGrowth: (days = 30) => axiosInstance.get('/admin/analytics/users/growth', { params: { days } }),
  getTopPosters: (limit = 10) => axiosInstance.get('/admin/analytics/posters/top', { params: { limit } }),
  getCategoryDistribution: () => axiosInstance.get('/admin/analytics/categories/distribution'),
  getLanguageDistribution: () => axiosInstance.get('/admin/analytics/languages/distribution'),
};

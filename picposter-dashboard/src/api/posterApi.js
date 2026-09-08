import axiosInstance from './axiosInstance';

export const posterApi = {
  getPosters: (params) => axiosInstance.get('/admin/posters', { params }),
  getPosterStats: () => axiosInstance.get('/admin/posters/stats'),
  getPosterById: (id) => axiosInstance.get(`/admin/posters/${id}`),
  createPoster: (formData) =>
    axiosInstance.post('/admin/posters', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updatePoster: (id, formData) =>
    axiosInstance.put(`/admin/posters/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updatePosterStatus: (id, isActive) =>
    axiosInstance.patch(`/admin/posters/${id}/status`, { isActive }),
  deletePoster: (id) => axiosInstance.delete(`/admin/posters/${id}`),
};

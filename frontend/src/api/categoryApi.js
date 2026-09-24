import axiosInstance from './axiosInstance';

export const categoryApi = {
  getCategories: () => axiosInstance.get('/admin/categories'),
  getCategoryById: (id) => axiosInstance.get(`/admin/categories/${id}`),
  createCategory: (formData) =>
    axiosInstance.post('/admin/categories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateCategory: (id, formData) =>
    axiosInstance.put(`/admin/categories/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateCategoryStatus: (id, isActive) =>
    axiosInstance.patch(`/admin/categories/${id}/status`, { isActive }),
  reorderCategories: (items) =>
    axiosInstance.patch('/admin/categories/reorder', { items }),
  deleteCategory: (id) => axiosInstance.delete(`/admin/categories/${id}`),
};

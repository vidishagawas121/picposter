import axiosInstance from './axiosInstance';

export const userApi = {
  getUsers: (params) => axiosInstance.get('/admin/users', { params }),
  getUserById: (id) => axiosInstance.get(`/admin/users/${id}`),
  updateUserStatus: (id, isActive) =>
    axiosInstance.patch(`/admin/users/${id}/status`, { isActive }),
  updateUserRole: (id, role) =>
    axiosInstance.patch(`/admin/users/${id}/role`, { role }),
  getUserCreations: (id, params) =>
    axiosInstance.get(`/admin/users/${id}/creations`, { params }),
};

import axiosInstance from './axiosInstance';

export const supportApi = {
  getSupportQueries: (params) => axiosInstance.get('/admin/support', { params }),
  getSupportQueryById: (id) => axiosInstance.get(`/admin/support/${id}`),
  updateSupportStatus: (id, status) =>
    axiosInstance.patch(`/admin/support/${id}/status`, { status }),
  deleteSupportQuery: (id) => axiosInstance.delete(`/admin/support/${id}`),
};

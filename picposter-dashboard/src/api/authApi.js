import axiosInstance from './axiosInstance';

export const authApi = {
  sendOtp: (mobile) => axiosInstance.post('/auth/send-otp', { mobile }),
  verifyOtp: (payload) => axiosInstance.post('/auth/verify-otp', payload),
  refreshToken: (payload) => axiosInstance.post('/auth/refresh-token', payload),
  logout: (payload) => axiosInstance.post('/auth/logout', payload),
  getProfile: () => axiosInstance.get('/user/profile'),
};

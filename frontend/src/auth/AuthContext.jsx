import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('picposter_admin_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('picposter_access_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('picposter_access_token');
      if (savedToken) {
        try {
          const res = await authApi.getProfile();
          if (res.data?.success && res.data?.data) {
            setUser(res.data.data);
            localStorage.setItem('picposter_admin_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.error('Session validation failed:', err);
          // Token will be refreshed by Axios interceptor or wiped if expired
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const sendOtp = async (mobile) => {
    const res = await authApi.sendOtp(mobile);
    return res.data;
  };

  const loginWithOtp = async (mobile, otp) => {
    const res = await authApi.verifyOtp({
      mobile,
      otp,
      deviceId: 'web_admin_dashboard',
      platform: 'web',
    });

    if (res.data?.success) {
      const { user: authUser, tokens } = res.data.data;
      if (authUser.role !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }

      setUser(authUser);
      setToken(tokens.accessToken);
      localStorage.setItem('picposter_access_token', tokens.accessToken);
      localStorage.setItem('picposter_refresh_token', tokens.refreshToken);
      localStorage.setItem('picposter_admin_user', JSON.stringify(authUser));
      return authUser;
    }
    throw new Error(res.data?.message || 'Login failed');
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('picposter_refresh_token');
      if (refreshToken) {
        await authApi.logout({ refreshToken });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('picposter_access_token');
      localStorage.removeItem('picposter_refresh_token');
      localStorage.removeItem('picposter_admin_user');
      window.location.href = '/login';
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user && user.role === 'admin',
    isAdmin: user?.role === 'admin',
    sendOtp,
    loginWithOtp,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import AdminRoute from './auth/AdminRoute';
import LoginPage from './auth/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardHome from './components/dashboard/DashboardHome';
import PosterListPage from './components/posters/PosterListPage';
import CategoryListPage from './components/categories/CategoryListPage';
import UserListPage from './components/users/UserListPage';
import SupportListPage from './components/support/SupportListPage';

export const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Owner/Admin Routes */}
          <Route element={<AdminRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/posters" element={<PosterListPage />} />
              <Route path="/categories" element={<CategoryListPage />} />
              <Route path="/users" element={<UserListPage />} />
              <Route path="/support" element={<SupportListPage />} />
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

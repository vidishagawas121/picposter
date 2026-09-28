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
import ErrorBoundary from './components/common/ErrorBoundary';
import NotFoundPage from './components/common/NotFoundPage';

export const App = () => {
  return (
    <ErrorBoundary>
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

            {/* 404 Fallback Route */}
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;

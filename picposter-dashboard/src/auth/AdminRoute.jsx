import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Box, CircularProgress, Typography, Button } from '@mui/material';

export const AdminRoute = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0b0f19',
          gap: 2,
        }}
      >
        <CircularProgress color="primary" />
        <Typography variant="body2" color="text.secondary">
          Authenticating PicPoster Admin...
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthenticated) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#0b0f19',
          p: 3,
          textAlign: 'center',
        }}
      >
        <Typography variant="h4" color="error.main" gutterBottom fontWeight={700}>
          403 — Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mb: 3 }}>
          Your account does not have administrator privileges. Please log in with an authorized PicPoster Owner/Admin account.
        </Typography>
        <Button variant="contained" color="primary" onClick={() => (window.location.href = '/login')}>
          Back to Login
        </Button>
      </Box>
    );
  }

  return <Outlet />;
};

export default AdminRoute;

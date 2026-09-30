import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Box, Card, Typography, Button, CircularProgress } from '@mui/material';
import { LockOutlined, ArrowForwardRounded } from '@mui/icons-material';

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

  // Card 15: Direct Access Blocked
  if (!user || !isAuthenticated) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.18) 0%, #0b0f19 75%)',
          p: 2,
        }}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: 420,
            p: { xs: 3, sm: 4.5 },
            textAlign: 'center',
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(17, 24, 39, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              backgroundColor: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#818cf8',
              mb: 1,
            }}
          >
            <LockOutlined sx={{ fontSize: 32 }} />
          </Box>

          <Typography variant="h5" fontWeight={700} sx={{ color: '#fff' }}>
            Access Restricted
          </Typography>

          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', maxWidth: 300, lineHeight: 1.6 }}>
            You need to be logged in as an admin to access this page.
          </Typography>

          <Button
            variant="contained"
            fullWidth
            onClick={() => (window.location.href = '/login')}
            endIcon={<ArrowForwardRounded />}
            sx={{
              mt: 2,
              py: 1.4,
              fontWeight: 600,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              boxShadow: '0 8px 20px -4px rgba(99, 102, 241, 0.5)',
              textTransform: 'none',
              fontSize: '0.95rem',
              '&:hover': {
                background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
              },
            }}
          >
            Go to Admin Login
          </Button>
        </Card>
      </Box>
    );
  }

  return <Outlet />;
};

export default AdminRoute;

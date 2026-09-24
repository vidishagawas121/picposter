import React, { useState, useEffect } from 'react';
import { userApi } from '../../api/userApi';
import { formatDate, formatDateTime } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Avatar,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CloseRounded,
  BusinessRounded,
  PersonOutlineRounded,
  AutoAwesomeRounded,
  AdminPanelSettingsRounded,
  BlockRounded,
  CheckCircleOutlineRounded,
} from '@mui/icons-material';

export const UserDetailPanel = ({
  open,
  userId,
  onClose,
  onToggleStatus,
  onToggleRole,
}) => {
  const [data, setData] = useState(null);
  const [creations, setCreations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!userId) return;
      try {
        setLoading(true);
        const [userRes, creationsRes] = await Promise.all([
          userApi.getUserById(userId),
          userApi.getUserCreations(userId, { page: 1, limit: 12 }),
        ]);

        setData(userRes.data?.data || null);
        setCreations(creationsRes.data?.data || []);
      } catch (err) {
        console.error('Failed to load user details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (open && userId) {
      fetchUserDetails();
      setTabIndex(0);
    }
  }, [open, userId]);

  if (!open) return null;

  const user = data?.user;
  const business = data?.businessProfile;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 540 },
          backgroundColor: '#0f172a',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          p: { xs: 2, sm: 3 },
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          User Account Profile
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseRounded />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', mb: 2.5 }} />

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
          <CircularProgress size={36} color="primary" />
          <Typography variant="body2" color="text.secondary">
            Loading user profile and creations...
          </Typography>
        </Box>
      ) : user ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Top Avatar and Core info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={user.profilePhoto}
              alt={user.name}
              sx={{
                width: 64,
                height: 64,
                bgcolor: 'primary.main',
                fontSize: '1.5rem',
                fontWeight: 700,
                border: '2px solid rgba(99, 102, 241, 0.4)',
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h6" fontWeight={700}>
                {user.name || 'User'}
              </Typography>
              <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                {user.mobile}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.75, alignItems: 'center' }}>
                <StatusBadge active={user.isActive} />
                <Chip
                  label={user.role === 'admin' ? 'Admin' : 'User'}
                  color={user.role === 'admin' ? 'primary' : 'default'}
                  size="small"
                  sx={{ height: 22, fontWeight: 700, fontSize: '0.7rem' }}
                />
                {user.isVerified && (
                  <Chip
                    label="Verified"
                    color="success"
                    variant="outlined"
                    size="small"
                    sx={{ height: 22, fontSize: '0.7rem' }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 1.5, pt: 1 }}>
            <Button
              variant="outlined"
              color={user.isActive ? 'error' : 'success'}
              size="small"
              fullWidth
              startIcon={user.isActive ? <BlockRounded /> : <CheckCircleOutlineRounded />}
              onClick={() => onToggleStatus(user)}
            >
              {user.isActive ? 'Deactivate User' : 'Activate User'}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              fullWidth
              startIcon={<AdminPanelSettingsRounded />}
              onClick={() => onToggleRole(user)}
            >
              {user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}
            </Button>
          </Box>

          {/* Tabs */}
          <Tabs
            value={tabIndex}
            onChange={(_, val) => setTabIndex(val)}
            sx={{
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minWidth: 'auto', px: 2 },
            }}
          >
            <Tab icon={<PersonOutlineRounded fontSize="small" />} iconPosition="start" label="Overview" />
            <Tab icon={<BusinessRounded fontSize="small" />} iconPosition="start" label="Business Profile" />
            <Tab icon={<AutoAwesomeRounded fontSize="small" />} iconPosition="start" label={`Creations (${data?.totalCreations || 0})`} />
          </Tabs>

          {/* Tab 0: Overview */}
          {tabIndex === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Email Address</Typography>
                  <Typography variant="body2" fontWeight={600}>{user.email || 'Not provided'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Preferred Language</Typography>
                  <Typography variant="body2" fontWeight={600}>{user.preferredLanguage || 'English'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Registration Date</Typography>
                  <Typography variant="body2" fontWeight={600}>{formatDate(user.createdAt)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Last Login</Typography>
                  <Typography variant="body2" fontWeight={600}>{formatDateTime(user.lastLoginAt)}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Tab 1: Business Profile */}
          {tabIndex === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              {business && (business.companyName || business.contactNumber) ? (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Company / Brand Name</Typography>
                    <Typography variant="body1" fontWeight={700}>{business.companyName || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Business Contact</Typography>
                    <Typography variant="body2" fontWeight={600}>{business.contactNumber || '-'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Business Email</Typography>
                    <Typography variant="body2" fontWeight={600}>{business.businessMail || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Tagline / Slogan</Typography>
                    <Typography variant="body2">{business.tagline || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">Physical Address</Typography>
                    <Typography variant="body2">{business.businessAddress || '-'}</Typography>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                  No business profile has been configured by this user yet.
                </Typography>
              )}
            </Box>
          )}

          {/* Tab 2: Creations */}
          {tabIndex === 2 && (
            <Box sx={{ pt: 1 }}>
              {creations.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  User has not saved any customized creations yet.
                </Typography>
              ) : (
                <Grid container spacing={1.5}>
                  {creations.map((c) => (
                    <Grid item xs={6} sm={4} key={c._id || c.id}>
                      <Box
                        sx={{
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          bgcolor: '#000000',
                          position: 'relative',
                          aspectRatio: '1/1',
                        }}
                      >
                        <img
                          src={c.customizedImageUrl}
                          alt="Creation"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          User record not found.
        </Typography>
      )}
    </Drawer>
  );
};

export default UserDetailPanel;

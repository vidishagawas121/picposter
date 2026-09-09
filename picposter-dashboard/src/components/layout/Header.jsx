import React, { useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  Chip,
} from '@mui/material';
import {
  MenuRounded,
  LogoutRounded,
  AdminPanelSettingsRounded,
  PersonOutlineRounded,
} from '@mui/icons-material';

export const Header = ({ onDrawerToggle }) => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleCloseMenu();
    logout();
  };

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'none',
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={onDrawerToggle}
            sx={{ display: { md: 'none' } }}
          >
            <MenuRounded />
          </IconButton>
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Platform Status:
            </Typography>
            <Chip
              label="Live Online"
              size="small"
              color="success"
              variant="outlined"
              sx={{ height: 24, fontSize: '0.75rem', fontWeight: 600 }}
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            onClick={handleOpenMenu}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'pointer',
              p: 0.75,
              borderRadius: 3,
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
            }}
          >
            <Avatar
              src={user?.profilePhoto}
              alt={user?.name ? user.name.replace(/\bowner\b/gi, '').trim() || 'Admin' : 'Admin'}
              sx={{
                width: 38,
                height: 38,
                bgcolor: 'primary.main',
                fontWeight: 700,
                border: '2px solid rgba(99, 102, 241, 0.5)',
              }}
            >
              {(user?.name ? user.name.replace(/\bowner\b/gi, '').trim() || 'A' : 'A').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>
                {user?.name ? user.name.replace(/\bowner\b/gi, '').trim() || 'Admin' : 'Admin'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.mobile || '+919876543210'}
              </Typography>
            </Box>
          </Box>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: {
                minWidth: 200,
                backgroundColor: '#111827',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                mt: 1,
              },
            }}
          >
            <MenuItem disabled sx={{ opacity: '1 !important', py: 1 }}>
              <ListItemIcon>
                <AdminPanelSettingsRounded fontSize="small" color="primary" />
              </ListItemIcon>
              <Box>
                <Typography variant="body2" fontWeight={600}>
                  Role: Administrator
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Full System Control
                </Typography>
              </Box>
            </MenuItem>
            <Divider sx={{ my: 0.5, borderColor: 'rgba(255, 255, 255, 0.08)' }} />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.light' }}>
              <ListItemIcon>
                <LogoutRounded fontSize="small" color="error" />
              </ListItemIcon>
              Log Out
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;

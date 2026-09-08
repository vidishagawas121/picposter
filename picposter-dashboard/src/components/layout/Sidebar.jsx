import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import {
  DashboardRounded,
  CollectionsRounded,
  CategoryRounded,
  GroupRounded,
  HeadsetMicRounded,
  AutoAwesomeRounded,
} from '@mui/icons-material';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: DashboardRounded },
  { label: 'Posters', path: '/posters', icon: CollectionsRounded },
  { label: 'Categories', path: '/categories', icon: CategoryRounded },
  { label: 'Users', path: '/users', icon: GroupRounded },
  { label: 'Support', path: '/support', icon: HeadsetMicRounded },
];

const DRAWER_WIDTH = 260;

export const Sidebar = ({ mobileOpen, onDrawerClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (path) => {
    navigate(path);
    if (onDrawerClose) {
      onDrawerClose();
    }
  };

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0e1422' }}>
      {/* Brand logo header */}
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366f1 0%, #ec4899 100%)',
            boxShadow: '0 8px 16px -4px rgba(99, 102, 241, 0.4)',
          }}
        >
          <AutoAwesomeRounded sx={{ color: '#ffffff', fontSize: 22 }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} className="gradient-text" lineHeight={1.1}>
            PicPoster
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            Owner Admin
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />

      {/* Navigation List */}
      <List sx={{ px: 2, py: 2, flexGrow: 1 }}>
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            mb: 1,
            display: 'block',
            color: 'text.disabled',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            fontSize: '0.7rem',
          }}
        >
          Main Menu
        </Typography>

        {NAV_ITEMS.map((item) => {
          const IconComponent = item.icon;
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.75 }}>
              <ListItemButton
                onClick={() => handleNavClick(item.path)}
                sx={{
                  borderRadius: 2.5,
                  py: 1.25,
                  px: 2,
                  transition: 'all 0.2s',
                  backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                  '&:hover': {
                    backgroundColor: isActive
                      ? 'rgba(99, 102, 241, 0.22)'
                      : 'rgba(255, 255, 255, 0.04)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 38,
                    color: isActive ? 'primary.light' : 'text.secondary',
                  }}
                >
                  <IconComponent fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#ffffff' : 'text.primary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer Info */}
      <Box sx={{ p: 2.5, borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          }}
        >
          <Typography variant="caption" fontWeight={600} display="block" color="text.secondary">
            PicPoster Engine v1.0
          </Typography>
          <Typography variant="caption" color="text.disabled" display="block">
            Mongoose & Express 5.x
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;

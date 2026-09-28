import React, { useState, useEffect, useCallback } from 'react';
import { userApi } from '../../api/userApi';
import DataTable from '../common/DataTable';
import SearchBar from '../common/SearchBar';
import StatusBadge from '../common/StatusBadge';
import ConfirmDialog from '../common/ConfirmDialog';
import UserDetailPanel from './UserDetailPanel';
import { formatDate } from '../../utils/formatters';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  Switch,
  MenuItem,
  TextField,
  Chip,
  Tooltip,
  TableRow,
  TableCell,
} from '@mui/material';
import {
  VisibilityRounded,
  AdminPanelSettingsRounded,
  PersonOutlineRounded,
} from '@mui/icons-material';

export const UserListPage = () => {
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [isVerified, setIsVerified] = useState('all');
  const [isActive, setIsActive] = useState('all');

  // Modals & Drawers
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Confirm dialogs
  const [statusDialog, setStatusDialog] = useState({ open: false, user: null });
  const [roleDialog, setRoleDialog] = useState({ open: false, user: null });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...(search ? { search } : {}),
        ...(role !== 'all' ? { role } : {}),
        ...(isVerified !== 'all' ? { isVerified } : {}),
        ...(isActive !== 'all' ? { isActive } : {}),
      };

      const res = await userApi.getUsers(params);
      if (res.data?.success) {
        setUsers(res.data.data || []);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, role, isVerified, isActive]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle status toggle confirmation
  const handleStatusConfirm = async () => {
    if (!statusDialog.user) return;
    try {
      setActionLoading(true);
      const newStatus = !statusDialog.user.isActive;
      await userApi.updateUserStatus(statusDialog.user._id || statusDialog.user.id, newStatus);
      setStatusDialog({ open: false, user: null });
      fetchUsers();
    } catch (err) {
      console.error('Failed to change user status:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle role change confirmation
  const handleRoleConfirm = async () => {
    if (!roleDialog.user) return;
    try {
      setActionLoading(true);
      const newRole = roleDialog.user.role === 'admin' ? 'user' : 'admin';
      await userApi.updateUserRole(roleDialog.user._id || roleDialog.user.id, newRole);
      setRoleDialog({ open: false, user: null });
      fetchUsers();
    } catch (err) {
      console.error('Failed to change user role:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { id: 'user', label: 'User Name & Mobile', minWidth: 200 },
    { id: 'email', label: 'Email', minWidth: 160 },
    { id: 'role', label: 'Role', width: 100 },
    { id: 'verified', label: 'Verified', width: 100 },
    { id: 'registered', label: 'Joined Date', width: 130 },
    { id: 'status', label: 'Active', width: 90, align: 'center' },
    { id: 'actions', label: 'Actions', width: 110, align: 'right' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" fontWeight={800} className="gradient-text">
          User Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View registered accounts, verify status, manage permissions, and inspect business profiles
        </Typography>
      </Box>

      {/* Filters Bar */}
      <Box
        sx={{
          p: 2,
          borderRadius: 3,
          bgcolor: '#111827',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          gap: 1.5,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by name, mobile, email..."
          sx={{ flexGrow: 1, minWidth: 240 }}
        />

        <TextField
          select
          size="small"
          label="Role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="all">All Roles</MenuItem>
          <MenuItem value="user">User</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Verification"
          value={isVerified}
          onChange={(e) => {
            setIsVerified(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="true">Verified</MenuItem>
          <MenuItem value="false">Unverified</MenuItem>
        </TextField>

        <TextField
          select
          size="small"
          label="Status"
          value={isActive}
          onChange={(e) => {
            setIsActive(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="all">All Status</MenuItem>
          <MenuItem value="true">Active</MenuItem>
          <MenuItem value="false">Inactive</MenuItem>
        </TextField>
      </Box>

      {/* Users Table */}
      <DataTable
        columns={columns}
        rows={users}
        loading={loading}
        page={page}
        limit={limit}
        totalCount={totalCount}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        renderRow={(user) => (
          <TableRow
            key={user._id || user.id}
            hover
            sx={{ cursor: 'pointer' }}
            onClick={() => {
              setSelectedUserId(user._id || user.id);
              setDetailOpen(true);
            }}
          >
            <TableCell>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  src={user.profilePhoto}
                  alt={user.name}
                  sx={{ width: 38, height: 38, bgcolor: 'primary.main', fontWeight: 700 }}
                >
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700}>
                    {user.name || 'User'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" fontFamily="monospace">
                    {user.mobile}
                  </Typography>
                </Box>
              </Box>
            </TableCell>

            <TableCell>
              <Typography variant="body2" color="text.secondary">
                {user.email || '-'}
              </Typography>
            </TableCell>

            <TableCell>
              <Chip
                label={user.role === 'admin' ? 'Admin' : 'User'}
                color={user.role === 'admin' ? 'primary' : 'default'}
                size="small"
                sx={{ height: 22, fontWeight: 700, fontSize: '0.72rem' }}
              />
            </TableCell>

            <TableCell>
              <StatusBadge label={user.isVerified ? 'Verified' : 'Unverified'} />
            </TableCell>

            <TableCell>{formatDate(user.createdAt)}</TableCell>

            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
              <Switch
                size="small"
                checked={user.isActive}
                onChange={() => setStatusDialog({ open: true, user })}
                color="success"
              />
            </TableCell>

            <TableCell align="right" onClick={(e) => e.stopPropagation()}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                <Tooltip title="View Profile & Creations">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedUserId(user._id || user.id);
                      setDetailOpen(true);
                    }}
                  >
                    <VisibilityRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={user.role === 'admin' ? 'Demote to User' : 'Promote to Admin'}>
                  <IconButton
                    size="small"
                    color={user.role === 'admin' ? 'warning' : 'primary'}
                    onClick={() => setRoleDialog({ open: true, user })}
                  >
                    <AdminPanelSettingsRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </TableCell>
          </TableRow>
        )}
      />

      {/* User Details Drawer */}
      <UserDetailPanel
        open={detailOpen}
        userId={selectedUserId}
        onClose={() => {
          setDetailOpen(false);
          setSelectedUserId(null);
        }}
        onToggleStatus={(u) => setStatusDialog({ open: true, user: u })}
        onToggleRole={(u) => setRoleDialog({ open: true, user: u })}
      />

      {/* Confirm Deactivation/Activation */}
      <ConfirmDialog
        open={statusDialog.open}
        title={statusDialog.user?.isActive ? 'Deactivate User Account' : 'Activate User Account'}
        message={`Are you sure you want to ${
          statusDialog.user?.isActive ? 'deactivate' : 'activate'
        } the account for "${statusDialog.user?.name || statusDialog.user?.mobile}"?`}
        confirmText={statusDialog.user?.isActive ? 'Deactivate' : 'Activate'}
        confirmColor={statusDialog.user?.isActive ? 'error' : 'success'}
        loading={actionLoading}
        onConfirm={handleStatusConfirm}
        onCancel={() => setStatusDialog({ open: false, user: null })}
      />

      {/* Confirm Role Change */}
      <ConfirmDialog
        open={roleDialog.open}
        title={roleDialog.user?.role === 'admin' ? 'Revoke Admin Privileges' : 'Promote to Administrator'}
        message={`Are you sure you want to change the role of "${
          roleDialog.user?.name || roleDialog.user?.mobile
        }" to ${roleDialog.user?.role === 'admin' ? 'User' : 'Administrator'}?`}
        confirmText="Confirm Role Change"
        confirmColor="primary"
        loading={actionLoading}
        onConfirm={handleRoleConfirm}
        onCancel={() => setRoleDialog({ open: false, user: null })}
      />
    </Box>
  );
};

export default UserListPage;

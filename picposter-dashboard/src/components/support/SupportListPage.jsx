import React, { useState, useEffect, useCallback } from 'react';
import { supportApi } from '../../api/supportApi';
import DataTable from '../common/DataTable';
import SearchBar from '../common/SearchBar';
import StatusBadge from '../common/StatusBadge';
import ConfirmDialog from '../common/ConfirmDialog';
import SupportDetailModal from './SupportDetailModal';
import { formatDate } from '../../utils/formatters';
import { SUPPORT_STATUSES } from '../../utils/constants';
import {
  Box,
  Typography,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  TableRow,
  TableCell,
} from '@mui/material';
import {
  VisibilityRounded,
  DeleteOutlineRounded,
} from '@mui/icons-material';

export const SupportListPage = () => {
  const [queries, setQueries] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  // Modals
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [queryToDelete, setQueryToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQueries = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        ...(search ? { search } : {}),
        ...(status !== 'all' ? { status } : {}),
      };

      const res = await supportApi.getSupportQueries(params);
      if (res.data?.success) {
        setQueries(res.data.data || []);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch (err) {
      console.error('Failed to load support queries:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status]);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  const handleDeleteConfirm = async () => {
    if (!queryToDelete) return;
    try {
      setActionLoading(true);
      await supportApi.deleteSupportQuery(queryToDelete._id || queryToDelete.id);
      setDeleteOpen(false);
      setQueryToDelete(null);
      fetchQueries();
    } catch (err) {
      console.error('Failed to delete query:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { id: 'name', label: 'Contact Name', minWidth: 150 },
    { id: 'contact', label: 'Email / Phone', minWidth: 160 },
    { id: 'query', label: 'Query Preview', minWidth: 260 },
    { id: 'status', label: 'Status', width: 130 },
    { id: 'createdAt', label: 'Submitted', width: 120 },
    { id: 'actions', label: 'Actions', width: 100, align: 'right' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography variant="h4" fontWeight={800} className="gradient-text">
          Support Query Center
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track, respond to, and resolve user inquiries and support tickets
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
          placeholder="Search by name, contact, query..."
          sx={{ flexGrow: 1, minWidth: 240 }}
        />

        <TextField
          select
          size="small"
          label="Workflow Status"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">All Statuses</MenuItem>
          {SUPPORT_STATUSES.map((s) => (
            <MenuItem key={s.value} value={s.value}>
              {s.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* Support Queries Table */}
      <DataTable
        columns={columns}
        rows={queries}
        loading={loading}
        page={page}
        limit={limit}
        totalCount={totalCount}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        renderRow={(q) => (
          <TableRow
            key={q._id || q.id}
            hover
            sx={{ cursor: 'pointer' }}
            onClick={() => {
              setSelectedQuery(q);
              setDetailOpen(true);
            }}
          >
            <TableCell>
              <Typography variant="subtitle2" fontWeight={700}>
                {q.name}
              </Typography>
            </TableCell>

            <TableCell>
              <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                {q.contact}
              </Typography>
            </TableCell>

            <TableCell>
              <Typography variant="body2" noWrap sx={{ maxWidth: 320, color: 'text.secondary' }}>
                {q.query}
              </Typography>
            </TableCell>

            <TableCell>
              <StatusBadge label={q.status} />
            </TableCell>

            <TableCell>{formatDate(q.createdAt)}</TableCell>

            <TableCell align="right" onClick={(e) => e.stopPropagation()}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                <Tooltip title="View & Update Status">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => {
                      setSelectedQuery(q);
                      setDetailOpen(true);
                    }}
                  >
                    <VisibilityRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Query">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setQueryToDelete(q);
                      setDeleteOpen(true);
                    }}
                  >
                    <DeleteOutlineRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </TableCell>
          </TableRow>
        )}
      />

      {/* Support Detail Modal */}
      <SupportDetailModal
        open={detailOpen}
        query={selectedQuery}
        onClose={() => {
          setDetailOpen(false);
          setSelectedQuery(null);
        }}
        onSuccess={fetchQueries}
      />

      {/* Delete Query Confirm Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete Support Ticket"
        message={`Are you sure you want to delete the support inquiry from "${queryToDelete?.name}"?`}
        confirmText="Delete Query"
        confirmColor="error"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteOpen(false);
          setQueryToDelete(null);
        }}
      />
    </Box>
  );
};

export default SupportListPage;

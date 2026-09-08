import React, { useState, useEffect, useCallback } from 'react';
import { posterApi } from '../../api/posterApi';
import { categoryApi } from '../../api/categoryApi';
import DataTable from '../common/DataTable';
import SearchBar from '../common/SearchBar';
import StatusBadge from '../common/StatusBadge';
import ConfirmDialog from '../common/ConfirmDialog';
import PosterFormModal from './PosterFormModal';
import PosterDetailPanel from './PosterDetailPanel';
import { formatNumber } from '../../utils/formatters';
import { LANGUAGES } from '../../utils/constants';
import {
  Box,
  Typography,
  Button,
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
  AddRounded,
  EditRounded,
  DeleteOutlineRounded,
  VisibilityRounded,
  StarRounded,
  WhatshotRounded,
} from '@mui/icons-material';

export const PosterListPage = () => {
  const [posters, setPosters] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [language, setLanguage] = useState('all');
  const [isActive, setIsActive] = useState('all');
  const [isTrending, setIsTrending] = useState('all');
  const [isPremium, setIsPremium] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  const [categories, setCategories] = useState([]);

  // Modals state
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPoster, setSelectedPoster] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [posterToDelete, setPosterToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryApi.getCategories();
        if (res.data?.data) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Fetch Posters
  const fetchPosters = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit,
        sortBy,
        sortOrder,
        ...(search ? { search } : {}),
        ...(category !== 'all' ? { category } : {}),
        ...(language !== 'all' ? { language } : {}),
        ...(isActive !== 'all' ? { isActive } : {}),
        ...(isTrending !== 'all' ? { isTrending } : {}),
        ...(isPremium !== 'all' ? { isPremium } : {}),
      };

      const res = await posterApi.getPosters(params);
      if (res.data?.success) {
        setPosters(res.data.data || []);
        setTotalCount(res.data.totalCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch posters:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, category, language, isActive, isTrending, isPremium, sortBy, sortOrder]);

  useEffect(() => {
    fetchPosters();
  }, [fetchPosters]);

  // Handle inline status toggle
  const handleToggleStatus = async (poster, e) => {
    e.stopPropagation();
    try {
      const newStatus = !poster.isActive;
      await posterApi.updatePosterStatus(poster._id || poster.id, newStatus);
      setPosters((prev) =>
        prev.map((p) =>
          (p._id === poster._id || p.id === poster.id) ? { ...p, isActive: newStatus } : p
        )
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!posterToDelete) return;
    try {
      setActionLoading(true);
      await posterApi.deletePoster(posterToDelete._id || posterToDelete.id);
      setDeleteOpen(false);
      setPosterToDelete(null);
      fetchPosters();
    } catch (err) {
      console.error('Failed to delete poster:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    { id: 'thumbnail', label: 'Preview', width: 80 },
    { id: 'title', label: 'Title & Category', minWidth: 200 },
    { id: 'language', label: 'Language', width: 120 },
    { id: 'downloads', label: 'Downloads', width: 110, align: 'right' },
    { id: 'shares', label: 'Shares', width: 100, align: 'right' },
    { id: 'status', label: 'Active', width: 100, align: 'center' },
    { id: 'actions', label: 'Actions', width: 140, align: 'right' },
  ];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header & Add Button */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} className="gradient-text">
            Poster Templates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage, upload, edit, and organize all banner & poster templates
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddRounded />}
          onClick={() => {
            setSelectedPoster(null);
            setFormOpen(true);
          }}
          sx={{ py: 1.2, px: 2.5 }}
        >
          Add New Poster
        </Button>
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
          placeholder="Search by title or tag..."
          sx={{ flexGrow: 1, minWidth: 200 }}
        />

        <TextField
          select
          size="small"
          label="Category"
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="all">All Categories</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c._id || c.slug} value={c.slug}>
              {c.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Language"
          value={language}
          onChange={(e) => {
            setLanguage(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 130 }}
        >
          <MenuItem value="all">All Languages</MenuItem>
          {LANGUAGES.map((l) => (
            <MenuItem key={l} value={l}>
              {l}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Trending"
          value={isTrending}
          onChange={(e) => {
            setIsTrending(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="true">Trending</MenuItem>
          <MenuItem value="false">Standard</MenuItem>
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

      {/* Posters Table */}
      <DataTable
        columns={columns}
        rows={posters}
        loading={loading}
        page={page}
        limit={limit}
        totalCount={totalCount}
        onPageChange={setPage}
        onLimitChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
        }}
        renderRow={(poster) => (
          <TableRow key={poster._id || poster.id} hover sx={{ cursor: 'pointer' }}>
            <TableCell onClick={() => { setSelectedPoster(poster); setDetailOpen(true); }}>
              <Avatar
                variant="rounded"
                src={poster.thumbnailUrl || poster.imageUrl}
                alt={poster.title}
                sx={{ width: 46, height: 46, borderRadius: 2 }}
              />
            </TableCell>

            <TableCell onClick={() => { setSelectedPoster(poster); setDetailOpen(true); }}>
              <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ maxWidth: 280 }}>
                {poster.title}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', mt: 0.5 }}>
                <Chip
                  label={poster.category}
                  size="small"
                  sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(255,255,255,0.05)' }}
                />
                {poster.isTrending && (
                  <Chip
                    icon={<WhatshotRounded sx={{ fontSize: '12px !important' }} />}
                    label="Trending"
                    size="small"
                    color="secondary"
                    sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                  />
                )}
                {poster.isPremium && (
                  <Chip
                    icon={<StarRounded sx={{ fontSize: '12px !important' }} />}
                    label="Premium"
                    size="small"
                    color="warning"
                    sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
                  />
                )}
              </Box>
            </TableCell>

            <TableCell>{poster.language}</TableCell>

            <TableCell align="right" sx={{ fontWeight: 700, color: 'success.light' }}>
              {formatNumber(poster.downloadsCount)}
            </TableCell>

            <TableCell align="right" sx={{ fontWeight: 700, color: 'info.light' }}>
              {formatNumber(poster.sharesCount)}
            </TableCell>

            <TableCell align="center">
              <Switch
                size="small"
                checked={poster.isActive}
                onChange={(e) => handleToggleStatus(poster, e)}
                color="success"
              />
            </TableCell>

            <TableCell align="right">
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setSelectedPoster(poster);
                      setDetailOpen(true);
                    }}
                  >
                    <VisibilityRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Edit Poster">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => {
                      setSelectedPoster(poster);
                      setFormOpen(true);
                    }}
                  >
                    <EditRounded fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Poster">
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setPosterToDelete(poster);
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

      {/* Modals & Panels */}
      <PosterFormModal
        open={formOpen}
        poster={selectedPoster}
        onClose={() => setFormOpen(false)}
        onSuccess={fetchPosters}
      />

      <PosterDetailPanel
        open={detailOpen}
        poster={selectedPoster}
        onClose={() => setDetailOpen(false)}
        onEdit={(p) => {
          setSelectedPoster(p);
          setFormOpen(true);
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Poster Template"
        message={`Are you sure you want to permanently delete "${posterToDelete?.title}"? The associated image assets will be removed.`}
        confirmText="Delete Poster"
        confirmColor="error"
        loading={actionLoading}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setDeleteOpen(false);
          setPosterToDelete(null);
        }}
      />
    </Box>
  );
};

export default PosterListPage;

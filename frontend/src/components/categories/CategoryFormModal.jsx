import React, { useState, useEffect } from 'react';
import { categoryApi } from '../../api/categoryApi';
import ImageUploader from '../common/ImageUploader';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Switch,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { CategoryRounded, EditRounded } from '@mui/icons-material';

export const CategoryFormModal = ({ open, category, onClose, onSuccess }) => {
  const isEdit = Boolean(category?._id || category?.id);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [iconFile, setIconFile] = useState(null);
  const [existingIconUrl, setExistingIconUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setSlug(category.slug || '');
      setSortOrder(category.sortOrder !== undefined ? category.sortOrder : 0);
      setIsActive(category.isActive !== undefined ? Boolean(category.isActive) : true);
      setExistingIconUrl(category.iconUrl || '');
      setIconFile(null);
    } else {
      setName('');
      setSlug('');
      setSortOrder(0);
      setIsActive(true);
      setExistingIconUrl('');
      setIconFile(null);
    }
    setError('');
  }, [category, open]);

  // Auto generate slug when name changes during creation
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!isEdit) {
      setSlug(
        val
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || name.trim().length < 2 || name.trim().length > 50) {
      setError('Category name must be between 2 and 50 characters');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('slug', slug.trim());
      formData.append('sortOrder', Number(sortOrder));
      formData.append('isActive', isActive);

      if (iconFile) {
        formData.append('icon', iconFile);
      }

      if (isEdit) {
        const catId = category._id || category.id;
        await categoryApi.updateCategory(catId, formData);
      } else {
        await categoryApi.createCategory(formData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Save category error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#111827',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3.5,
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: 'rgba(99, 102, 241, 0.15)',
              color: 'primary.main',
            }}
          >
            {isEdit ? <EditRounded fontSize="small" /> : <CategoryRounded fontSize="small" />}
          </Box>
          <Typography variant="h6" fontWeight={700}>
            {isEdit ? 'Edit Category' : 'Create Category'}
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Category Name"
            required
            fullWidth
            value={name}
            onChange={handleNameChange}
            placeholder="e.g. Festival, Real Estate, Motivational"
            helperText="Min 2 chars, Max 50 chars (unique)"
          />

          <TextField
            label="URL-Safe Slug"
            required
            fullWidth
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            placeholder="e.g. festival, real-estate"
            helperText="Lowercase alphanumeric with hyphens"
          />

          <TextField
            label="Sort Order Ranking"
            type="number"
            fullWidth
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            helperText="Display ranking sequence in category carousels (lower appears first)"
          />

          <Box>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Category Icon Image (Optional)
            </Typography>
            <ImageUploader
              value={iconFile || existingIconUrl}
              onChange={(file) => setIconFile(file)}
              onRemove={() => {
                setIconFile(null);
                setExistingIconUrl('');
              }}
              maxSize={2 * 1024 * 1024}
              label="Select Icon Image"
              hint="Max 2MB (PNG/SVG/WebP). Automatically resized & converted to WebP."
            />
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                color="success"
              />
            }
            label={<Typography variant="body2" fontWeight={600}>Active & Visible to Mobile App</Typography>}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
          >
            {loading ? 'Saving...' : isEdit ? 'Update Category' : 'Create Category'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CategoryFormModal;

import React, { useState, useEffect } from 'react';
import { posterApi } from '../../api/posterApi';
import { categoryApi } from '../../api/categoryApi';
import ImageUploader from '../common/ImageUploader';
import TagInput from '../common/TagInput';
import { LANGUAGES, ASPECT_RATIOS } from '../../utils/constants';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
  Grid,
  Box,
  Typography,
  Alert,
  CircularProgress,
  RadioGroup,
  Radio,
  FormControl,
  FormLabel,
} from '@mui/material';
import { AutoAwesomeRounded, CollectionsRounded, LayersRounded } from '@mui/icons-material';

export const PosterFormModal = ({ open, poster, onClose, onSuccess, onSwitchToMulti }) => {
  const isEdit = Boolean(poster?._id || poster?.id);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState('English');
  const [tags, setTags] = useState([]);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isTrending, setIsTrending] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryApi.getCategories();
        if (res.data?.data) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch categories for poster form:', err);
      }
    };

    if (open) {
      loadCategories();
    }
  }, [open]);

  useEffect(() => {
    if (poster) {
      setTitle(poster.title || '');
      setCategory(poster.category || poster.categoryId?.slug || '');
      setLanguage(poster.language || 'English');
      setTags(Array.isArray(poster.tags) ? poster.tags : []);
      setAspectRatio(poster.aspectRatio || '1:1');
      setIsTrending(Boolean(poster.isTrending));
      setIsPremium(Boolean(poster.isPremium));
      setIsActive(poster.isActive !== undefined ? Boolean(poster.isActive) : true);
      setExistingImageUrl(poster.imageUrl || '');
      setImageFile(null);
    } else {
      setTitle('');
      setCategory('');
      setLanguage('English');
      setTags([]);
      setAspectRatio('1:1');
      setIsTrending(false);
      setIsPremium(false);
      setIsActive(true);
      setExistingImageUrl('');
      setImageFile(null);
    }
    setError('');
  }, [poster, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || title.trim().length < 3 || title.trim().length > 120) {
      setError('Title must be between 3 and 120 characters');
      return;
    }
    if (!category) {
      setError('Please select a category');
      return;
    }
    if (!isEdit && !imageFile) {
      setError('Please upload a poster template image');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('category', category);
      formData.append('language', language);
      formData.append('aspectRatio', aspectRatio);
      formData.append('isTrending', isTrending);
      formData.append('isPremium', isPremium);
      formData.append('isActive', isActive);
      formData.append('tags', tags.join(','));

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (isEdit) {
        const posterId = poster._id || poster.id;
        await posterApi.updatePoster(posterId, formData);
      } else {
        await posterApi.createPoster(formData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Save poster error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save poster');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
              {isEdit ? <CollectionsRounded fontSize="small" /> : <AutoAwesomeRounded fontSize="small" />}
            </Box>
            <Typography variant="h6" fontWeight={700}>
              {isEdit ? 'Edit Poster Template' : 'Add Single Poster'}
            </Typography>
          </Box>

          {!isEdit && onSwitchToMulti && (
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              startIcon={<LayersRounded fontSize="small" />}
              onClick={onSwitchToMulti}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.78rem',
                borderRadius: 2,
              }}
            >
              Switch to Multiple Upload
            </Button>
          )}
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          <Grid container spacing={2.5}>
            {/* Left side form fields */}
            <Grid item xs={12} md={7}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Poster Title"
                  required
                  fullWidth
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Diwali Mega Celebration Banner"
                  helperText="Must be 3 to 120 characters"
                />

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="Category"
                      required
                      fullWidth
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat._id || cat.slug} value={cat.slug}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      label="Language"
                      required
                      fullWidth
                      value={language}
                      onChange={(e) => setLanguage(e.target.value)}
                    >
                      {LANGUAGES.map((lang) => (
                        <MenuItem key={lang} value={lang}>
                          {lang}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ fontSize: '0.8rem', color: 'text.secondary', mb: 0.5 }}>
                    Aspect Ratio
                  </FormLabel>
                  <RadioGroup
                    row
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value)}
                  >
                    {ASPECT_RATIOS.map((ratio) => (
                      <FormControlLabel
                        key={ratio}
                        value={ratio}
                        control={<Radio size="small" />}
                        label={<Typography variant="body2">{ratio}</Typography>}
                      />
                    ))}
                  </RadioGroup>
                </FormControl>

                <TagInput
                  value={tags}
                  onChange={setTags}
                  label="Search Tags & Keywords"
                  placeholder="Type tag and press Enter"
                />

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', pt: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isTrending}
                        onChange={(e) => setIsTrending(e.target.checked)}
                        color="secondary"
                      />
                    }
                    label={<Typography variant="body2" fontWeight={600}>Trending Featured</Typography>}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={isPremium}
                        onChange={(e) => setIsPremium(e.target.checked)}
                        color="warning"
                      />
                    }
                    label={<Typography variant="body2" fontWeight={600}>Premium Tier</Typography>}
                  />

                  <FormControlLabel
                    control={
                      <Switch
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        color="success"
                      />
                    }
                    label={<Typography variant="body2" fontWeight={600}>Active Status</Typography>}
                  />
                </Box>
              </Box>
            </Grid>

            {/* Right side Image Upload */}
            <Grid item xs={12} md={5}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Poster Template Artwork {isEdit ? '(Replace Optional)' : '(Required)'}
              </Typography>
              <ImageUploader
                value={imageFile || existingImageUrl}
                onChange={(file) => setImageFile(file)}
                onRemove={() => {
                  setImageFile(null);
                  setExistingImageUrl('');
                }}
                label="Select or Drop Poster Artwork"
                hint="Max 10MB (JPG/PNG/WebP). Automatically converted to WebP + thumbnail."
              />
            </Grid>
          </Grid>
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
            {loading ? 'Saving...' : isEdit ? 'Update Poster' : 'Create Poster'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default PosterFormModal;

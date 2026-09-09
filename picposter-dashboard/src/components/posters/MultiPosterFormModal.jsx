import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { posterApi } from '../../api/posterApi';
import { categoryApi } from '../../api/categoryApi';
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
  LinearProgress,
  IconButton,
  Tooltip,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import {
  LayersRounded,
  CloudUploadRounded,
  DeleteOutlineRounded,
  CheckCircleRounded,
  ErrorOutlineRounded,
  AddPhotoAlternateRounded,
  ImageRounded,
  RestartAltRounded,
  AutoAwesomeRounded,
} from '@mui/icons-material';

export const MultiPosterFormModal = ({ open, onClose, onSuccess }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [titlePrefix, setTitlePrefix] = useState('');
  const [category, setCategory] = useState('');
  const [language, setLanguage] = useState('English');
  const [tags, setTags] = useState([]);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [isTrending, setIsTrending] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null); // { successful: [], failed: [], total, successCount, failureCount }

  // Fetch categories on open
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await categoryApi.getCategories();
        if (res.data?.data) {
          setCategories(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch categories:', err);
      }
    };

    if (open) {
      loadCategories();
    }
  }, [open]);

  // Reset form when modal opens or closes
  const resetForm = useCallback(() => {
    // Revoke previous object URLs
    filePreviews.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    });
    setSelectedFiles([]);
    setFilePreviews([]);
    setTitlePrefix('');
    setCategory('');
    setLanguage('English');
    setTags([]);
    setAspectRatio('1:1');
    setIsTrending(false);
    setIsPremium(false);
    setIsActive(true);
    setLoading(false);
    setUploadProgress(0);
    setError('');
    setResults(null);
  }, [filePreviews]);

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  // Handle Dropzone files
  const onDrop = useCallback((acceptedFiles) => {
    if (!acceptedFiles || acceptedFiles.length === 0) return;

    const newFiles = [];
    const newPreviews = [];

    acceptedFiles.forEach((file) => {
      newFiles.push(file);
      newPreviews.push({
        file,
        name: file.name,
        size: file.size,
        previewUrl: URL.createObjectURL(file),
      });
    });

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);
    setError('');
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
  });

  const handleRemoveFile = (index) => {
    setFilePreviews((prev) => {
      const updated = [...prev];
      if (updated[index]?.previewUrl) {
        URL.revokeObjectURL(updated[index].previewUrl);
      }
      updated.splice(index, 1);
      return updated;
    });

    setSelectedFiles((prev) => {
      const updated = [...prev];
      updated.splice(index, 1);
      return updated;
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      setError('Please select at least one poster image to upload');
      return;
    }

    if (!category) {
      setError('Please select a category for the uploaded posters');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setUploadProgress(0);

      const formData = new FormData();
      formData.append('category', category);
      formData.append('language', language);
      formData.append('aspectRatio', aspectRatio);
      formData.append('isTrending', isTrending);
      formData.append('isPremium', isPremium);
      formData.append('isActive', isActive);
      formData.append('tags', tags.join(','));

      if (titlePrefix.trim()) {
        formData.append('titlePrefix', titlePrefix.trim());
      }

      selectedFiles.forEach((file) => {
        formData.append('images', file);
      });

      const response = await posterApi.createMultiplePosters(formData, (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      if (response.data?.success) {
        setResults(response.data.data);
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(response.data?.message || 'Failed to upload some or all posters');
      }
    } catch (err) {
      console.error('Multiple posters upload error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to upload posters');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return; // Prevent closing while upload is in progress
    resetForm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#111827',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 3.5,
          maxHeight: '92vh',
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        {/* Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1.5,
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: '12px',
                bgcolor: 'rgba(99, 102, 241, 0.15)',
                color: 'primary.main',
              }}
            >
              <LayersRounded fontSize="medium" />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>
                Add Multiple Posters (Bulk Upload)
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Upload multiple poster images at once. Each image is processed to WebP and saved as a separate poster document.
              </Typography>
            </Box>
          </Box>

          {selectedFiles.length > 0 && !results && (
            <Chip
              label={`${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 700 }}
            />
          )}
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2.5 }}>
          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Results Screen */}
          {results ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 1 }}>
              <Alert
                severity={results.failureCount === 0 ? 'success' : 'warning'}
                icon={results.failureCount === 0 ? <CheckCircleRounded /> : <ErrorOutlineRounded />}
                sx={{ borderRadius: 2 }}
              >
                <Typography variant="subtitle2" fontWeight={700}>
                  {results.failureCount === 0
                    ? `All ${results.successCount} posters uploaded successfully!`
                    : `Processed ${results.total} posters: ${results.successCount} succeeded, ${results.failureCount} failed.`}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Each poster has been stored as a separate document in MongoDB with optimized WebP artwork and thumbnails.
                </Typography>
              </Alert>

              {/* Failed items list if any */}
              {results.failed && results.failed.length > 0 && (
                <Box sx={{ p: 2, bgcolor: 'rgba(239, 68, 68, 0.08)', borderRadius: 2.5, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <Typography variant="subtitle2" color="error.light" fontWeight={700} gutterBottom>
                    Failed Uploads ({results.failed.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {results.failed.map((item, idx) => (
                      <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight={600}>{item.filename}</Typography>
                        <Typography variant="caption" color="error.main">{item.error}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}

              {/* Successful posters preview cards */}
              {results.successful && results.successful.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                    Successfully Created Posters ({results.successful.length})
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 0.5, maxHeight: 340, overflowY: 'auto', pr: 0.5 }}>
                    {results.successful.map((item) => (
                      <Grid item xs={12} sm={6} md={4} key={item._id || item.id}>
                        <Paper
                          sx={{
                            p: 1.5,
                            bgcolor: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: 2.5,
                            display: 'flex',
                            gap: 1.5,
                            alignItems: 'center',
                          }}
                        >
                          <Box
                            component="img"
                            src={item.thumbnailUrl || item.imageUrl}
                            alt={item.title}
                            sx={{
                              width: 52,
                              height: 52,
                              borderRadius: 2,
                              objectFit: 'cover',
                              bgcolor: '#000',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                          />
                          <Box sx={{ minWidth: 0, flex: 1 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>
                              {item.title}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mt: 0.5 }}>
                              <Chip
                                label={item.category}
                                size="small"
                                sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(255,255,255,0.06)' }}
                              />
                              <Chip
                                label={item.language}
                                size="small"
                                sx={{ height: 18, fontSize: '0.65rem', bgcolor: 'rgba(99, 102, 241, 0.12)', color: 'primary.light' }}
                              />
                            </Box>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          ) : (
            /* Upload Form Content */
            <Grid container spacing={3}>
              {/* Left Column: Multi-File Selection & Previews */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AddPhotoAlternateRounded fontSize="small" color="primary" />
                  Select Multiple Poster Images (Required)
                </Typography>

                {/* Dropzone */}
                <Box
                  {...getRootProps()}
                  sx={{
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'rgba(255, 255, 255, 0.18)',
                    borderRadius: 3,
                    p: 3,
                    textAlign: 'center',
                    backgroundColor: isDragActive ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    mb: 2,
                    '&:hover': {
                      borderColor: loading ? 'rgba(255, 255, 255, 0.18)' : 'primary.light',
                      backgroundColor: loading ? 'inherit' : 'rgba(99, 102, 241, 0.04)',
                    },
                  }}
                >
                  <input {...getInputProps()} disabled={loading} />
                  <CloudUploadRounded sx={{ fontSize: 44, color: isDragActive ? 'primary.main' : 'text.secondary', mb: 1 }} />
                  <Typography variant="subtitle2" fontWeight={600}>
                    {isDragActive ? 'Drop images here' : 'Click or Drag & Drop multiple posters'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                    Supports JPG, PNG, WebP up to 10MB each. You can select multiple files at once.
                  </Typography>
                </Box>

                {fileRejections.length > 0 && (
                  <Typography variant="caption" color="error.main" sx={{ mb: 1.5, display: 'block' }}>
                    {fileRejections.length} file(s) rejected. Max file size is 10MB (JPEG, PNG, WebP only).
                  </Typography>
                )}

                {/* Selected Files Preview List */}
                {filePreviews.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary">
                        SELECTED FILES ({filePreviews.length})
                      </Typography>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          filePreviews.forEach((item) => URL.revokeObjectURL(item.previewUrl));
                          setSelectedFiles([]);
                          setFilePreviews([]);
                        }}
                        disabled={loading}
                        sx={{ fontSize: '0.72rem', py: 0 }}
                      >
                        Clear All
                      </Button>
                    </Box>

                    <Box
                      sx={{
                        maxHeight: 240,
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 1,
                        pr: 0.5,
                      }}
                    >
                      {filePreviews.map((item, idx) => (
                        <Paper
                          key={idx}
                          sx={{
                            p: 1,
                            px: 1.5,
                            bgcolor: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                            <Box
                              component="img"
                              src={item.previewUrl}
                              alt={item.name}
                              sx={{
                                width: 38,
                                height: 38,
                                borderRadius: 1.5,
                                objectFit: 'cover',
                                bgcolor: '#000',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                              }}
                            />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 220 }}>
                                {item.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatFileSize(item.size)}
                              </Typography>
                            </Box>
                          </Box>

                          <Tooltip title="Remove file">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemoveFile(idx)}
                              disabled={loading}
                              sx={{ opacity: 0.8, '&:hover': { opacity: 1 } }}
                            >
                              <DeleteOutlineRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Paper>
                      ))}
                    </Box>
                  </Box>
                )}
              </Grid>

              {/* Right Column: Batch Metadata Settings */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AutoAwesomeRounded fontSize="small" color="secondary" />
                  Common Poster Metadata
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                  <TextField
                    label="Base Title / Title Prefix (Optional)"
                    fullWidth
                    value={titlePrefix}
                    onChange={(e) => setTitlePrefix(e.target.value)}
                    placeholder="e.g. Diwali Mega Banner"
                    helperText="If provided, posters are named 'Title 1', 'Title 2', etc. Otherwise filenames are used."
                    disabled={loading}
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
                        disabled={loading}
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
                        disabled={loading}
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
                          disabled={loading}
                          control={<Radio size="small" />}
                          label={<Typography variant="body2">{ratio}</Typography>}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>

                  <TagInput
                    value={tags}
                    onChange={setTags}
                    label="Common Search Tags & Keywords"
                    placeholder="Type tag and press Enter"
                    disabled={loading}
                  />

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', pt: 0.5 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={isTrending}
                          onChange={(e) => setIsTrending(e.target.checked)}
                          color="secondary"
                          disabled={loading}
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
                          disabled={loading}
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
                          disabled={loading}
                        />
                      }
                      label={<Typography variant="body2" fontWeight={600}>Active Status</Typography>}
                    />
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}

          {/* Upload Progress Bar */}
          {loading && (
            <Box sx={{ mt: 1, p: 2, bgcolor: 'rgba(99, 102, 241, 0.08)', borderRadius: 2.5, border: '1px solid rgba(99, 102, 241, 0.2)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700} color="primary.light">
                  Uploading and processing {selectedFiles.length} posters...
                </Typography>
                <Typography variant="body2" fontWeight={700} color="primary.light">
                  {uploadProgress}%
                </Typography>
              </Box>
              <LinearProgress
                variant={uploadProgress > 0 && uploadProgress < 100 ? 'determinate' : 'indeterminate'}
                value={uploadProgress}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Sharp image pipeline is optimizing each poster to WebP format and generating high-quality thumbnails.
              </Typography>
            </Box>
          )}
        </DialogContent>

        {/* Dialog Actions */}
        <DialogActions sx={{ px: 3, pb: 3, pt: 1.5, gap: 1, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {results ? (
            <>
              <Button
                variant="outlined"
                color="inherit"
                onClick={resetForm}
                startIcon={<RestartAltRounded />}
              >
                Upload More Posters
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleClose}
              >
                Done & View Posters
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleClose}
                variant="outlined"
                color="inherit"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || selectedFiles.length === 0}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LayersRounded />}
              >
                {loading
                  ? `Processing (${selectedFiles.length})...`
                  : `Upload ${selectedFiles.length > 0 ? selectedFiles.length : ''} Poster${selectedFiles.length !== 1 ? 's' : ''}`}
              </Button>
            </>
          )}
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MultiPosterFormModal;

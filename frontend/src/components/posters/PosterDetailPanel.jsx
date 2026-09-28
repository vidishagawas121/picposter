import React from 'react';
import { formatDate, formatNumber } from '../../utils/formatters';
import StatusBadge from '../common/StatusBadge';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Chip,
  Button,
  Grid,
} from '@mui/material';
import {
  CloseRounded,
  EditRounded,
  DownloadRounded,
  ShareRounded,
  VisibilityRounded,
  StarRounded,
  WhatshotRounded,
} from '@mui/icons-material';

export const PosterDetailPanel = ({ open, poster, onClose, onEdit }) => {
  if (!poster) return null;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 480 },
          backgroundColor: '#0f172a',
          borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
          p: 3,
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>
          Poster Details
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseRounded />
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)', mb: 3 }} />

      {/* Image Preview */}
      <Box
        sx={{
          width: '100%',
          maxHeight: 320,
          borderRadius: 3,
          overflow: 'hidden',
          bgcolor: '#000000',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={poster.imageUrl || poster.thumbnailUrl}
          alt={poster.title}
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </Box>

      {/* Poster Metadata */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {poster.title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <StatusBadge active={poster.isActive} />
            {poster.isTrending && (
              <Chip
                icon={<WhatshotRounded sx={{ fontSize: '14px !important' }} />}
                label="Trending"
                size="small"
                color="secondary"
                sx={{ height: 24, fontWeight: 700 }}
              />
            )}
            {poster.isPremium && (
              <Chip
                icon={<StarRounded sx={{ fontSize: '14px !important' }} />}
                label="Premium"
                size="small"
                color="warning"
                sx={{ height: 24, fontWeight: 700 }}
              />
            )}
            <Chip
              label={poster.aspectRatio || '1:1'}
              size="small"
              variant="outlined"
              sx={{ height: 24 }}
            />
          </Box>
        </Box>

        {/* Metrics summary */}
        <Grid container spacing={2} sx={{ my: 0.5 }}>
          <Grid item xs={4}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', textAlign: 'center' }}>
              <DownloadRounded sx={{ color: 'success.light', fontSize: 20 }} />
              <Typography variant="h6" fontWeight={700}>
                {formatNumber(poster.downloadsCount)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Downloads
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', textAlign: 'center' }}>
              <ShareRounded sx={{ color: 'info.light', fontSize: 20 }} />
              <Typography variant="h6" fontWeight={700}>
                {formatNumber(poster.sharesCount)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Shares
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={4}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.03)', textAlign: 'center' }}>
              <VisibilityRounded sx={{ color: 'primary.light', fontSize: 20 }} />
              <Typography variant="h6" fontWeight={700}>
                {formatNumber(poster.viewsCount)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Views
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Category:</strong> {poster.category || poster.categoryId?.name || '-'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Language:</strong> {poster.language || 'English'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Created:</strong> {formatDate(poster.createdAt)}
          </Typography>
        </Box>

        {/* Tags */}
        {poster.tags && poster.tags.length > 0 && (
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 0.5 }}>
              Tags & Keywords
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {poster.tags.map((t) => (
                <Chip key={t} label={t} size="small" variant="outlined" />
              ))}
            </Box>
          </Box>
        )}

        <Box sx={{ mt: 3 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={<EditRounded />}
            onClick={() => {
              onClose();
              onEdit(poster);
            }}
          >
            Edit Poster Metadata
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
};

export default PosterDetailPanel;

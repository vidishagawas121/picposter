import React, { useState } from 'react';
import { supportApi } from '../../api/supportApi';
import { formatDateTime } from '../../utils/formatters';
import { SUPPORT_STATUSES } from '../../utils/constants';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  MenuItem,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { HeadsetMicRounded, ArrowForwardRounded } from '@mui/icons-material';

export const SupportDetailModal = ({ open, query, onClose, onSuccess }) => {
  if (!query) return null;

  const [status, setStatus] = useState(query.status ? query.status.toUpperCase() : 'PENDING');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateStatus = async () => {
    try {
      setLoading(true);
      setError('');
      await supportApi.updateSupportStatus(query._id || query.id, status);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to update support status:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update query status');
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
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: '10px',
            bgcolor: 'rgba(245, 158, 11, 0.15)',
            color: 'warning.main',
          }}
        >
          <HeadsetMicRounded fontSize="small" />
        </Box>
        <Typography variant="h6" fontWeight={700}>
          Support Query Details
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Submitted By
            </Typography>
            <Typography variant="subtitle1" fontWeight={700}>
              {query.name}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">
              Contact Info
            </Typography>
            <Typography variant="body2" fontWeight={600} fontFamily="monospace">
              {query.contact}
            </Typography>
          </Box>
        </Box>

        <Typography variant="caption" color="text.secondary">
          Submitted On: {formatDateTime(query.createdAt)}
        </Typography>

        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" gutterBottom>
            User Inquiry Message:
          </Typography>
          <Box
            sx={{
              p: 2,
              borderRadius: 2.5,
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              fontFamily: 'inherit',
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
            }}
          >
            <Typography variant="body2">{query.query}</Typography>
          </Box>
        </Box>

        <Box sx={{ mt: 1 }}>
          <TextField
            select
            fullWidth
            label="Workflow Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            helperText="Transition ticket status through resolution"
          >
            {SUPPORT_STATUSES.map((s) => (
              <MenuItem key={s.value} value={s.value}>
                {s.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit" disabled={loading}>
          Close
        </Button>
        <Button
          onClick={handleUpdateStatus}
          variant="contained"
          color="primary"
          disabled={loading}
          endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardRounded />}
        >
          {loading ? 'Updating...' : 'Update Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SupportDetailModal;

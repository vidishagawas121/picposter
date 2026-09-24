import React from 'react';
import { Chip } from '@mui/material';

export const StatusBadge = ({ active, label, variant = 'filled', size = 'small' }) => {
  const isPositive = active !== undefined ? active : label === 'Active' || label === 'RESOLVED' || label === 'admin';

  let color = 'default';
  let displayLabel = label;

  if (active !== undefined) {
    color = active ? 'success' : 'error';
    displayLabel = active ? 'Active' : 'Inactive';
  } else if (label) {
    const upper = label.toUpperCase();
    if (upper === 'PENDING') color = 'warning';
    else if (upper === 'IN_PROGRESS') color = 'info';
    else if (upper === 'RESOLVED') color = 'success';
    else if (upper === 'CLOSED') color = 'default';
    else if (upper === 'ADMIN') color = 'primary';
    else if (upper === 'USER') color = 'default';
  }

  return (
    <Chip
      label={displayLabel}
      color={color}
      variant={variant}
      size={size}
      sx={{
        fontWeight: 700,
        fontSize: '0.72rem',
        borderRadius: '8px',
        px: 0.5,
        height: 24,
      }}
    />
  );
};

export default StatusBadge;

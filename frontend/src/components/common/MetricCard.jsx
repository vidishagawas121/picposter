import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export const MetricCard = ({ title, value, icon: IconComponent, color = '#6366f1', subtitle }) => {
  return (
    <Card
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: `0 12px 24px -6px ${color}25`,
        },
      }}
    >
      {/* Background glow accent */}
      <Box
        sx={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 90,
          height: 90,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color}33 0%, transparent 70%)`,
          pointerEvents: 'none',
        }}
      />

      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            {title}
          </Typography>
          {IconComponent && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 42,
                height: 42,
                borderRadius: '12px',
                backgroundColor: `${color}18`,
                color: color,
              }}
            >
              <IconComponent sx={{ fontSize: 22 }} />
            </Box>
          )}
        </Box>

        <Typography variant="h4" fontWeight={800} sx={{ color: '#ffffff', mb: 0.5 }}>
          {value}
        </Typography>

        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default MetricCard;

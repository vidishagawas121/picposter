import React, { useState } from 'react';
import { Box, TextField, Chip } from '@mui/material';

export const TagInput = ({ value = [], onChange, label = 'Tags', placeholder = 'Add tag and press Enter' }) => {
  const [inputValue, setInputValue] = useState('');

  const tags = Array.isArray(value) ? value : [];

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const trimmed = inputValue.trim().toLowerCase();
      if (trimmed && !tags.includes(trimmed)) {
        onChange([...tags, trimmed]);
      }
      setInputValue('');
    }
  };

  const handleDelete = (tagToDelete) => {
    onChange(tags.filter((t) => t !== tagToDelete));
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <TextField
        label={label}
        size="small"
        fullWidth
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      {tags.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              size="small"
              onDelete={() => handleDelete(tag)}
              sx={{
                bgcolor: 'rgba(99, 102, 241, 0.15)',
                color: 'primary.light',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                fontWeight: 600,
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default TagInput;

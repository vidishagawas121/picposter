import React, { useState, useEffect } from 'react';
import { TextField, InputAdornment, IconButton } from '@mui/material';
import { SearchRounded, ClearRounded } from '@mui/icons-material';

export const SearchBar = ({
  value = '',
  onChange,
  placeholder = 'Search...',
  delay = 300,
  sx = {},
}) => {
  const [innerValue, setInnerValue] = useState(value);

  useEffect(() => {
    setInnerValue(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onChange && innerValue !== value) {
        onChange(innerValue);
      }
    }, delay);
    return () => clearTimeout(timer);
  }, [innerValue, delay, onChange, value]);

  return (
    <TextField
      size="small"
      value={innerValue}
      onChange={(e) => setInnerValue(e.target.value)}
      placeholder={placeholder}
      sx={{
        minWidth: 240,
        ...sx,
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchRounded sx={{ color: 'text.secondary', fontSize: 20 }} />
          </InputAdornment>
        ),
        endAdornment: innerValue ? (
          <InputAdornment position="end">
            <IconButton
              size="small"
              onClick={() => {
                setInnerValue('');
                onChange('');
              }}
            >
              <ClearRounded sx={{ fontSize: 16 }} />
            </IconButton>
          </InputAdornment>
        ) : null,
      }}
    />
  );
};

export default SearchBar;

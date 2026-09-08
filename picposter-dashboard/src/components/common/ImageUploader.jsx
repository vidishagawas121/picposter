import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Button, IconButton } from '@mui/material';
import { CloudUploadRounded, DeleteOutlineRounded, ImageRounded } from '@mui/icons-material';

export const ImageUploader = ({
  value, // file object or existing URL string
  onChange,
  onRemove,
  accept = { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.svg'] },
  maxSize = 10 * 1024 * 1024,
  label = 'Upload Image',
  hint = 'Supports PNG, JPG, WebP up to 10MB',
  aspectRatio = '1/1',
}) => {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }
    if (typeof value === 'string') {
      setPreview(value);
    } else if (value instanceof File || value instanceof Blob) {
      const objectUrl = URL.createObjectURL(value);
      setPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [value]);

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        onChange(file);
      }
    },
    [onChange]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  const handleClear = (e) => {
    e.stopPropagation();
    setPreview(null);
    if (onRemove) onRemove();
    else onChange(null);
  };

  return (
    <Box>
      <Box
        {...getRootProps()}
        sx={{
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'rgba(255, 255, 255, 0.15)',
          borderRadius: 3,
          p: 2.5,
          textAlign: 'center',
          backgroundColor: isDragActive ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            borderColor: 'primary.light',
            backgroundColor: 'rgba(99, 102, 241, 0.04)',
          },
        }}
      >
        <input {...getInputProps()} />

        {preview ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1.5,
            }}
          >
            <Box
              sx={{
                position: 'relative',
                width: 140,
                height: 140,
                borderRadius: 2,
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                bgcolor: '#000000',
              }}
            >
              <img
                src={preview}
                alt="Upload preview"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
              />
              <IconButton
                size="small"
                onClick={handleClear}
                sx={{
                  position: 'absolute',
                  top: 4,
                  right: 4,
                  bgcolor: 'rgba(0, 0, 0, 0.7)',
                  color: 'error.light',
                  '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.8)', color: '#ffffff' },
                }}
              >
                <DeleteOutlineRounded fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="caption" color="text.secondary">
              Click or drag to replace image
            </Typography>
          </Box>
        ) : (
          <Box sx={{ py: 2 }}>
            <CloudUploadRounded sx={{ fontSize: 44, color: isDragActive ? 'primary.main' : 'text.secondary', mb: 1 }} />
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              {isDragActive ? 'Drop image here' : label}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {hint}
            </Typography>
          </Box>
        )}
      </Box>

      {fileRejections.length > 0 && (
        <Typography variant="caption" color="error.main" sx={{ mt: 1, display: 'block' }}>
          {fileRejections[0].errors[0]?.message || 'File rejected. Check format and size limit.'}
        </Typography>
      )}
    </Box>
  );
};

export default ImageUploader;

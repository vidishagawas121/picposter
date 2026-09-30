import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import logoImg from '../assets/logo.png';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  InputAdornment,
  IconButton,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  PersonRounded,
  LockOutlined,
  ArrowForwardRounded,
  Visibility,
  VisibilityOff,
  CheckCircleRounded,
  CancelRounded,
  ErrorOutlineRounded,
  ShieldRounded,
} from '@mui/icons-material';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { loginWithPassword } = useAuth();

  // Admin Password Login state
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Lockout / Rate limit state (Excessive failed attempts)
  const [isLockedOut, setIsLockedOut] = useState(false);

  // Forgot password dialog
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  // Validations
  const cleanIdentifier = identifier.trim();
  const isIdentifierValid = cleanIdentifier.length > 0 && cleanIdentifier.length <= 100;
  const showIdentifierError = identifierTouched && cleanIdentifier.length === 0;

  const cleanPassword = password.trim();
  const isPasswordValid = cleanPassword.length >= 8 && cleanPassword.length <= 64;
  const showPasswordError = passwordTouched && (cleanPassword.length === 0 || cleanPassword.length < 8);

  // Handle Admin Password Login Submit
  const handleAdminLogin = async (e) => {
    e?.preventDefault();
    setIdentifierTouched(true);
    setPasswordTouched(true);
    setAuthError('');
    setLoginSuccess(false);

    if (!isIdentifierValid || !isPasswordValid) {
      return;
    }

    try {
      setLoading(true);
      await loginWithPassword(cleanIdentifier, cleanPassword);
      setLoginSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      const respData = err.response?.data;
      if (err.response?.status === 429 || respData?.errorCode === 'TOO_MANY_FAILED_ATTEMPTS') {
        setIsLockedOut(true);
      } else {
        setAuthError(respData?.message || 'Invalid admin credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 15%, rgba(99, 102, 241, 0.22) 0%, #0b0f19 80%)',
        p: { xs: 2, sm: 3 },
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 440,
          p: { xs: 2.5, sm: 4 },
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(17, 24, 39, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        }}
      >
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: 0 }}>
          {/* Logo & Header */}
          <Box sx={{ textAlign: 'center' }}>
            <Box
              component="img"
              src={logoImg}
              alt="PicPoster Logo"
              sx={{
                width: 68,
                height: 68,
                borderRadius: '18px',
                objectFit: 'contain',
                boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.45)',
                mb: 1.5,
              }}
            />
            <Typography variant="h4" fontWeight={800} className="gradient-text" sx={{ letterSpacing: '-0.5px' }}>
              PicPoster
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mt: 0.5 }}>
              Owner & Admin Control Center
            </Typography>
          </Box>

          {/* Lockout Screen (Excessive Failed Attempts) */}
          {isLockedOut ? (
            <Box sx={{ textAlign: 'center', py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ef4444',
                  mb: 0.5,
                }}
              >
                <ShieldRounded sx={{ fontSize: 38 }} />
              </Box>

              <Typography variant="h5" fontWeight={700} sx={{ color: '#fff' }}>
                Too Many Attempts
              </Typography>

              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.65)', maxWidth: 320, lineHeight: 1.6 }}>
                You have made too many failed login attempts.<br />
                Please try again later.
              </Typography>

              <Button
                variant="contained"
                fullWidth
                onClick={() => {
                  setIsLockedOut(false);
                  setAuthError('');
                }}
                endIcon={<ArrowForwardRounded />}
                sx={{
                  mt: 1,
                  py: 1.4,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                }}
              >
                Back to Login
              </Button>
            </Box>
          ) : (
            <form onSubmit={handleAdminLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Username / Email Field */}
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.75, display: 'block', fontWeight: 500 }}>
                  Username / Email
                </Typography>
                <TextField
                  fullWidth
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value.slice(0, 100));
                    setIdentifierTouched(true);
                    setAuthError('');
                  }}
                  onBlur={() => setIdentifierTouched(true)}
                  placeholder="Enter your username or email"
                  inputProps={{ maxLength: 100 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderColor: showIdentifierError
                        ? '#ef4444'
                        : isIdentifierValid
                        ? '#10b981'
                        : 'rgba(255, 255, 255, 0.15)',
                      '& fieldset': {
                        borderColor: showIdentifierError
                          ? '#ef4444'
                          : isIdentifierValid
                          ? '#10b981'
                          : 'rgba(255, 255, 255, 0.15)',
                      },
                      '&:hover fieldset': {
                        borderColor: showIdentifierError
                          ? '#ef4444'
                          : isIdentifierValid
                          ? '#10b981'
                          : '#818cf8',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: showIdentifierError ? '#ef4444' : isIdentifierValid ? '#10b981' : '#818cf8',
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonRounded sx={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        {showIdentifierError && <CancelRounded sx={{ color: '#ef4444', fontSize: 20 }} />}
                        {isIdentifierValid && <CheckCircleRounded sx={{ color: '#10b981', fontSize: 20 }} />}
                      </InputAdornment>
                    ),
                  }}
                />
                {showIdentifierError && (
                  <Typography variant="caption" sx={{ color: '#ef4444', mt: 0.5, display: 'block' }}>
                    Please enter your username or email address.
                  </Typography>
                )}
              </Box>

              {/* Password Field */}
              <Box>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.75, display: 'block', fontWeight: 500 }}>
                  Password
                </Typography>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value.slice(0, 64));
                    setPasswordTouched(true);
                    setAuthError('');
                  }}
                  onBlur={() => setPasswordTouched(true)}
                  placeholder="Enter your password"
                  inputProps={{ maxLength: 64 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderColor: showPasswordError
                        ? '#ef4444'
                        : isPasswordValid
                        ? '#10b981'
                        : 'rgba(255, 255, 255, 0.15)',
                      '& fieldset': {
                        borderColor: showPasswordError
                          ? '#ef4444'
                          : isPasswordValid
                          ? '#10b981'
                          : 'rgba(255, 255, 255, 0.15)',
                      },
                      '&:hover fieldset': {
                        borderColor: showPasswordError
                          ? '#ef4444'
                          : isPasswordValid
                          ? '#10b981'
                          : '#818cf8',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: showPasswordError ? '#ef4444' : isPasswordValid ? '#10b981' : '#818cf8',
                      },
                    },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined sx={{ color: 'rgba(255, 255, 255, 0.45)', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        {showPasswordError && <CancelRounded sx={{ color: '#ef4444', fontSize: 20, mr: 0.5 }} />}
                        {isPasswordValid && <CheckCircleRounded sx={{ color: '#10b981', fontSize: 20, mr: 0.5 }} />}
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          size="small"
                          sx={{ color: 'rgba(255, 255, 255, 0.5)' }}
                        >
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                {showPasswordError && (
                  <Typography variant="caption" sx={{ color: '#ef4444', mt: 0.5, display: 'block' }}>
                    Password must be at least 8 characters.
                  </Typography>
                )}
              </Box>

              {/* Remember Me & Forgot Password Row */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      sx={{
                        color: 'rgba(255, 255, 255, 0.4)',
                        '&.Mui-checked': { color: '#818cf8' },
                      }}
                    />
                  }
                  label={
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.75)', userSelect: 'none' }}>
                      Remember me
                    </Typography>
                  }
                />
                <Button
                  variant="text"
                  size="small"
                  onClick={() => setForgotPasswordOpen(true)}
                  sx={{
                    textTransform: 'none',
                    color: '#818cf8',
                    fontSize: '0.8rem',
                    p: 0,
                    '&:hover': { background: 'transparent', textDecoration: 'underline' },
                  }}
                >
                  Forgot password?
                </Button>
              </Box>

              {/* Wrong Credentials Banner */}
              {authError && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    p: 1.75,
                    borderRadius: '12px',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ef4444',
                      flexShrink: 0,
                    }}
                  >
                    <ErrorOutlineRounded sx={{ fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#fff' }}>
                      {authError}.
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Please check your username/email and password.
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Successful Login Banner */}
              {loginSuccess && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.75,
                    borderRadius: '12px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                  }}
                >
                  <CheckCircleRounded sx={{ color: '#10b981', fontSize: 24 }} />
                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#fff' }}>
                      Login successful!
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                      Redirecting to Admin Dashboard...
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Sign In Button */}
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading || loginSuccess}
                endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardRounded />}
                sx={{
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: '0.98rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  boxShadow: '0 8px 20px -4px rgba(99, 102, 241, 0.5)',
                  textTransform: 'none',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
                  },
                }}
              >
                {loading ? 'Authenticating...' : 'Sign In as Admin'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Forgot Password Modal */}
      <Dialog
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
        PaperProps={{
          sx: {
            backgroundColor: '#111827',
            color: '#fff',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            p: 1,
            maxWidth: 420,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <LockOutlined sx={{ color: '#818cf8' }} />
          Admin Credentials Reset
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', lineHeight: 1.6 }}>
            For enterprise security, PicPoster Owner/Admin password credentials cannot be reset publicly.
            Please consult your backend environment configuration or platform system administrator to manage admin access.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setForgotPasswordOpen(false)}
            variant="contained"
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            }}
          >
            Understood
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoginPage;

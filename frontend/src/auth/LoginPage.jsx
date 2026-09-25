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
  Alert,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Chip,
} from '@mui/material';
import {
  PersonRounded,
  LockOutlined,
  PhoneIphoneRounded,
  ArrowForwardRounded,
  Visibility,
  VisibilityOff,
  LoginRounded,
} from '@mui/icons-material';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { loginWithPassword, sendOtp, loginWithOtp } = useAuth();

  // Tab mode: 0 = Password Login, 1 = Mobile OTP
  const [tabIndex, setTabIndex] = useState(0);

  // Password Login state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Mobile OTP state
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpStep, setOtpStep] = useState(1); // 1: Enter Mobile, 2: Enter OTP
  const [devOtpHint, setDevOtpHint] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle Username & Password Login
  const handlePasswordLogin = async (e) => {
    e?.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both username and password.');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await loginWithPassword(username.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Send OTP
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!mobile || !mobile.startsWith('+')) {
      setError('Please provide a valid E.164 mobile number with country code (e.g. +919876543210)');
      return;
    }

    try {
      setError('');
      setLoading(true);
      const res = await sendOtp(mobile);
      if (res.data?.devOtp) {
        setDevOtpHint(res.data.devOtp);
        setOtp(res.data.devOtp);
      }
      setOtpStep(2);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // Handle Verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter a 6-digit verification code');
      return;
    }

    try {
      setError('');
      setLoading(true);
      await loginWithOtp(mobile, otp);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to verify OTP');
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
        background: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.18) 0%, #0b0f19 75%)',
        p: 2,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 460,
          p: { xs: 2, sm: 3.5 },
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
        }}
      >
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: 0 }}>
          {/* Logo & Header */}
          <Box sx={{ textAlign: 'center', mb: 0.5 }}>
            <Box
              component="img"
              src={logoImg}
              alt="PicPoster Logo"
              sx={{
                width: 68,
                height: 68,
                borderRadius: '16px',
                objectFit: 'contain',
                boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.4)',
                mb: 1.5,
              }}
            />
            <Typography variant="h4" fontWeight={800} className="gradient-text">
              PicPoster
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Owner & Admin Control Center
            </Typography>
          </Box>

          {/* Login Type Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
            <Tabs
              value={tabIndex}
              onChange={(e, val) => {
                setTabIndex(val);
                setError('');
              }}
              variant="fullWidth"
              textColor="primary"
              indicatorColor="primary"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  py: 1.2,
                },
              }}
            >
              <Tab icon={<LockOutlined sx={{ fontSize: 18 }} />} iconPosition="start" label="Password Login" />
              <Tab icon={<PhoneIphoneRounded sx={{ fontSize: 18 }} />} iconPosition="start" label="Mobile OTP" />
            </Tabs>
          </Box>

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* TAB 0: Username & Password Login */}
          {tabIndex === 0 && (
            <form onSubmit={handlePasswordLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <TextField
                label="Username / Email"
                fullWidth
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username or email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonRounded sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Password"
                fullWidth
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size="small"
                        sx={{ color: 'text.secondary' }}
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginRounded />}
                sx={{
                  py: 1.5,
                  fontWeight: 700,
                  fontSize: '1rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  boxShadow: '0 8px 20px -4px rgba(99, 102, 241, 0.5)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #4f46e5 0%, #9333ea 100%)',
                  },
                }}
              >
                {loading ? 'Authenticating...' : 'Sign In as Admin'}
              </Button>
            </form>
          )}

          {/* TAB 1: Mobile OTP Login */}
          {tabIndex === 1 && (
            <>
              {otpStep === 1 ? (
                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <TextField
                    label="Admin Mobile Number"
                    fullWidth
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91XXXXXXXXXX"
                    helperText="Includes country code (E.164 format)"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIphoneRounded sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading}
                    endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForwardRounded />}
                    sx={{ py: 1.5, borderRadius: '12px' }}
                  >
                    {loading ? 'Sending OTP...' : 'Send Verification Code'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary">
                      OTP sent to <strong>{mobile}</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Button size="small" onClick={handleSendOtp} disabled={loading} sx={{ color: 'primary.light' }}>
                        Resend
                      </Button>
                      <Button size="small" onClick={() => setOtpStep(1)} sx={{ color: 'text.secondary' }}>
                        Change
                      </Button>
                    </Box>
                  </Box>

                  {devOtpHint && (
                    <Chip
                      label={`Dev OTP Code: ${devOtpHint} (Click to fill)`}
                      color="info"
                      variant="outlined"
                      size="small"
                      onClick={() => setOtp(devOtpHint)}
                      sx={{ alignSelf: 'flex-start', cursor: 'pointer' }}
                    />
                  )}

                  <TextField
                    label="6-Digit Verification Code"
                    fullWidth
                    autoFocus
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    inputProps={{ maxLength: 6 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading}
                    endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <ArrowForwardRounded />}
                    sx={{ py: 1.5, borderRadius: '12px' }}
                  >
                    {loading ? 'Verifying...' : 'Log In to Dashboard'}
                  </Button>
                </form>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;

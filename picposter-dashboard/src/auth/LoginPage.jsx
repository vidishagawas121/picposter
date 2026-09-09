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
  Chip,
} from '@mui/material';
import {
  PhoneIphoneRounded,
  LockOutlined,
  ArrowForwardRounded,
} from '@mui/icons-material';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { sendOtp, loginWithOtp } = useAuth();

  const [mobile, setMobile] = useState('+919876543210');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1: Enter Mobile, 2: Enter OTP
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devOtpHint, setDevOtpHint] = useState('');

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
        setOtp(res.data.devOtp); // Auto-fill for convenience during review
      }
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

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
        background: 'radial-gradient(circle at 50% 20%, rgba(99, 102, 241, 0.15) 0%, #0b0f19 70%)',
        p: 2,
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 440,
          p: { xs: 2, sm: 3 },
          backdropFilter: 'blur(20px)',
          backgroundColor: 'rgba(17, 24, 39, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
      >
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <Box sx={{ textAlign: 'center', mb: 1 }}>
            <Box
              component="img"
              src={logoImg}
              alt="PicPoster Logo"
              sx={{
                width: 68,
                height: 68,
                borderRadius: '16px',
                objectFit: 'contain',
                boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.4)',
                mb: 2,
              }}
            />
            <Typography variant="h4" fontWeight={800} className="gradient-text">
              PicPoster
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Owner & Admin Control Center
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {step === 1 ? (
            <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <TextField
                label="Admin Mobile Number"
                fullWidth
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+919876543210"
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
                sx={{ py: 1.5 }}
              >
                {loading ? 'Sending OTP...' : 'Send Verification Code'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  OTP sent to <strong>{mobile}</strong>
                </Typography>
                <Button size="small" onClick={() => setStep(1)} sx={{ color: 'primary.light' }}>
                  Change
                </Button>
              </Box>

              {devOtpHint && (
                <Chip
                  label={`Dev OTP Code: ${devOtpHint}`}
                  color="info"
                  variant="outlined"
                  size="small"
                  sx={{ alignSelf: 'flex-start' }}
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
                sx={{ py: 1.5 }}
              >
                {loading ? 'Verifying...' : 'Log In to Dashboard'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginPage;

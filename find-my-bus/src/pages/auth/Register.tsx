import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Client-side validations
    if (!name || !email || !password || !confirmPassword) {
      setFormError('All fields are required.');
      return;
    }

    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setFormError('Password must contain at least one letter and one number.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ name, email, password, confirmPassword });
      // Redirect to OTP verification page and pass the email in location state
      navigate('/verify-otp', { state: { email } });
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || err.response?.data?.error?.reason;
      setFormError(serverMessage || 'Registration failed. Please check your credentials and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 450, width: '100%', border: 'none', boxShadow: 24 }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo & Header */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                bgcolor: 'secondary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                boxShadow: '0 4px 10px rgba(245, 158, 11, 0.4)',
              }}
            >
              <DirectionsBusIcon sx={{ color: 'secondary.contrastText', fontSize: 32 }} />
            </Box>
            <Typography variant="h5" align="center" sx={{ fontWeight: 700, letterSpacing: -0.5 }}>
              FindMyBus
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 0.5 }}>
              Register your school and streamline bus tracking.
            </Typography>
          </Box>

          {formError && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
              {formError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="School Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
                autoComplete="organization"
              />

              <TextField
                label="School Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
                autoComplete="email"
              />

              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting}
                autoComplete="new-password"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          disabled={isSubmitting}
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
                autoComplete="new-password"
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={isSubmitting}
                sx={{ mt: 1, py: 1.5 }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Register School'
                )}
              </Button>
            </Box>
          </form>

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Already have a school account?{' '}
              <Link component={RouterLink} to="/login" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Log In
              </Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;

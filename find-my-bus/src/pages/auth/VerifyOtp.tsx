import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import EmailIcon from '@mui/icons-material/Email';

const VerifyOtp = () => {
  const { verify, resend } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Read email from state (passed from Register page)
  const initialEmail = location.state?.email || '';
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0); // Countdown in seconds

  const inputRefs = useRef<HTMLInputElement[]>([]);

  // Start countdown on cooldown update
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const handleInputChange = (index: number, value: string) => {
    // Only accept numeric digits
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    // Keep only the last character if pasted/multi-typed
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input field
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Backspace: clear current field, focus previous field
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').trim();
    if (!/^\d{6}$/.test(pasteData)) return; // verify exactly 6 digits

    const digits = pasteData.split('');
    setOtp(digits);
    // Focus last field
    inputRefs.current[5]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    if (!email) {
      setErrorMsg('Please enter a valid school email.');
      return;
    }

    setIsVerifying(true);
    try {
      await verify({ email, otp: otpCode });
      // Redirect to home dashboard
      navigate('/', { replace: true });
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || err.response?.data?.error?.reason;
      setErrorMsg(serverMessage || 'Verification failed. Please check the code and try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setErrorMsg('');
    setSuccessMsg('');

    if (!email) {
      setErrorMsg('Please enter your school email to resend OTP.');
      return;
    }

    setIsResending(true);
    try {
      await resend(email);
      setSuccessMsg('A new verification code has been sent to your email.');
      setCooldown(60); // 60s cooldown limit
      // Clear otp fields
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      const serverMessage = err.response?.data?.message || err.response?.data?.error?.reason;
      setErrorMsg(serverMessage || 'Failed to resend verification code. Please try again.');
    } finally {
      setIsResending(false);
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
          {/* Icon Header */}
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
              <EmailIcon sx={{ color: 'secondary.contrastText', fontSize: 32 }} />
            </Box>
            <Typography variant="h5" align="center" sx={{ fontWeight: 700, letterSpacing: -0.5 }}>
              Verify Your Email
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 0.5 }}>
              We sent a 6-digit verification code to
            </Typography>
            {email ? (
              <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 600, mt: 0.5 }}>
                {email}
              </Typography>
            ) : (
              <TextField
                size="small"
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mt: 2, maxWidth: 300 }}
                placeholder="Enter email"
              />
            )}
          </Box>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
              {errorMsg}
            </Alert>
          )}

          {successMsg && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: '8px' }}>
              {successMsg}
            </Alert>
          )}

          <form onSubmit={handleVerify}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Split OTP Fields */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5 }} onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <TextField
                    key={index}
                    inputRef={(el) => (inputRefs.current[index] = el)}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e as React.KeyboardEvent<HTMLInputElement>)}
                    slotProps={{
                      htmlInput: {
                        maxLength: 1,
                        style: {
                          textAlign: 'center',
                          fontSize: '22px',
                          fontWeight: 'bold',
                          padding: '12px 8px',
                        },
                        inputMode: 'numeric',
                      },
                    }}
                    disabled={isVerifying}
                    variant="outlined"
                  />
                ))}
              </Box>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={isVerifying}
                sx={{ py: 1.5 }}
              >
                {isVerifying ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Verify Email'
                )}
              </Button>
            </Box>
          </form>

          {/* Resend Control */}
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Didn't receive the code?
            </Typography>
            <Button
              onClick={handleResend}
              disabled={isResending || cooldown > 0}
              variant="text"
              color="primary"
              sx={{ mt: 1, fontWeight: 600 }}
            >
              {isResending ? (
                <CircularProgress size={16} />
              ) : cooldown > 0 ? (
                `Resend OTP in ${cooldown}s`
              ) : (
                'Resend OTP'
              )}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VerifyOtp;

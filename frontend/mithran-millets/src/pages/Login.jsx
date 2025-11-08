import React, { useEffect, useState, useRef } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  Checkbox,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';
import { motion } from 'framer-motion';

/**
 * Login.jsx
 *
 * - Hides navbar while mounted by adding body.no-navbar
 * - Persists token to localStorage (signal for Navbar) and sessionStorage optionally
 * - Dispatches authChanged so Navbar swaps buttons immediately
 * - Replaces history entry and locks history to prevent back navigation to login
 */

function lockHistoryToCurrent() {
  // push a state so there is a stable state to re-push on pop
  window.history.pushState(null, '', window.location.href);
  const onPopState = () => {
    // cancel back by pushing state again
    window.history.pushState(null, '', window.location.href);
  };
  window.addEventListener('popstate', onPopState);
  return () => window.removeEventListener('popstate', onPopState);
}

const Login = () => {
  const [form, setForm] = useState({ username: '', password: '', remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const usernameRef = useRef(null);
  const cleanupRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('no-navbar');
    usernameRef.current?.focus();
    return () => {
      document.body.classList.remove('no-navbar');
      // cleanup popstate listener if still active
      if (cleanupRef.current) cleanupRef.current();
    };
  }, []);

  const validate = () => {
    if (!form.username || form.username.trim().length < 3) {
      toast.info('Please enter a valid username (at least 3 characters)');
      return false;
    }
    if (!form.password || form.password.length < 6) {
      toast.info('Password must be at least 6 characters');
      return false;
    }
    return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        username: form.username.trim(),
        password: form.password,
      });

      const token = res.data?.token;
      if (!token) throw new Error('No token returned from server');

      // decode role if available
      let role = 'USER';
      try {
        const decoded = jwtDecode(token);
        role = decoded?.role ?? decoded?.roles ?? role;
      } catch {
        role = res.data?.role ?? role;
      }

      // Always write token to localStorage so Navbar detects login immediately.
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);

      // If remember === false keep a copy in sessionStorage for semantics (optional)
      if (!form.remember) {
        sessionStorage.setItem('token', token);
      } else {
        sessionStorage.removeItem('token');
      }

      // notify other parts of the app so Navbar updates
      window.dispatchEvent(new Event('authChanged'));

      // navigate with replace so login page is removed from history
      const target = role === 'ADMIN' ? '/admin/dashboard' : '/';
      navigate(target, { replace: true });

      // lock history to prevent back navigation to auth page
      cleanupRef.current = lockHistoryToCurrent();

      toast.success('Login successful!');
    } catch (err) {
      console.error('Login error:', err?.response?.data || err.message);
      const msg = err?.response?.data?.message || err?.message || 'Invalid credentials';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1b4332 0%, #2d6a4f 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 480 }}
      >
        <Paper
          elevation={8}
          sx={{
            p: { xs: 4, md: 6 },
            borderRadius: 3,
            mx: 'auto',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03))',
            backdropFilter: 'blur(6px)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            color: '#fefae0',
          }}
        >
          <Typography
            variant="h4"
            align="center"
            gutterBottom
            sx={{ color: '#fefae0', fontFamily: 'Georgia, serif', fontWeight: 800 }}
          >
            Welcome back
          </Typography>

          <Typography variant="body2" align="center" sx={{ color: 'rgba(254,250,224,0.85)', mb: 3 }}>
            Sign in to continue to Mithran Millets
          </Typography>

          <Stack spacing={2}>
            <TextField
              inputRef={usernameRef}
              label="Username"
              fullWidth
              variant="filled"
              size="small"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              onKeyDown={handleKeyDown}
              InputLabelProps={{ style: { color: 'rgba(254,250,224,0.9)' } }}
              InputProps={{ sx: { background: 'rgba(255,255,255,0.04)', color: '#fefae0' } }}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              fullWidth
              variant="filled"
              size="small"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onKeyDown={handleKeyDown}
              InputLabelProps={{ style: { color: 'rgba(254,250,224,0.9)' } }}
              InputProps={{
                sx: { background: 'rgba(255,255,255,0.04)', color: '#fefae0' },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      onClick={() => setShowPassword((s) => !s)}
                      edge="end"
                      sx={{ color: '#fefae0' }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={form.remember}
                    onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                    sx={{ color: '#fefae0' }}
                  />
                }
                label={<Typography sx={{ color: '#fefae0' }}>Remember me</Typography>}
              />

              <Button variant="text" size="small" onClick={() => navigate('/forgot-password')} sx={{ color: '#fefae0', textTransform: 'none' }}>
                Forgot password?
              </Button>
            </Box>

            <Button
              variant="contained"
              fullWidth
              disabled={loading}
              onClick={handleLogin}
              sx={{
                mt: 1,
                py: 1.25,
                fontSize: '1rem',
                backgroundColor: '#d4a373',
                color: '#1b4332',
                fontWeight: 700,
                borderRadius: '28px',
                '&:hover': { backgroundColor: '#e9c46a' },
              }}
            >
              {loading ? <CircularProgress size={22} sx={{ color: '#1b4332' }} /> : 'Sign in'}
            </Button>

            <Typography align="center" sx={{ color: 'rgba(254,250,224,0.85)' }}>
              Don’t have an account?{' '}
              <Button variant="text" onClick={() => navigate('/signup')} sx={{ color: '#e9c46a', textTransform: 'none' }}>
                Sign up
              </Button>
            </Typography>
          </Stack>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default Login;

import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  TextField,
  Button,
} from '@mui/material';
import api from '../services/api';
import { toast } from 'react-toastify';

const Profile = () => {
  const [user, setUser] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    address: '',
  });

  const [editMode, setEditMode] = useState(false);
  const [editedFields, setEditedFields] = useState({});

  useEffect(() => {
    api.get('/auth/profile')
      .then(res => setUser(res.data))
      .catch(err => console.error('Failed to fetch profile:', err));
  }, []);

  const handleChange = (field, value) => {
    setEditedFields(prev => ({ ...prev, [field]: value }));
    setUser(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (Object.keys(editedFields).length === 0) {
      toast.info('No changes to update');
      return;
    }

    api.patch('/auth/profile', editedFields)
      .then(res => {
        setUser(res.data);
        setEditedFields({});
        setEditMode(false);
        toast.success('Profile updated successfully!');
      })
      .catch(() => toast.error('Failed to update profile'));
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(to right, #fefae0, #e9c46a)',
        py: 6,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 4,
            backgroundColor: '#fff8e1',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            sx={{
              fontWeight: 'bold',
              color: '#1b4332',
              textAlign: 'center',
              mb: 4,
              fontFamily: 'Georgia, serif',
            }}
          >
            👤 Your Profile
          </Typography>

          {editMode ? (
            <>
              <TextField
                fullWidth
                label="Full Name"
                sx={{ mb: 2 }}
                value={user.fullName}
                onChange={e => handleChange('fullName', e.target.value)}
              />
              <TextField
                fullWidth
                label="Email"
                sx={{ mb: 2 }}
                value={user.email}
                onChange={e => handleChange('email', e.target.value)}
              />
              <TextField
                fullWidth
                label="Phone"
                sx={{ mb: 2 }}
                value={user.phone}
                onChange={e => handleChange('phone', e.target.value)}
              />
              <TextField
                fullWidth
                label="Address"
                sx={{ mb: 2 }}
                value={user.address}
                onChange={e => handleChange('address', e.target.value)}
              />
              <Button variant="contained" sx={{ mr: 2 }} onClick={handleSave}>
                Save Changes
              </Button>
              <Button variant="outlined" onClick={() => setEditMode(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Username:</strong> {user.username || '—'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Full Name:</strong> {user.fullName || '—'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Email:</strong> {user.email || '—'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Phone:</strong> {user.phone || '—'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>Address:</strong> {user.address || '—'}
              </Typography>
              <Button variant="contained" onClick={() => setEditMode(true)}>
                Edit Profile
              </Button>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Profile;

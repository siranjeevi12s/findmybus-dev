import { useState, type FormEvent } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { registerStudent } from '../../api/studentRegistrationApi';

const SCHOOL_NAME = 'siranjeevi';
const SCHOOL_EMAIL = 'siranjeevi12s2@gmail.com';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialForm = {
  studentName: '',
  studentId: '',
  grade: '',
  section: '',
  parentName: '',
  parentEmail: '',
  parentPhone: '',
  busNumber: '',
};

const RegisterStudent = () => {
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (field: keyof typeof initialForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    if (Object.values(form).some((value) => !value.trim())) {
      setFormError('Please fill in all fields.');
      return;
    }

    if (!EMAIL_REGEX.test(form.parentEmail)) {
      setFormError('Please enter a valid parent email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registerStudent({
        ...form,
        schoolName: SCHOOL_NAME,
        schoolEmail: SCHOOL_EMAIL,
      });

      const successPageUrl = import.meta.env.VITE_SUCCESS_PAGE_URL;
      if (successPageUrl) {
        const url = new URL(successPageUrl);
        url.searchParams.set('email', form.parentEmail);
        url.searchParams.set('school', SCHOOL_NAME);
        window.location.assign(url.toString());
        return;
      }

      setSuccess(true);
      setForm(initialForm);
    } catch (error) {
      const responseMessage =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof error.response === 'object' &&
        error.response !== null &&
        'data' in error.response &&
        typeof error.response.data === 'object' &&
        error.response.data !== null &&
        'message' in error.response.data &&
        typeof error.response.data.message === 'string'
          ? error.response.data.message
          : null;
      setFormError(responseMessage || 'Could not create the student profile. Please try again.');
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
        bgcolor: '#f3f4f6',
        p: 2,
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 560, boxShadow: 8 }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Typography variant="overline" color="primary" sx={{ fontWeight: 700 }}>
            Registered school: {SCHOOL_NAME}
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }} gutterBottom>
            Register Student
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Fill in the details to create a student profile.
          </Typography>

          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              Student registered successfully. The parent can now sign in.
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Student Name" value={form.studentName} onChange={(event) => updateField('studentName', event.target.value)} required fullWidth disabled={isSubmitting} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Student ID" value={form.studentId} onChange={(event) => updateField('studentId', event.target.value)} required fullWidth disabled={isSubmitting} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Grade" value={form.grade} onChange={(event) => updateField('grade', event.target.value)} required fullWidth disabled={isSubmitting} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Section" value={form.section} onChange={(event) => updateField('section', event.target.value)} required fullWidth disabled={isSubmitting} />
              </Grid>
              <Grid size={12}>
                <TextField label="Parent Name" value={form.parentName} onChange={(event) => updateField('parentName', event.target.value)} required fullWidth disabled={isSubmitting} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Parent Email" type="email" value={form.parentEmail} onChange={(event) => updateField('parentEmail', event.target.value)} required fullWidth disabled={isSubmitting} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField label="Parent Phone" type="tel" value={form.parentPhone} onChange={(event) => updateField('parentPhone', event.target.value)} required fullWidth disabled={isSubmitting} />
              </Grid>
              <Grid size={12}>
                <TextField label="Bus Number" value={form.busNumber} onChange={(event) => updateField('busNumber', event.target.value)} required fullWidth disabled={isSubmitting} helperText="Used to assign the student to a bus route." />
              </Grid>
              <Grid size={12}>
                <Button type="submit" variant="contained" size="large" fullWidth disabled={isSubmitting}>
                  {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create Student Profile'}
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
            Already have an account?{' '}
            <Link component={RouterLink} to="/login" sx={{ fontWeight: 600 }}>
              Login
            </Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default RegisterStudent;

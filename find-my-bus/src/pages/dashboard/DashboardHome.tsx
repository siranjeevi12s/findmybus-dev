import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardStats } from '../../hooks/useDashboard';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';

// Icons
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AddIcon from '@mui/icons-material/Add';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

const DashboardHome = () => {
  const { school } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useDashboardStats();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data?.success) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load dashboard statistics.
        </Alert>
        <Button variant="contained" onClick={() => refetch()}>
          Retry
        </Button>
      </Box>
    );
  }

  const stats = data.data;

  // Calculate percentage of students assigned
  const assignmentPercentage =
    stats.totalStudents > 0
      ? Math.round((stats.assignedStudents / stats.totalStudents) * 100)
      : 0;

  const statCards = [
    {
      title: 'Total Buses',
      value: stats.totalBuses,
      icon: <DirectionsBusIcon sx={{ fontSize: 40, color: 'primary.main' }} />,
      bgColor: '#eff6ff', // blue 50
    },
    {
      title: 'Total Drivers',
      value: stats.totalDrivers,
      icon: <PersonIcon sx={{ fontSize: 40, color: '#059669' }} />, // green 600
      bgColor: '#ecfdf5', // green 50
    },
    {
      title: 'Registered Students',
      value: stats.totalStudents,
      icon: <PeopleIcon sx={{ fontSize: 40, color: '#7c3aed' }} />, // purple 600
      bgColor: '#f5f3ff', // purple 50
    },
    {
      title: 'Assigned Students',
      value: `${stats.assignedStudents} / ${stats.totalStudents}`,
      icon: <AssignmentTurnedInIcon sx={{ fontSize: 40, color: 'secondary.main' }} />,
      bgColor: '#fffbeb', // amber 50
    },
  ];

  return (
    <Box>
      {/* Welcome Banner */}
      <Paper
        sx={{
          p: 4,
          mb: 4,
          background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
          borderRadius: '20px',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', color: '#ffffff' }} gutterBottom>
          Welcome back, {school?.name}!
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.8)', maxWidth: 600 }}>
          Manage your transport operations, assign drivers to vehicles, and ensure student safety with real-time analytics.
        </Typography>
      </Paper>

      {/* Stats Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '16px',
                    bgcolor: card.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600, mb: 0.5 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: '"Outfit", sans-serif' }}>
                    {card.value}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Student Assignment Progress */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', p: 1 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontFamily: '"Outfit", sans-serif' }}>
                Student Bus Allocation
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 600 }}>
                  Allocation Progress
                </Typography>
                <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700 }}>
                  {assignmentPercentage}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={assignmentPercentage}
                color={assignmentPercentage > 75 ? 'success' : assignmentPercentage > 35 ? 'warning' : 'error'}
                sx={{ height: 12, borderRadius: 6, mb: 3 }}
              />
              <Typography variant="body2" color="textSecondary">
                Currently, {stats.assignedStudents} students are mapped to active buses. Make sure all students are mapped to ensure they receive tracking updates.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Operations panel */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%', p: 1 }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, fontFamily: '"Outfit", sans-serif' }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/buses')}
                    sx={{ py: 1.5, borderRadius: '10px' }}
                  >
                    Add Vehicle
                  </Button>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/drivers')}
                    sx={{ py: 1.5, borderRadius: '10px' }}
                  >
                    Add Driver
                  </Button>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/students')}
                    sx={{ py: 1.5, borderRadius: '10px' }}
                  >
                    Add Student
                  </Button>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Button
                    variant="contained"
                    color="secondary"
                    fullWidth
                    startIcon={<SwapHorizIcon />}
                    onClick={() => navigate('/assignments')}
                    sx={{ py: 1.5, borderRadius: '10px' }}
                  >
                    Assign Driver
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardHome;

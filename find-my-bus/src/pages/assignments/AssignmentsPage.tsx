import React, { useState } from 'react';
import {
  useAssignments,
  useAssignDriver,
  useUnassignDriver,
} from '../../hooks/useAssignments';
import { useBuses } from '../../hooks/useBuses';
import { useDrivers } from '../../hooks/useDrivers';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Pagination from '@mui/material/Pagination';
import Chip from '@mui/material/Chip';

// Icons
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import LinkOffIcon from '@mui/icons-material/LinkOff';

const AssignmentsPage = () => {
  const [tabIndex, setTabIndex] = useState(0); // 0 = Active, 1 = History
  const [page, setPage] = useState(1);
  
  // Assignment Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [formError, setFormError] = useState('');
  
  // Snackbar Alert
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Fetch Assignments based on active tab
  const activeStatus = tabIndex === 0 ? 'active' : 'inactive';
  const { data, isLoading, error } = useAssignments({
    page,
    limit: 5,
    status: activeStatus,
  });

  // Fetch Buses and Drivers for select dropdowns (limit 100 to get a full list)
  const { data: busesData, isLoading: isLoadingBuses } = useBuses({ page: 1, limit: 100 });
  const { data: driversData, isLoading: isLoadingDrivers } = useDrivers({ page: 1, limit: 100 });

  // Mutations
  const assignMutation = useAssignDriver();
  const unassignMutation = useUnassignDriver();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
    setPage(1);
  };

  const handleOpenAssignDialog = () => {
    setSelectedBusId('');
    setSelectedDriverId('');
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!selectedBusId || !selectedDriverId) {
      setFormError('Please select both a bus and a driver.');
      return;
    }

    try {
      await assignMutation.mutateAsync({
        busId: selectedBusId,
        driverId: selectedDriverId,
      });
      setNotification({ open: true, message: 'Driver assigned successfully', severity: 'success' });
      handleCloseDialog();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error?.reason || 'Assignment failed';
      setFormError(msg);
    }
  };

  const handleUnassign = async (id: string) => {
    try {
      await unassignMutation.mutateAsync(id);
      setNotification({ open: true, message: 'Bus and driver pairing deactivated successfully', severity: 'success' });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Unassignment failed';
      setNotification({ open: true, message: msg, severity: 'error' });
    }
  };

  const buses = busesData?.data?.buses || [];
  const drivers = driversData?.data?.drivers || [];

  // Simple formatting helper
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
          Bus-Driver Assignments
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<SwapHorizIcon />}
          onClick={handleOpenAssignDialog}
          sx={{ borderRadius: '10px', px: 3 }}
        >
          Assign Driver
        </Button>
      </Box>

      {/* Tabs for switching between Active and History view */}
      <Paper sx={{ mb: 3, borderRadius: '12px' }}>
        <Tabs value={tabIndex} onChange={handleTabChange} indicatorColor="secondary" textColor="inherit" sx={{ px: 2 }}>
          <Tab label="Active Pairings" sx={{ fontWeight: 600, py: 2 }} />
          <Tab label="Assignment History" sx={{ fontWeight: 600, py: 2 }} />
        </Tabs>
      </Paper>

      {/* Data Table */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">Failed to fetch assignments. Please try again.</Alert>
      ) : !data?.data?.assignments || data.data.assignments.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            {tabIndex === 0 ? 'No active bus-driver pairings' : 'No assignment logs found'}
          </Typography>
          {tabIndex === 0 && (
            <Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Pair active drivers with buses to prepare transport routes.
              </Typography>
              <Button variant="outlined" color="primary" onClick={handleOpenAssignDialog}>
                Assign Your First Pair
              </Button>
            </Box>
          )}
        </Paper>
      ) : (
        <Box>
          <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Bus Info</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Driver Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Assigned At</TableCell>
                  {tabIndex === 1 && <TableCell sx={{ fontWeight: 700 }}>Unassigned At</TableCell>}
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  {tabIndex === 0 && <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.data.assignments.map((assignment: any) => {
                  const bus = assignment.busId;
                  const driver = assignment.driverId;
                  
                  // Handle potential soft-deleted referenced entities
                  const busText = bus ? `${bus.busNumber} (${bus.registrationNumber})` : 'Deactivated Bus';
                  const driverText = driver ? `${driver.firstName} ${driver.lastName}` : 'Deactivated Driver';

                  return (
                    <TableRow key={assignment._id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{busText}</TableCell>
                      <TableCell>{driverText}</TableCell>
                      <TableCell>{formatDate(assignment.assignedAt)}</TableCell>
                      {tabIndex === 1 && <TableCell>{formatDate(assignment.unassignedAt)}</TableCell>}
                      <TableCell>
                        <Chip
                          label={assignment.status === 'active' ? 'Active' : 'Inactive'}
                          color={assignment.status === 'active' ? 'success' : 'default'}
                          size="small"
                          sx={{ fontWeight: 600, borderRadius: '6px' }}
                        />
                      </TableCell>
                      {tabIndex === 0 && (
                        <TableCell align="right">
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<LinkOffIcon />}
                            onClick={() => handleUnassign(assignment._id)}
                            sx={{ borderRadius: '6px' }}
                          >
                            Unassign
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {data.data.pagination && data.data.pagination.pages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={data.data.pagination.pages}
                page={page}
                onChange={(_, val) => setPage(val)}
                color="primary"
              />
            </Box>
          )}
        </Box>
      )}

      {/* ASSIGNMENT DIALOG */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Assign Driver to Vehicle</DialogTitle>
        <form onSubmit={handleAssignSubmit}>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              Select a school bus and driver to pair. Note that assigning an already paired bus or driver will automatically deactivate their previous pairing and update the assignment history.
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                select
                label="Select Bus"
                value={selectedBusId}
                onChange={(e) => setSelectedBusId(e.target.value)}
                required
                disabled={isLoadingBuses}
                helperText={isLoadingBuses ? 'Loading buses list...' : ''}
              >
                {buses.map((bus: any) => (
                  <MenuItem key={bus._id} value={bus._id}>
                    {bus.busNumber} ({bus.registrationNumber})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Select Driver"
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                required
                disabled={isLoadingDrivers}
                helperText={isLoadingDrivers ? 'Loading drivers list...' : ''}
              >
                {drivers.map((driver: any) => (
                  <MenuItem key={driver._id} value={driver._id}>
                    {driver.firstName} {driver.lastName}
                  </MenuItem>
                ))}
              </TextField>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialog} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Assign Pair
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* SNACKBAR FEEDBACK */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%', borderRadius: '8px' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AssignmentsPage;

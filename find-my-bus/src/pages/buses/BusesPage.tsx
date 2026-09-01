import React, { useState } from 'react';
import {
  useBuses,
  useCreateBus,
  useUpdateBus,
  useDeleteBus,
} from '../../hooks/useBuses';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
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
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Pagination from '@mui/material/Pagination';
import Chip from '@mui/material/Chip';

// Icons
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';

interface BusFormState {
  busNumber: string;
  registrationNumber: string;
  busType: 'Standard' | 'Minibus' | 'Coach';
  capacity: number;
  status?: 'active' | 'inactive';
}

const initialFormState: BusFormState = {
  busNumber: '',
  registrationNumber: '',
  busType: 'Standard',
  capacity: 30,
};

const BusesPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  
  // Dialog Open/Close States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Selected Item states
  const [editingBusId, setEditingBusId] = useState<string | null>(null);
  const [deletingBusId, setDeletingBusId] = useState<string | null>(null);
  
  // Form State
  const [formState, setFormState] = useState<BusFormState>(initialFormState);
  const [formError, setFormError] = useState('');
  
  // Snackbar notification states
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Fetch queries
  const { data, isLoading, error } = useBuses({ page, limit: 5, search });
  
  // CRUD Mutations
  const createMutation = useCreateBus();
  const updateMutation = useUpdateBus();
  const deleteMutation = useDeleteBus();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleOpenCreateDialog = () => {
    setEditingBusId(null);
    setFormState(initialFormState);
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (bus: any) => {
    setEditingBusId(bus._id);
    setFormState({
      busNumber: bus.busNumber,
      registrationNumber: bus.registrationNumber,
      busType: bus.busType,
      capacity: bus.capacity,
      status: bus.status,
    });
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (id: string) => {
    setDeletingBusId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialogs = () => {
    setIsDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setEditingBusId(null);
    setDeletingBusId(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formState.busNumber || !formState.registrationNumber || !formState.capacity) {
      setFormError('All fields are required.');
      return;
    }

    if (formState.capacity < 1) {
      setFormError('Capacity must be at least 1.');
      return;
    }

    try {
      if (editingBusId) {
        // Edit flow
        await updateMutation.mutateAsync({
          id: editingBusId,
          payload: {
            ...formState,
            status: formState.status || 'active',
          },
        });
        setNotification({ open: true, message: 'Bus updated successfully', severity: 'success' });
      } else {
        // Create flow
        await createMutation.mutateAsync({
          ...formState,
          status: formState.status || 'active',
        });
        setNotification({ open: true, message: 'Bus registered successfully', severity: 'success' });
      }
      handleCloseDialogs();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error?.reason || 'Operation failed';
      setFormError(msg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingBusId) return;

    try {
      await deleteMutation.mutateAsync(deletingBusId);
      setNotification({ open: true, message: 'Bus deleted successfully', severity: 'success' });
      handleCloseDialogs();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete bus';
      setNotification({ open: true, message: msg, severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
          Manage Vehicles
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
          sx={{ borderRadius: '10px', px: 3 }}
        >
          Add Bus
        </Button>
      </Box>

      {/* Filter and Search Bar */}
      <Card sx={{ p: 2, mb: 3 }}>
        <form onSubmit={handleSearchSubmit}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              placeholder="Search by Bus Number or Registration..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              size="small"
              slotProps={{
                input: {
                  startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                },
              }}
              sx={{ flexGrow: 1 }}
            />
            <Button type="submit" variant="contained" color="primary">
              Search
            </Button>
          </Box>
        </form>
      </Card>

      {/* Data Table */}
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">Failed to fetch buses. Please try again.</Alert>
      ) : !data?.data?.buses || data.data.buses.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No vehicles registered yet
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Add school buses to populate the transport fleet database.
          </Typography>
          <Button variant="outlined" color="primary" onClick={handleOpenCreateDialog}>
            Register First Bus
          </Button>
        </Paper>
      ) : (
        <Box>
          <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Bus Number</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Registration No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Capacity</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.data.buses.map((bus: any) => (
                  <TableRow key={bus._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{bus.busNumber}</TableCell>
                    <TableCell>{bus.registrationNumber}</TableCell>
                    <TableCell>{bus.busType}</TableCell>
                    <TableCell>{bus.capacity} seats</TableCell>
                    <TableCell>
                      <Chip
                        label={bus.status === 'active' ? 'Active' : 'Inactive'}
                        color={bus.status === 'active' ? 'success' : 'default'}
                        size="small"
                        sx={{ fontWeight: 600, borderRadius: '6px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleOpenEditDialog(bus)} size="small" sx={{ mr: 1 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleOpenDeleteDialog(bus._id)} size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination Controls */}
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

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={isDialogOpen} onClose={handleCloseDialogs} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingBusId ? 'Edit Bus Properties' : 'Register New Bus'}
        </DialogTitle>
        <form onSubmit={handleFormSubmit}>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                label="Bus Number"
                placeholder="e.g. BUS-001"
                value={formState.busNumber}
                onChange={(e) => setFormState({ ...formState, busNumber: e.target.value })}
                required
              />
              <TextField
                label="Registration Number"
                placeholder="e.g. TN01AB1234"
                value={formState.registrationNumber}
                onChange={(e) => setFormState({ ...formState, registrationNumber: e.target.value })}
                required
              />
              <TextField
                select
                label="Bus Type"
                value={formState.busType}
                onChange={(e) => setFormState({ ...formState, busType: e.target.value as any })}
                required
              >
                <MenuItem value="Standard">Standard (40+ Seats)</MenuItem>
                <MenuItem value="Minibus">Minibus (15-25 Seats)</MenuItem>
                <MenuItem value="Coach">Coach (Luxury/Tour)</MenuItem>
              </TextField>
              <TextField
                label="Capacity"
                type="number"
                value={formState.capacity}
                onChange={(e) => setFormState({ ...formState, capacity: parseInt(e.target.value, 10) || 0 })}
                required
                slotProps={{ htmlInput: { min: 1 } }}
              />
              {editingBusId && (
                <TextField
                  select
                  label="Status"
                  value={formState.status}
                  onChange={(e) => setFormState({ ...formState, status: e.target.value as any })}
                  required
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </TextField>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialogs} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary">
              {editingBusId ? 'Save Changes' : 'Add Vehicle'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* CONFIRM DELETE DIALOG */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDialogs}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deactivation</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to deactivate/delete this bus? Soft-deleting this vehicle will also invalidate its active driver assignments and clear its relationship from assigned students.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialogs} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete Bus
          </Button>
        </DialogActions>
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

export default BusesPage;

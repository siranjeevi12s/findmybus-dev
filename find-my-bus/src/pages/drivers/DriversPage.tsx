import React, { useState } from 'react';
import {
  useDrivers,
  useCreateDriver,
  useUpdateDriver,
  useDeleteDriver,
} from '../../hooks/useDrivers';
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

interface DriverFormState {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  status?: 'active' | 'inactive';
}

const initialFormState: DriverFormState = {
  firstName: '',
  lastName: '',
  phoneNumber: '',
  email: '',
  licenseNumber: '',
  licenseExpiryDate: '',
  address: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
};

const DriversPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Selected Driver state
  const [editingDriverId, setEditingDriverId] = useState<string | null>(null);
  const [deletingDriverId, setDeletingDriverId] = useState<string | null>(null);

  // Form State
  const [formState, setFormState] = useState<DriverFormState>(initialFormState);
  const [formError, setFormError] = useState('');

  // Snackbar Alert state
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Fetch hook
  const { data, isLoading, error } = useDrivers({ page, limit: 5, search });

  // CRUD Mutations
  const createMutation = useCreateDriver();
  const updateMutation = useUpdateDriver();
  const deleteMutation = useDeleteDriver();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleOpenCreateDialog = () => {
    setEditingDriverId(null);
    setFormState(initialFormState);
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (driver: any) => {
    setEditingDriverId(driver._id);
    
    // Format expiry date to YYYY-MM-DD
    const expiryDate = driver.licenseExpiryDate ? new Date(driver.licenseExpiryDate).toISOString().split('T')[0] : '';

    setFormState({
      firstName: driver.firstName,
      lastName: driver.lastName,
      phoneNumber: driver.phoneNumber,
      email: driver.email,
      licenseNumber: driver.licenseNumber,
      licenseExpiryDate: expiryDate,
      address: driver.address,
      emergencyContactName: driver.emergencyContact?.name || '',
      emergencyContactPhone: driver.emergencyContact?.phone || '',
      status: driver.status,
    });
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (id: string) => {
    setDeletingDriverId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialogs = () => {
    setIsDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setEditingDriverId(null);
    setDeletingDriverId(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const {
      firstName,
      lastName,
      phoneNumber,
      email,
      licenseNumber,
      licenseExpiryDate,
      address,
      emergencyContactName,
      emergencyContactPhone,
    } = formState;

    if (
      !firstName ||
      !lastName ||
      !phoneNumber ||
      !email ||
      !licenseNumber ||
      !licenseExpiryDate ||
      !address ||
      !emergencyContactName ||
      !emergencyContactPhone
    ) {
      setFormError('All fields are required.');
      return;
    }

    const payload = {
      firstName,
      lastName,
      phoneNumber,
      email,
      licenseNumber,
      licenseExpiryDate,
      address,
      emergencyContact: {
        name: emergencyContactName,
        phone: emergencyContactPhone,
      },
      status: formState.status || 'active',
    };

    try {
      if (editingDriverId) {
        await updateMutation.mutateAsync({
          id: editingDriverId,
          payload,
        });
        setNotification({ open: true, message: 'Driver updated successfully', severity: 'success' });
      } else {
        await createMutation.mutateAsync(payload);
        setNotification({ open: true, message: 'Driver employed successfully', severity: 'success' });
      }
      handleCloseDialogs();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error?.reason || 'Operation failed';
      setFormError(msg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingDriverId) return;

    try {
      await deleteMutation.mutateAsync(deletingDriverId);
      setNotification({ open: true, message: 'Driver deleted successfully', severity: 'success' });
      handleCloseDialogs();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete driver';
      setNotification({ open: true, message: msg, severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
          Manage Drivers
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
          sx={{ borderRadius: '10px', px: 3 }}
        >
          Add Driver
        </Button>
      </Box>

      {/* Filter and Search Bar */}
      <Card sx={{ p: 2, mb: 3 }}>
        <form onSubmit={handleSearchSubmit}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              placeholder="Search by Name, License No, or Phone..."
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
        <Alert severity="error">Failed to fetch drivers. Please try again.</Alert>
      ) : !data?.data?.drivers || data.data.drivers.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No drivers registered yet
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Add school bus drivers to populate the personnel database.
          </Typography>
          <Button variant="outlined" color="primary" onClick={handleOpenCreateDialog}>
            Register First Driver
          </Button>
        </Paper>
      ) : (
        <Box>
          <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Driver Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Phone Number</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Email Address</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>License No</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>License Expiry</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.data.drivers.map((driver: any) => (
                  <TableRow key={driver._id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{`${driver.firstName} ${driver.lastName}`}</TableCell>
                    <TableCell>{driver.phoneNumber}</TableCell>
                    <TableCell>{driver.email}</TableCell>
                    <TableCell>{driver.licenseNumber}</TableCell>
                    <TableCell>
                      {new Date(driver.licenseExpiryDate).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={driver.status === 'active' ? 'Active' : 'Inactive'}
                        color={driver.status === 'active' ? 'success' : 'default'}
                        size="small"
                        sx={{ fontWeight: 600, borderRadius: '6px' }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleOpenEditDialog(driver)} size="small" sx={{ mr: 1 }}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleOpenDeleteDialog(driver._id)} size="small">
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
      <Dialog open={isDialogOpen} onClose={handleCloseDialogs} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingDriverId ? 'Edit Driver Details' : 'Register New Driver'}
        </DialogTitle>
        <form onSubmit={handleFormSubmit}>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1.5 }}>
              Personal Info
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="First Name"
                value={formState.firstName}
                onChange={(e) => setFormState({ ...formState, firstName: e.target.value })}
                required
              />
              <TextField
                label="Last Name"
                value={formState.lastName}
                onChange={(e) => setFormState({ ...formState, lastName: e.target.value })}
                required
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Phone Number"
                value={formState.phoneNumber}
                onChange={(e) => setFormState({ ...formState, phoneNumber: e.target.value })}
                required
              />
              <TextField
                label="Email"
                type="email"
                value={formState.email}
                onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                required
              />
            </Box>

            <TextField
              label="Home Address"
              value={formState.address}
              onChange={(e) => setFormState({ ...formState, address: e.target.value })}
              required
              sx={{ mb: 3 }}
            />

            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1.5 }}>
              Credentials & Status
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                label="License Number"
                value={formState.licenseNumber}
                onChange={(e) => setFormState({ ...formState, licenseNumber: e.target.value })}
                required
              />
              <TextField
                label="License Expiry"
                type="date"
                slotProps={{ inputLabel: { shrink: true } }}
                value={formState.licenseExpiryDate}
                onChange={(e) => setFormState({ ...formState, licenseExpiryDate: e.target.value })}
                required
              />
            </Box>

            {editingDriverId && (
              <TextField
                select
                label="Status"
                value={formState.status}
                onChange={(e) => setFormState({ ...formState, status: e.target.value as any })}
                required
                sx={{ mb: 3 }}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </TextField>
            )}

            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1.5 }}>
              Emergency Contact
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Contact Name"
                value={formState.emergencyContactName}
                onChange={(e) => setFormState({ ...formState, emergencyContactName: e.target.value })}
                required
              />
              <TextField
                label="Contact Phone"
                value={formState.emergencyContactPhone}
                onChange={(e) => setFormState({ ...formState, emergencyContactPhone: e.target.value })}
                required
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={handleCloseDialogs} color="inherit">
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary">
              {editingDriverId ? 'Save Changes' : 'Employ Driver'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* CONFIRM DELETE DIALOG */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDialogs}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deactivation</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to deactivate/delete this driver? Soft-deleting this driver will also terminate any active bus pairings.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialogs} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete Driver
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

export default DriversPage;

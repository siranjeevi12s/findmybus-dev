import React, { useState } from 'react';
import {
  useStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
} from '../../hooks/useStudents';
import { useBuses } from '../../hooks/useBuses';
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

interface StudentFormState {
  studentName: string;
  studentId: string;
  grade: string;
  section: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  busId: string;
  status?: 'active' | 'inactive';
}

const initialFormState: StudentFormState = {
  studentName: '',
  studentId: '',
  grade: '',
  section: '',
  parentName: '',
  parentEmail: '',
  parentPhone: '',
  busId: '', // Represents Unassigned initially
};

const StudentsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Dialog States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Selected Student state
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);

  // Form State
  const [formState, setFormState] = useState<StudentFormState>(initialFormState);
  const [formError, setFormError] = useState('');

  // Snackbar alert state
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Fetch Students
  const { data, isLoading, error } = useStudents({ page, limit: 5, search });
  
  // Fetch Buses for assignment selection (limit 100 to get all)
  const { data: busesData, isLoading: isLoadingBuses } = useBuses({ page: 1, limit: 100 });

  // CRUD Mutations
  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const deleteMutation = useDeleteStudent();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleOpenCreateDialog = () => {
    setEditingStudentId(null);
    setFormState(initialFormState);
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (student: any) => {
    setEditingStudentId(student._id);
    setFormState({
      studentName: student.studentName,
      studentId: student.studentId,
      grade: student.grade,
      section: student.section,
      parentName: student.parentName,
      parentEmail: student.parentEmail,
      parentPhone: student.parentPhone,
      busId: student.busId?._id || student.busId || '', // Handles populated or raw ID
      status: student.status,
    });
    setFormError('');
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (id: string) => {
    setDeletingStudentId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialogs = () => {
    setIsDialogOpen(false);
    setIsDeleteDialogOpen(false);
    setEditingStudentId(null);
    setDeletingStudentId(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const {
      studentName,
      studentId,
      grade,
      section,
      parentName,
      parentEmail,
      parentPhone,
      busId,
    } = formState;

    if (!studentName || !studentId || !grade || !section || !parentName || !parentEmail || !parentPhone) {
      setFormError('All fields (except Bus mapping) are required.');
      return;
    }

    const payload = {
      studentName,
      studentId,
      grade,
      section,
      parentName,
      parentEmail,
      parentPhone,
      busId: busId === '' ? null : busId,
      status: formState.status || 'active',
    };

    try {
      if (editingStudentId) {
        await updateMutation.mutateAsync({
          id: editingStudentId,
          payload,
        });
        setNotification({ open: true, message: 'Student details updated successfully', severity: 'success' });
      } else {
        await createMutation.mutateAsync(payload);
        setNotification({ open: true, message: 'Student registered successfully', severity: 'success' });
      }
      handleCloseDialogs();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error?.reason || 'Operation failed';
      setFormError(msg);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudentId) return;

    try {
      await deleteMutation.mutateAsync(deletingStudentId);
      setNotification({ open: true, message: 'Student deleted successfully', severity: 'success' });
      handleCloseDialogs();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to delete student';
      setNotification({ open: true, message: msg, severity: 'error' });
    }
  };

  const buses = busesData?.data?.buses || [];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif' }}>
          Manage Students
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
          sx={{ borderRadius: '10px', px: 3 }}
        >
          Add Student
        </Button>
      </Box>

      {/* Filter and Search Bar */}
      <Card sx={{ p: 2, mb: 3 }}>
        <form onSubmit={handleSearchSubmit}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              placeholder="Search by Student Name, ID, or Parent Details..."
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
        <Alert severity="error">Failed to fetch students. Please try again.</Alert>
      ) : !data?.data?.students || data.data.students.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px' }}>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No students registered yet
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
            Add school students and assign them to transit routes.
          </Typography>
          <Button variant="outlined" color="primary" onClick={handleOpenCreateDialog}>
            Register First Student
          </Button>
        </Paper>
      ) : (
        <Box>
          <TableContainer component={Paper} sx={{ borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: 'none' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Student ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Student Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Class & Sec</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Parent Info</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Assigned Bus</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.data.students.map((student: any) => {
                  const bus = student.busId;
                  const busDisplay = bus ? `${bus.busNumber} (${bus.registrationNumber})` : 'Unassigned';

                  return (
                    <TableRow key={student._id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{student.studentId}</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{student.studentName}</TableCell>
                      <TableCell>{`${student.grade} - ${student.section}`}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {student.parentName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                          {student.parentEmail} | {student.parentPhone}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={busDisplay}
                          color={bus ? 'secondary' : 'default'}
                          size="small"
                          sx={{ fontWeight: 600, borderRadius: '6px' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={student.status === 'active' ? 'Active' : 'Inactive'}
                          color={student.status === 'active' ? 'success' : 'default'}
                          size="small"
                          sx={{ fontWeight: 600, borderRadius: '6px' }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" onClick={() => handleOpenEditDialog(student)} size="small" sx={{ mr: 1 }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton color="error" onClick={() => handleOpenDeleteDialog(student._id)} size="small">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
          {editingStudentId ? 'Edit Student Details' : 'Register New Student'}
        </DialogTitle>
        <form onSubmit={handleFormSubmit}>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1.5 }}>
              Student Details
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField
                label="Student Name"
                value={formState.studentName}
                onChange={(e) => setFormState({ ...formState, studentName: e.target.value })}
                required
              />
              <TextField
                label="Student ID"
                placeholder="e.g. STU-001"
                value={formState.studentId}
                onChange={(e) => setFormState({ ...formState, studentId: e.target.value })}
                required
              />
            </Box>

            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                label="Class / Grade"
                placeholder="e.g. Grade 5"
                value={formState.grade}
                onChange={(e) => setFormState({ ...formState, grade: e.target.value })}
                required
              />
              <TextField
                label="Section"
                placeholder="e.g. A"
                value={formState.section}
                onChange={(e) => setFormState({ ...formState, section: e.target.value })}
                required
              />
            </Box>

            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1.5 }}>
              Parent Info
            </Typography>
            <TextField
              label="Parent Full Name"
              value={formState.parentName}
              onChange={(e) => setFormState({ ...formState, parentName: e.target.value })}
              required
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                label="Parent Email"
                type="email"
                value={formState.parentEmail}
                onChange={(e) => setFormState({ ...formState, parentEmail: e.target.value })}
                required
              />
              <TextField
                label="Parent Phone"
                value={formState.parentPhone}
                onChange={(e) => setFormState({ ...formState, parentPhone: e.target.value })}
                required
              />
            </Box>

            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 700, mb: 1.5 }}>
              Route & Status
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                select
                label="Assign Bus Route"
                value={formState.busId}
                onChange={(e) => setFormState({ ...formState, busId: e.target.value })}
                disabled={isLoadingBuses}
                helperText={isLoadingBuses ? 'Loading buses...' : 'Optional route pairing'}
                sx={{ flexGrow: 1 }}
              >
                <MenuItem value=""><em>Unassigned (No bus route)</em></MenuItem>
                {buses.map((bus: any) => (
                  <MenuItem key={bus._id} value={bus._id}>
                    {bus.busNumber} ({bus.registrationNumber})
                  </MenuItem>
                ))}
              </TextField>

              {editingStudentId && (
                <TextField
                  select
                  label="Status"
                  value={formState.status}
                  onChange={(e) => setFormState({ ...formState, status: e.target.value as any })}
                  required
                  sx={{ width: 150 }}
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
              {editingStudentId ? 'Save Changes' : 'Register Student'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* CONFIRM DELETE DIALOG */}
      <Dialog open={isDeleteDialogOpen} onClose={handleCloseDialogs}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deactivation</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to deactivate/delete this student? Soft-deleting this record will flag the status as deleted but preserve the record for history auditing.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialogs} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete Student
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

export default StudentsPage;

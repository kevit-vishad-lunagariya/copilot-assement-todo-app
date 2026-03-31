import { useState } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import { createTask } from '../../services/tasksService';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const INITIAL_FORM = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
};

/**
 * Modal dialog for creating a new task.
 * @param {{ open: boolean, onClose: () => void, onCreated: (task: object) => void }} props
 * @param {boolean} props.open - Whether the dialog is visible.
 * @param {() => void} props.onClose - Callback invoked when the dialog should close.
 * @param {(task: object) => void} props.onCreated - Callback invoked with the newly created task.
 * @returns {JSX.Element}
 */
export const AddTaskDialog = ({ open, onClose, onCreated }) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [titleError, setTitleError] = useState('');

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (field === 'title') setTitleError('');
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!form.title.trim()) {
      setTitleError('Title is required');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await createTask({
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
      });

      if (response.success) {
        onCreated(response.data);
        setForm(INITIAL_FORM);
        onClose();
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || 'Failed to create task. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setForm(INITIAL_FORM);
    setError(null);
    setTitleError('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      aria-labelledby="add-task-dialog-title"
    >
      <Box component="form" onSubmit={handleSubmit}>
      <DialogTitle id="add-task-dialog-title">Add New Task</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ pt: 0.5 }}>
          {error && (
            <Alert severity="error" aria-live="polite">
              {error}
            </Alert>
          )}

          <TextField
            label="Title"
            required
            fullWidth
            value={form.title}
            onChange={handleChange('title')}
            error={!!titleError}
            helperText={titleError}
            inputProps={{ maxLength: 200 }}
            autoFocus
          />

          <TextField
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={form.description}
            onChange={handleChange('description')}
            inputProps={{ maxLength: 1000 }}
            helperText={`${form.description.length} / 1000`}
          />

          <Stack direction="row" spacing={2}>
            <TextField
              select
              label="Priority"
              fullWidth
              value={form.priority}
              onChange={handleChange('priority')}
            >
              {PRIORITY_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              fullWidth
              value={form.status}
              onChange={handleChange('status')}
            >
              {STATUS_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={isLoading} color="inherit">
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {isLoading ? 'Adding…' : 'Add Task'}
        </Button>
      </DialogActions>
      </Box>
    </Dialog>
  );
};

export default AddTaskDialog;

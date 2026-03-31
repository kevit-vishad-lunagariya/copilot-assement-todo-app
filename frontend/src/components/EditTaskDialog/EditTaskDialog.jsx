import { useState, useEffect } from 'react';
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
import { updateTask } from '../../services/tasksService';

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
];

/** Valid forward transitions per current status (backward moves are rejected by the API). */
const VALID_NEXT_STATUSES = {
  'todo': ['todo', 'in-progress'],
  'in-progress': ['in-progress', 'done'],
  'done': ['done'],
};

/**
 * Returns the STATUS_OPTIONS entries that are valid selections for a given current status.
 * @param {string} currentStatus - The task's current status value.
 * @returns {{ value: string, label: string }[]}
 */
function getSelectableStatuses(currentStatus) {
  const allowed = VALID_NEXT_STATUSES[currentStatus] ?? STATUS_OPTIONS.map((o) => o.value);
  return STATUS_OPTIONS.filter((o) => allowed.includes(o.value));
}

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

/**
 * Modal dialog for editing an existing task.
 * @param {{ open: boolean, task: object|null, onClose: () => void, onUpdated: (task: object) => void }} props
 * @param {boolean} props.open - Whether the dialog is visible.
 * @param {object|null} props.task - The task to edit; null when closed.
 * @param {() => void} props.onClose - Callback invoked when the dialog should close.
 * @param {(task: object) => void} props.onUpdated - Callback invoked with the updated task data.
 * @returns {JSX.Element}
 */
export const EditTaskDialog = ({ open, task, onClose, onUpdated }) => {
  const [form, setForm] = useState({ title: '', description: '', status: 'todo', priority: 'medium' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [titleError, setTitleError] = useState('');

  useEffect(() => {
    if (task) {
      setForm({
        title: task.title ?? '',
        description: task.description ?? '',
        status: task.status ?? 'todo',
        priority: task.priority ?? 'medium',
      });
      setError(null);
      setTitleError('');
    }
  }, [task]);

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
      const response = await updateTask(task.id, {
        title: form.title.trim(),
        description: form.description.trim(),
        status: form.status,
        priority: form.priority,
      });

      if (response.success) {
        onUpdated(response.data);
        onClose();
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || 'Failed to update task. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
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
      aria-labelledby="edit-task-dialog-title"
    >
      <Box component="form" onSubmit={handleSubmit}>
      <DialogTitle id="edit-task-dialog-title">Edit Task</DialogTitle>

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
              {getSelectableStatuses(task?.status ?? form.status).map((opt) => (
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
          {isLoading ? 'Saving…' : 'Save Changes'}
        </Button>
      </DialogActions>
      </Box>
    </Dialog>
  );
};

export default EditTaskDialog;

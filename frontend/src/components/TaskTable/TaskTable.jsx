import { useState, useEffect, useCallback, useRef, memo, useDeferredValue, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Button,
  Chip,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment,
  Tooltip,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterListOffIcon from '@mui/icons-material/FilterListOff';
import { fetchTasks, updateTask, deleteTask, completeTask } from '../../services/tasksService';
import { AddTaskDialog } from '../AddTaskDialog/AddTaskDialog';
import { EditTaskDialog } from '../EditTaskDialog/EditTaskDialog';

/** @type {Record<string, { label: string, color: import('@mui/material').ChipProps['color'] }>} */
const PRIORITY_CONFIG = {
  low: { label: 'Low', color: 'success' },
  medium: { label: 'Medium', color: 'warning' },
  high: { label: 'High', color: 'error' },
};

/** @type {Record<string, { label: string, color: import('@mui/material').ChipProps['color'] }>} */
const STATUS_CONFIG = {
  todo: { label: 'To Do', color: 'default' },
  'in-progress': { label: 'In Progress', color: 'info' },
  done: { label: 'Done', color: 'success' },
};

/** Ordered workflow steps used to determine the next status on complete. */
const STATUS_ORDER = ['todo', 'in-progress', 'done'];

const COLUMNS = [
  { id: 'title', label: 'Title', sortable: true },
  { id: 'priority', label: 'Priority', sortable: true },
  { id: 'status', label: 'Status', sortable: true },
  { id: 'createdAt', label: 'Created Date', sortable: true },
  { id: 'actions', label: 'Actions', sortable: false },
];

/**
 * Format an ISO date string into a locale-friendly short date.
 * @param {string} iso - ISO 8601 date string.
 * @returns {string} Formatted date string.
 */
function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Compare two task rows for sorting.
 * @param {object} a - First task.
 * @param {object} b - Second task.
 * @param {string} orderBy - Field to sort by.
 * @returns {number} Negative if a < b, positive if a > b, 0 if equal.
 */
function compare(a, b, orderBy) {
  const valA = a[orderBy] ?? '';
  const valB = b[orderBy] ?? '';
  if (valA < valB) return -1;
  if (valA > valB) return 1;
  return 0;
}

/**
 * A single memoised task row. Isolated from parent re-renders unless its own props change.
 * Applies: rerender-no-inline-components (HIGH) + rerender-memo (MEDIUM) from vercel-react-best-practices.
 * @param {{ task: object, onComplete: Function, onEdit: Function, onDeleteRequest: Function, isDeleting: boolean, isCompleting: boolean }} props
 * @returns {JSX.Element}
 */
const TaskRow = memo(function TaskRow({
  task,
  onComplete,
  onEdit,
  onDeleteRequest,
  isDeleting,
  isCompleting,
}) {
  const priorityCfg = PRIORITY_CONFIG[task.priority] ?? { label: task.priority, color: 'default' };
  const statusCfg = STATUS_CONFIG[task.status] ?? { label: task.status, color: 'default' };
  const isDone = task.status === 'done';
  const completeLabel = task.status === 'todo' ? 'Start' : 'Complete';

  return (
    <TableRow hover sx={{ '&:last-child td': { border: 0 }, transition: 'background 0.15s' }}>
      <TableCell sx={{ maxWidth: 300 }}>
        <Tooltip
          title={task.description || ''}
          placement="top-start"
          disableHoverListener={!task.description}
        >
          <Typography variant="body2" noWrap sx={{ fontWeight: 500 }}>
            {task.title}
          </Typography>
        </Tooltip>
      </TableCell>

      <TableCell>
        <Chip
          label={priorityCfg.label}
          color={priorityCfg.color}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600, minWidth: 70 }}
        />
      </TableCell>

      <TableCell>
        <Chip
          label={statusCfg.label}
          color={statusCfg.color}
          size="small"
          sx={{ fontWeight: 600, minWidth: 95 }}
        />
      </TableCell>

      <TableCell sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>
        {formatDate(task.createdAt)}
      </TableCell>

      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title={isDone ? 'Already completed' : completeLabel}>
            <span>
              <IconButton
                size="small"
                color="success"
                onClick={() => onComplete(task)}
                disabled={isDone || isCompleting || isDeleting}
                aria-label={isDone ? `${task.title} is done` : `${completeLabel} ${task.title}`}
              >
                {isCompleting
                  ? <CircularProgress size={16} color="inherit" />
                  : <CheckCircleIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Edit">
            <span>
              <IconButton
                size="small"
                color="primary"
                onClick={() => onEdit(task)}
                disabled={isDeleting || isCompleting}
                aria-label={`Edit ${task.title}`}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Delete">
            <span>
              <IconButton
                size="small"
                color="error"
                onClick={() => onDeleteRequest(task.id)}
                disabled={isDeleting || isCompleting}
                aria-label={`Delete ${task.title}`}
              >
                {isDeleting
                  ? <CircularProgress size={16} color="inherit" />
                  : <DeleteIcon fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </TableCell>
    </TableRow>
  );
});

/**
 * Task table page — lists all tasks with live search, status/priority filters,
 * sortable columns, and per-row Edit, Delete, and Complete actions.
 * @returns {JSX.Element}
 */
const TaskTable = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'error' });

  // Stable callbacks so memo(TaskRow) skips re-renders when parent state unrelated to rows changes
  const showToast = useCallback(
    (message, severity = 'error') => setToast({ open: true, message, severity }),
    []
  );
  const closeToast = useCallback(
    () => setToast((prev) => ({ ...prev, open: false })),
    []
  );

  // Filters (all client-side — no page reload)
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Sorting
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('createdAt');

  // Dialogs
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Per-row async loading states
  const [deletingId, setDeletingId] = useState(null);
  const [completingId, setCompletingId] = useState(null);

  const abortRef = useRef(null);

  const loadTasks = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchTasks();
      if (response.success) {
        setTasks(response.data);
      }
    } catch (err) {
      if (err?.code !== 'ERR_CANCELED') {
        setError('Failed to load tasks. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [loadTasks]);

  const handleSort = (columnId) => {
    if (orderBy === columnId) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(columnId);
      setOrder('asc');
    }
  };

  const handleTaskCreated = (newTask) => {
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleTaskUpdated = (updated) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  /**
   * Advance a task one step forward in the status workflow.
   * For tasks in 'todo', advances to 'in-progress' via PUT.
   * For tasks in 'in-progress', calls the dedicated POST complete endpoint.
   * Memoised via useCallback so memo(TaskRow) skips re-renders on unrelated parent updates.
   */
  const handleComplete = useCallback(async (task) => {
    if (task.status === 'done') return;

    setCompletingId(task.id);
    try {
      let response;
      if (task.status === 'in-progress') {
        response = await completeTask(task.id);
      } else {
        const currentIdx = STATUS_ORDER.indexOf(task.status);
        const nextStatus = STATUS_ORDER[currentIdx + 1];
        response = await updateTask(task.id, { status: nextStatus });
      }
      if (response.success) {
        setTasks((prev) => prev.map((t) => (t.id === task.id ? response.data : t)));
      }
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to update task.');
    } finally {
      setCompletingId(null);
    }
  }, [showToast]);

  const handleDeleteConfirm = async () => {
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setDeletingId(id);
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to delete task.');
    } finally {
      setDeletingId(null);
    }
  };

  // rerender-use-deferred-value: search input stays snappy; filtered list renders when idle
  const deferredSearch = useDeferredValue(search);
  const isSearchStale = search !== deferredSearch;

  const hasActiveFilters = statusFilter !== '' || priorityFilter !== '';

  const filteredTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.title.toLowerCase().includes(deferredSearch.toLowerCase()))
        .filter((task) => !statusFilter || task.status === statusFilter)
        .filter((task) => !priorityFilter || task.priority === priorityFilter)
        .sort((a, b) => order === 'asc' ? compare(a, b, orderBy) : compare(b, a, orderBy)),
    [tasks, deferredSearch, statusFilter, priorityFilter, order, orderBy]
  );

  const stats = useMemo(
    () => ({
      total: tasks.length,
      todo: tasks.filter((t) => t.status === 'todo').length,
      inProgress: tasks.filter((t) => t.status === 'in-progress').length,
      done: tasks.filter((t) => t.status === 'done').length,
    }),
    [tasks]
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
      {/* Page header */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h5" component="h1" fontWeight={600}>
            Tasks
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isLoading
              ? 'Loading…'
              : `${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''}${hasActiveFilters ? ' (filtered)' : ''}`}
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setAddDialogOpen(true)}
          aria-label="Add new task"
        >
          Add Task
        </Button>
      </Stack>

      {/* Stats summary cards */}
      {!isLoading && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
            gap: 2,
            mb: 3,
          }}
        >
          {[
            { label: 'Total', value: stats.total, color: '#6366f1', bgColor: '#eef2ff', borderColor: '#c7d2fe' },
            { label: 'To Do', value: stats.todo, color: '#64748b', bgColor: '#f8fafc', borderColor: '#e2e8f0' },
            { label: 'In Progress', value: stats.inProgress, color: '#3b82f6', bgColor: '#eff6ff', borderColor: '#bfdbfe' },
            { label: 'Done', value: stats.done, color: '#10b981', bgColor: '#f0fdf4', borderColor: '#bbf7d0' },
          ].map(({ label, value, color, bgColor, borderColor }) => (
            <Paper
              key={label}
              variant="outlined"
              sx={{
                p: { xs: 1.5, sm: 2 },
                textAlign: 'center',
                borderRadius: 2,
                bgcolor: bgColor,
                borderColor,
                transition: 'transform 0.15s, box-shadow 0.15s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: 3 },
              }}
            >
              <Typography variant="h4" fontWeight={700} sx={{ color, lineHeight: 1 }}>
                {value}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {label}
              </Typography>
            </Paper>
          ))}
        </Box>
      )}

      {/* Search + Filters row */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 2 }} alignItems="flex-start">
        <TextField
          placeholder="Search tasks by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          inputProps={{ 'aria-label': 'Search tasks by title' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
          size="small"
          sx={{ flex: 1, minWidth: 200 }}
        />

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="todo">To Do</MenuItem>
            <MenuItem value="in-progress">In Progress</MenuItem>
            <MenuItem value="done">Done</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="priority-filter-label">Priority</InputLabel>
          <Select
            labelId="priority-filter-label"
            label="Priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <MenuItem value="">All priorities</MenuItem>
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </Select>
        </FormControl>

        {hasActiveFilters && (
          <Tooltip title="Clear filters">
            <IconButton
              onClick={() => { setStatusFilter(''); setPriorityFilter(''); }}
              aria-label="Clear status and priority filters"
              size="small"
              sx={{ mt: 0.5 }}
            >
              <FilterListOffIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Stack>

      {/* Page-level error */}
      {error && (
        <Alert severity="error" aria-live="polite" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Table */}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: 2, opacity: isSearchStale ? 0.6 : 1, transition: 'opacity 0.2s' }}
      >
        <Table aria-label="Tasks table" stickyHeader>
          <TableHead>
            <TableRow>
              {COLUMNS.map((col) => (
                <TableCell
                  key={col.id}
                  sortDirection={orderBy === col.id ? order : false}
                  sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
                  align={col.id === 'actions' ? 'right' : 'left'}
                >
                  {col.sortable ? (
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : 'asc'}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} align="center" sx={{ py: 6 }}>
                  <CircularProgress aria-label="Loading tasks" />
                </TableCell>
              </TableRow>
            ) : filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    {search || hasActiveFilters
                      ? 'No tasks match your search or filters.'
                      : 'No tasks yet. Add your first task!'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onEdit={setEditTask}
                  onDeleteRequest={setConfirmDeleteId}
                  isDeleting={deletingId === task.id}
                  isCompleting={completingId === task.id}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Task dialog */}
      <AddTaskDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onCreated={handleTaskCreated}
      />

      {/* Edit Task dialog */}
      <EditTaskDialog
        open={editTask !== null}
        task={editTask}
        onClose={() => setEditTask(null)}
        onUpdated={handleTaskUpdated}
      />

      {/* Delete confirmation dialog */}
      <Dialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        aria-labelledby="delete-confirm-title"
      >
        <DialogTitle id="delete-confirm-title">Delete Task?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This action cannot be undone. The task will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setConfirmDeleteId(null)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Error toast notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={closeToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          onClose={closeToast}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default TaskTable;

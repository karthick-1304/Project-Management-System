import { useState, useEffect } from 'react';
import Modal from '../../components/Modal.jsx';
import { Button, Input, Alert } from '../../components/ui.jsx';
import { tasksApi } from '../../api/tasks.js';

const EMPTY = {
  title: '',
  description: '',
  assignee: '',
  dueDate: '',
  priority: 'medium',
  status: 'todo',
};

// Handles both create (no `task`) and edit (with `task`).
export default function TaskFormModal({
  open,
  onClose,
  projectId,
  collaborators = [],
  task = null,
  defaultStatus,
  onSaved,
}) {
  const isEdit = !!task;
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setForm({
        title: task.title || '',
        description: task.description || '',
        assignee: task.assignee || '',
        dueDate: task.dueDate ? String(task.dueDate).slice(0, 10) : '',
        priority: task.priority || 'medium',
        status: task.status || 'todo',
      });
    } else {
      setForm({ ...EMPTY, status: defaultStatus || 'todo' });
    }
    setError('');
  }, [open, task, defaultStatus]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const payload = {
      title: form.title,
      description: form.description,
      assignee: form.assignee || null,
      dueDate: form.dueDate || null,
      priority: form.priority,
      status: form.status,
    };
    try {
      const { task: saved } = isEdit
        ? await tasksApi.update(task.id, payload)
        : await tasksApi.create(projectId, payload);
      onSaved?.(saved);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit task' : 'Create task'}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Input
          id="t-title"
          label="Title"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Assignee
            </label>
            <select
              value={form.assignee}
              onChange={(e) => setForm({ ...form, assignee: e.target.value })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="">Unassigned</option>
              {collaborators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            id="t-due"
            label="Due date"
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          />
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Saving…' : isEdit ? 'Save task' : 'Create task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

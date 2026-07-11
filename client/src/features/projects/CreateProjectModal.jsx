import { useState } from 'react';
import Modal from '../../components/Modal.jsx';
import { Button, Input, Alert } from '../../components/ui.jsx';
import { projectsApi } from '../../api/projects.js';
import EmailChips from './EmailChips.jsx';

const EMPTY = { name: '', key: '', description: '', status: 'Active' };

export default function CreateProjectModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [emails, setEmails] = useState([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setForm(EMPTY);
    setEmails([]);
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { project } = await projectsApi.create({ ...form, collaboratorEmails: emails });
      reset();
      onCreated?.(project);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create project">
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <Input
          id="name"
          label="Project name"
          required
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <Input
          id="key"
          label="Project key"
          required
          placeholder="e.g. ENG"
          value={form.key}
          onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase() })}
        />
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
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
            <option value="Active">Active</option>
            <option value="OnHold">On Hold</option>
            <option value="Completed">Completed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Add collaborators (by email)
          </label>
          <EmailChips emails={emails} onChange={setEmails} />
          <p className="mt-1 text-xs text-gray-400">
            They'll be added as members and notified by email.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? 'Creating…' : 'Create project'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

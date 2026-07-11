import { useEffect, useState } from 'react';
import Modal from '../../components/Modal.jsx';
import { Button, Input, Alert } from '../../components/ui.jsx';
import EmailChips from './EmailChips.jsx';
import { projectsApi } from '../../api/projects.js';
import {
  formatDate,
  formatDateTime,
  PROJECT_STATUS_LABEL,
} from '../../lib/format.js';

export default function ProjectSettingsModal({ open, onClose, project, onUpdated, onDeleted }) {
  const isOwner = project?.myRole === 'owner';
  const [form, setForm] = useState({ name: '', key: '', description: '', status: 'Active' });
  const [collaborators, setCollaborators] = useState([]);
  const [logs, setLogs] = useState([]);
  const [newEmails, setNewEmails] = useState([]);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!open || !project) return;
    setForm({
      name: project.name,
      key: project.key,
      description: project.description || '',
      status: project.status,
    });
    setCollaborators(project.collaborators || []);
    setError('');
    setMsg('');
    setConfirmDelete(false);
    setNewEmails([]);
    projectsApi.logs(project.id).then((d) => setLogs(d.logs)).catch(() => setLogs([]));
  }, [open, project]);

  const save = async () => {
    setError('');
    setMsg('');
    setBusy(true);
    try {
      const { project: updated } = await projectsApi.update(project.id, form);
      setMsg('Saved.');
      onUpdated?.(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addCollaborators = async () => {
    setError('');
    setBusy(true);
    try {
      let latest = collaborators;
      for (const email of newEmails) {
        const { collaborators: c } = await projectsApi.addCollaborator(project.id, email);
        latest = c;
      }
      setCollaborators(latest);
      setNewEmails([]);
      setMsg('Collaborator(s) added and notified.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeCollaborator = async (userId) => {
    setError('');
    try {
      const { collaborators: c } = await projectsApi.removeCollaborator(project.id, userId);
      setCollaborators(c);
      setMsg('Collaborator removed and notified.');
    } catch (err) {
      setError(err.message);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      await projectsApi.remove(project.id);
      onDeleted?.(project.id);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  if (!project) return null;
  const c = project.counts;

  return (
    <Modal open={open} onClose={onClose} title="Project settings" size="lg">
      <div className="space-y-5">
        {error && <Alert>{error}</Alert>}
        {msg && <Alert kind="success">{msg}</Alert>}
        {!isOwner && (
          <Alert kind="info">You are a member of this project — details are read-only.</Alert>
        )}

        {/* Details */}
        <section className="grid gap-3 sm:grid-cols-2">
          <Input
            id="p-name"
            label="Name"
            value={form.name}
            disabled={!isOwner}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            id="p-key"
            label="Key"
            value={form.key}
            disabled={!isOwner}
            onChange={(e) => setForm({ ...form, key: e.target.value.toUpperCase() })}
          />
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              rows={2}
              value={form.description}
              disabled={!isOwner}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={form.status}
              disabled={!isOwner}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 disabled:opacity-60"
            >
              <option value="Active">Active</option>
              <option value="OnHold">On Hold</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </section>

        {/* Read-only meta */}
        <section className="grid grid-cols-2 gap-2 rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3 text-sm">
          <div><span className="text-gray-400">Created</span><br />{formatDate(project.createdAt)}</div>
          <div><span className="text-gray-400">Created by</span><br />{project.createdByName || '—'}</div>
          <div className="col-span-2 flex gap-4 text-xs text-gray-600 dark:text-gray-300">
            <span>{c.total} tasks</span>
            <span>{c.todo} to do</span>
            <span>{c.inprogress} in progress</span>
            <span>{c.done} done</span>
          </div>
        </section>

        {isOwner && (
          <div className="flex justify-end">
            <Button onClick={save} disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        )}

        {/* Collaborators */}
        <section>
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Collaborators
          </h4>
          <ul className="space-y-1">
            {collaborators.map((col) => (
              <li
                key={col.id}
                className="flex items-center justify-between rounded-md bg-gray-50 dark:bg-gray-900/40 px-3 py-1.5 text-sm"
              >
                <span className="text-gray-800 dark:text-gray-200">
                  {col.name} <span className="text-gray-400">({col.email})</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{col.role}</span>
                  {isOwner && col.role !== 'owner' && (
                    <button
                      onClick={() => removeCollaborator(col.id)}
                      className="text-xs text-red-500 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {isOwner && (
            <div className="mt-3">
              <EmailChips emails={newEmails} onChange={setNewEmails} />
              {newEmails.length > 0 && (
                <Button variant="secondary" className="mt-2" onClick={addCollaborators} disabled={busy}>
                  Add {newEmails.length} collaborator{newEmails.length === 1 ? '' : 's'}
                </Button>
              )}
            </div>
          )}
        </section>

        {/* History log */}
        <section>
          <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Project history
          </h4>
          <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            {logs.length === 0 && <p className="p-3 text-sm text-gray-400">No activity yet.</p>}
            {logs.map((l) => (
              <div key={l.id} className="flex items-center justify-between px-3 py-2 text-xs">
                <span className="text-gray-700 dark:text-gray-300">
                  <span className="font-mono text-gray-500">{l.actionType}</span>
                  {l.taskKey ? ` · ${l.taskKey}` : ''} {l.message ? `— ${l.message}` : ''}
                </span>
                <span className="text-gray-400 shrink-0 ml-2">
                  {l.actionByName || '—'} · {formatDateTime(l.actionAt)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Danger zone */}
        {isOwner && (
          <section className="border-t border-gray-200 dark:border-gray-700 pt-4">
            {!confirmDelete ? (
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete project
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Delete "{project.name}" and all its tasks? This cannot be undone.
                </span>
                <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={doDelete} disabled={busy}>
                  Confirm delete
                </Button>
              </div>
            )}
          </section>
        )}
      </div>
    </Modal>
  );
}

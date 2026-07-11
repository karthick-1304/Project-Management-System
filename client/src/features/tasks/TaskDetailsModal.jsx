import { useEffect, useState } from 'react';
import Modal from '../../components/Modal.jsx';
import { Button, Alert } from '../../components/ui.jsx';
import { tasksApi } from '../../api/tasks.js';
import CommentsSection from './CommentsSection.jsx';
import ActivitySection from './ActivitySection.jsx';
import {
  formatDate,
  priorityClasses,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
} from '../../lib/format.js';

export default function TaskDetailsModal({ open, onClose, taskId, onEdit, onChanged }) {
  const [task, setTask] = useState(null);
  const [perms, setPerms] = useState(null);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [logRefresh, setLogRefresh] = useState(0);

  const load = () => {
    if (!taskId) return;
    tasksApi
      .get(taskId)
      .then((d) => {
        setTask(d.task);
        setPerms(d.permissions);
      })
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    if (!open) return;
    setError('');
    setConfirmDelete(false);
    setTask(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskId]);

  const changeStatus = async (status) => {
    try {
      const { task: t } = await tasksApi.updateStatus(taskId, status);
      setTask(t);
      setLogRefresh((n) => n + 1);
      onChanged?.();
    } catch (e) {
      setError(e.message);
    }
  };

  const doDelete = async () => {
    try {
      await tasksApi.remove(taskId);
      onChanged?.();
      onClose?.();
    } catch (e) {
      setError(e.message);
    }
  };

  const editHint = perms?.canEdit
    ? 'You can edit all fields (owner or task creator).'
    : perms?.canChangeStatus
      ? 'You can change the status (you are the assignee), but only the owner or creator can edit other fields.'
      : 'You have view-only access to this task.';

  return (
    <Modal open={open} onClose={onClose} title={task ? task.taskKey : 'Task'} size="lg">
      {error && <Alert>{error}</Alert>}
      {!task ? (
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      ) : (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{task.title}</h3>
            <span
              className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${priorityClasses(
                task.priority
              )}`}
            >
              {TASK_PRIORITY_LABEL[task.priority]}
            </span>
          </div>

          {task.description && (
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {task.description}
            </p>
          )}

          {/* Info grid */}
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-gray-400">Status</dt>
              <dd>
                {perms?.canChangeStatus ? (
                  <select
                    value={task.status}
                    onChange={(e) => changeStatus(e.target.value)}
                    className="mt-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-gray-100"
                  >
                    <option value="todo">To Do</option>
                    <option value="inprogress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                ) : (
                  <span className="text-gray-800 dark:text-gray-200">
                    {TASK_STATUS_LABEL[task.status]}
                  </span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-gray-400">Assignee</dt>
              <dd className="text-gray-800 dark:text-gray-200">{task.assigneeName || 'Unassigned'}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Due date</dt>
              <dd className="text-gray-800 dark:text-gray-200">{formatDate(task.dueDate)}</dd>
            </div>
            <div>
              <dt className="text-gray-400">Created by</dt>
              <dd className="text-gray-800 dark:text-gray-200">{task.createdByName || '—'}</dd>
            </div>
          </dl>

          <Alert kind="info">{editHint}</Alert>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <ActivitySection taskId={task.id} refreshKey={logRefresh} />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <CommentsSection taskId={task.id} canDeleteAny={perms?.canDelete} />
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            {perms?.canDelete &&
              (confirmDelete ? (
                <>
                  <span className="mr-auto self-center text-sm text-gray-600 dark:text-gray-300">
                    Delete this task?
                  </span>
                  <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </Button>
                  <Button variant="danger" onClick={doDelete}>
                    Confirm delete
                  </Button>
                </>
              ) : (
                <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              ))}
            {perms?.canEdit && !confirmDelete && (
              <Button onClick={() => onEdit?.(task)}>Edit task</Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}

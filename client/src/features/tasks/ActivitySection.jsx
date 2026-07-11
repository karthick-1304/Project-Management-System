import { useEffect, useState } from 'react';
import { tasksApi } from '../../api/tasks.js';
import { formatDateTime } from '../../lib/format.js';

const LABEL = {
  TASK_CREATED: 'created',
  TASK_UPDATED: 'updated',
  TASK_DELETED: 'deleted',
  PROJECT_CREATED: 'project created',
};

// `refreshKey` lets the parent force a reload after edits/status changes.
export default function ActivitySection({ taskId, refreshKey }) {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    if (!taskId) return;
    tasksApi.logs(taskId).then((d) => setLogs(d.logs)).catch(() => setLogs([]));
  }, [taskId, refreshKey]);

  return (
    <section>
      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Activity</h4>
      <div className="max-h-40 overflow-y-auto rounded-md border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
        {logs.length === 0 && <p className="p-3 text-xs text-gray-400">No activity yet.</p>}
        {logs.map((l) => (
          <div key={l.id} className="flex items-center justify-between px-3 py-2 text-xs">
            <span className="text-gray-700 dark:text-gray-300">
              <span className="font-medium">{l.actionByName || '—'}</span>{' '}
              {l.message || LABEL[l.actionType] || l.actionType}
            </span>
            <span className="text-gray-400 shrink-0 ml-2">{formatDateTime(l.actionAt)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

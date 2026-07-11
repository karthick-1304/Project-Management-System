import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi } from '../api/dashboard.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  formatDate,
  priorityClasses,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
} from '../lib/format.js';

function Stat({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className={`text-2xl font-bold ${accent || 'text-gray-900 dark:text-white'}`}>{value}</div>
      <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi
      .get()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
        Welcome, {user?.name}
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Here's your overview.</p>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
            <Stat label="Total projects" value={data.totalProjects} />
            <Stat label="Tasks assigned to you" value={data.totalTasks} />
            <Stat label="Completed" value={data.completedTasks} accent="text-green-600 dark:text-green-400" />
            <Stat label="Pending" value={data.pendingTasks} accent="text-amber-600 dark:text-amber-400" />
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="border-b border-gray-200 dark:border-gray-700 px-4 py-3">
              <h2 className="font-semibold text-gray-900 dark:text-white">Recent tasks</h2>
            </div>
            {data.recentTasks.length === 0 ? (
              <p className="p-6 text-sm text-gray-500 dark:text-gray-400">
                No tasks yet.{' '}
                <Link to="/projects" className="text-indigo-600 hover:underline">
                  Go to projects
                </Link>
                .
              </p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {data.recentTasks.map((t) => (
                  <li key={t.id}>
                    <Link
                      to={`/projects/${t.projectId}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <span className="text-xs font-mono text-gray-500 dark:text-gray-400 w-16 shrink-0">
                        {t.taskKey}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-sm text-gray-900 dark:text-gray-100">
                        {t.title}
                      </span>
                      <span className="hidden sm:inline text-xs text-gray-400">{t.projectName}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityClasses(
                          t.priority
                        )}`}
                      >
                        {TASK_PRIORITY_LABEL[t.priority]}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 w-20 shrink-0 text-right">
                        {TASK_STATUS_LABEL[t.status]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

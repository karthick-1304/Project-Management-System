import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/projects.js';
import ProjectSettingsModal from '../features/projects/ProjectSettingsModal.jsx';
import { projectStatusClasses, PROJECT_STATUS_LABEL } from '../lib/format.js';

export default function ProjectBoard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const load = useCallback(() => {
    setError('');
    projectsApi
      .get(id)
      .then((d) => setProject(d.project))
      .catch((e) => setError(e.message));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-500">{error}</p>
        <button onClick={() => navigate('/projects')} className="mt-2 text-indigo-600 hover:underline">
          ← Back to projects
        </button>
      </div>
    );
  }

  if (!project) return <div className="p-6 text-gray-500 dark:text-gray-400">Loading…</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
          <span className="text-sm font-mono text-gray-500 dark:text-gray-400">{project.key}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${projectStatusClasses(
              project.status
            )}`}
          >
            {PROJECT_STATUS_LABEL[project.status]}
          </span>
          <span className="text-xs text-gray-400">({project.myRole})</span>
        </div>
        <button
          onClick={() => setSettingsOpen(true)}
          title="Project settings"
          className="rounded-md p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.53 1.53 0 0 1-2.29.95c-1.37-.84-2.94.73-2.1 2.1.5.82.09 1.9-.83 2.16-1.56.38-1.56 2.6 0 2.98.92.26 1.33 1.34.83 2.16-.84 1.37.73 2.94 2.1 2.1.82-.5 1.9-.09 2.16.83.38 1.56 2.6 1.56 2.98 0 .26-.92 1.34-1.33 2.16-.83 1.37.84 2.94-.73 2.1-2.1a1.53 1.53 0 0 1 .83-2.16c1.56-.38 1.56-2.6 0-2.98a1.53 1.53 0 0 1-.83-2.16c.84-1.37-.73-2.94-2.1-2.1a1.53 1.53 0 0 1-2.16-.83zM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Kanban board is implemented in the tasks/kanban step. */}
      <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center text-gray-500 dark:text-gray-400">
        Kanban board (tasks) is built in the next step.
      </div>

      <ProjectSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        project={project}
        onUpdated={(updated) => setProject(updated)}
        onDeleted={() => navigate('/projects')}
      />
    </div>
  );
}

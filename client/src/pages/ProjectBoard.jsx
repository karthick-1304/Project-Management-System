import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/projects.js';
import { tasksApi } from '../api/tasks.js';
import ProjectSettingsModal from '../features/projects/ProjectSettingsModal.jsx';
import TaskFormModal from '../features/tasks/TaskFormModal.jsx';
import TaskDetailsModal from '../features/tasks/TaskDetailsModal.jsx';
import KanbanBoard from '../features/tasks/KanbanBoard.jsx';
import { Button, Alert } from '../components/ui.jsx';
import { projectStatusClasses, PROJECT_STATUS_LABEL } from '../lib/format.js';

export default function ProjectBoard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', priority: '', search: '' });

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState('todo');
  const [editingTask, setEditingTask] = useState(null);
  const [detailsTaskId, setDetailsTaskId] = useState(null);

  const loadProject = useCallback(() => {
    projectsApi.get(id).then(setProjectSafe).catch((e) => setError(e.message));
    function setProjectSafe(d) {
      setProject(d.project);
    }
  }, [id]);

  const loadTasks = useCallback(() => {
    tasksApi
      .list(id, filters)
      .then((d) => setTasks(d.tasks))
      .catch((e) => setError(e.message));
  }, [id, filters]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    const t = setTimeout(loadTasks, 200);
    return () => clearTimeout(t);
  }, [loadTasks]);

  const refresh = () => {
    loadTasks();
    loadProject();
  };

  const openCreate = (status) => {
    setCreateStatus(status);
    setCreateOpen(true);
  };

  // Optimistic drag-to-move; reverts and shows an error if the server rejects.
  const moveTask = async (task, status) => {
    const prev = tasks;
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, status } : t)));
    setError('');
    try {
      await tasksApi.updateStatus(task.id, status);
      loadProject(); // refresh counts
    } catch (e) {
      setTasks(prev); // revert
      setError(e.message);
    }
  };

  if (error && !project) {
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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
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
        <div className="flex items-center gap-2">
          <Button onClick={() => openCreate('todo')}>+ New task</Button>
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
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          placeholder="Search by key or title…"
          className="flex-1 min-w-[200px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-gray-900 dark:text-gray-100"
        >
          <option value="">All statuses</option>
          <option value="todo">To Do</option>
          <option value="inprogress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select
          value={filters.priority}
          onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-gray-900 dark:text-gray-100"
        >
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      {error && (
        <div className="mb-3">
          <Alert>{error}</Alert>
        </div>
      )}

      {/* Kanban board (drag-and-drop) */}
      <KanbanBoard
        tasks={tasks}
        onOpen={(taskId) => setDetailsTaskId(taskId)}
        onAdd={(status) => openCreate(status)}
        onMove={moveTask}
      />

      {/* Modals */}
      <ProjectSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        project={project}
        onUpdated={(updated) => setProject(updated)}
        onDeleted={() => navigate('/projects')}
      />
      <TaskFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        projectId={id}
        collaborators={project.collaborators}
        defaultStatus={createStatus}
        onSaved={() => {
          setCreateOpen(false);
          refresh();
        }}
      />
      <TaskFormModal
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        projectId={id}
        collaborators={project.collaborators}
        task={editingTask}
        onSaved={() => {
          setEditingTask(null);
          refresh();
        }}
      />
      <TaskDetailsModal
        open={!!detailsTaskId}
        onClose={() => setDetailsTaskId(null)}
        taskId={detailsTaskId}
        onEdit={(t) => {
          setDetailsTaskId(null);
          setEditingTask(t);
        }}
        onChanged={refresh}
      />
    </div>
  );
}

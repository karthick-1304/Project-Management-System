import { useEffect, useState, useCallback } from 'react';
import { projectsApi } from '../api/projects.js';
import ProjectCard from '../features/projects/ProjectCard.jsx';
import CreateProjectModal from '../features/projects/CreateProjectModal.jsx';
import { Button } from '../components/ui.jsx';
import { useNavigate } from 'react-router-dom';

export default function ProjectsDashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', status: '', role: '', sort: 'created_at', dir: 'desc' });
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(() => {
    setLoading(true);
    projectsApi
      .list(filters)
      .then((d) => setProjects(d.projects))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(load, 200); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Projects dashboard</h1>
        <Button onClick={() => setCreateOpen(true)}>+ Create project</Button>
      </div>

      {/* Search + filters + sort */}
      <div className="mb-4 flex flex-wrap gap-2">
        <input
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="Search by name…"
          className="flex-1 min-w-[200px] rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={filters.status}
          onChange={(e) => set({ status: e.target.value })}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-gray-900 dark:text-gray-100"
        >
          <option value="">All statuses</option>
          <option value="Active">Active</option>
          <option value="OnHold">On Hold</option>
          <option value="Completed">Completed</option>
        </select>
        <select
          value={filters.role}
          onChange={(e) => set({ role: e.target.value })}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-gray-900 dark:text-gray-100"
        >
          <option value="">Owner &amp; member</option>
          <option value="owner">Owner</option>
          <option value="member">Member</option>
        </select>
        <select
          value={`${filters.sort}:${filters.dir}`}
          onChange={(e) => {
            const [sort, dir] = e.target.value.split(':');
            set({ sort, dir });
          }}
          className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-2 text-sm text-gray-900 dark:text-gray-100"
        >
          <option value="name:asc">Name A→Z</option>
          <option value="name:desc">Name Z→A</option>
          <option value="created_at:desc">Newest first</option>
          <option value="created_at:asc">Oldest first</option>
        </select>
      </div>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading…</p>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-10 text-center text-gray-500 dark:text-gray-400">
          No projects match. Create one to get started.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      <CreateProjectModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(project) => {
          setCreateOpen(false);
          if (project?.id) navigate(`/projects/${project.id}`);
        }}
      />
    </div>
  );
}

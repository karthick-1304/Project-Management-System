import { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { projectsApi } from '../api/projects.js';

// Sidebar: "Projects" label + search + create; list of the user's projects;
// and a link to the full projects dashboard.
export default function Sidebar({ onCreateProject, onNavigate }) {
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  // Re-fetch on search change AND on every route change, so newly created or
  // deleted projects (which navigate) reflect immediately without a refresh.
  useEffect(() => {
    let active = true;
    projectsApi
      .list({ search, sort: 'name', dir: 'asc' })
      .then((d) => active && setProjects(d.projects))
      .catch(() => active && setProjects([]));
    return () => {
      active = false;
    };
  }, [search, location.pathname]);

  return (
    <aside className="w-64 h-full shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col">
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Projects
          </span>
          <button
            onClick={onCreateProject}
            title="Create project"
            className="rounded-md p-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-gray-700"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 4a1 1 0 0 1 1 1v4h4a1 1 0 1 1 0 2h-4v4a1 1 0 1 1-2 0v-4H5a1 1 0 1 1 0-2h4V5a1 1 0 0 1 1-1z" />
            </svg>
          </button>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search projects…"
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <nav className="flex-1 overflow-y-auto px-2">
        {projects.length === 0 && (
          <p className="px-2 py-2 text-sm text-gray-400">No projects yet.</p>
        )}
        {projects.map((p) => (
          <NavLink
            key={p.id}
            to={`/projects/${p.id}`}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center justify-between rounded-md px-2 py-1.5 text-sm mb-0.5 ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-gray-700 dark:text-white'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            <span className="truncate">{p.name}</span>
            <span className="ml-2 shrink-0 rounded bg-gray-100 dark:bg-gray-600 px-1.5 text-xs text-gray-600 dark:text-gray-200">
              {p.key}
            </span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-gray-200 dark:border-gray-700 p-2">
        <button
          onClick={() => {
            navigate('/projects');
            onNavigate?.();
          }}
          className="w-full rounded-md px-2 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          → Go to projects dashboard
        </button>
      </div>
    </aside>
  );
}

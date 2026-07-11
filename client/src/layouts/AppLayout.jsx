import { useState, useCallback } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import CreateProjectModal from '../features/projects/CreateProjectModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { Button } from '../components/ui.jsx';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  const onCreated = useCallback(
    (project) => {
      setCreateOpen(false);
      setRefreshKey((k) => k + 1);
      if (project?.id) navigate(`/projects/${project.id}`);
    },
    [navigate]
  );

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      {/* Sidebar: hidden on small screens, toggled via the menu button */}
      <div
        className={`${mobileOpen ? 'fixed inset-0 z-40 flex' : 'hidden'} md:static md:flex`}
        onClick={() => setMobileOpen(false)}
      >
        <div onClick={(e) => e.stopPropagation()} className="h-full">
          <Sidebar onCreateProject={() => setCreateOpen(true)} refreshKey={refreshKey} />
        </div>
        {mobileOpen && <div className="flex-1 bg-black/40" />}
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              className="md:hidden text-gray-600 dark:text-gray-300"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
            <Link to="/" className="font-semibold text-gray-900 dark:text-white">
              PM Tool
            </Link>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={toggle}
              title="Toggle theme"
              className="rounded-md p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <span className="hidden sm:inline text-gray-500 dark:text-gray-400">{user?.email}</span>
            <Button variant="secondary" onClick={logout}>
              Log out
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <CreateProjectModal open={createOpen} onClose={() => setCreateOpen(false)} onCreated={onCreated} />
    </div>
  );
}

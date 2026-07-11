import { useState, useCallback } from 'react';
import { Outlet, Link, NavLink, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import CreateProjectModal from '../features/projects/CreateProjectModal.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { Button } from '../components/ui.jsx';

const navLinkClass = ({ isActive }) =>
  `px-3 py-1.5 rounded-md text-sm font-medium ${
    isActive
      ? 'bg-indigo-50 text-indigo-700 dark:bg-gray-700 dark:text-white'
      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
  }`;

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const onCreated = useCallback(
    (project) => {
      setCreateOpen(false);
      if (project?.id) navigate(`/projects/${project.id}`);
    },
    [navigate]
  );

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Desktop sidebar — full height */}
      <div className="hidden md:flex">
        <Sidebar onCreateProject={() => setCreateOpen(true)} />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden" onClick={() => setMobileOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="h-full">
            <Sidebar
              onCreateProject={() => {
                setMobileOpen(false);
                setCreateOpen(true);
              }}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
          <div className="flex-1 bg-black/40" />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
          <div className="flex items-center gap-2">
            <button
              className="md:hidden text-gray-600 dark:text-gray-300 text-lg"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              ☰
            </button>
            <Link to="/" className="font-semibold text-gray-900 dark:text-white mr-1">
              PM Tool
            </Link>
            <nav className="flex items-center gap-1">
              <NavLink to="/" end className={navLinkClass}>
                Home
              </NavLink>
              <NavLink to="/projects" className={navLinkClass}>
                Projects Dashboard
              </NavLink>
            </nav>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={toggle}
              title="Toggle theme"
              className="flex items-center gap-1.5 rounded-md px-2 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span className="hidden sm:inline">Theme</span>
            </button>
            <span className="hidden md:inline text-gray-500 dark:text-gray-400">{user?.email}</span>
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

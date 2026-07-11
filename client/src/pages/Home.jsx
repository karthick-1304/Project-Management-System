import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/ui.jsx';

// Temporary authenticated landing. Replaced by the real dashboard in a later step.
export default function Home() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h1 className="font-semibold">PM Tool</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500 dark:text-gray-400">{user?.email}</span>
          <Button variant="secondary" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>
      <main className="p-6">
        <p className="text-gray-600 dark:text-gray-300">
          Signed in as <strong>{user?.name}</strong>. Dashboard, projects, and tasks are built in
          the next steps.
        </p>
      </main>
    </div>
  );
}

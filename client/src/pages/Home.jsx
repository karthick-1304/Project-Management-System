import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';

// Temporary home. Replaced by the real dashboard (totals + recent tasks) in a later step.
export default function Home() {
  const { user } = useAuth();
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
        Welcome, {user?.name}
      </h1>
      <p className="mt-2 text-gray-600 dark:text-gray-300">
        The full dashboard (totals + recent tasks) is built in a later step. For now, head to your{' '}
        <Link to="/projects" className="text-indigo-600 hover:underline">
          projects dashboard
        </Link>
        .
      </p>
    </div>
  );
}

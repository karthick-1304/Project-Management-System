import { useEffect, useState } from 'react';
import { apiFetch } from '../api/client.js';

// Temporary landing page to verify client<->server wiring during scaffold.
export default function HealthCheck() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiFetch('/health').then(setHealth).catch((e) => setError(e.message));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <div className="p-8 rounded-xl shadow bg-white dark:bg-gray-800 w-96">
        <h1 className="text-xl font-semibold mb-4">PM Tool — scaffold</h1>
        {error && <p className="text-red-500">API error: {error}</p>}
        {!error && !health && <p className="text-gray-500">Checking API…</p>}
        {health && (
          <ul className="space-y-1 text-sm">
            <li>Status: <span className="font-mono">{health.status}</span></li>
            <li>Database: <span className="font-mono">{health.db}</span></li>
            <li>Time: <span className="font-mono">{health.time}</span></li>
          </ul>
        )}
      </div>
    </div>
  );
}

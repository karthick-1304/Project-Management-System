import { Link } from 'react-router-dom';
import { projectStatusClasses, PROJECT_STATUS_LABEL } from '../../lib/format.js';

export default function ProjectCard({ project }) {
  const c = project.counts;
  return (
    <Link
      to={`/projects/${project.id}`}
      className="block rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white truncate">{project.name}</h3>
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{project.key}</span>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${projectStatusClasses(
            project.status
          )}`}
        >
          {PROJECT_STATUS_LABEL[project.status]}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-3 text-xs text-gray-600 dark:text-gray-300">
        <span className="font-medium">{c.total} tasks</span>
        <span className="text-gray-400">·</span>
        <span>{c.todo} to do</span>
        <span>{c.inprogress} in progress</span>
        <span>{c.done} done</span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {c.collaborators} collaborator{c.collaborators === 1 ? '' : 's'}
        </span>
        <span
          className={`rounded px-1.5 py-0.5 text-xs font-medium ${
            project.myRole === 'owner'
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {project.myRole}
        </span>
      </div>
    </Link>
  );
}

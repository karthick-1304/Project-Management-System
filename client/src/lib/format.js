export function formatDate(value, opts = { dateStyle: 'medium' }) {
  if (!value) return '—';
  try {
    return new Intl.DateTimeFormat(undefined, opts).format(new Date(value));
  } catch {
    return String(value);
  }
}

export function formatDateTime(value) {
  return formatDate(value, { dateStyle: 'medium', timeStyle: 'short' });
}

export const PROJECT_STATUS_LABEL = {
  Active: 'Active',
  OnHold: 'On Hold',
  Completed: 'Completed',
};

export function projectStatusClasses(status) {
  return (
    {
      Active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      OnHold: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
      Completed: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    }[status] || 'bg-gray-100 text-gray-700'
  );
}

export const TASK_STATUS_LABEL = { todo: 'To Do', inprogress: 'In Progress', done: 'Done' };
export const TASK_PRIORITY_LABEL = { low: 'Low', medium: 'Medium', high: 'High' };

export function priorityClasses(p) {
  return (
    {
      low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
      high: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
    }[p] || 'bg-gray-100 text-gray-700'
  );
}

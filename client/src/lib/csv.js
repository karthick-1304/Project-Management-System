import { TASK_STATUS_LABEL, TASK_PRIORITY_LABEL } from './format.js';

function escape(value) {
  const s = value == null ? '' : String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Build CSV text from a task list. */
export function tasksToCsv(tasks) {
  const header = ['Key', 'Title', 'Status', 'Priority', 'Assignee', 'Due Date', 'Created By'];
  const rows = tasks.map((t) => [
    t.taskKey,
    t.title,
    TASK_STATUS_LABEL[t.status] || t.status,
    TASK_PRIORITY_LABEL[t.priority] || t.priority,
    t.assigneeName || '',
    t.dueDate ? String(t.dueDate).slice(0, 10) : '',
    t.createdByName || '',
  ]);
  return [header, ...rows].map((r) => r.map(escape).join(',')).join('\r\n');
}

/** Trigger a browser download of the given text as a file. */
export function downloadText(filename, text, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

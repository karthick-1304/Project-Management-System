import { priorityClasses, TASK_PRIORITY_LABEL, formatDate } from '../../lib/format.js';

export default function TaskCard({ task, onClick, dragHandleProps, style, innerRef }) {
  return (
    <div
      ref={innerRef}
      style={style}
      {...dragHandleProps}
      onClick={onClick}
      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 shadow-sm hover:shadow cursor-pointer"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{task.taskKey}</span>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityClasses(task.priority)}`}
        >
          {TASK_PRIORITY_LABEL[task.priority]}
        </span>
      </div>
      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</p>
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className="truncate">{task.assigneeName || 'Unassigned'}</span>
        {task.dueDate && <span className="shrink-0 ml-2">{formatDate(task.dueDate)}</span>}
      </div>
    </div>
  );
}

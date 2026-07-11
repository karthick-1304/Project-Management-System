import { useState } from 'react';
import { priorityClasses } from '../../lib/format.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function ymd(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

export default function CalendarView({ tasks, onOpen }) {
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });

  const first = new Date(cursor.year, cursor.month, 1);
  const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
  const leading = first.getDay();

  // Group tasks by their due date (YYYY-MM-DD).
  const byDate = {};
  const noDue = [];
  for (const t of tasks) {
    if (t.dueDate) {
      const key = String(t.dueDate).slice(0, 10);
      (byDate[key] ||= []).push(t);
    } else {
      noDue.push(t);
    }
  }

  const todayKey = ymd(new Date());
  const cells = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(cursor.year, cursor.month, d));
  }

  const move = (delta) => {
    setCursor((c) => {
      const m = c.month + delta;
      return { year: c.year + Math.floor(m / 12), month: ((m % 12) + 12) % 12 };
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900 dark:text-white">
          {MONTHS[cursor.month]} {cursor.year}
        </h2>
        <div className="flex gap-1">
          <button
            onClick={() => move(-1)}
            className="rounded-md px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            ← Prev
          </button>
          <button
            onClick={() => setCursor({ year: new Date().getFullYear(), month: new Date().getMonth() })}
            className="rounded-md px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Today
          </button>
          <button
            onClick={() => move(1)}
            className="rounded-md px-2 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
        {WEEKDAYS.map((w) => (
          <div
            key={w}
            className="bg-gray-50 dark:bg-gray-800 px-2 py-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
          >
            {w}
          </div>
        ))}
        {cells.map((date, i) => {
          const key = date ? ymd(date) : null;
          const dayTasks = key ? byDate[key] || [] : [];
          return (
            <div
              key={i}
              className={`min-h-[90px] bg-white dark:bg-gray-800 p-1.5 ${
                key === todayKey ? 'ring-2 ring-inset ring-indigo-400' : ''
              }`}
            >
              {date && (
                <>
                  <div className="text-xs text-gray-400 mb-1">{date.getDate()}</div>
                  <div className="space-y-1">
                    {dayTasks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onOpen(t.id)}
                        className={`block w-full truncate rounded px-1 py-0.5 text-left text-[10px] font-medium ${priorityClasses(
                          t.priority
                        )}`}
                        title={`${t.taskKey}: ${t.title}`}
                      >
                        {t.taskKey} {t.title}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {noDue.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            No due date ({noDue.length})
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {noDue.map((t) => (
              <button
                key={t.id}
                onClick={() => onOpen(t.id)}
                className={`rounded px-2 py-0.5 text-xs font-medium ${priorityClasses(t.priority)}`}
              >
                {t.taskKey} {t.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

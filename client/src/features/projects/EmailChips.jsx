import { useState } from 'react';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Simple chip input for collecting a list of email addresses.
export default function EmailChips({ emails, onChange }) {
  const [value, setValue] = useState('');
  const [err, setErr] = useState('');

  const add = () => {
    const email = value.trim().toLowerCase();
    if (!email) return;
    if (!EMAIL_RE.test(email)) {
      setErr('Enter a valid email');
      return;
    }
    if (!emails.includes(email)) onChange([...emails, email]);
    setValue('');
    setErr('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add();
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="name@example.com"
          className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="button"
          onClick={add}
          className="rounded-md bg-gray-100 dark:bg-gray-700 px-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          Add
        </button>
      </div>
      {err && <p className="mt-1 text-xs text-red-500">{err}</p>}
      {emails.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {emails.map((e) => (
            <span
              key={e}
              className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 px-2 py-0.5 text-xs text-indigo-700 dark:text-indigo-300"
            >
              {e}
              <button
                type="button"
                onClick={() => onChange(emails.filter((x) => x !== e))}
                className="hover:text-indigo-900 dark:hover:text-white"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

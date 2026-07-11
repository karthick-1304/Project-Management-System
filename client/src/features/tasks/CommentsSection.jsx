import { useEffect, useRef, useState } from 'react';
import { commentsApi } from '../../api/comments.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Button, Alert } from '../../components/ui.jsx';
import { formatDateTime } from '../../lib/format.js';

export default function CommentsSection({ taskId, canDeleteAny }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const load = () => commentsApi.list(taskId).then((d) => setComments(d.comments)).catch(() => {});

  useEffect(() => {
    if (taskId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const submit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setError('');
    setBusy(true);
    try {
      await commentsApi.create(taskId, { message, file });
      setMessage('');
      setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const del = async (id) => {
    try {
      await commentsApi.remove(id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const openAttachment = async (attId) => {
    try {
      const { url } = await commentsApi.attachmentUrl(attId);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section>
      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Comments</h4>
      {error && <Alert>{error}</Alert>}

      <div className="space-y-2 max-h-56 overflow-y-auto mb-3">
        {comments.length === 0 && <p className="text-sm text-gray-400">No comments yet.</p>}
        {comments.map((c) => {
          const canDelete = canDeleteAny || c.createdBy === user?.id;
          return (
            <div key={c.id} className="rounded-md bg-gray-50 dark:bg-gray-900/40 p-2.5 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800 dark:text-gray-200">{c.authorName}</span>
                <span className="text-xs text-gray-400">{formatDateTime(c.createdAt)}</span>
              </div>
              <p className="mt-1 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{c.message}</p>
              {c.attachments?.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {c.attachments.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => openAttachment(a.id)}
                      className="inline-flex items-center gap-1 rounded bg-indigo-50 dark:bg-indigo-900/40 px-2 py-0.5 text-xs text-indigo-700 dark:text-indigo-300 hover:underline"
                    >
                      📎 {a.fileName}
                    </button>
                  ))}
                </div>
              )}
              {canDelete && (
                <button
                  onClick={() => del(c.id)}
                  className="mt-1 text-xs text-red-500 hover:underline"
                >
                  Delete
                </button>
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={submit} className="space-y-2">
        <textarea
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a comment…"
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex items-center justify-between gap-2">
          <input
            ref={fileRef}
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="text-xs text-gray-500 dark:text-gray-400 file:mr-2 file:rounded file:border-0 file:bg-gray-100 dark:file:bg-gray-700 file:px-2 file:py-1 file:text-xs"
          />
          <Button type="submit" disabled={busy || !message.trim()}>
            {busy ? 'Posting…' : 'Comment'}
          </Button>
        </div>
      </form>
    </section>
  );
}

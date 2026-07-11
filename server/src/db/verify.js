import { pool } from '../config/db.js';

const tables = [
  'users', 'projects', 'project_collaborators', 'tasks',
  'comments', 'attachments', 'logs', 'password_resets',
];

try {
  for (const t of tables) {
    const { rows } = await pool.query(`SELECT count(*)::int AS n FROM ${t}`);
    console.log(`${t.padEnd(22)} ${rows[0].n}`);
  }
  const { rows: tk } = await pool.query('SELECT task_key, title, status FROM tasks ORDER BY task_key');
  console.log('\nTasks:');
  for (const r of tk) console.log(`  ${r.task_key}  [${r.status}]  ${r.title}`);
} finally {
  await pool.end();
}

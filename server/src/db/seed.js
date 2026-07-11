// Seeds test users, projects, collaborators, tasks, comments, and logs.
// Idempotent-ish: clears the domain tables first, keeps schema intact.
import bcrypt from 'bcrypt';

const PASSWORD = 'Password123!'; // shared test password for all seeded users

export async function seed(pool) {
  const hash = await bcrypt.hash(PASSWORD, 10);

  await pool.query('BEGIN');
  try {
    // Clear domain data (FK-safe order); leaves enums/functions intact.
    await pool.query(`
      TRUNCATE logs, attachments, comments, tasks,
               project_collaborators, projects, password_resets, users
      RESTART IDENTITY CASCADE;
    `);

    // Users
    const users = [
      { name: 'Alice Owner', email: 'alice@example.com' },
      { name: 'Bob Member', email: 'bob@example.com' },
      { name: 'Carol Member', email: 'carol@example.com' },
    ];
    const userIds = {};
    for (const u of users) {
      const { rows } = await pool.query(
        `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id`,
        [u.name, u.email, hash]
      );
      userIds[u.email] = rows[0].id;
    }
    const alice = userIds['alice@example.com'];
    const bob = userIds['bob@example.com'];
    const carol = userIds['carol@example.com'];

    // Project
    const { rows: projRows } = await pool.query(
      `INSERT INTO projects (name, key, description, status, created_by, updated_by)
       VALUES ($1, $2, $3, 'Active', $4, $4) RETURNING id`,
      ['Engineering', 'ENG', 'Core engineering project', alice]
    );
    const projectId = projRows[0].id;

    // Collaborators
    await pool.query(
      `INSERT INTO project_collaborators (project_id, user_id, role) VALUES
        ($1, $2, 'owner'), ($1, $3, 'member'), ($1, $4, 'member')`,
      [projectId, alice, bob, carol]
    );

    // Log: project created
    await pool.query(
      `INSERT INTO logs (project_id, action_type, message, action_by)
       VALUES ($1, 'PROJECT_CREATED', 'Project "Engineering" created', $2)`,
      [projectId, alice]
    );

    // Tasks (use next_task_key for realistic keys)
    const taskSeed = [
      { title: 'Set up CI pipeline', priority: 'high', status: 'inprogress', assignee: bob, creator: alice },
      { title: 'Design database schema', priority: 'high', status: 'done', assignee: alice, creator: alice },
      { title: 'Build login page', priority: 'medium', status: 'todo', assignee: carol, creator: bob },
      { title: 'Write API docs', priority: 'low', status: 'todo', assignee: null, creator: alice },
    ];
    const taskIds = [];
    for (const t of taskSeed) {
      const { rows: keyRows } = await pool.query(`SELECT next_task_key($1) AS key`, [projectId]);
      const taskKey = keyRows[0].key;
      const { rows } = await pool.query(
        `INSERT INTO tasks (project_id, task_key, title, description, assignee, priority, status, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8) RETURNING id`,
        [projectId, taskKey, t.title, `${t.title} — seeded task.`, t.assignee, t.priority, t.status, t.creator]
      );
      taskIds.push(rows[0].id);
      await pool.query(
        `INSERT INTO logs (project_id, task_id, action_type, message, action_by)
         VALUES ($1, $2, 'TASK_CREATED', $3, $4)`,
        [projectId, rows[0].id, `Task ${taskKey} created`, t.creator]
      );
    }

    // A comment on the first task
    await pool.query(
      `INSERT INTO comments (task_id, message, created_by)
       VALUES ($1, $2, $3)`,
      [taskIds[0], 'Started working on the pipeline config.', bob]
    );

    await pool.query('COMMIT');
    console.log('[db] Seed complete.');
    console.log(`[db] Test login — email: alice@example.com / bob@example.com / carol@example.com`);
    console.log(`[db] Test password (all users): ${PASSWORD}`);
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }
}

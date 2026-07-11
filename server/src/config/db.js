import pg from 'pg';
import { env } from './env.js';

const { Pool, types } = pg;

// Return DATE (OID 1082) columns as plain 'YYYY-MM-DD' strings instead of JS
// Dates, so due dates aren't shifted a day by timezone during JSON serialization.
types.setTypeParser(1082, (v) => v);

export const pool = new Pool({
  connectionString: env.databaseUrl,
  // Supabase requires SSL. rejectUnauthorized:false is fine for the pooled/direct URI.
  ssl: env.databaseUrl?.includes('supabase.') ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[db] Unexpected idle client error', err);
});

/** Run a parameterized query. */
export function query(text, params) {
  return pool.query(text, params);
}

/** Run a set of statements inside a transaction. */
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

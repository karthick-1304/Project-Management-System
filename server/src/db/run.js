// Usage: node src/db/run.js schema | seed
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { pool } from '../config/db.js';
import { seed } from './seed.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function runSchema() {
  const sql = await readFile(join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('[db] Schema applied.');
}

async function main() {
  const cmd = process.argv[2];
  try {
    if (cmd === 'schema') {
      await runSchema();
    } else if (cmd === 'seed') {
      await seed(pool);
    } else if (cmd === 'reset') {
      await runSchema();
      await seed(pool);
    } else {
      console.error('Usage: node src/db/run.js <schema|seed|reset>');
      process.exit(1);
    }
  } catch (err) {
    console.error('[db] Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();

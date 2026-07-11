import { createApp } from './app.js';
import { env, assertEnv } from './config/env.js';

assertEnv();

const app = createApp();

app.listen(env.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] API listening on http://localhost:${env.port} (${env.nodeEnv})`);
});

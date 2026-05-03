/**
 * launcher.js — Starts Metro.
 */
'use strict';
const { spawn } = require('child_process');

const PORT = process.env.PORT || '18717';

const env = {
  ...process.env,
  PORT,
  EXPO_PACKAGER_PROXY_URL: process.env.EXPO_PACKAGER_PROXY_URL || `http://localhost:${PORT}`,
  EXPO_PUBLIC_DOMAIN: process.env.EXPO_PUBLIC_DOMAIN || 'localhost',
};

const metro = spawn(
  'pnpm',
  ['exec', 'expo', 'start', '--port', PORT],
  { env, stdio: 'inherit', cwd: __dirname }
);

metro.on('exit', (code) => {
  process.exit(code ?? 1);
});

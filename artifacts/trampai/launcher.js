/**
 * launcher.js — Starts Metro with a preload script that forces IPv4 binding.
 *
 * Replit's workflow health check reads /proc/net/tcp (IPv4 only).
 * By default Metro binds to :: (IPv6) making it invisible to the check.
 * preload-ipv4.js patches net.Server.prototype.listen so Metro binds on
 * 0.0.0.0 (all IPv4 interfaces) instead, which /proc/net/tcp can see.
 */
'use strict';
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || '18717';
const PRELOAD = path.join(__dirname, 'preload-ipv4.js');

const env = {
  ...process.env,
  PORT,
  NODE_OPTIONS: `--require ${PRELOAD}`,
  EXPO_PACKAGER_PROXY_URL: `https://${process.env.REPLIT_EXPO_DEV_DOMAIN || 'localhost'}`,
  EXPO_PUBLIC_DOMAIN: process.env.REPLIT_DEV_DOMAIN || 'localhost',
  EXPO_PUBLIC_REPL_ID: process.env.REPL_ID || '',
  REACT_NATIVE_PACKAGER_HOSTNAME: process.env.REPLIT_DEV_DOMAIN || 'localhost',
};

const metro = spawn(
  'pnpm',
  ['exec', 'expo', 'start', '--localhost', '--port', PORT],
  { env, stdio: 'inherit', cwd: __dirname }
);

metro.on('exit', (code) => {
  process.exit(code ?? 1);
});

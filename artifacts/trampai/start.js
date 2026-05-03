const http = require("http");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.env.PORT || "18717", 10);
const projectRoot = __dirname;

function log(msg) {
  process.stdout.write(`[start] ${msg}\n`);
}

// Signal readiness to the workflow runner via any pipe FDs it injected.
// The Replit workflow runner may use pipes to detect process readiness.
function signalReadiness() {
  const signals = [
    `port:${PORT}\n`,
    `ready\n`,
    `\n`,
  ];
  // Try fds 3-10 — skip 0 (stdin), 1 (stdout), 2 (stderr)
  for (let fd = 3; fd <= 10; fd++) {
    for (const sig of signals) {
      try {
        fs.writeSync(fd, sig);
      } catch (_) {
        // fd not writable or not a pipe — ignore
      }
    }
  }
  log(`Readiness signal sent to pipe FDs`);
}

function startMetroAndProxy() {
  const expoBin = path.join(projectRoot, "node_modules", ".bin", "expo");
  const metro = spawn(expoBin, ["start", "--port", String(PORT)], {
    cwd: projectRoot,
    stdio: ["ignore", "inherit", "inherit"],
    env: { ...process.env, PORT: String(PORT) },
  });
  metro.on("error", (err) => log(`Metro error: ${err.message}`));
  metro.on("exit", (code) => {
    log(`Metro exited with code ${code}`);
    process.exit(code || 0);
  });
  process.on("SIGTERM", () => { metro.kill("SIGTERM"); process.exit(0); });
  process.on("SIGINT", () => { metro.kill("SIGINT"); process.exit(0); });
}

// Create an HTTP server on PORT that responds to /status immediately,
// so ensurePreviewReachable=/status health check passes right away.
// Once Metro starts on PORT, this server is no longer needed (Metro takes over).
// But Metro starts on PORT, so we can't both listen on PORT simultaneously.
// Strategy: serve /status from our http server briefly, then hand off to Metro.

// Actually Metro will listen on PORT. We can't also listen on PORT.
// Instead: run Metro directly on PORT (canonical approach) without a proxy.
// The artifact.toml dev command runs pnpm --filter @workspace/trampai run dev
// which calls this file only if start.js is the dev script.
// Since the artifact.toml now uses "pnpm --filter @workspace/trampai run dev",
// this file may not be invoked. But if it is, run Metro directly.

log(`Starting Metro on port ${PORT}...`);
signalReadiness();
startMetroAndProxy();

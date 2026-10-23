const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const realCwd = fs.realpathSync.native(process.cwd());

if (process.cwd() !== realCwd) {
  console.log(`[Casing Corrector] Normalizing working directory path casing for Next.js build...`);
  console.log(`From: ${process.cwd()}`);
  console.log(`To:   ${realCwd}\n`);
}

const nextBin = path.join(realCwd, 'node_modules', 'next', 'dist', 'bin', 'next');

const nodeOptions = process.env.NODE_OPTIONS || '--max-old-space-size=4096';

const runBuild = (extraArgs = []) => {
  return spawnSync(process.execPath, [nextBin, 'build', ...extraArgs, ...process.argv.slice(2)], {
    cwd: realCwd,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: nodeOptions,
      PWD: realCwd,
      INIT_CWD: realCwd,
    }
  });
};

// Safely clear previous .next build artifacts with retry to prevent Windows file locking issues
const nextDir = path.join(realCwd, '.next');
try {
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  }
} catch (_) {}

console.log('🚀 [Build] Starting Next.js frontend build...');
const defaultArgs = process.argv.includes('--webpack') ? [] : ['--turbo'];
let result = runBuild(defaultArgs);

if (result.status !== 0 && !process.argv.includes('--webpack') && !process.argv.includes('--turbo')) {
  console.log('\n⚠️  Retrying with --webpack...\n');
  result = runBuild(['--webpack']);
}

process.exit(result.status ?? 0);

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const realCwd = fs.realpathSync.native(process.cwd());

if (process.cwd() !== realCwd) {
  console.log(`[Casing Corrector] Normalizing working directory path casing for Next.js build...`);
  console.log(`From: ${process.cwd()}`);
  console.log(`To:   ${realCwd}\n`);
}

// Resolve the Next.js binary, looking in this package's node_modules first
let nextBin;
try {
  nextBin = require.resolve('next/dist/bin/next', { paths: [realCwd, path.join(__dirname, '..')] });
} catch (_e) {
  nextBin = path.join(realCwd, 'node_modules', 'next', 'dist', 'bin', 'next');
}

const nodeOptions = process.env.NODE_OPTIONS || '--max-old-space-size=4096';

// Zero-Downtime Safe Build:
// Never wipe .next in production while the server is live to prevent 404/500 downtime during builds.
const isWindows = process.platform === 'win32';
const nextDir = path.join(realCwd, '.next');
if (isWindows && process.env.NODE_ENV !== 'production' && process.argv.includes('--clean')) {
  try {
    if (fs.existsSync(nextDir)) {
      fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
    }
  } catch (_) {}
}

console.log('🚀 [Build] Starting Next.js frontend build (single-pass)...');

// Smart Hybrid Bundler:
// - On Linux / Live Production Server: Uses Next.js native default (Turbopack) for maximum build speed.
// - On Windows: Next.js 16 has an open bug with Google Fonts in Turbopack, so default to --webpack
//   unless the developer explicitly passes --turbo or --turbopack.
const isWindows = process.platform === 'win32';
const hasExplicitTurbo = process.argv.includes('--turbo') || process.argv.includes('--turbopack');
const hasExplicitWebpack = process.argv.includes('--webpack');

const buildArgs = ['build'];
if (isWindows && !hasExplicitTurbo && !hasExplicitWebpack) {
  buildArgs.push('--webpack');
}
buildArgs.push(...process.argv.slice(2));

const result = spawnSync(process.execPath, [nextBin, ...buildArgs], {
  cwd: realCwd,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: nodeOptions,
    PWD: realCwd,
    INIT_CWD: realCwd,
  }
});

if (result.status !== 0) {
  console.error(`\n❌ [Build] Next.js frontend build failed with exit code ${result.status}`);
  process.exit(result.status || 1);
}

console.log('\n✅ [Build] Next.js frontend build completed successfully.');
process.exit(0);

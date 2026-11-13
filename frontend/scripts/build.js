const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

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
const distDirName = process.env.NEXT_DIST_DIR || '.next';
const nextDir = path.join(realCwd, distDirName);
if (isWindows && process.env.NODE_ENV !== 'production' && process.argv.includes('--clean')) {
  try {
    if (fs.existsSync(nextDir)) {
      fs.rmSync(nextDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
    }
  } catch (_) {}
}

console.log('🚀 [Build] Starting Next.js frontend build (single-pass)...');

// Production Bundler:
// Always default to --webpack for 100% stability with Google Fonts and CSS chunk serving across Linux and Windows.
// Pass --turbo explicitly if experimental Turbopack build is desired.
const hasExplicitTurbo = process.argv.includes('--turbo') || process.argv.includes('--turbopack');
const hasExplicitWebpack = process.argv.includes('--webpack');

const buildArgs = ['build'];
if (!hasExplicitTurbo) {
  buildArgs.push('--webpack');
}
buildArgs.push(...process.argv.slice(2));

const child = spawn(process.execPath, [nextBin, ...buildArgs], {
  cwd: realCwd,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: nodeOptions,
    PWD: realCwd,
    INIT_CWD: realCwd,
  }
});

// Guard against manifest write race conditions:
// Next.js finalizes static routes by writing _ssgManifest.js into .next/static/<buildId>/_ssgManifest.js.
// If the static/<buildId> folder is not created in advance or was removed during concurrent operations,
// fs.writeFile throws ENOENT. This active watcher guarantees that static/<buildId> exists as soon as BUILD_ID is generated.
const guardInterval = setInterval(() => {
  try {
    const buildIdFile = path.join(nextDir, 'BUILD_ID');
    if (fs.existsSync(buildIdFile)) {
      const buildId = fs.readFileSync(buildIdFile, 'utf-8').trim();
      if (buildId) {
        const staticBuildDir = path.join(nextDir, 'static', buildId);
        if (!fs.existsSync(staticBuildDir)) {
          fs.mkdirSync(staticBuildDir, { recursive: true });
        }
      }
    }
  } catch (_) {}
}, 300);

child.on('close', (code) => {
  clearInterval(guardInterval);
  if (code !== 0) {
    console.error(`\n❌ [Build] Next.js frontend build failed with exit code ${code}`);
    process.exit(code || 1);
  }
  console.log('\n✅ [Build] Next.js frontend build completed successfully.');
  process.exit(0);
});

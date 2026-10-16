const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const realCwd = fs.realpathSync.native(process.cwd());

if (process.cwd() !== realCwd) {
  console.log(`[Casing Corrector] Normalizing working directory path casing for Next.js...`);
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

const devArgs = ['dev'];
if (process.env.PORT && !process.argv.includes('-p') && !process.argv.includes('--port')) {
  devArgs.push('-p', process.env.PORT);
}
if (!process.argv.includes('-H') && !process.argv.includes('--hostname')) {
  devArgs.push('-H', '0.0.0.0');
}
devArgs.push(...process.argv.slice(2));

const nodeOptions = process.env.NODE_OPTIONS || '--max-old-space-size=4096';

const child = spawn(process.execPath, [nextBin, ...devArgs], {
  cwd: realCwd,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: nodeOptions,
    PWD: realCwd,
    INIT_CWD: realCwd,
  }
});

let cleanedUp = false;
const cleanup = () => {
  if (cleanedUp) return;
  cleanedUp = true;
  if (child && child.pid && !child.killed) {
    try {
      if (process.platform === 'win32') {
        require('child_process').execSync(`taskkill /pid ${child.pid} /T /F`, { stdio: 'ignore' });
      } else {
        child.kill('SIGTERM');
      }
    } catch (_) {}
  }
};

process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

process.on('exit', () => {
  cleanup();
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});


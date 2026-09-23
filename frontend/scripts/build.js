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

const result = spawnSync(process.execPath, ['--max-old-space-size=4096', nextBin, 'build', ...process.argv.slice(2)], {
  cwd: realCwd,
  stdio: 'inherit',
  env: {
    ...process.env,
    PWD: realCwd,
    INIT_CWD: realCwd,
  }
});

process.exit(result.status ?? 0);

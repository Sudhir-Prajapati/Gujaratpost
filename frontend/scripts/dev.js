const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const realCwd = fs.realpathSync.native(process.cwd());

if (process.cwd() !== realCwd) {
  console.log(`[Casing Corrector] Normalizing working directory path casing for Next.js...`);
  console.log(`From: ${process.cwd()}`);
  console.log(`To:   ${realCwd}\n`);
}

const nextBin = path.join(realCwd, 'node_modules', 'next', 'dist', 'bin', 'next');

const child = spawn(process.execPath, [nextBin, 'dev', ...process.argv.slice(2)], {
  cwd: realCwd,
  stdio: 'inherit',
  env: {
    ...process.env,
    PWD: realCwd,
    INIT_CWD: realCwd,
  }
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});

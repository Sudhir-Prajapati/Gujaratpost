const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const realCwd = fs.realpathSync.native(process.cwd());

if (process.cwd() !== realCwd) {
  console.log(`[Casing Corrector] Normalizing working directory path casing for Next.js...`);
  console.log(`From: ${process.cwd()}`);
  console.log(`To:   ${realCwd}\n`);
}

const devArgs = ['dev'];
if (process.env.PORT && !process.argv.includes('-p') && !process.argv.includes('--port')) {
  devArgs.push('-p', process.env.PORT);
}
if (!process.argv.includes('-H') && !process.argv.includes('--hostname')) {
  devArgs.push('-H', '0.0.0.0');
}
devArgs.push(...process.argv.slice(2));

const child = spawn(process.execPath, [nextBin, ...devArgs], {
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

const fs = require('fs');
const { spawnSync } = require('child_process');

const realCwd = fs.realpathSync.native(process.cwd());

if (process.cwd() !== realCwd) {
  console.log(`[Casing Corrector] Detected casing mismatch in working directory.`);
  console.log(`Current CWD: ${process.cwd()}`);
  console.log(`Real CWD:    ${realCwd}`);
  console.log(`Rerunning build in the correct casing...\n`);

  const result = spawnSync('npm', ['run', 'build'], {
    cwd: realCwd,
    stdio: 'inherit',
    shell: true
  });
  process.exit(result.status ?? 0);
} else {
  const result = spawnSync('npx', ['next', 'build'], {
    cwd: realCwd,
    stdio: 'inherit',
    shell: true
  });
  process.exit(result.status ?? 0);
}

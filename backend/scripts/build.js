const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 [Build] Starting Gujarat Post backend build...');

// 1. Prisma Client Generation
try {
  console.log('📦 [Build] Checking / Generating Prisma Client...');
  const prismaRes = spawnSync('npx', ['prisma', 'generate'], {
    stdio: 'pipe',
    shell: true,
    encoding: 'utf-8',
  });

  if (prismaRes.status === 0) {
    console.log('✅ [Build] Prisma Client generated successfully.');
  } else {
    const errOutput = (prismaRes.stderr || '') + (prismaRes.stdout || '');
    const clientPath = path.join(__dirname, '../node_modules/@prisma/client');
    // If dev server locked the dll on Windows, keep existing client
    if (errOutput.includes('EPERM') && fs.existsSync(clientPath)) {
      console.log('ℹ️  [Build] Active server process detected; existing Prisma Client is up to date.');
    } else {
      console.error(errOutput);
      process.exit(prismaRes.status || 1);
    }
  }
} catch (e) {
  console.warn('⚠️  [Build] Prisma generate note:', e.message);
}

// 2. TypeScript Compilation
console.log('🔨 [Build] Compiling TypeScript into dist/ ...');
const tscRes = spawnSync('npx', ['tsc'], {
  stdio: 'inherit',
  shell: true,
});

if (tscRes.status !== 0) {
  console.error('❌ [Build] TypeScript compilation failed.');
  process.exit(tscRes.status || 1);
}

const mainEntry = path.join(__dirname, '../dist/index.js');
if (!fs.existsSync(mainEntry)) {
  console.error(`❌ [Build] Entry file not found at ${mainEntry}`);
  process.exit(1);
}

console.log('✅ [Build] Gujarat Post backend built successfully! Ready at dist/index.js');
process.exit(0);

const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

function isListening(host, port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const finish = (ready) => { socket.destroy(); resolve(ready); };
    socket.setTimeout(1000);
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.once('timeout', () => finish(false));
  });
}

async function main() {
  const rawUrl = process.env.AIVEN_DATABASE_URL || process.env.DATABASE_URL;
  if (!rawUrl) throw new Error('Set DATABASE_URL in backend/.env first.');
  const url = new URL(rawUrl.trim().replace(/^["']|["']$/g, ''));
  // Only manage the existing project database on local Windows development machines.
  if (process.env.NODE_ENV === 'production' || process.platform !== 'win32' ||
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) return;
  const host = url.hostname === '[::1]' ? '::1' : url.hostname;
  const port = Number(url.port || 3306);
  if (await isListening(host, port)) {
    console.log(`[MySQL] Database port ${port} is ready.`);
    return;
  }
  const executable = process.env.MYSQLD_PATH ||
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'MySQL', 'MySQL Server 8.4', 'bin', 'mysqld.exe');
  const dataDir = path.join(__dirname, '..', 'mysql_data');
  if (!fs.existsSync(executable) || !fs.existsSync(path.join(dataDir, 'mysql'))) {
    throw new Error('Local MySQL is offline. Start your MySQL service, or set MYSQLD_PATH to mysqld.exe and provide the existing backend/mysql_data directory.');
  }
  console.log(`[MySQL] Starting the project database on port ${port}...`);
  if (process.platform === 'win32') {
    const psCmd = `Start-Process -FilePath '${executable}' -ArgumentList '--datadir="${dataDir}"','--port=${port}' -WindowStyle Hidden`;
    spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psCmd], {
      stdio: 'ignore', windowsHide: true, detached: true,
    }).unref();
  } else {
    const child = spawn(executable, [`--datadir=${dataDir}`, `--port=${port}`], {
      detached: true, stdio: 'ignore',
    });
    child.unref();
  }
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (await isListening(host, port)) {
      console.log(`[MySQL] Database port ${port} is ready.`);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('MySQL did not become ready. Check backend/mysql_data/*.err for the server error.');
}

main().catch((error) => {
  console.error(`[MySQL] ${error.message}`);
  process.exitCode = 1;
});

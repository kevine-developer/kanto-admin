import net from 'node:net';
import path from 'node:path';
import { spawn } from 'node:child_process';

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, '0.0.0.0');
  });
}

async function getAvailablePort(startPort, maxTries = 10) {
  for (let i = 0; i < maxTries; i++) {
    const port = startPort + i;
    if (await isPortFree(port)) {
      return port;
    }
  }
  return startPort;
}

const preferredPort = Number(process.env.PORT) || 3001;
const port = await getAvailablePort(preferredPort);

if (port !== preferredPort) {
  console.log(
    `\x1b[33m⚠️  [Kanto Admin] Le port ${preferredPort} est occupé. Démarrage sur le port alternatif : ${port}\x1b[0m`
  );
} else {
  console.log(`\x1b[32m🚀 [Kanto Admin] Démarrage sur le port ${port}\x1b[0m`);
}

const nextBin = path.resolve(process.cwd(), 'node_modules', 'next', 'dist', 'bin', 'next');

const child = spawn(process.execPath, [nextBin, 'dev', '-p', String(port)], {
  stdio: 'inherit',
});

child.on('exit', (code) => process.exit(code ?? 0));

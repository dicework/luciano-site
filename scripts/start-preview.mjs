import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projectRoot } from './sites-env.mjs';

const args = process.argv.slice(2);
const envFile = path.join(projectRoot, '.env.local');
const hasEnvFile = args.some((arg) => arg === '--env-file' || arg.startsWith('--env-file='));
const cli = new URL('../node_modules/wrangler/bin/wrangler.js', import.meta.url);

// Use an absolute path: Wrangler otherwise resolves Worker secrets beside the built config.
const child = spawn(
  process.execPath,
  [
    fileURLToPath(cli),
    'dev',
    '--config',
    'dist/server/wrangler.json',
    '--local',
    '--persist-to',
    '.wrangler/state',
    '--ip',
    '127.0.0.1',
    '--inspector-port',
    '0',
    ...(!hasEnvFile && existsSync(envFile) ? ['--env-file', envFile] : []),
    ...args,
  ],
  { stdio: 'inherit', cwd: projectRoot },
);
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});

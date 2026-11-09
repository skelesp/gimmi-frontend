// Writes src/app/core/api/schema.ts from the API v2 contract (sc-3282).
//   npm run api:types                     contract of the test API
//   npm run api:types -- <url or path>    another contract (e.g. a local backend or a file)
// The generator has its own TypeScript 5 (tools/types), because openapi-typescript does not run on the TypeScript 6 of the app.
import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const source = process.argv[2] ?? 'https://api-test.gimmi.be/api/v2/openapi.json';
const output = resolve(here, '../../src/app/core/api/schema.ts');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

execFileSync(npm, ['ci'], { cwd: here, stdio: 'inherit', shell: process.platform === 'win32' });
execFileSync(npm, ['exec', '--', 'openapi-typescript', source, '-o', output], {
  cwd: here,
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

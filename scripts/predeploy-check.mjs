import fs from 'node:fs';
import path from 'node:path';

const required = [
  'Dockerfile', 'render.yaml', 'apps/api/src/server.js', 'apps/api/src/paymentGuard.js',
  'apps/web/index.html', 'apps/mobile/app.json', 'apps/mobile/eas.json'
];
let ok = true;
for (const p of required) {
  if (!fs.existsSync(path.resolve(p))) { console.error(`Missing: ${p}`); ok = false; }
}
const app = JSON.parse(fs.readFileSync('apps/mobile/app.json','utf8'));
if (!app.expo?.ios?.bundleIdentifier || !app.expo?.android?.package) {
  console.error('Mobile bundle/package identifier is missing.'); ok = false;
}
console.log(ok ? 'Jarvis predeploy file check passed.' : 'Jarvis predeploy file check failed.');
process.exit(ok ? 0 : 1);

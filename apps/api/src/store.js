import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../..');
const defaultFile = path.join(repoRoot, 'data', 'db.local.json');
const seedFile = path.join(repoRoot, 'data', 'db.json');
const dataFile = path.resolve(repoRoot, process.env.DATA_FILE || defaultFile);

const fallback = {
  profile: { name: 'Shiv', cards: [], preferences: {} },
  connections: [], tasks: [], approvals: [], paymentConfirmations: [], audit: [], messages: []
};

function ensure() {
  fs.mkdirSync(path.dirname(dataFile), { recursive: true });
  if (!fs.existsSync(dataFile)) {
    const seed = fs.existsSync(seedFile) ? fs.readFileSync(seedFile, 'utf8') : JSON.stringify(fallback, null, 2);
    fs.writeFileSync(dataFile, seed);
  }
}

export function readStore() {
  ensure();
  try { return { ...fallback, ...JSON.parse(fs.readFileSync(dataFile, 'utf8')) }; }
  catch { return structuredClone(fallback); }
}

export function writeStore(data) {
  ensure();
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

import fs from 'node:fs';

import { analyze, parseJsonl, renderDashboard } from './analyze.js';

const argumentsList = process.argv.slice(2);
if (!argumentsList[0]) {
  console.error('usage: node src/cli.js events.jsonl --out dashboard.html');
  process.exit(2);
}

const outputIndex = argumentsList.indexOf('--out');
if (outputIndex >= 0 && !argumentsList[outputIndex + 1]) {
  console.error('--out requires a path');
  process.exit(2);
}
const output = outputIndex >= 0 ? argumentsList[outputIndex + 1] : 'dashboard.html';
const events = parseJsonl(fs.readFileSync(argumentsList[0], 'utf8'));
const summary = analyze(events);
fs.writeFileSync(output, renderDashboard(summary));
console.log(JSON.stringify(summary, null, 2));

/* tools/test-report — runs the suite and writes timestamped reports:
   JUnit XML (machine-readable, what CI dashboards ingest) and an HTML page
   (human-readable, needs @vitest/ui). Timestamps keep successive local runs
   from overwriting each other. reports/ is gitignored.
   Usage: npm run test:report */

import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

/* ISO timestamp, made filename-safe: colons out, milliseconds dropped. */
const stamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+$/, '');
const junitFile = `reports/junit-${stamp}.xml`;
const htmlFile = `reports/html-${stamp}/index.html`;

mkdirSync('reports', { recursive: true });

const result = spawnSync(
  'npx vitest run --reporter=default --reporter=junit --reporter=html ' +
    `--outputFile.junit=${junitFile} --outputFile.html=${htmlFile}`,
  { stdio: 'inherit', shell: true },
);

console.log(`\njunit: ${junitFile}`);
console.log(`html:  ${htmlFile}  (serve the folder to view, e.g. npx serve reports/html-${stamp})`);
process.exit(result.status ?? 1);

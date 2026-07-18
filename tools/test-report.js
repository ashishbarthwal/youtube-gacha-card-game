/* tools/test-report — runs the suite, writes a timestamped JUnit XML, then
   renders it into a single self-contained HTML report. No dependencies, no
   server: the HTML is a document, not an app — double-click opens it, and it
   still opens in ten years. (DECISIONS.md: chosen over @vitest/ui's app-style
   report.) reports/ is gitignored; CI uploads it as the run artifact.
   Usage: npm run test:report */

import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

/* ISO timestamp, made filename-safe: colons out, milliseconds dropped. */
const stamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+$/, '');
const junitFile = `reports/junit-${stamp}.xml`;
const htmlFile = `reports/report-${stamp}.html`;

mkdirSync('reports', { recursive: true });

const result = spawnSync(
  `npx vitest run --reporter=default --reporter=junit --outputFile.junit=${junitFile}`,
  { stdio: 'inherit', shell: true },
);

/* Render even when tests fail — a red run is exactly when the report matters. */
if (existsSync(junitFile)) {
  writeFileSync(htmlFile, render(readFileSync(junitFile, 'utf8')));
  console.log(`\njunit: ${junitFile}`);
  console.log(`html:  ${htmlFile}  (self-contained — just open it)`);
} else {
  console.error('\nno JUnit file was produced; skipping HTML render');
}
process.exit(result.status ?? 1);

/* ---- JUnit XML -> HTML ---------------------------------------------------
   Vitest's JUnit output is regular enough for a small hand parser: suites
   hold cases, cases hold an optional <failure> (or <skipped/>). Attribute
   values are XML-escaped, so unescape on the way in, HTML-escape on the way
   out. */

function unescapeXml(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function attrsOf(tag) {
  const out = {};
  for (const m of tag.matchAll(/([\w-]+)="([^"]*)"/g)) out[m[1]] = unescapeXml(m[2]);
  return out;
}

function parse(xml) {
  const root = attrsOf(xml.match(/<testsuites\b[^>]*>/)?.[0] ?? '');
  const suites = [];
  for (const s of xml.matchAll(/<testsuite\b([^>]*)>([\s\S]*?)<\/testsuite>/g)) {
    const suite = { ...attrsOf(s[1]), cases: [] };
    for (const c of s[2].matchAll(/<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g)) {
      const kase = attrsOf(c[1]);
      const body = c[2] ?? '';
      const failure = body.match(/<failure\b([^>]*)>([\s\S]*?)<\/failure>/);
      if (failure) kase.failure = { ...attrsOf(failure[1]), text: unescapeXml(failure[2]).trim() };
      if (/<skipped\b/.test(body)) kase.skipped = true;
      suite.cases.push(kase);
    }
    suites.push(suite);
  }
  return { root, suites };
}

function render(xml) {
  const { root, suites } = parse(xml);
  const failures = Number(root.failures ?? 0) + Number(root.errors ?? 0);
  const verdict = failures === 0 ? 'PASS' : 'FAIL';

  const suiteHtml = suites.map(suite => `
  <section>
    <h2>${escapeHtml(suite.name)} <small>${suite.tests} tests · ${suite.failures} failures · ${Number(suite.time).toFixed(2)}s</small></h2>
    <table>
      ${suite.cases.map(kase => `
      <tr class="${kase.failure ? 'fail' : kase.skipped ? 'skip' : 'pass'}">
        <td class="dot">${kase.failure ? '✕' : kase.skipped ? '○' : '✓'}</td>
        <td>${escapeHtml(kase.name)}</td>
        <td class="time">${(Number(kase.time) * 1000).toFixed(1)}ms</td>
      </tr>
      ${kase.failure ? `<tr class="detail"><td></td><td colspan="2"><pre>${escapeHtml(kase.failure.message ?? '')}\n\n${escapeHtml(kase.failure.text)}</pre></td></tr>` : ''}`).join('')}
    </table>
  </section>`).join('\n');

  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${verdict} — ${root.tests} tests — ${escapeHtml(stamp)}</title>
<style>
  body { font-family: system-ui, sans-serif; background: #150e1f; color: #f4effa;
         max-width: 860px; margin: 0 auto; padding: 32px 20px; }
  .verdict { font-size: 40px; font-weight: 800; letter-spacing: 2px;
             color: ${failures === 0 ? '#3ddc84' : '#ff2d55'}; }
  .meta { color: #a795c2; margin: 6px 0 28px; }
  h2 { font-size: 16px; border-bottom: 1px solid rgba(255,255,255,0.12);
       padding-bottom: 6px; margin: 26px 0 4px; }
  h2 small { color: #a795c2; font-weight: 400; font-size: 12px; margin-left: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  td { padding: 4px 6px; vertical-align: top; }
  .dot { width: 20px; text-align: center; }
  .pass .dot { color: #3ddc84; }
  .fail .dot, .fail td:nth-child(2) { color: #ff2d55; }
  .skip .dot { color: #a795c2; }
  .time { text-align: right; color: #a795c2; font-family: ui-monospace, monospace; font-size: 12px; white-space: nowrap; }
  .detail pre { background: rgba(255,45,85,0.08); border: 1px solid rgba(255,45,85,0.3);
                border-radius: 8px; padding: 10px 12px; margin: 2px 0 10px;
                white-space: pre-wrap; font-size: 12px; }
</style>
<div class="verdict">${verdict}</div>
<p class="meta">${root.tests} tests · ${failures} failures · ${Number(root.time).toFixed(2)}s · generated ${new Date().toISOString()}</p>
${suiteHtml}
</html>
`;
}

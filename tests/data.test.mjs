import fs from 'node:fs';
import ts from 'typescript';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

// Compile and exercise the actual UI adapter without a browser or extra test dependencies.
const sourceUrl = new URL('../src/data.ts', import.meta.url);
const require = createRequire(sourceUrl);
const source = fs.readFileSync(sourceUrl, 'utf8');
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true },
}).outputText;
const exports = {};
new Function('require', 'exports', js)(require, exports);

assert.equal(exports.profiles.length, 20);
for (const p of exports.profiles) {
  const { profile, selection, rows } = exports.getSelection(p.genderCode, p.noc);
  assert.equal(profile.id, p.id);
  assert.ok(rows.length > 0);
  assert.ok(rows.every(r => Number.isFinite(r.percent) && r.lower <= r.percent && r.upper >= r.percent));
  assert.ok(rows.every((r, i) => i === 0 || rows[i - 1].percent >= r.percent));
  const total = rows.reduce((sum, r) => sum + r.percent, 0) + (selection.pooled?.percent || 0);
  assert.ok(selection.hasUnreportedRemainder ? total < 100 : Math.abs(total - 100) < 0.0001);
  assert.ok(selection.includedPercent > 0 && selection.includedPercent <= selection.linkedPercent && selection.linkedPercent <= 100);
}
assert.throws(() => exports.getSelection('3', '4'));
console.log('All 20 UI selections pass: categories, uncertainty ranges, order, coverage and percentage totals.');

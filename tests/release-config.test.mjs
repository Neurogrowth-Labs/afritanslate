import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

test('all Vercel API rewrites target a repository function', () => {
  const { rewrites } = JSON.parse(readFileSync('vercel.json', 'utf8'));
  for (const rewrite of rewrites.filter(({ source }) => source.startsWith('/api/'))) {
    const destination = rewrite.destination.split('?')[0];
    const candidate = `${destination.replace(/^\//, '')}.ts`;
    assert.ok(existsSync(candidate), `${rewrite.source} targets missing ${candidate}`);
  }
});

test('environment files are protected from commits', () => {
  const ignoreRules = readFileSync('.gitignore', 'utf8');
  assert.match(ignoreRules, /^\.env$/m);
  assert.match(ignoreRules, /^\.env\.\*$/m);
  assert.ok(existsSync('.env.example'));
});

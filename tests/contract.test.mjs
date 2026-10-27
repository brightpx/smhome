import { strict as assert } from 'node:assert';
import fs from 'node:fs';
const md = fs.readFileSync('docs/web-api-contract.md', 'utf8');
assert.ok(md.includes('/device/pag/source-query'));
assert.ok(md.includes('eb0b9857bf4d24e73aujri'));

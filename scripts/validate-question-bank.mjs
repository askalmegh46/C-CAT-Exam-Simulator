import fs from 'node:fs';

const sql = fs.readFileSync(new URL('../supabase/seed.sql', import.meta.url), 'utf8');
const tupleRe = /\('((?:''|[^'])*)','([AB])','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)'::jsonb,(\d),'((?:''|[^'])*)','((?:''|[^'])*)','((?:''|[^'])*)'\)/g;
const rows = [];
let m;
while ((m = tupleRe.exec(sql))) {
  const unquote = s => s.replaceAll("''", "'");
  const options = JSON.parse(unquote(m[6]));
  rows.push({ id: unquote(m[1]), section: m[2], topic: unquote(m[3]), difficulty: unquote(m[4]), options, answer: Number(m[7]) });
}
if (rows.length !== 1000) throw new Error(`Expected 1000 rows, found ${rows.length}`);
if (new Set(rows.map(r => r.id)).size !== rows.length) throw new Error('Duplicate question IDs found');
for (const r of rows) {
  if (r.options.length !== 4) throw new Error(`Question ${r.id} does not have 4 options`);
  if (new Set(r.options).size !== 4) throw new Error(`Question ${r.id} has duplicate options`);
  if (![0,1,2,3].includes(r.answer)) throw new Error(`Question ${r.id} has invalid answer index`);
}
const key = r => `${r.section}|${r.topic}`;
const counts = new Map();
for (const r of rows) counts.set(key(r), (counts.get(key(r)) ?? 0) + 1);
const expected = new Map([
  ['A|English',125],['A|Quantitative Aptitude',125],['A|Reasoning',125],['A|Computer Fundamentals & Concepts of Programming',125],
  ['B|C Programming',100],['B|Data Structures',100],['B|OOP Concepts using C++',100],['B|Operating Systems & Networking',100],['B|Basics of Big Data & Artificial Intelligence',100]
]);
for (const [k,n] of expected) if (counts.get(k)!==n) throw new Error(`${k}: expected ${n}, found ${counts.get(k)}`);
console.log('Question bank validation passed: 1,000 questions; 4 Section A topics at 125 each; 5 Section B topics at 100 each.');

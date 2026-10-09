import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, '..', 'src', 'data');
const base = JSON.parse(await readFile(join(srcDir, 'dnd_spells_library.json'), 'utf8'));

const API = 'https://www.dnd5eapi.co/api/2014/spells/';

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function inferTarget(api) {
  const desc = (api.desc || []).join(' ');
  const first = desc.split(/\.\s/)[0] || '';
  const lead = first.replace(/^When you cast this spell using/, '');
  if (lead.length < 10 || lead.length > 220) return '';
  return lead.trim();
}

function normalizeStats(api) {
  if (!api) return null;

  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

  const healByLevel = {};
  const healSrc =
    api.heal_at_slot_level || api.heal_at_character_level || {};
  for (const [k, dice] of Object.entries(healSrc)) healByLevel[k] = dice;

  const damageByLevel = {};
  for (const d of api.damage || []) {
    const type = d.damage_type ? d.damage_type.name.toLowerCase() : 'unknown';
    const src = d.damage_at_slot_level || d.damage_at_character_level || {};
    for (const [k, dice] of Object.entries(src)) damageByLevel[k] = { dice, type };
  }

  return {
    attackType: api.attack_type ? cap(api.attack_type) : '',
    saveAbility: api.dc && api.dc.dc_type ? api.dc.dc_type.name : '',
    saveNote: api.dc && api.dc.dc_success ? api.dc.dc_success : '',
    target: inferTarget(api),
    aoeShape: api.area_of_effect ? cap(api.area_of_effect.type) : '',
    aoeSize: api.area_of_effect ? String(api.area_of_effect.size ?? '') : '',
    damageByLevel,
    healByLevel: Object.keys(healByLevel).length ? healByLevel : null,
  };
}

const CONCURRENCY = 6;
const queue = base.map((entry, index) => ({ entry, index }));
const results = new Array(base.length);
let failures = [];

async function fetchOne(index) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(API + index, { headers: { accept: 'application/json' } });
      if (res.status === 200) return await res.json();
      if (res.status === 404) return null;
    } catch {
      // network hiccup; retry below
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return { __error: true };
}

async function worker() {
  while (queue.length) {
    const { entry, index } = queue.shift();
    const api = await fetchOne(slugify(entry.name));
    if (api === null) {
      failures.push({ index, name: entry.name, reason: 'not-found' });
      results[index] = entry;
    } else if (api && api.__error) {
      failures.push({ index, name: entry.name, reason: 'network' });
      results[index] = entry;
    } else {
      results[index] = {
        ...entry,
        higherLevelSlot: entry.higherLevelSlot ?? (api.higher_level ? api.higher_level.join(' ') : undefined),
        stats: normalizeStats(api),
      };
    }
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, worker));

// stable order
const sorted = base.map((_, i) => results[i]);
await writeFile(join(srcDir, 'dnd_spells_enriched.json'), JSON.stringify(sorted, null, 2), 'utf8');

const enriched = sorted.filter((s) => s.stats && (s.stats.attackType || s.stats.saveAbility || (s.stats.damageByLevel && Object.keys(s.stats.damageByLevel).length) || s.stats.healByLevel || s.stats.target || s.stats.aoeShape));
console.log(`base=${base.length} enriched=${enriched.length} plain=${sorted.length - enriched.length}`);
console.log(`failures=${failures.length}`);
for (const f of failures) console.log(`  MISS ${f.reason}: ${f.name}`);
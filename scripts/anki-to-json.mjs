// Uso: node scripts/anki-to-json.mjs export.txt src/app/data/segunda.json   (o primera.json)
// Export de Anki: Archivo > Exportar > "Notas en texto plano (.txt)"
// Tildá: "Incluir HTML y medios", "Incluir etiquetas" y "Incluir GUID" (el GUID mantiene estable el id de cada tarjeta).
import { readFileSync, writeFileSync } from 'node:fs';

const [, , input, output] = process.argv;
if (!input || !output) { console.error('Uso: node scripts/anki-to-json.mjs export.txt src/app/data/segunda.json'); process.exit(1); }

const raw = readFileSync(input, 'utf8').replace(/^\uFEFF/, '');
const lines = raw.split(/\r?\n/);
const meta = {};
let i = 0;
for (; i < lines.length && lines[i].startsWith('#'); i++) {
  const m = lines[i].match(/^#([^:]+):(.*)$/);
  if (m) meta[m[1].trim()] = m[2].trim();
}
const body = lines.slice(i).join('\n');
const sep = { tab: '\t', comma: ',', semicolon: ';', space: ' ', pipe: '|', colon: ':' }[meta.separator] ?? '\t';

function parse(text) {
  const rows = []; let row = [], cell = '', q = false;
  for (let k = 0; k < text.length; k++) {
    const ch = text[k];
    if (q) {
      if (ch === '"') { if (text[k + 1] === '"') { cell += '"'; k++; } else q = false; } else cell += ch;
    } else if (ch === '"' && cell === '') q = true;
    else if (ch === sep) { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); cell = ''; if (row.some(c => c !== '')) rows.push(row); row = []; }
    else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const rows = parse(body);
const col = name => (meta[name] ? Number(meta[name]) - 1 : -1);
const guidCol = col('guid column'), tagsColMeta = col('tags column');
const special = new Set([guidCol, col('notetype column'), col('deck column')].filter(n => n >= 0));
const width = Math.max(...rows.map(r => r.length));
let tagsCol = tagsColMeta;
if (tagsCol < 0) { // sin cabecera: si sobran columnas, la última son las etiquetas
  const fieldsCount = [...Array(width).keys()].filter(n => !special.has(n)).length;
  if (fieldsCount > 11) tagsCol = width - 1;
}
if (tagsCol >= 0) special.add(tagsCol);
const fieldCols = [...Array(width).keys()].filter(n => !special.has(n));

const clean = s => (s ?? '').replace(/\[sound:[^\]]*\]/g, '').trim();
const hash = s => { let h = 5381; for (const ch of s) h = ((h << 5) + h + ch.codePointAt(0)) >>> 0; return h.toString(36); };

const seen = new Set();
const cards = rows.map(r => {
  const f = fieldCols.map(c => clean(r[c]));
  // 0 Front Phrase, 1 Front Phrase Furigana, 2 Word in known language, 3 Front notes
  // 4 Back full phrase, 5 Reading, 6 Meaning, 7 Back notes, 8-10 Audio / Audio on Front / Sort (se ignoran)
  const card = {
    id: guidCol >= 0 ? r[guidCol] : hash(f[0] + '|' + f[2] + '|' + f[6]),
    front: { phrase: f[0], furigana: f[1], word: f[2], notes: f[3] },
    back: { fullPhrase: f[4], reading: f[5], meaning: f[6], notes: f[7] },
    tags: tagsCol >= 0 ? (r[tagsCol] ?? '').split(/\s+/).filter(Boolean) : [],
  };
  if (seen.has(card.id)) { console.warn('ID repetido, se agrega sufijo:', card.id); card.id += '-' + seen.size; }
  seen.add(card.id);
  return card;
});

writeFileSync(output, JSON.stringify(cards, null, 2));
console.log(`${cards.length} tarjetas -> ${output}`);

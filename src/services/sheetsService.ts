// ── Servei preus en temps real del Google Sheets ─────────────────────────────
const SHEET_ID = '1v_w1Gh3K5MiyrlMubPw5pZKXoCjHO85BSq7aR0ka60Q';
const CACHE_MS = 2 * 60 * 1000;

export interface SheetPrice {
  name: string;
  hours: number;
  price: number;
  level: string;
  mode: string;
}

let priceCache: { data: SheetPrice[]; ts: number } | null = null;

async function fetchCSV(sheetName: string): Promise<string> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  const res = await fetch(url);
  const txt = await res.text();
  if (!res.ok || txt.trimStart().startsWith('<') || txt.length < 10) {
    throw new Error(`Full "${sheetName}" no accessible`);
  }
  return txt;
}

function parseCSV(csv: string): string[][] {
  return csv.split('\n').filter(Boolean).map(line => {
    const cols: string[] = []; let cur = '', q = false;
    for (const c of line) {
      if (c === '"') { q = !q; }
      else if (c === ',' && !q) { cols.push(cur.replace(/^"|"$/g, '').trim()); cur = ''; }
      else cur += c;
    }
    cols.push(cur.replace(/^"|"$/g, '').trim());
    return cols;
  });
}

function parsePrice(raw: string): number {
  // "125€" → 125 | "260€/sessió" → 260 | "150€/any" → 150 | "120" → 120 | "Segons Equip" → 0
  const n = parseFloat(raw.replace(/[€$\s]/g, '').split('/')[0].replace(',', '.'));
  return isFinite(n) && n > 0 ? n : 0;
}

function rowsToSheetPrices(rows: string[][]): SheetPrice[] {
  // Busquem la fila de capçalera (conté "Nom" o "Curs" o "Preu")
  const hi = rows.findIndex(r =>
    r.some(c => /nom|curs|preu|price/i.test(c))
  );
  const dataRows = hi >= 0 ? rows.slice(hi + 1) : rows.slice(1);

  return dataRows
    .filter(r => r[1] && r[3]) // cal nom (col B) i preu (col D)
    .map(r => ({
      name: r[1] ?? '',
      hours: parseInt(r[2]) || 0,
      price: parsePrice(r[3] ?? ''),
      level: r[4] ?? '',
      mode: r[5] ?? '',
    }))
    .filter(r => r.name && r.price > 0);
}

export async function getSheetPrices(): Promise<SheetPrice[]> {
  if (priceCache && Date.now() - priceCache.ts < CACHE_MS) return priceCache.data;

  // Provem els noms possibles del full en ordre
  const sheetNames = ['Preus', 'tCatàlegPreus', 'tCatalegPreus', 'Catàleg', 'Cataleg', 'Sheet1'];

  for (const name of sheetNames) {
    try {
      const csv = await fetchCSV(name);
      const rows = parseCSV(csv);
      const data = rowsToSheetPrices(rows);
      if (data.length > 0) {
        console.log(`✅ Preus carregats del full "${name}": ${data.length} cursos`);
        data.forEach(d => console.log(`  ${d.name}: ${d.hours}h · ${d.price}€`));
        priceCache = { data, ts: Date.now() };
        return data;
      }
    } catch {
      // Provar el següent
    }
  }

  console.warn('⚠️ No s\'han pogut llegir els preus del Sheets');
  return [];
}

// Normalitza un nom per al matching: minúscules, sense accents, sense caràcters especials
function normalizeName(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // treu accents
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extreu paraules significatives (exclou articles i preposicions curtes)
function keyWords(s: string): string[] {
  const stop = new Set(['a', 'de', 'del', 'la', 'les', 'el', 'els', 'i', 'per', 'per a', 'al', 'als', 'un', 'una', 'en', 'amb']);
  return normalizeName(s).split(' ').filter(w => w.length > 1 && !stop.has(w));
}

function nameScore(sheetName: string, dbName: string): number {
  const sn = normalizeName(sheetName);
  const dn = normalizeName(dbName);
  if (sn === dn) return 100;
  if (sn.includes(dn) || dn.includes(sn)) return 80;
  // Puntuació per paraules clau en comú
  const sw = keyWords(sheetName);
  const dw = keyWords(dbName);
  if (sw.length === 0 || dw.length === 0) return 0;
  const common = sw.filter(w => dw.includes(w)).length;
  const ratio = common / Math.max(sw.length, dw.length);
  return Math.round(ratio * 60);
}

// Retorna el preu del Sheets per un curs, o null si no es troba
export async function getPriceForCourse(courseName: string): Promise<number | null> {
  const prices = await getSheetPrices();
  let bestScore = 0;
  let bestPrice: number | null = null;
  for (const p of prices) {
    const score = nameScore(p.name, courseName);
    if (score > bestScore && score >= 50) { bestScore = score; bestPrice = p.price; }
  }
  return bestPrice;
}

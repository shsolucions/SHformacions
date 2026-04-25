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
      price: parseFloat((r[3] ?? '').replace(/[€EUR\s,]/g, '').trim()) || 0,
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
        data.forEach(d => console.log(`  ${d.name}: ${d.price}€`));
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

// Retorna el preu del Sheets per un curs, o null si no es troba
export async function getPriceForCourse(courseName: string): Promise<number | null> {
  const prices = await getSheetPrices();
  const name = courseName.toLowerCase().trim();
  const match = prices.find(p => {
    const pName = p.name.toLowerCase().trim();
    return pName === name || pName.includes(name) || name.includes(pName);
  });
  return match?.price ?? null;
}

// ── Servei per llegir preus en temps real del Google Sheets ──────────────────
const SHEET_ID = '1v_w1Gh3K5MiyrlMubPw5pZKXoCjHO85BSq7aR0ka60Q';
const CACHE_MS = 5 * 60 * 1000; // 5 minuts

interface SheetPrice {
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
  if (!res.ok || txt.trimStart().startsWith('<')) throw new Error('Sheets no accessible');
  return txt;
}

function parseCSV(csv: string): string[][] {
  return csv.split('\n').filter(Boolean).map(line => {
    const cols: string[] = []; let cur = '', q = false;
    for (const c of line) {
      if (c === '"') { q = !q; }
      else if (c === ',' && !q) { cols.push(cur.trim()); cur = ''; }
      else cur += c;
    }
    cols.push(cur.trim()); return cols;
  });
}

export async function getSheetPrices(): Promise<SheetPrice[]> {
  if (priceCache && Date.now() - priceCache.ts < CACHE_MS) return priceCache.data;
  try {
    const csv = await fetchCSV('tCatàlegPreus');
    const rows = parseCSV(csv);
    const hi = rows.findIndex(r => r.some(c => /Nom|Curs/i.test(c)));
    const data = (hi >= 0 ? rows.slice(hi + 1) : rows.slice(1))
      .filter(r => r[1])
      .map(r => ({
        name: r[1]?.replace(/^"|"$/g, '') ?? '',
        hours: parseInt(r[2]) || 0,
        price: parseFloat((r[3] ?? '').replace(/[€EUR,]/g, '').trim()) || 0,
        level: r[4] ?? '',
        mode: r[5] ?? '',
      }))
      .filter(r => r.name && r.price > 0);
    priceCache = { data, ts: Date.now() };
    return data;
  } catch {
    return [];
  }
}

// Busca el preu d'un curs pel nom (cerca flexible)
export async function getPriceForCourse(courseName: string): Promise<number | null> {
  const prices = await getSheetPrices();
  const name = courseName.toLowerCase();
  const match = prices.find(p => p.name.toLowerCase().includes(name) || name.includes(p.name.toLowerCase()));
  return match ? match.price : null;
}

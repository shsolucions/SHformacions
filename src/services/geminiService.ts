// ── Servei Gemini API — via proxy servidor (clau protegida) ───────────────────
// La clau API és al servidor Vercel. Mai arriba al navegador. Google no la pot bloquejar.

const SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL ?? '';
const SHEET_ID  = '1v_w1Gh3K5MiyrlMubPw5pZKXoCjHO85BSq7aR0ka60Q';

export interface ChatMessage { role: 'user' | 'model'; text: string; }

// ── Caché 5 minuts pel Sheets ─────────────────────────────────────────────────
const sheetCache: Record<string, { val: string; ts: number }> = {};

async function fetchSheet(name: string): Promise<string> {
  const k = `sheet_${name}`;
  if (sheetCache[k] && Date.now() - sheetCache[k].ts < 300000) return sheetCache[k].val;
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`;
    const res = await fetch(url);
    const txt = await res.text();
    if (!res.ok || txt.trimStart().startsWith('<') || txt.length < 20) return '';
    sheetCache[k] = { val: txt, ts: Date.now() };
    return txt;
  } catch { return ''; }
}

function csvToRows(csv: string): string[][] {
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

async function buildSystemPrompt(): Promise<string> {
  let instructions = '';
  const instrCSV = await fetchSheet('tInstruccions');
  if (instrCSV) {
    const rows = csvToRows(instrCSV);
    const txt = rows[1]?.[2] ?? '';
    if (txt.length > 80) { instructions = txt; console.log('✅ Instruccions de Sheets'); }
  }
  if (!instructions) instructions = FALLBACK_INSTRUCTIONS;

  let catalog = '';
  const catCSV = await fetchSheet('tCatàlegPreus');
  if (catCSV) {
    const rows = csvToRows(catCSV);
    const hi = rows.findIndex(r => r.some(c => /Nom|Curs/i.test(c)));
    const data = hi >= 0 ? rows.slice(hi + 1) : rows.slice(1);
    let out = 'CATALEG ACTUALITZAT:\n';
    let lastCat = '';
    for (const [cat, nom, hores, preu, nivell, mod] of data) {
      if (!nom) continue;
      const c = (cat || '').replace(/^[^\w\u00C0-\u017E]+/u, '').trim();
      if (c && c !== lastCat) { lastCat = c; out += `\n[${c}]\n`; }
      out += `* ${[nom, hores, preu, nivell, mod].filter(Boolean).join(' | ')}\n`;
    }
    catalog = out;
    console.log('✅ Cataleg de Sheets');
  } else {
    catalog = FALLBACK_CATALOG;
  }

  return `${instructions}\n\n========\n${catalog}\n========\nREGLA: Usa SEMPRE preus exactes. No inventis preus.`;
}

// ── Enviar missatge via proxy del servidor ────────────────────────────────────
export async function sendMessage(history: ChatMessage[], userText: string): Promise<string> {
  const systemPrompt = await buildSystemPrompt();

  // Filtrem missatges 'model' inicials (Gemini exigeix que comenci amb 'user')
  let start = 0;
  while (start < history.length && history[start].role === 'model') start++;
  const trimmed = history.slice(start);

  const contents = [
    ...trimmed.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: 'user' as const, parts: [{ text: userText }] }
  ];

  console.log(`📤 Enviant via proxy: ${contents.length} missatges`);

  // Cridem el nostre proxy a /api/chat (la clau és al servidor)
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents
    })
  });

  const data = await res.json() as { text?: string; error?: string };

  if (!res.ok || data.error) {
    throw new Error(data.error ?? `Error ${res.status}`);
  }

  if (!data.text) throw new Error('Resposta buida');
  // Netejem Markdown que Gemini posa malgrat les instruccions
  const cleaned = data.text
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // **negreta** → text
    .replace(/\*([^*]+)\*/g, '$1')       // *cursiva* → text
    .replace(/#{1,6}\s/g, '')            // # títols → res
    .replace(/`([^`]+)`/g, '$1');        // `codi` → text
  console.log('✅ Resposta rebuda');
  return cleaned;
}

// ── Guardar conversa al Sheets ────────────────────────────────────────────────
export async function saveConversationToSheet(payload: {
  phone: string; email: string; summary: string; courses: string; fullChat: string;
}): Promise<void> {
  if (!SHEET_URL) return;
  try {
    await fetch(SHEET_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, sheet: 'Converses' })
    });
    console.log('✅ Guardat al Sheets');
  } catch (e) { console.warn('Sheets:', e); }
}

// ── Fallbacks ─────────────────────────────────────────────────────────────────
const FALLBACK_INSTRUCTIONS = `Ets l'assistent virtual de SHformacions. Respon en catala. Ets proper i professional.
PROHIBIT ABSOLUT: No uses mai **, *, #, ##. ZERO Markdown. Text pla i emojis sempre.
Quan presentes opcions usa: 1️⃣ 2️⃣ 3️⃣ 4️⃣

MUY IMPORTANT - QUAN EL CLIENT DEMANA DATES, DISPONIBILITAT O CONTACTE:
MAI donis el telefon ni el correu de SHformacions.
SEMPRE demana les dades del CLIENT:
"Per poder enviar-te la informació i confirmar les dates disponibles, necessito les teves dades:
📱 El teu telefon (WhatsApp):
📧 El teu correu electronic:
Aixi en Said es posara en contacte amb tu directament!"`;

const FALLBACK_CATALOG = `CATALEG: Excel Inicial 10h 90EUR | Excel Intermedi 12h 140EUR | Word Inicial 8h 75EUR | Word Intermedi 12h 110EUR | PowerPoint Inicial 8h 75EUR | IA Inicial 10h 120EUR | ACTIC N1 30h 150EUR | ACTIC N2 40h 200EUR`;

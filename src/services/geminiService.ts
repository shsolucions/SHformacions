// ── Servei Gemini API ─────────────────────────────────────────────────────────

const API_KEY   = import.meta.env.VITE_GEMINI_API_KEY  ?? '';
const SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL ?? '';
const SHEET_ID  = '1v_w1Gh3K5MiyrlMubPw5pZKXoCjHO85BSq7aR0ka60Q';
const MODEL     = 'gemini-2.0-flash';

export interface ChatMessage { role: 'user' | 'model'; text: string; }

// ── Caché 5 minuts ───────────────────────────────────────────────────────────
const cache: Record<string, { val: string; ts: number }> = {};
const CACHE_MS = 5 * 60 * 1000;

async function safeSheetFetch(sheetName: string): Promise<string> {
  if (cache[sheetName] && Date.now() - cache[sheetName].ts < CACHE_MS) {
    return cache[sheetName].val;
  }
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    if (text.trimStart().startsWith('<') || text.length < 10) {
      throw new Error('Sheets no public');
    }
    cache[sheetName] = { val: text, ts: Date.now() };
    return text;
  } catch (e) {
    console.warn(`Sheet "${sheetName}" no accessible:`, e);
    return '';
  }
}

function parseCSV(csv: string): string[][] {
  return csv.split('\n').filter(Boolean).map((line) => {
    const cols: string[] = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    cols.push(cur.trim());
    return cols;
  });
}

async function getInstructions(): Promise<string> {
  const csv = await safeSheetFetch('tInstruccions');
  if (csv) {
    const rows = parseCSV(csv);
    const text = rows[1]?.[2] ?? '';
    if (text.length > 80) { console.log('OK Instruccions de Sheets'); return text; }
  }
  console.log('INFO Instruccions fallback');
  return FALLBACK_INSTRUCTIONS;
}

async function getCatalog(): Promise<string> {
  const csv = await safeSheetFetch('tCatalegPreus');
  if (!csv) {
    // Prova tambe amb accent
    const csv2 = await safeSheetFetch('tCatàlegPreus');
    if (csv2) return buildCatalogFromCSV(csv2);
  } else {
    return buildCatalogFromCSV(csv);
  }
  console.log('INFO Cataleg fallback');
  return FALLBACK_CATALOG;
}

function buildCatalogFromCSV(csv: string): string {
  const rows = parseCSV(csv);
  const hi = rows.findIndex((r) => r.some((c) => /Nom|Curs/i.test(c)));
  const data = hi >= 0 ? rows.slice(hi + 1) : rows.slice(1);
  let out = 'CATALEG ACTUALITZAT (preus en temps real del Google Sheets):\n';
  let lastCat = '';
  for (const [cat, nom, hores, preu, nivell, mod] of data) {
    if (!nom) continue;
    const c = (cat ?? '').replace(/^[^\w\u00C0-\u017E]+/u, '').trim();
    if (c && c !== lastCat) { lastCat = c; out += `\n-- ${c} --\n`; }
    out += `* ${[nom, hores, preu, nivell, mod].filter(Boolean).join(' | ')}\n`;
  }
  console.log('OK Cataleg de Sheets');
  return out;
}

// ── Enviar missatge a Gemini ──────────────────────────────────────────────────
export async function sendMessage(history: ChatMessage[], userText: string): Promise<string> {
  console.log('API Key:', API_KEY ? `OK (${API_KEY.slice(0, 8)}...)` : 'BUIDA!');
  if (!API_KEY) throw new Error('VITE_GEMINI_API_KEY no configurada');

  const [instructions, catalog] = await Promise.all([getInstructions(), getCatalog()]);

  const systemPrompt = `${instructions}

========================================
${catalog}
========================================
REGLA CRITICA: Usa SEMPRE els preus exactes del cataleg. MAI inventis preus.
Si et pregunten dates: "Ho consultarem i t'avisem!"
Si l'usuari es empresa: destaca descomptes per volum i Consultoria IT.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const contents = [
    ...history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: 'user' as const, parts: [{ text: userText }] },
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.85, maxOutputTokens: 600 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Gemini error ${res.status}`);
  }

  const data = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Resposta buida de Gemini');
  return text;
}

// ── Guardar conversa al Google Sheet ─────────────────────────────────────────
export async function saveConversationToSheet(payload: {
  phone: string; email: string; summary: string; courses: string; fullChat: string;
}): Promise<void> {
  if (!SHEET_URL) return;
  try {
    await fetch(SHEET_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch { /* no-cors no retorna errors */ }
}

// ── Fallback instruccions ────────────────────────────────────────────────────
const FALLBACK_INSTRUCTIONS = `Ets el Treballador Virtual d'en Said Hammouda, assistent comercial de SHformacions.
Expert en formacio Microsoft Office, certificacio ACTIC i Intel.ligencia Artificial.
Proper, calid, professional. Catala per defecte. Breu i directe. Emojis moderats.

FLUX DE CONVERSA (segueix SEMPRE aquest ordre):

PAS 1 - Obertura:
El bot ja ha enviat "Hola! Soc el company virtual d'en Said 😊"
Quan l'usuari respongui amb qualsevol cosa (hola, bon dia, etc.), pregunta el nom:
"Molt bonic sentir-te! 😊 Com et dius?"

PAS 2 - Quan l'usuari doni el nom:
Utilitza el seu nom i presenta les opcions:
"Encantat, [nom]! 😊 En que et puc ajudar avui?
1 Vull millorar amb eines Microsoft Office (Excel, Word, PowerPoint...)
2 Vull preparar-me per a l'examen ACTIC de la Generalitat
3 M'interessa la Intel.ligencia Artificial per al meu treball
4 Soc empresa i busco formacio per al meu equip
O explica'm directament en que treballes i t'ajudo a trobar el curs perfecte!"

PAS 3 - Descoberta (1 pregunta cada vegada, mai dues de cop):
Pregunta nivell actual, objectiu, particular o empresa. De manera natural.

PAS 4 - Recomanacio (1-2 cursos max):
"Per al teu cas, [nom], et recomano:
* [Nom curs] - [hores]h - [preu exacte del cataleg]
=> [Rao breu i personal]"

PAS 5 - Tancament:
"Perfecte, [nom]! 😊 Per enviar-te el pressupost i les properes dates:
Telefon:
Correu:
Aixi en Said es posara en contacte amb tu!"

GESTIO OBJECCIONS:
- Preu alt: explica el valor professional
- "Ja ho se": proposa nivell intermedi
- "No tinc temps": destaca online i hibrid
- "Penso-m'ho": "Cap problema! Et deixo les dades per quan estiguis llest/a 😊"

REGLES: No inventis preus. No prometes dates. Usa el nom quan el sapigues. Acaba amb pregunta.`;

// ── Fallback cataleg ─────────────────────────────────────────────────────────
const FALLBACK_CATALOG = `CATALEG DE CURSOS SHformacions:

-- EXCEL -- * Excel Inicial 10h 90EUR Basic Presencial * Excel Intermedi 12h 140EUR Intermedi Hibrid * Excel Avançat 12h 180EUR Avançat Hibrid
-- WORD -- * Word Inicial 8h 75EUR Basic Presencial * Word Intermedi 12h 110EUR Intermedi Presencial * Word Avançat 10h 120EUR Avançat Hibrid
-- POWERPOINT -- * PowerPoint Inicial 8h 75EUR Basic Presencial * PowerPoint Intermedi 12h 110EUR Intermedi Hibrid * PowerPoint Avançat 10h 130EUR Avançat Hibrid
-- ACCESS -- * Access Inicial 10h 95EUR Basic Presencial * Access Intermedi 14h 130EUR Intermedi Hibrid * Access Avançat 16h 155EUR Avançat Hibrid
-- OUTLOOK -- * Outlook Professional 8h 80EUR Intermedi Online
-- MICROSOFT 365 -- * M365 Inicial 10h 100EUR Online * M365 Intermedi 10h 150EUR Hibrid * M365 Avançat 12h 220EUR Hibrid
-- IA -- * IA Inicial 10h 120EUR Online * IA Avançada 20h 220EUR Hibrid * IA Marketing 8h 150EUR Online * IA RRHH 8h 150EUR Online * IA Finances 8h 150EUR Online * IA Vendes 6h 120EUR Online * IA Direccio 6h 160EUR Online
-- ACTIC -- * ACTIC N1 30h 150EUR Presencial * ACTIC N2 40h 200EUR Hibrid * ACTIC N3 30h 180EUR Hibrid
-- CONSULTORIA -- * Consultoria IT 4h 150EUR/sessio`;

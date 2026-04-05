// ── Servei Gemini API — versió robusta amb debug ──────────────────────────────

const API_KEY   = import.meta.env.VITE_GEMINI_API_KEY  ?? '';
const SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL ?? '';
const SHEET_ID  = '1v_w1Gh3K5MiyrlMubPw5pZKXoCjHO85BSq7aR0ka60Q';
const MODEL     = 'gemini-1.5-flash';

export interface ChatMessage { role: 'user' | 'model'; text: string; }

// ── Caché 5 minuts ────────────────────────────────────────────────────────────
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
  // Intentem llegir instruccions del Sheets
  let instructions = '';
  const instrCSV = await fetchSheet('tInstruccions');
  if (instrCSV) {
    const rows = csvToRows(instrCSV);
    const txt = rows[1]?.[2] ?? '';
    if (txt.length > 80) instructions = txt;
  }
  if (!instructions) instructions = DEFAULT_INSTRUCTIONS;

  // Intentem llegir el catàleg del Sheets
  let catalog = '';
  const catCSV = await fetchSheet('tCatàlegPreus');
  if (catCSV) {
    const rows = csvToRows(catCSV);
    const hi = rows.findIndex(r => r.some(c => /Nom|Curs/i.test(c)));
    const data = hi >= 0 ? rows.slice(hi + 1) : rows.slice(1);
    let out = 'CATALEG ACTUALITZAT (live des del Google Sheets):\n';
    let lastCat = '';
    for (const [cat, nom, hores, preu, nivell, mod] of data) {
      if (!nom) continue;
      const c = (cat || '').replace(/^[^\w\u00C0-\u017E]+/u, '').trim();
      if (c && c !== lastCat) { lastCat = c; out += `\n[${c}]\n`; }
      out += `* ${[nom, hores, preu, nivell, mod].filter(Boolean).join(' | ')}\n`;
    }
    catalog = out;
    console.log('✅ Cataleg llegit del Sheets');
  } else {
    catalog = DEFAULT_CATALOG;
    console.log('ℹ️ Cataleg: usant fallback');
  }

  return `${instructions}\n\n========\n${catalog}\n========\nREGLA: Usa SEMPRE preus exactes del cataleg. No inventis preus.`;
}

// ── Exportar sendMessage ──────────────────────────────────────────────────────
export async function sendMessage(history: ChatMessage[], userText: string): Promise<string> {
  // Verificació clau
  console.log('🔑 API Key:', API_KEY ? `OK ${API_KEY.slice(0,8)}...` : '❌ BUIDA');
  if (!API_KEY) throw new Error('VITE_GEMINI_API_KEY no configurada a Vercel → Settings → Environment Variables');

  const systemPrompt = await buildSystemPrompt();

  // Construïm l'historial garantint que comença amb 'user'
  const safeHistory = history.filter(m => m.role === 'user' || m.role === 'model');
  // Eliminem missatges 'model' del principi (Gemini exigeix que comenci amb 'user')
  let start = 0;
  while (start < safeHistory.length && safeHistory[start].role === 'model') start++;
  const trimmedHistory = safeHistory.slice(start);

  const contents = [
    ...trimmedHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: 'user' as const, parts: [{ text: userText }] }
  ];

  console.log(`📤 Enviant a Gemini: ${contents.length} missatges`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { temperature: 0.85, maxOutputTokens: 500 }
  };

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch (networkErr) {
    console.error('❌ Error de xarxa:', networkErr);
    throw new Error(`Error de xarxa: ${networkErr}`);
  }

  const data = await res.json().catch(() => ({})) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    error?: { message?: string; code?: number };
  };

  if (!res.ok || data.error) {
    const errMsg = data.error?.message ?? `HTTP ${res.status}`;
    console.error('❌ Gemini API error:', errMsg, data);
    throw new Error(errMsg);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error('❌ Resposta buida:', JSON.stringify(data));
    throw new Error('Resposta buida de Gemini');
  }

  console.log('✅ Resposta rebuda:', text.slice(0, 60) + '...');
  return text;
}

// ── Guardar conversa ──────────────────────────────────────────────────────────
export async function saveConversationToSheet(payload: {
  phone: string; email: string; summary: string; courses: string; fullChat: string;
}): Promise<void> {
  if (!SHEET_URL) { console.warn('VITE_GOOGLE_SHEET_URL no configurada'); return; }
  try {
    await fetch(SHEET_URL, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log('✅ Conversa guardada al Sheets');
  } catch (e) { console.warn('⚠️ No s\'ha pogut guardar al Sheets:', e); }
}

// ── Instruccions per defecte ──────────────────────────────────────────────────
const DEFAULT_INSTRUCTIONS = `Ets el Treballador Virtual d'en Said Hammouda, assistent de SHformacions.
Ets proper, calid, professional. Catala per defecte. Breu i directe.

FLUX:
1. Salutacio inicial ja enviada. Quan usuari saluda -> demana el nom.
2. Quan dona el nom -> saluda per nom i presenta les 4 opcions:
   "Encantat [nom]! En que et puc ajudar?
   1 Microsoft Office (Excel, Word, PowerPoint...)
   2 ACTIC de la Generalitat
   3 Intel.ligencia Artificial
   4 Formacio per a empreses"
3. Una pregunta cada vegada. Descobreix: nivell, objectiu, particular/empresa, nombre persones.
4. Recomana 1-2 cursos amb preu exacte del cataleg.
5. Tancament: demana telefon i correu per enviar pressupost.
   Si es empresa de mes de 10 persones: aplica 10% de descompte i menciona-ho.`;

const DEFAULT_CATALOG = `CATALEG SHFORMACIONS:
[EXCEL] * Excel Inicial 10h 90EUR Basic Presencial * Excel Intermedi 12h 140EUR Intermedi Hibrid * Excel Avançat 12h 180EUR Avançat Hibrid
[WORD] * Word Inicial 8h 75EUR Basic Presencial * Word Intermedi 12h 110EUR Intermedi Presencial * Word Avançat 10h 120EUR Avançat Hibrid
[POWERPOINT] * PowerPoint Inicial 8h 75EUR Basic Presencial * PowerPoint Intermedi 12h 110EUR * PowerPoint Avançat 10h 130EUR
[ACCESS] * Access Inicial 10h 95EUR * Access Intermedi 14h 130EUR * Access Avançat 16h 155EUR
[OUTLOOK] * Outlook Professional 8h 80EUR Online
[MICROSOFT 365] * M365 Inicial 10h 100EUR Online * M365 Intermedi 10h 150EUR * M365 Avançat 12h 220EUR
[IA] * IA Inicial 10h 120EUR Online * IA Avançada 20h 220EUR Hibrid * IA Marketing 8h 150EUR * IA RRHH 8h 150EUR * IA Finances 8h 150EUR * IA Vendes 6h 120EUR * IA Direccio 6h 160EUR
[ACTIC] * ACTIC N1 30h 150EUR Presencial * ACTIC N2 40h 200EUR * ACTIC N3 30h 180EUR
[CONSULTORIA] * Consultoria IT 4h 150EUR/sessio`;

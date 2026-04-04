// ── Servei Gemini API — catàleg i instruccions des de Google Sheets ───────────

const API_KEY   = import.meta.env.VITE_GEMINI_API_KEY  ?? '';
const SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL ?? '';
const SHEET_ID  = '1v_w1Gh3K5MiyrlMubPw5pZKXoCjHO85BSq7aR0ka60Q';
const GID_PREUS         = '0';
const GID_INSTRUCCIONS  = '1574477118';
const MODEL = 'gemini-2.0-flash';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// ── Caché (5 minuts) ─────────────────────────────────────────────────────────
interface Cache { value: string; ts: number; }
const cache: Record<string, Cache> = {};
const CACHE_MS = 5 * 60 * 1000;

async function fetchCSV(gid: string): Promise<string[][]> {
  const key = `sheet_${gid}`;
  if (cache[key] && Date.now() - cache[key].ts < CACHE_MS) {
    return parseCSV(cache[key].value);
  }
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${gid}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  cache[key] = { value: text, ts: Date.now() };
  return parseCSV(text);
}

function parseCSV(csv: string): string[][] {
  return csv.split('\n')
    .filter(Boolean)
    .map((line) => {
      // Parser CSV robust: respecta comes dins de cometes
      const cols: string[] = [];
      let cur = '', inQ = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQ = !inQ; }
        else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
        else { cur += ch; }
      }
      cols.push(cur.trim());
      return cols;
    });
}

// ── Llegir instruccions del Full 2 (columna C, fila 2) ───────────────────────
async function fetchInstructions(): Promise<string> {
  try {
    const rows = await fetchCSV(GID_INSTRUCCIONS);
    // Fila 0 = capçalera (Nom | Descripció | Instruccions)
    // Fila 1 = les dades reals
    const instruccions = rows[1]?.[2] ?? '';
    if (instruccions.length > 50) return instruccions;
    throw new Error('Instruccions buides');
  } catch (err) {
    console.warn('No s\'han pogut carregar les instruccions del Sheets:', err);
    return getFallbackInstructions();
  }
}

// ── Llegir catàleg del Full 1 (Preus) ────────────────────────────────────────
async function fetchCatalog(): Promise<string> {
  try {
    const rows = await fetchCSV(GID_PREUS);
    // Fila 0 pot ser el nom de la pestanya, fila 1 és la capçalera
    // Detectem la fila de capçalera buscant "Nom del Curs"
    const headerIdx = rows.findIndex((r) => r.some((c) => c.includes('Nom del Curs')));
    const dataRows = rows.slice(headerIdx + 1);

    let catalog = 'CATÀLEG ACTUALITZAT (preus en temps real del Google Sheets):\n\n';
    let lastCat = '';

    for (const cols of dataRows) {
      const [cat, nom, hores, preu, nivell, modalitat] = cols;
      if (!nom || nom === 'Nom del Curs') continue;
      if (cat && cat !== lastCat) {
        lastCat = cat;
        catalog += `\n── ${cat.replace(/^[^\w]*/u, '').trim()} ──\n`;
      }
      const parts = [nom, hores, preu, nivell, modalitat].filter(Boolean).join(' | ');
      catalog += `• ${parts}\n`;
    }
    return catalog;
  } catch (err) {
    console.warn('No s\'ha pogut carregar el catàleg:', err);
    return getFallbackCatalog();
  }
}

// ── Enviar missatge a Gemini ─────────────────────────────────────────────────
export async function sendMessage(
  history: ChatMessage[],
  newMessage: string
): Promise<string> {
  if (!API_KEY) throw new Error('API key no configurada');

  // Carreguem instruccions + catàleg en paral·lel
  const [instruccions, catalog] = await Promise.all([
    fetchInstructions(),
    fetchCatalog(),
  ]);

  // El system prompt combina les instruccions del Sheets + el catàleg actual
  const systemPrompt = `${instruccions}

════════════════════════════════════════════
${catalog}
════════════════════════════════════════════

REGLES ESTRICTES:
❌ Usa SEMPRE els preus exactes del catàleg de dalt. Mai invents preus.
❌ Mai prometes dates concretes. Di "consultarem disponibilitat".
❌ Si et pregunten algo que no saps: "Deixa que ho consulti amb en Saïd 😊"
✅ Usa el nom de l'usuari si te'l dóna.
✅ Si menciona empresa: destaca descomptes per volum i la Consultoria IT.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  const contents = history.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));
  contents.push({ role: 'user', parts: [{ text: newMessage }] });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents,
      generationConfig: { temperature: 0.8, maxOutputTokens: 600 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err.error?.message ?? `Error ${res.status}`);
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  };
  return data.candidates?.[0]?.content?.parts?.[0]?.text
    ?? 'Ho sento, no he pogut generar una resposta.';
}

// ── Guardar conversa al Google Sheet de converses ────────────────────────────
export async function saveConversationToSheet(payload: {
  phone: string; email: string; summary: string;
  courses: string; fullChat: string;
}): Promise<void> {
  if (!SHEET_URL) return;
  try {
    await fetch(SHEET_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch { /* no-cors no retorna error */ }
}

// ── Fallbacks locals (si el Sheets no és accessible) ─────────────────────────
function getFallbackInstructions(): string {
  return `Ets el Treballador Virtual d'en Saïd Hammouda, assistent comercial especialitzat de SHformacions.
Actues com un Director Comercial expert en formació ofimàtica, certificació ACTIC i IA.

Parles en CATALÀ per defecte. Si l'usuari escriu en castellà o anglès, t'adaptes.
Ets proper, càlid i professional. Breu i directe. Emojis moderats.

Comença SEMPRE amb:
"Hola! 👋 Soc el company virtual d'en Saïd 😊 aquí per ajudar-te!

Com et dius?

En què et puc ajudar avui? Tria una opció:
1️⃣ Vull millorar amb eines Microsoft Office (Excel, Word, PowerPoint...)
2️⃣ Vull preparar-me per a l'examen ACTIC de la Generalitat
3️⃣ M'interessa la Intel·ligència Artificial per al meu treball
4️⃣ Soc empresa i busco formació per al meu equip

O si prefereixes, explica'm directament en què treballes i t'ajudo a trobar el curs perfecte 🎯"`;
}

function getFallbackCatalog(): string {
  return `CATÀLEG DE CURSOS (versió local):
• Excel Inicial | 10h | 90€ | Bàsic | Presencial
• Excel Intermedi | 12h | 140€ | Intermedi | Híbrid
• Excel Avançat | 12h | 180€ | Avançat | Híbrid
• Word Inicial | 8h | 75€ | Bàsic | Presencial
• Word Intermedi | 12h | 110€ | Intermedi | Presencial
• Word Avançat | 10h | 120€ | Avançat | Híbrid
• PowerPoint Inicial | 8h | 75€ | Bàsic | Presencial
• PowerPoint Intermedi | 12h | 110€ | Intermedi | Híbrid
• PowerPoint Avançat | 10h | 130€ | Avançat | Híbrid
• Access Inicial | 10h | 95€ | Bàsic | Presencial
• Access Intermedi | 14h | 130€ | Intermedi | Híbrid
• Access Avançat | 16h | 155€ | Avançat | Híbrid
• Outlook Professional | 8h | 80€ | Intermedi | Online
• Microsoft 365 Inicial | 10h | 100€ | Online
• Microsoft 365 Intermedi | 10h | 150€ | Híbrid
• Microsoft 365 Avançat | 12h | 220€ | Híbrid
• IA Inicial | 10h | 120€ | Online
• IA Avançada | 20h | 220€ | Híbrid
• IA Màrqueting | 8h | 150€ | Online
• IA RRHH | 8h | 150€ | Online
• IA Finances | 8h | 150€ | Online
• IA Vendes | 6h | 120€ | Online
• IA Direcció | 6h | 160€ | Online
• ACTIC Nivell 1 | 30h | 150€ | Presencial
• ACTIC Nivell 2 | 40h | 200€ | Híbrid
• ACTIC Nivell 3 | 30h | 180€ | Híbrid
• Consultoria IT | 4h | 150€/sessió`;
}

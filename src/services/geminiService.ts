// ── Servei Gemini API — catàleg i instruccions des de Google Sheets ───────────

const API_KEY   = import.meta.env.VITE_GEMINI_API_KEY  ?? '';
const SHEET_URL = import.meta.env.VITE_GOOGLE_SHEET_URL ?? '';
const SHEET_ID  = '1v_w1Gh3K5MiyrlMubPw5pZKXoCjHO85BSq7aR0ka60Q';
const MODEL = 'gemini-2.0-flash';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// ── Caché (5 minuts) ─────────────────────────────────────────────────────────
interface Cache { value: string; ts: number; }
const cache: Record<string, Cache> = {};
const CACHE_MS = 5 * 60 * 1000;

// ── Llegir CSV per NOM de pestanya (més fiable que GID) ───────────────────────
async function fetchSheetByName(sheetName: string): Promise<string[][]> {
  const key = `sheet_${sheetName}`;
  if (cache[key] && Date.now() - cache[key].ts < CACHE_MS) {
    return parseCSV(cache[key].value);
  }

  // Intentem per nom de pestanya codificat
  const encodedName = encodeURIComponent(sheetName);
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodedName}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} per a "${sheetName}"`);
  const text = await res.text();
  if (text.includes('<!DOCTYPE') || text.length < 10) {
    throw new Error(`Resposta HTML en lloc de CSV — el Sheets no és públic o el nom "${sheetName}" no existeix`);
  }
  cache[key] = { value: text, ts: Date.now() };
  return parseCSV(text);
}

function parseCSV(csv: string): string[][] {
  return csv.split('\n').filter(Boolean).map((line) => {
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

// ── Llegir instruccions de la pestanya "tInstruccions" (columna C, fila 2) ───
async function fetchInstructions(): Promise<string> {
  try {
    const rows = await fetchSheetByName('tInstruccions');
    // Fila 0 = capçalera (Nom | Descripció | Instruccions)
    // Fila 1 = dades reals — columna 2 = Instruccions
    const instruccions = rows[1]?.[2] ?? '';
    if (instruccions.length > 50) {
      console.log('✅ Instruccions carregades des del Sheets:', instruccions.slice(0, 80) + '...');
      return instruccions;
    }
    throw new Error('La cel·la C2 de tInstruccions és buida o massa curta');
  } catch (err) {
    console.warn('⚠️ Instruccions del Sheets no disponibles, usant fallback:', err);
    return getFallbackInstructions();
  }
}

// ── Llegir catàleg de la pestanya "tCatàlegPreus" ────────────────────────────
async function fetchCatalog(): Promise<string> {
  try {
    const rows = await fetchSheetByName('tCatàlegPreus');
    // Busquem la fila de capçalera (conté "Nom del Curs")
    const headerIdx = rows.findIndex((r) => r.some((c) => c.includes('Nom del Curs') || c.includes('Nom')));
    const dataRows = headerIdx >= 0 ? rows.slice(headerIdx + 1) : rows.slice(1);

    let catalog = 'CATÀLEG ACTUALITZAT DE CURSOS (preus en temps real):\n\n';
    let lastCat = '';

    for (const cols of dataRows) {
      const [cat, nom, hores, preu, nivell, modalitat] = cols;
      if (!nom || nom === 'Nom del Curs' || nom === 'Nom') continue;
      const catClean = cat?.replace(/^[^\w\u00C0-\u024F]*/u, '').trim() ?? '';
      if (catClean && catClean !== lastCat) {
        lastCat = catClean;
        catalog += `\n── ${catClean} ──\n`;
      }
      const parts = [nom, hores, preu, nivell, modalitat].filter(Boolean).join(' | ');
      catalog += `• ${parts}\n`;
    }
    console.log('✅ Catàleg carregat des del Sheets');
    return catalog;
  } catch (err) {
    console.warn('⚠️ Catàleg del Sheets no disponible, usant fallback:', err);
    return getFallbackCatalog();
  }
}

// ── Enviar missatge a Gemini ─────────────────────────────────────────────────
export async function sendMessage(
  history: ChatMessage[],
  newMessage: string
): Promise<string> {
  if (!API_KEY) throw new Error('VITE_GEMINI_API_KEY no configurada a Vercel');

  // Carreguem instruccions + catàleg en paral·lel (amb fallback automàtic)
  const [instruccions, catalog] = await Promise.all([
    fetchInstructions(),
    fetchCatalog(),
  ]);

  const systemPrompt = `${instruccions}

════════════════════════════════
${catalog}
════════════════════════════════

REGLES ADDICIONALS:
- Usa SEMPRE els preus exactes del catàleg anterior. MAI inventis preus.
- Si et pregunten dates: "Ho consultarem i t'avisem aviat 😊"
- Si et pregunten algo fora del catàleg: "Deixa que ho consulti amb en Saïd 😊"
- Si l'usuari és empresa: destaca descomptes per volum i Consultoria IT.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

  const contents = [
    ...history.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: 'user' as const, parts: [{ text: newMessage }] },
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
    const errData = await res.json().catch(() => ({})) as { error?: { message?: string; status?: string } };
    const msg = errData.error?.message ?? `Error ${res.status}`;
    throw new Error(msg);
  }

  const data = await res.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[]
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Resposta buida de Gemini');
  return text;
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
  } catch { /* no-cors no retorna errors */ }
}

// ── Fallback instruccions ────────────────────────────────────────────────────
function getFallbackInstructions(): string {
  return `Ets el Treballador Virtual d'en Saïd Hammouda, assistent comercial especialitzat de SHformacions. Actues com un Director Comercial expert en formació ofimàtica (Microsoft Office), certificació ACTIC i Intel·ligència Artificial.

PERSONALITAT: Proper, càlid i professional. Mai fred ni robòtic. Enginyós, empàtic i motivador. Parles en CATALÀ per defecte. Si l'usuari escriu en castellà o anglès, t'adaptes immediatament. Ets breu i directe. Emojis moderats.

SALUTACIÓ INICIAL - comença SEMPRE exactament amb:
"Hola! 👋 Soc el company virtual d'en Saïd 😊, aquí per ajudar-te i guiar-te de la millor manera possible.

Com et dius?

En què et puc ajudar avui? Tria una opció o escriu-me directament:
1️⃣ Vull millorar amb eines Microsoft Office (Excel, Word, PowerPoint...)
2️⃣ Vull preparar-me per a l'examen ACTIC de la Generalitat
3️⃣ M'interessa la Intel·ligència Artificial per al meu treball
4️⃣ Soc empresa i busco formació per al meu equip

O si prefereixes, explica'm directament en què treballes i t'ajudo a trobar el curs perfecte 🎯"

Quan respongui amb el seu nom, fes-li les preguntes d'una en una de manera natural. No facis totes les preguntes de cop.

Al final de la recomanació, demana de manera natural:
"Per enviar-te el pressupost i les properes dates disponibles 😊
📱 Telèfon (WhatsApp):
📧 Correu electrònic:
Així en Saïd et pot contactar personalment!"`;
}

// ── Fallback catàleg ─────────────────────────────────────────────────────────
function getFallbackCatalog(): string {
  return `CATÀLEG DE CURSOS (versió local — activa el Sheets públic per preus en temps real):

── EXCEL ── • Excel Inicial | 10h | 90€ | Bàsic | Presencial • Excel Intermedi | 12h | 140€ | Intermedi | Híbrid • Excel Avançat | 12h | 180€ | Avançat | Híbrid
── WORD ── • Word Inicial | 8h | 75€ | Bàsic | Presencial • Word Intermedi | 12h | 110€ | Intermedi | Presencial • Word Avançat | 10h | 120€ | Avançat | Híbrid
── POWERPOINT ── • PowerPoint Inicial | 8h | 75€ | Bàsic | Presencial • PowerPoint Intermedi | 12h | 110€ | Intermedi | Híbrid • PowerPoint Avançat | 10h | 130€ | Avançat | Híbrid
── ACCESS ── • Access Inicial | 10h | 95€ | Bàsic | Presencial • Access Intermedi | 14h | 130€ | Intermedi | Híbrid • Access Avançat | 16h | 155€ | Avançat | Híbrid
── OUTLOOK ── • Outlook Professional | 8h | 80€ | Intermedi | Online
── MICROSOFT 365 ── • Microsoft 365 Inicial | 10h | 100€ | Online • Microsoft 365 Intermedi | 10h | 150€ | Híbrid • Microsoft 365 Avançat | 12h | 220€ | Híbrid
── INTEL·LIGÈNCIA ARTIFICIAL ── • IA Inicial | 10h | 120€ | Online • IA Avançada | 20h | 220€ | Híbrid • IA Màrqueting | 8h | 150€ | Online • IA RRHH | 8h | 150€ | Online • IA Finances | 8h | 150€ | Online • IA Vendes | 6h | 120€ | Online • IA Direcció | 6h | 160€ | Online
── ACTIC ── • ACTIC Nivell 1 | 30h | 150€ | Presencial • ACTIC Nivell 2 | 40h | 200€ | Híbrid • ACTIC Nivell 3 | 30h | 180€ | Híbrid
── CONSULTORIA IT ── • Consultoria IT per a Empreses | 4h | 150€/sessió`;
}

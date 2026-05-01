import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Només acceptem POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // La clau API queda al servidor - MAI arriba al navegador
  const API_KEY = process.env.GEMINI_API_KEY ?? '';
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key no configurada al servidor' });
  }

  try {
    const { contents, system_instruction } = req.body;

    // Si és el primer missatge (historial buit), afegim context extra al system prompt
    const isFirstUserMessage = contents.length === 1;
    let finalSystemInstruction = system_instruction;
    if (isFirstUserMessage && system_instruction?.parts?.[0]?.text) {
      const context = [
        '',
        'CONTEXT ACTUAL: Ja has enviat la salutació inicial.',
        'L usuari acaba d escriure el seu primer missatge.',
        'La teva UNICA resposta ara ha de ser demanar el nom.',
        'Exemple: Molt de gust, encantat de saludar-te! Com et dius?',
        'NO presentes categories ni opcions. NOMES demana el nom.',
        '',
        'REGLA IMPORTANT SOBRE GRUPS:',
        'Si l usuari menciona que son 10 o mes persones, menciona SEMPRE:',
        '- 10-19 persones: 10% de descompte sobre el preu total',
        '- 20 o mes persones: 15% de descompte',
        'Exemple: "Per a un grup de 12 persones, apliquem un 10% de descompte!"'
      ].join('\n');
      finalSystemInstruction = {
        parts: [{
          text: system_instruction.parts[0].text + context
        }]
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 28000);

    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: finalSystemInstruction,
            contents,
            generationConfig: { temperature: 0.85, maxOutputTokens: 1000 }
          }),
          signal: controller.signal,
        }
      );
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message ?? 'Error Gemini' });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
}

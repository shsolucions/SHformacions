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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction,
          contents,
          generationConfig: { temperature: 0.85, maxOutputTokens: 500 }
        })
      }
    );

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

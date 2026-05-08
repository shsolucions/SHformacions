import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== process.env.VITE_ADMIN_SHARED_SECRET) {
    return res.status(401).json({ error: 'No autoritzat' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return res.status(500).json({ error: 'Supabase no configurat al servidor' });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('diplomas')
      .select('*')
      .order('issued_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data ?? []);
  }

  if (req.method === 'DELETE') {
    const { id, user_id, verification_code } = req.body as {
      id: string; user_id: string; verification_code?: string;
    };
    if (!id) return res.status(400).json({ error: 'id requerit' });

    if (user_id && verification_code) {
      await supabase.storage
        .from('diplomas')
        .remove([`${user_id}/${verification_code}.pdf`])
        .catch(() => { /* ignorem errors d'storage si el fitxer ja no existeix */ });
    }

    const { error } = await supabase.from('diplomas').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Mètode no permès' });
}

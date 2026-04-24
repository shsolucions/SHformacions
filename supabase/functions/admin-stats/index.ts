// =====================================================================
// Supabase Edge Function — admin-stats
// =====================================================================
// Retorna estadístiques agregades del projecte per al panel d'admin.
// Protegida per un header secret (x-admin-secret) + service_role interna.
//
// Accions (query param ?action=...):
//   · summary    (per defecte) — comptadors + 5 últims de cada taula
//   · budgets    — llistat paginat de pressuposts
//   · users      — llistat paginat de profiles
//   · diplomas   — llistat paginat de diplomes
//
// Paràmetres comuns:
//   · limit (default 20, màx 100)
//   · offset (default 0)
//
// Desplegament:
//   supabase functions deploy admin-stats --no-verify-jwt
//   supabase secrets set ADMIN_SHARED_SECRET=<un-valor-llarg-aleatori>
//
// El client ha d'enviar el header:
//   x-admin-secret: <mateix valor>
// =====================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ADMIN_SHARED_SECRET = Deno.env.get('ADMIN_SHARED_SECRET')!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-admin-secret, content-type',
  'Access-Control-Max-Age': '86400',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
  });
}

// timing-safe comparison per evitar timing attacks (molt bàsic)
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  // Check secret
  const secret = req.headers.get('x-admin-secret') ?? '';
  if (!ADMIN_SHARED_SECRET || !safeEqual(secret, ADMIN_SHARED_SECRET)) {
    return json({ error: 'unauthorized' }, 401);
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action') ?? 'summary';
  const limitRaw = Number(url.searchParams.get('limit') ?? '20');
  const offsetRaw = Number(url.searchParams.get('offset') ?? '0');
  const limit = Math.min(Math.max(limitRaw | 0, 1), 100);
  const offset = Math.max(offsetRaw | 0, 0);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    switch (action) {
      case 'summary': {
        const [
          usersCount,
          budgetsCount,
          diplomasCount,
          enrollmentsCount,
          recentBudgets,
          recentUsers,
          recentDiplomas,
        ] = await Promise.all([
          admin.from('profiles').select('id', { count: 'exact', head: true }),
          admin.from('budgets').select('id', { count: 'exact', head: true }),
          admin.from('diplomas').select('id', { count: 'exact', head: true }),
          admin
            .from('user_courses')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'enrolled'),
          admin
            .from('budgets')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5),
          admin
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5),
          admin
            .from('diplomas')
            .select('*')
            .order('issued_at', { ascending: false })
            .limit(5),
        ]);

        return json({
          total_users: usersCount.count ?? 0,
          total_budgets: budgetsCount.count ?? 0,
          total_diplomas: diplomasCount.count ?? 0,
          total_enrollments: enrollmentsCount.count ?? 0,
          recent_budgets: recentBudgets.data ?? [],
          recent_users: recentUsers.data ?? [],
          recent_diplomas: recentDiplomas.data ?? [],
        });
      }

      case 'budgets': {
        const { data, error, count } = await admin
          .from('budgets')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) return json({ error: error.message }, 500);
        return json({ items: data ?? [], total: count ?? 0, limit, offset });
      }

      case 'users': {
        const { data, error, count } = await admin
          .from('profiles')
          .select('*', { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) return json({ error: error.message }, 500);
        return json({ items: data ?? [], total: count ?? 0, limit, offset });
      }

      case 'diplomas': {
        const { data, error, count } = await admin
          .from('diplomas')
          .select('*', { count: 'exact' })
          .order('issued_at', { ascending: false })
          .range(offset, offset + limit - 1);
        if (error) return json({ error: error.message }, 500);
        return json({ items: data ?? [], total: count ?? 0, limit, offset });
      }

      default:
        return json({ error: 'unknown_action', action }, 400);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: 'internal_error', message: msg }, 500);
  }
});

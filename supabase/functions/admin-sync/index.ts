// =====================================================================
// Supabase Edge Function — admin-sync
// =====================================================================
// Sincronitza dades entre el Dexie local de l'admin i les taules
// admin_* al núvol. Dues operacions:
//
//   · push  → el client envia les seves dades Dexie, la funció les
//             fa upsert al núvol (resolució: el client guanya).
//   · pull  → la funció retorna totes les dades del núvol perquè
//             el client les escrigui al Dexie local (substituint).
//
// Protegida amb x-admin-secret (igual que admin-stats i issue-diploma).
//
// Entitats suportades (inicialment): "courses"
// (Extensible — afegeix cases als switch si vols "users", "payments", etc.)
//
// Push body:
// {
//   "entity": "courses",
//   "items":  [ {...}, {...}, ... ],
//   "device_id": "mbp-said" (opcional)
// }
//
// Push response:
// {
//   "ok": true,
//   "entity": "courses",
//   "upserted": 12,
//   "deleted": 0
// }
//
// Pull body:
// {
//   "entity": "courses"
// }
//
// Pull response:
// {
//   "entity": "courses",
//   "items": [ ... ],
//   "total": 12,
//   "pulled_at": "2026-04-18T..."
// }
//
// Desplegament:
//   supabase functions deploy admin-sync --no-verify-jwt
// =====================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ADMIN_SHARED_SECRET = Deno.env.get('ADMIN_SHARED_SECRET')!;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-admin-secret, content-type',
  'Access-Control-Max-Age': '86400',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
  });
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

// ---------------------------------------------------------------------
// TIPUS — han de coincidir amb els de Dexie (src/types/index.ts)
// ---------------------------------------------------------------------

interface CourseDexie {
  id?: number;
  name: string;
  description: string;
  category: string;
  level: string;
  format: string;
  duration: number;
  price: number;
  maxStudents: number;
  currentStudents: number;
  instructor?: string;
  location?: string;
  startDate?: number;    // Dexie usa epoch ms
  endDate?: number;
  status: string;
  tags?: string;
  objectives?: string;
  targetAudience?: string;
  createdAt: number;
  updatedAt: number;
}

// ---------------------------------------------------------------------
// TRANSFORMACIONS Dexie ↔ Cloud
// ---------------------------------------------------------------------

function courseDexieToCloud(c: CourseDexie) {
  if (!c.id) throw new Error('course sense id');
  return {
    local_id: c.id,
    name: c.name,
    description: c.description ?? '',
    category: c.category,
    level: c.level,
    format: c.format,
    duration: c.duration ?? 0,
    price: c.price ?? 0,
    max_students: c.maxStudents ?? 0,
    current_students: c.currentStudents ?? 0,
    instructor: c.instructor ?? null,
    location: c.location ?? null,
    start_date: c.startDate ? new Date(c.startDate).toISOString() : null,
    end_date: c.endDate ? new Date(c.endDate).toISOString() : null,
    status: c.status,
    tags: c.tags ?? null,
    objectives: c.objectives ?? null,
    target_audience: c.targetAudience ?? null,
    created_at: new Date(c.createdAt).toISOString(),
    synced_at: new Date().toISOString(),
  };
}

function courseCloudToDexie(c: Record<string, unknown>): CourseDexie {
  return {
    id: c.local_id as number,
    name: c.name as string,
    description: (c.description as string) ?? '',
    category: c.category as string,
    level: c.level as string,
    format: c.format as string,
    duration: Number(c.duration ?? 0),
    price: Number(c.price ?? 0),
    maxStudents: Number(c.max_students ?? 0),
    currentStudents: Number(c.current_students ?? 0),
    instructor: (c.instructor as string) ?? undefined,
    location: (c.location as string) ?? undefined,
    startDate: c.start_date ? new Date(c.start_date as string).getTime() : undefined,
    endDate: c.end_date ? new Date(c.end_date as string).getTime() : undefined,
    status: c.status as string,
    tags: (c.tags as string) ?? undefined,
    objectives: (c.objectives as string) ?? undefined,
    targetAudience: (c.target_audience as string) ?? undefined,
    createdAt: c.created_at ? new Date(c.created_at as string).getTime() : Date.now(),
    updatedAt: c.updated_at ? new Date(c.updated_at as string).getTime() : Date.now(),
  };
}

// ---------------------------------------------------------------------
// HANDLERS
// ---------------------------------------------------------------------

async function handlePush(
  admin: ReturnType<typeof createClient>,
  entity: string,
  items: unknown[],
  deviceId: string | null
) {
  if (entity === 'courses') {
    const rows = (items as CourseDexie[]).map(courseDexieToCloud);

    // Upsert per local_id
    const { error: upErr, count } = await admin
      .from('admin_courses')
      .upsert(rows, { onConflict: 'local_id', count: 'exact' });
    if (upErr) {
      return json({ error: 'upsert_failed', message: upErr.message }, 500);
    }

    // Registrar log
    await admin.from('admin_sync_log').insert({
      operation: 'push',
      entity: 'courses',
      items_count: rows.length,
      device_id: deviceId,
    });

    return json({
      ok: true,
      entity: 'courses',
      upserted: count ?? rows.length,
      deleted: 0,
    });
  }

  return json({ error: 'unknown_entity', entity }, 400);
}

async function handlePull(
  admin: ReturnType<typeof createClient>,
  entity: string,
  deviceId: string | null
) {
  if (entity === 'courses') {
    const { data, error } = await admin
      .from('admin_courses')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      return json({ error: 'select_failed', message: error.message }, 500);
    }

    const items = (data ?? []).map(courseCloudToDexie);

    await admin.from('admin_sync_log').insert({
      operation: 'pull',
      entity: 'courses',
      items_count: items.length,
      device_id: deviceId,
    });

    return json({
      entity: 'courses',
      items,
      total: items.length,
      pulled_at: new Date().toISOString(),
    });
  }

  return json({ error: 'unknown_entity', entity }, 400);
}

// ---------------------------------------------------------------------
// ENTRY POINT
// ---------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  const secret = req.headers.get('x-admin-secret') ?? '';
  if (!ADMIN_SHARED_SECRET || !safeEqual(secret, ADMIN_SHARED_SECRET)) {
    return json({ error: 'unauthorized' }, 401);
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action'); // 'push' | 'pull'

  if (action !== 'push' && action !== 'pull') {
    return json({ error: 'unknown_action', expected: ['push', 'pull'] }, 400);
  }

  let body: { entity?: string; items?: unknown[]; device_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  if (!body.entity) {
    return json({ error: 'missing_entity' }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    if (action === 'push') {
      if (!Array.isArray(body.items)) {
        return json({ error: 'items_must_be_array' }, 400);
      }
      return await handlePush(admin, body.entity, body.items, body.device_id ?? null);
    } else {
      return await handlePull(admin, body.entity, body.device_id ?? null);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: 'internal_error', message: msg }, 500);
  }
});

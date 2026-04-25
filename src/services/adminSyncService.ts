import { db } from '../db/database';
import type { Course } from '../types';

/**
 * Client de sincronització Dexie ↔ Supabase (via Edge Function admin-sync).
 * NOMÉS ÚS ADMIN.
 *
 * Flux típic:
 *   · Després d'editar cursos en un dispositiu → push()
 *   · Abans de començar a treballar en un altre dispositiu → pull()
 *
 * Resolució de conflictes:
 *   · Push: el client sobreescriu el núvol (upsert per local_id)
 *   · Pull: el núvol sobreescriu Dexie (clear + bulkPut)
 *
 * Aquesta és la resolució més simple. Si l'admin treballa alhora en dos
 * dispositius, la darrera operació "guanya". Això és acceptable per un
 * admin unipersonal. Si volguéssiu multi-admin o multi-device concurrent
 * caldria un CRDT o timestamps vs 'Last-Write-Wins'.
 */

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SHARED_SECRET as string | undefined;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

const LAST_PUSH_KEY = 'shformacions_last_push';
const LAST_PULL_KEY = 'shformacions_last_pull';
const LAST_SYNC_COUNT_KEY = 'shformacions_last_sync_count';
const DEVICE_ID_KEY = 'shformacions_device_id';

export type SyncEntity = 'courses';

export interface SyncResult {
  ok: boolean;
  entity: SyncEntity;
  count: number;
  at: string;
}

/** Genera o recupera un device_id persistent per a aquest navegador. */
function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `dev-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

async function callAdminSync(
  action: 'push' | 'pull',
  body: Record<string, unknown>
): Promise<unknown> {
  if (!SUPABASE_URL) throw new Error('VITE_SUPABASE_URL no configurat');
  if (!ADMIN_SECRET) throw new Error('VITE_ADMIN_SHARED_SECRET no configurat');

  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/admin-sync?action=${action}`,
    {
      method: 'POST',
      headers: {
        'x-admin-secret': ADMIN_SECRET,
        'content-type': 'application/json',
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    let detail = '';
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      /* ignore */
    }
    throw new Error(`admin-sync[${action}] ${res.status}: ${detail}`);
  }
  return await res.json();
}

export const adminSyncService = {
  /**
   * Retorna metadata del local per mostrar abans d'un push/pull.
   */
  async localSummary(): Promise<{
    users: number;
    courses: number;
    payments: number;
    requests: number;
    notifications: number;
    settings: number;
  }> {
    const [users, courses, payments, requests, notifications, settings] =
      await Promise.all([
        db.users.count(),
        db.courses.count(),
        db.payments.count(),
        db.requests.count(),
        db.notifications.count(),
        db.settings.count(),
      ]);
    return { users, courses, payments, requests, notifications, settings };
  },

  /** Timestamps de l'última operació (null si mai). */
  getLastSyncTimes(): { lastPush: string | null; lastPull: string | null } {
    return {
      lastPush: localStorage.getItem(LAST_PUSH_KEY),
      lastPull: localStorage.getItem(LAST_PULL_KEY),
    };
  },

  // ─── COURSES ───────────────────────────────────────────────────

  /**
   * Puja tots els cursos Dexie al núvol.
   */
  async pushCourses(): Promise<SyncResult> {
    const items = await db.courses.toArray();
    const response = (await callAdminSync('push', {
      entity: 'courses',
      items,
      device_id: getDeviceId(),
    })) as { ok: boolean; upserted: number };

    const at = new Date().toISOString();
    localStorage.setItem(LAST_PUSH_KEY, at);
    localStorage.setItem(LAST_SYNC_COUNT_KEY, String(items.length));

    return {
      ok: response.ok,
      entity: 'courses',
      count: response.upserted,
      at,
    };
  },

  /**
   * Baixa tots els cursos del núvol, **substituint** els del Dexie local.
   * (clear + bulkPut atòmic dins una transacció)
   */
  async pullCourses(): Promise<SyncResult> {
    const response = (await callAdminSync('pull', {
      entity: 'courses',
      device_id: getDeviceId(),
    })) as { entity: string; items: Course[]; total: number };

    // Escriure a Dexie de forma atòmica
    await db.transaction('rw', db.courses, async () => {
      await db.courses.clear();
      if (response.items.length > 0) {
        await db.courses.bulkPut(response.items);
      }
    });

    const at = new Date().toISOString();
    localStorage.setItem(LAST_PULL_KEY, at);
    localStorage.setItem(LAST_SYNC_COUNT_KEY, String(response.items.length));

    return {
      ok: true,
      entity: 'courses',
      count: response.total,
      at,
    };
  },
};

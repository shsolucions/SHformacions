// NOTA: Aquests tipus es defineixen localment perquè coincideixin amb els
// que afegeix l'Entrega 3.2 a `src/types/index.ts`. Si ja has aplicat 3.2,
// la forma és idèntica (podries importar-los des de '../types' i esborrar
// les declaracions d'aquí). Els deixem locals per permetre aplicar 3.3
// independentment de 3.2.

/** Perfil públic (taula profiles de Supabase). */
interface CloudProfile {
  id: string;
  nickname: string;
  name: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

interface CloudBudget {
  id: string;
  user_id: string;
  title: string;
  items: Array<{
    courseId?: number | string;
    name: string;
    price: number;
    qty: number;
    discount?: number;
    notes?: string;
  }>;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface CloudDiploma {
  id: string;
  user_id: string;
  course_key: string;
  course_name: string;
  student_name?: string;
  hours?: number;
  issued_at: string;
  pdf_url?: string;
  verification_code?: string;
  issued_by?: string;
  created_at?: string;
}

/** Resum de stats que retorna l'Edge Function admin-stats. */
interface AdminCloudStats {
  total_users: number;
  total_budgets: number;
  total_diplomas: number;
  total_enrollments: number;
  recent_budgets: CloudBudget[];
  recent_users: CloudProfile[];
  recent_diplomas: CloudDiploma[];
}

// Re-exporta els tipus per als consumidors del servei
export type {
  CloudProfile,
  CloudBudget,
  CloudDiploma,
  AdminCloudStats,
};

/**
 * Client per cridar l'Edge Function `admin-stats`.
 * Només l'admin pot invocar-la (veu el secret a .env.local).
 *
 * El secret NO va cap a Supabase directament — va cap a l'Edge Function
 * que el verifica i després usa la service_role internament.
 */

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SHARED_SECRET as string | undefined;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

function baseUrl(): string {
  if (!SUPABASE_URL) {
    throw new Error('VITE_SUPABASE_URL no configurat');
  }
  return `${SUPABASE_URL}/functions/v1/admin-stats`;
}

async function callAdminStats<T>(params: URLSearchParams): Promise<T> {
  if (!ADMIN_SECRET) {
    throw new Error('VITE_ADMIN_SHARED_SECRET no configurat');
  }
  const res = await fetch(`${baseUrl()}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'x-admin-secret': ADMIN_SECRET,
      'content-type': 'application/json',
    },
  });
  if (!res.ok) {
    let detail = '';
    try {
      detail = JSON.stringify(await res.json());
    } catch {
      /* ignore */
    }
    throw new Error(`admin-stats ${res.status}: ${detail}`);
  }
  return (await res.json()) as T;
}

export interface PagedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export const adminCloudService = {
  async summary(): Promise<AdminCloudStats> {
    return callAdminStats<AdminCloudStats>(
      new URLSearchParams({ action: 'summary' })
    );
  },

  async listBudgets(limit = 20, offset = 0): Promise<PagedResponse<CloudBudget>> {
    return callAdminStats<PagedResponse<CloudBudget>>(
      new URLSearchParams({
        action: 'budgets',
        limit: String(limit),
        offset: String(offset),
      })
    );
  },

  async listUsers(limit = 20, offset = 0): Promise<PagedResponse<CloudProfile>> {
    return callAdminStats<PagedResponse<CloudProfile>>(
      new URLSearchParams({
        action: 'users',
        limit: String(limit),
        offset: String(offset),
      })
    );
  },

  async listDiplomas(limit = 20, offset = 0): Promise<PagedResponse<CloudDiploma>> {
    return callAdminStats<PagedResponse<CloudDiploma>>(
      new URLSearchParams({
        action: 'diplomas',
        limit: String(limit),
        offset: String(offset),
      })
    );
  },
};

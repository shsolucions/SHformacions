import { supabase, requireSupabase, isCloudEnabled } from './supabase';

// =====================================================================
// TIPUS LOCALS (no exportats)
// =====================================================================
// Aquests tipus són una versió simplificada dels que acaben a
// src/types/index.ts quan s'aplica l'Entrega 3.2. Els deixem aquí com
// a `interface` privada per no crear duplicació amb els tipus globals.
// Si aplicas l'Entrega 3.2, pots substituir `CloudBudgetItem` etc. per
// imports des de '../types' — la forma és idèntica.
// =====================================================================

interface CloudBudgetItem {
  courseId?: number | string;
  name: string;
  price: number;
  qty: number;
  discount?: number;
  notes?: string;
}

interface CloudBudget {
  id: string;
  user_id: string;
  title: string;
  items: CloudBudgetItem[];
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  notes?: string;
  created_at: string;
  updated_at: string;
}

interface CloudUserCourse {
  id: string;
  user_id: string;
  course_key: string;
  course_name: string;
  status: 'interested' | 'enrolled' | 'completed' | 'cancelled';
  progress: number;
  enrolled_at?: string;
  completed_at?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface CloudDiploma {
  id: string;
  user_id: string;
  course_key: string;
  course_name: string;
  issued_at: string;
  pdf_url?: string;
  verification_code?: string;
  issued_by?: string;
  created_at?: string;
}

// Exports tipus per a compatibilitat amb codi que importi d'aquest fitxer.
// Si tens `types/index.ts` amb aquests tipus (E3.2), importa'ls d'allà en el teu codi.
export type {
  CloudBudgetItem,
  CloudBudget,
  CloudUserCourse,
  CloudDiploma,
};

// =====================================================================
// Helper: user_id de la sessió Supabase actual
// =====================================================================


const SUPABASE_UID_KEY = 'shformacions_supabase_uid';

/**
 * Retorna l'UID Supabase de la sessió actual.
 * Prioritza el localStorage (escrit per authService) per evitar crides de xarxa.
 * Si no hi és, fa fallback a `supabase.auth.getUser()` (cas edge).
 */
async function currentUserId(): Promise<string> {
  const cached = localStorage.getItem(SUPABASE_UID_KEY);
  if (cached) return cached;

  const sb = requireSupabase();
  const { data } = await sb.auth.getUser();
  if (!data.user?.id) {
    throw new Error('not_authenticated');
  }
  return data.user.id;
}

// =====================================================================
// BUDGETS
// =====================================================================

export const cloudBudgetService = {
  async list(): Promise<CloudBudget[]> {
    if (!isCloudEnabled() || !supabase) return [];
    const uid = await currentUserId();
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as CloudBudget[];
  },

  async get(id: string): Promise<CloudBudget | null> {
    if (!isCloudEnabled() || !supabase) return null;
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as CloudBudget | null;
  },

  async create(input: {
    title: string;
    items: CloudBudgetItem[];
    currency?: string;
    status?: CloudBudget['status'];
    notes?: string;
  }): Promise<CloudBudget> {
    const sb = requireSupabase();
    const uid = await currentUserId();
    const total = input.items.reduce((sum, it) => sum + it.price * it.qty, 0);

    const { data, error } = await sb
      .from('budgets')
      .insert({
        user_id: uid,
        title: input.title,
        items: input.items,
        total,
        currency: input.currency ?? 'EUR',
        status: input.status ?? 'draft',
        notes: input.notes,
      })
      .select('*')
      .single();
    if (error) throw error;
    return data as CloudBudget;
  },

  async update(
    id: string,
    patch: Partial<Pick<CloudBudget, 'title' | 'items' | 'status' | 'notes' | 'currency'>>
  ): Promise<CloudBudget> {
    const sb = requireSupabase();
    const updates: Record<string, unknown> = { ...patch };
    if (patch.items) {
      updates.total = patch.items.reduce((sum, it) => sum + it.price * it.qty, 0);
    }
    const { data, error } = await sb
      .from('budgets')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data as CloudBudget;
  },

  async remove(id: string): Promise<void> {
    const sb = requireSupabase();
    const { error } = await sb.from('budgets').delete().eq('id', id);
    if (error) throw error;
  },
};

// =====================================================================
// USER COURSES
// =====================================================================

export const cloudCourseService = {
  async list(): Promise<CloudUserCourse[]> {
    if (!isCloudEnabled() || !supabase) return [];
    const uid = await currentUserId();
    const { data, error } = await supabase
      .from('user_courses')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as CloudUserCourse[];
  },

  async upsert(input: {
    course_key: string;
    course_name: string;
    status?: CloudUserCourse['status'];
    progress?: number;
    metadata?: Record<string, unknown>;
  }): Promise<CloudUserCourse> {
    const sb = requireSupabase();
    const uid = await currentUserId();
    const payload = {
      user_id: uid,
      course_key: input.course_key,
      course_name: input.course_name,
      status: input.status ?? 'interested',
      progress: input.progress ?? 0,
      metadata: input.metadata ?? {},
      ...(input.status === 'enrolled' ? { enrolled_at: new Date().toISOString() } : {}),
      ...(input.status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
    };

    const { data, error } = await sb
      .from('user_courses')
      .upsert(payload, { onConflict: 'user_id,course_key' })
      .select('*')
      .single();
    if (error) throw error;
    return data as CloudUserCourse;
  },

  async updateStatus(
    id: string,
    status: CloudUserCourse['status'],
    progress?: number
  ): Promise<void> {
    const sb = requireSupabase();
    const patch: Record<string, unknown> = { status };
    if (typeof progress === 'number') patch.progress = progress;
    if (status === 'enrolled') patch.enrolled_at = new Date().toISOString();
    if (status === 'completed') patch.completed_at = new Date().toISOString();
    const { error } = await sb.from('user_courses').update(patch).eq('id', id);
    if (error) throw error;
  },

  async remove(id: string): Promise<void> {
    const sb = requireSupabase();
    const { error } = await sb.from('user_courses').delete().eq('id', id);
    if (error) throw error;
  },
};

// =====================================================================
// DIPLOMAS (només lectura des del client; l'emissió la fa l'Edge Function)
// =====================================================================

// Funció interna — no s'exporta com `cloudDiplomaService` perquè l'Entrega 3.4
// crea un fitxer src/services/cloudDiplomaService.ts amb un servei més complet
// (amb `issue()`, `getSignedPdfUrl()`, `verify()` via RPC, etc.). Aquí només
// tenim `list()` i `verify()` bàsics perquè `cloudUserService.diplomas`
// continuï funcionant si només tens l'Entrega 1 aplicada.
const diplomasInternal = {
  async list(): Promise<CloudDiploma[]> {
    if (!isCloudEnabled() || !supabase) return [];
    const uid = await currentUserId();
    const { data, error } = await supabase
      .from('diplomas')
      .select('*')
      .eq('user_id', uid)
      .order('issued_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as CloudDiploma[];
  },

  /**
   * Verifica un diploma pel codi de verificació.
   * NOTA: amb només l'Entrega 1 aplicada, aquesta funció només funciona
   * per al propietari autenticat del diploma (RLS bloqueja la resta).
   * L'Entrega 3.4 afegeix una funció RPC `verify_diploma_by_code` que
   * permet la verificació pública (sense ser propietari). Per accedir-hi,
   * usa `cloudDiplomaService.verify()` de 3.4 en comptes d'aquest.
   */
  async verify(verificationCode: string): Promise<CloudDiploma | null> {
    if (!isCloudEnabled() || !supabase) return null;
    const { data, error } = await supabase
      .from('diplomas')
      .select('*')
      .eq('verification_code', verificationCode)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as CloudDiploma | null;
  },
};

// =====================================================================
// EXPORT AGRUPAT
// =====================================================================

export const cloudUserService = {
  budgets: cloudBudgetService,
  courses: cloudCourseService,
  diplomas: diplomasInternal,
};

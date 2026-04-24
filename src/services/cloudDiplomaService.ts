import { supabase, isCloudEnabled } from './supabase';

/**
 * Tipus CloudDiploma local — coincideix amb l'estructura de la taula
 * `diplomas` després d'aplicar SUPABASE_SETUP.sql (E1) + SUPABASE_DIPLOMAS_SETUP.sql (E3.4).
 * Si tens aplicat l'Entrega 3.2 pots substituir-ho per `import type { CloudDiploma } from '../types'`.
 */
export interface CloudDiploma {
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

/**
 * Servei de diplomes — extensió per a l'Entrega 3.4.
 *
 * Flux:
 *   · Emissió (admin)      → `issue()` crida l'Edge Function `issue-diploma`.
 *   · Llistat propi         → `list()` (via RLS: només veus els teus).
 *   · Verificació pública   → `verify(code)` via RPC `verify_diploma_by_code`.
 *   · Renovar signed URL    → `getSignedPdfUrl()` per si expira la signed url.
 */

const ADMIN_SECRET = import.meta.env.VITE_ADMIN_SHARED_SECRET as string | undefined;
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;

export interface IssueDiplomaInput {
  user_id: string;
  course_key: string;
  course_name: string;
  student_name?: string;
  hours?: number;
  issuer_name?: string;
  issue_date?: string; // YYYY-MM-DD
}

export interface IssueDiplomaResult {
  id: string;
  verification_code: string;
  pdf_url: string | null;
  issued_at: string;
  student_name: string;
  course_name: string;
  hours?: number;
}

export const cloudDiplomaService = {
  /**
   * Llistat de diplomes de l'usuari autenticat.
   * Retorna [] si no hi ha núvol configurat (per fallback amb UI sense crash).
   */
  async list(): Promise<CloudDiploma[]> {
    if (!isCloudEnabled() || !supabase) return [];
    const { data: userResp } = await supabase.auth.getUser();
    const uid = userResp.user?.id;
    if (!uid) return [];
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
   * Funciona sense login (i també amb login). Crida una funció RPC
   * (`verify_diploma_by_code`) creada a SUPABASE_DIPLOMAS_SETUP.sql
   * que és SECURITY DEFINER i retorna només els camps públics del diploma.
   */
  async verify(verificationCode: string): Promise<CloudDiploma | null> {
    if (!isCloudEnabled() || !supabase) return null;
    const code = verificationCode.trim().toUpperCase();

    const { data, error } = await supabase.rpc('verify_diploma_by_code', { code });
    if (error) throw error;

    // La RPC retorna un array (pot ser buit o amb 1 element)
    if (!Array.isArray(data) || data.length === 0) return null;
    const d = data[0];

    // La RPC no retorna user_id ni pdf_url (són camps privats).
    // Construïm un CloudDiploma "parcial" amb els camps públics.
    return {
      id: d.id,
      user_id: '',  // no disponible públicament
      course_key: d.course_key,
      course_name: d.course_name,
      student_name: d.student_name,
      hours: d.hours ?? undefined,
      issued_at: d.issued_at,
      issued_by: d.issued_by,
      verification_code: d.verification_code,
    };
  },

  /**
   * Demana una nova signed URL per al PDF (per si l'anterior ha expirat).
   * Només el propietari pot generar la signed URL perquè la RLS del bucket
   * Storage està configurada a "propietari pel primer segment del path".
   */
  async getSignedPdfUrl(
    verificationCode: string,
    expiresSeconds = 3600
  ): Promise<string | null> {
    if (!isCloudEnabled() || !supabase) return null;
    const { data: userResp } = await supabase.auth.getUser();
    const uid = userResp.user?.id;
    if (!uid) return null;

    const path = `${uid}/${verificationCode}.pdf`;
    const { data, error } = await supabase.storage
      .from('diplomas')
      .createSignedUrl(path, expiresSeconds);
    if (error) return null;
    return data?.signedUrl ?? null;
  },

  /**
   * Emissió d'un diploma — NOMÉS ADMIN.
   * Crida l'Edge Function `issue-diploma` amb el secret compartit.
   */
  async issue(input: IssueDiplomaInput): Promise<IssueDiplomaResult> {
    if (!SUPABASE_URL) {
      throw new Error('VITE_SUPABASE_URL no configurat');
    }
    if (!ADMIN_SECRET) {
      throw new Error('VITE_ADMIN_SHARED_SECRET no configurat');
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/issue-diploma`, {
      method: 'POST',
      headers: {
        'x-admin-secret': ADMIN_SECRET,
        'content-type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      let detail = '';
      try {
        detail = JSON.stringify(await res.json());
      } catch {
        /* ignore */
      }
      throw new Error(`issue-diploma ${res.status}: ${detail}`);
    }

    return (await res.json()) as IssueDiplomaResult;
  },

  /**
   * Revoca (elimina) un diploma — NOMÉS ADMIN.
   * Cal una segona Edge Function o cridar directament amb service_role;
   * per simplicitat, el client NO pot revocar diplomes. Si l'admin necessita
   * revocar, ho farà via Supabase Studio (eliminar fila → eliminar PDF).
   */
  async remove(_id: string): Promise<never> {
    throw new Error(
      'remove: no implementat al client. Usa Supabase Studio o crea una Edge Function dedicada.'
    );
  },
};

// NOTA: no re-exportem `cloudUserService` aquí perquè `cloudUserService.budgets`
// i `cloudUserService.courses` ja existeixen a '../services/cloudUserService'
// (Entrega 1). Re-exportar-ho aquí sobreescriuria aquelles propietats.

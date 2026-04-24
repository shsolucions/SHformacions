import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase per SHformacions.
 *
 * Les credencials es llegeixen de variables d'entorn Vite:
 *   VITE_SUPABASE_URL      → URL del projecte (https://xxx.supabase.co)
 *   VITE_SUPABASE_ANON_KEY → anon public key (segur exposar-la al client)
 *
 * ⚠️ Mai no posis aquí la service_role key.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // No llancem error per no trencar el build en entorns sense .env;
  // el consumidor decidirà què fer si `supabase` és null.
  // eslint-disable-next-line no-console
  console.warn(
    '[supabase] VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY no configurats. ' +
      'Revisa .env.local'
  );
}

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storageKey: 'shformacions_supabase_auth',
        },
      })
    : null;

/** Helper: assegura que el client està disponible o llança error clar. */
export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error(
      'Supabase no configurat. Afegeix VITE_SUPABASE_URL i VITE_SUPABASE_ANON_KEY a .env.local'
    );
  }
  return supabase;
}

/** Helper: comprova si el núvol està actiu (per UI fallback). */
export function isCloudEnabled(): boolean {
  return supabase !== null;
}

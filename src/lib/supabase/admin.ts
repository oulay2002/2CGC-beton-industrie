// src/lib/supabase/admin.ts — Client Supabase a privileges eleves, STRICTEMENT serveur.
//
// L'application ne se sert pas de Supabase Auth : elle gere ses propres sessions
// signees (cf. src/lib/session.ts). La RLS basee sur auth.jwt() ne peut donc
// jamais identifier un utilisateur. Le modele retenu (cf. migration 003) est :
//
//   navigateur -> route handler Next.js (verifie le cookie de session)
//              -> ce client (service_role, contourne la RLS)
//              -> Postgres
//
// La cle service_role ne doit JAMAIS etre exposee au navigateur : l'import
// 'server-only' fait echouer la compilation si ce fichier est tire dans un
// bundle client.

import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cached: SupabaseClient | null = null;

/**
 * Indique si l'acces serveur a la base est configure.
 * Permet aux routes de degrader proprement (503) plutot que de planter.
 */
export function isAdminConfigured(): boolean {
  return Boolean(
    SUPABASE_URL &&
      !SUPABASE_URL.includes('placeholder') &&
      SERVICE_ROLE_KEY &&
      SERVICE_ROLE_KEY.length > 20
  );
}

/**
 * Retourne le client service_role, ou null si la configuration est absente.
 */
export function getAdminClient(): SupabaseClient | null {
  if (!isAdminConfigured()) return null;
  if (cached) return cached;

  cached = createClient(SUPABASE_URL as string, SERVICE_ROLE_KEY as string, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cached;
}

import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Client Supabase avec la service role key
 * Bypass RLS — à utiliser uniquement côté serveur (API routes)
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

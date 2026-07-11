import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

let client = null;

/** Lazily create the Supabase client (service role) for Storage operations. */
export function getSupabase() {
  if (client) return client;
  if (!env.supabase.url || !env.supabase.serviceRoleKey) return null;
  client = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
    auth: { persistSession: false },
  });
  return client;
}

export function isStorageConfigured() {
  return !!getSupabase();
}

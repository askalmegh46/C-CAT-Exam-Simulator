import { createClient } from '@/lib/supabase/server';

export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, isAdmin: false } as const;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  return { supabase, user, isAdmin: profile?.role === 'admin' } as const;
}

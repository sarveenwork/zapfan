import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export type UserRole = 'super_admin' | 'company_admin';

export interface UserProfile {
  id: string;
  company_id: string | null;
  role: UserRole;
}

export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, company_id, role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return null;
  }

  return profile as UserProfile;
}

export async function requireAuth(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}

export async function requireRole(allowedRoles: UserRole[]): Promise<UserProfile> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    redirect('/unauthorized');
  }
  return user;
}

export async function requireSuperAdmin(): Promise<UserProfile> {
  return requireRole(['super_admin']);
}

export async function requireCompanyAdmin(): Promise<UserProfile> {
  return requireRole(['company_admin', 'super_admin']);
}

'use client';

import { createBrowserClient } from '@supabase/ssr';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ProfileData {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

interface ChildData {
  id: string;
  first_name: string;
  current_grade: string;
  total_xp: number;
}

interface ExportData {
  profile: ProfileData;
  children: ChildData[];
  subscription: {
    status: string;
    started_at: string | null;
  } | null;
  exported_at: string;
}

export async function exportUserData(): Promise<ExportData | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Get profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, full_name, created_at')
    .eq('id', user.id)
    .single();

  if (!profile) return null;

  // Get children
  const { data: children } = await supabase
    .from('students')
    .select('id, first_name, current_grade, total_xp')
    .eq('parent_id', user.id)
    .is('deleted_at', null);

  // Get subscription
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('status, current_period_start')
    .eq('parent_id', user.id)
    .single();

  const exportData: ExportData = {
    profile: {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      created_at: profile.created_at,
    },
    children: children?.map(c => ({
      id: c.id,
      first_name: c.first_name,
      current_grade: c.current_grade,
      total_xp: c.total_xp,
    })) || [],
    subscription: subscription ? {
      status: subscription.status,
      started_at: subscription.current_period_start,
    } : null,
    exported_at: new Date().toISOString(),
  };

  return exportData;
}

export function downloadAsJson(data: ExportData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tinku-datos-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import type { Exercise } from '@/types/database';

export async function GET(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const conceptId = searchParams.get('concept_id');
  const difficulty = searchParams.get('difficulty');
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);

  let query = supabase.from('exercises').select('*').is('deleted_at', null);

  if (conceptId) {
    query = query.eq('concept_id', conceptId);
  }
  if (difficulty) {
    query = query.eq('difficulty', difficulty);
  }
  if (status) {
    query = query.eq('pedagogical_review_status', status);
  }

  const { data: exercises, error } = await query.limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ exercises: exercises as Exercise[] });
}
'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { StudentCharts } from './Charts';

interface StudentData {
  id: string;
  first_name: string;
  total_xp: number;
}

interface Props {
  students: StudentData[];
}

interface XpDataPoint {
  date: string;
  xp: number;
}

interface StreakData {
  day: string;
  completed: boolean;
}

export function DashboardCharts({ students }: Props) {
  const [chartsData, setChartsData] = useState<Record<string, { xp: XpDataPoint[]; streak: StreakData[] }>>({});

  useEffect(() => {
    async function fetchChartsData() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const result: Record<string, { xp: XpDataPoint[]; streak: StreakData[] }> = {};

      for (const student of students) {
        // Get last 7 days XP data from attempts
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const { data: attempts } = await supabase
          .from('attempts')
          .select('created_at, xp_earned')
          .eq('student_id', student.id)
          .gte('created_at', sevenDaysAgo.toISOString());

        // Aggregate XP by day
        const xpByDay: Record<string, number> = {};
        attempts?.forEach((a) => {
          const day = new Date(a.created_at).toISOString().split('T')[0];
          xpByDay[day] = (xpByDay[day] || 0) + (a.xp_earned || 0);
        });

        // Generate last 7 days
        const xp: XpDataPoint[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dayStr = d.toISOString().split('T')[0];
          xp.push({
            date: dayStr,
            xp: xpByDay[dayStr] || 0,
          });
        }

        // Weekly streak - show empty until real data is available
        const days = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const streak: StreakData[] = days.map((day) => ({
          day,
          completed: false,
        }));

        result[student.id] = { xp, streak };
      }

      setChartsData(result);
    }

    if (students.length > 0) {
      fetchChartsData();
    }
  }, [students]);

  if (students.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {students.map((student) => {
        const data = chartsData[student.id];
        if (!data) return null;

        return (
          <div key={student.id} className="rounded-xl border border-tinku-ink/10 p-4">
            <h3 className="font-medium text-tinku-ink mb-3">{student.first_name}</h3>
            <StudentCharts
              xpData={data.xp}
              streakData={data.streak}
              studentName={student.first_name}
            />
          </div>
        );
      })}
    </div>
  );
}
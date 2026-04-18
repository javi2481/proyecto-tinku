'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

interface XpDataPoint {
  date: string;
  xp: number;
}

interface StreakData {
  day: string;
  completed: boolean;
}

interface StudentChartsProps {
  xpData: XpDataPoint[];
  streakData: StreakData[];
  studentName: string;
}

// Format date for display
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' });
};

export function StudentCharts({ xpData, streakData, studentName }: StudentChartsProps) {
  // Check if there's any data
  const hasXpData = xpData.some(d => d.xp > 0);
  const hasStreakData = streakData.some(d => d.completed);

  if (!hasXpData && !hasStreakData) {
    return (
      <div className="text-center py-4 text-tinku-ink/60 text-sm">
        Sin actividad todavía 🌱
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* XP Line Chart */}
      {hasXpData && (
        <div>
          <h4 className="text-xs font-medium text-tinku-ink/70 mb-2">XP última semana</h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={xpData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                  tick={{ fontSize: 10 }}
                  stroke="#9ca3af"
                />
                <YAxis 
                  tick={{ fontSize: 10 }}
                  stroke="#9ca3af"
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  labelFormatter={(date) => formatDate(date as string)}
                />
                <Line
                  type="monotone"
                  dataKey="xp"
                  stroke="#0ea5e9"
                  strokeWidth={2}
                  dot={{ fill: '#0ea5e9', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Streak Bar Chart */}
      {hasStreakData && (
        <div>
          <h4 className="text-xs font-medium text-tinku-ink/70 mb-2">Esta semana</h4>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={streakData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 10 }}
                  stroke="#9ca3af"
                />
                <YAxis 
                  hide
                  domain={[0, 1]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value) => value ? 'Jugó' : 'No jugón'}
                />
                <Bar
                  dataKey="completed"
                  fill="#22c55e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
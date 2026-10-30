import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function StanceBarChart({ items = [] }: { items?: any[] }) {
  const counts: Record<string, number> = { supports: 0, refutes: 0, no_match: 0 };
  for (const it of items) {
    const k = (it.stance || 'no_match') as 'supports'|'refutes'|'no_match';
    counts[k] = (counts[k] || 0) + 1;
  }
  const data = [
    { name: 'Supports', value: counts.supports, color: '#10B981' },
    { name: 'Refutes', value: counts.refutes, color: '#EF4444' },
    { name: 'No Match', value: counts.no_match, color: '#F59E0B' }
  ];
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Source Stance</h3>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

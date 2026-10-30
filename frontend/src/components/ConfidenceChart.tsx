import { Pie, PieChart, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function ConfidenceChart({ confidence = 0.5 }: { confidence?: number }) {
  const data = [
    { name: 'Confidence', value: Math.round(confidence * 100) },
    { name: 'Remainder', value: 100 - Math.round(confidence * 100) }
  ];
  const COLORS = ['#10B981', '#E5E7EB'];
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Confidence</h3>
      </div>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={50} outerRadius={70} paddingAngle={2}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-1 text-center text-sm opacity-80">{Math.round(confidence * 100)}%</div>
    </div>
  );
}

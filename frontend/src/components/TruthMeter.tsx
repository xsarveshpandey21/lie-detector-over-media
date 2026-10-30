export default function TruthMeter({ score, label }: { score: number; label: string }) {
  const color = score >= 70 ? 'bg-green-500' : score < 40 ? 'bg-red-500' : 'bg-yellow-500';
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold">Truth Meter</h2>
        <span className="text-sm opacity-80">{label}</span>
      </div>
      <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded">
        <div className={`h-4 rounded ${color}`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }}></div>
      </div>
      <div className="mt-1 text-right text-sm opacity-80">{score}%</div>
    </div>
  );
}

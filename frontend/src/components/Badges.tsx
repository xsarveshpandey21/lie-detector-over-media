export default function Badges({ badge, points }: { badge?: string; points?: number }) {
  return (
    <div className="card">
      <h3 className="font-semibold mb-1">Badges</h3>
      <div className="text-sm opacity-90">{badge || 'None yet'}</div>
      {points!=null && <div className="text-xs opacity-70">+{points} points</div>}
    </div>
  );
}

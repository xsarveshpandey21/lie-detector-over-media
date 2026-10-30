// Simple map-like visualization (abstracted nodes) to show regional trust/stance
// This avoids heavy geo libs but gives a quick, readable signal.
import React from 'react';

type CV = { source: string; stance?: 'supports'|'refutes'|'no_match'; confidence?: number; region?: string };

function colorFor(score: number) {
  // 0 red -> 0.5 yellow -> 1 green
  if (score >= 0.66) return '#10B981'; // green
  if (score >= 0.33) return '#F59E0B'; // yellow
  return '#EF4444'; // red
}

function scoreFrom(items: CV[]) {
  // supports +1, refutes 0, no_match 0.5; avg in [0,1]
  if (!items.length) return 0.5;
  const vals: number[] = items.map(it => it.stance === 'supports' ? 1 : it.stance === 'refutes' ? 0 : 0.5);
  const sum = vals.reduce((a:number,b:number)=>a+b, 0);
  const avg = sum / vals.length;
  return avg;
}

export default function TrustMap({ items = [] as CV[] }: { items?: CV[] }) {
  // naive region mapping by source (customize later)
  const regionOf: Record<string, string> = {
    Reuters: 'Global',
    PolitiFact: 'US',
    Snopes: 'US',
    AltNews: 'India',
    Factly: 'India'
  };
  const buckets: Record<string, CV[]> = { Global: [], India: [], US: [], EU: [] };
  for (const it of items) {
    const r = it.region || regionOf[it.source] || 'Global';
    if (!buckets[r]) buckets[r] = [];
    buckets[r].push(it);
  }
  const regions = Object.keys(buckets);
  const scores = regions.map(r => ({ r, s: scoreFrom(buckets[r]) }));

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Trust Map</h3>
      <div className="text-xs opacity-70 mb-2">Regional signal from cross-verification sources (abstracted)</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {scores.map(({ r, s }) => (
          <div key={r} className="rounded-lg p-4 text-center" style={{ background: colorFor(s), color: 'white' }}>
            <div className="text-sm font-semibold">{r}</div>
            <div className="text-xs opacity-90">{Math.round(s*100)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

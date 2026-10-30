import { useEffect, useState } from 'react';
import { getLeaderboard } from '../api/client';

export default function Leaderboard() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { getLeaderboard().then(setRows).catch(()=>{}); }, []);
  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Leaderboard</h3>
      <ul className="text-sm space-y-1">
        {rows.map((r,i)=> (
          <li key={i} className="flex justify-between"><span>{r.user}</span><span>{r.points} pts</span></li>
        ))}
      </ul>
    </div>
  );
}

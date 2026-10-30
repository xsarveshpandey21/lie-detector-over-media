export default function SourcesList({ items = [] }: { items?: any[] }) {
  const colorFor = (stance: string) => {
    if (stance === 'supports') return 'text-green-600';
    if (stance === 'refutes') return 'text-red-600';
    if (stance === 'no_match') return 'text-yellow-600';
    return 'text-gray-600';
  };
  const labelFor = (stance: string) => {
    if (stance === 'supports') return 'Supports';
    if (stance === 'refutes') return 'Refutes';
    if (stance === 'no_match') return 'No Match';
    return stance;
  };
  return (
    <div className="card">
      <h3 className="font-semibold mb-2">Sources & Cross-Verification</h3>
      <ul className="space-y-2 text-sm">
        {items.map((cv:any, idx:number)=> (
          <li key={idx} className="flex flex-col">
            <div className="flex items-center justify-between">
              <div>
                <a className="underline" href={cv.url} target="_blank" rel="noreferrer">{cv.source}</a>
                <span className={`ml-2 text-xs font-medium ${colorFor(cv.stance)}`}>{labelFor(cv.stance)}</span>
              </div>
              {typeof cv.confidence === 'number' && (
                <span className="text-xs opacity-70">{Math.round(cv.confidence * 100)}%</span>
              )}
            </div>
            {cv.note && <div className="opacity-80">{cv.note}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}

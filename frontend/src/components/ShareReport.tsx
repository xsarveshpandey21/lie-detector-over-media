export default function ShareReport({ report }: { report: any }) {
  async function copy() {
    try {
      const text = `TruthLens AI Report\n\nSummary: ${report.summary}\nScore: ${report.truthScore}%\nConfidence: ${Math.round((report.confidence||0)*100)}%\nLabel: ${report.label}\n\nExplanations:\n- ${(report.explanations||[]).join('\n- ')}\n\nSources:\n${(report.breakdown?.crossVerification||[]).map((s:any)=>`- ${s.source}: ${s.stance} (${Math.round((s.confidence||0)*100)}%) ${s.url}`).join('\n')}`;
      await navigator.clipboard.writeText(text);
      alert('Report copied to clipboard');
    } catch {
      alert('Copy failed');
    }
  }
  return (
    <div className="card">
      <h3 className="font-semibold mb-1">Share</h3>
      <button className="px-3 py-2 bg-blue-600 text-white rounded" onClick={copy}>Copy Report</button>
    </div>
  );
}

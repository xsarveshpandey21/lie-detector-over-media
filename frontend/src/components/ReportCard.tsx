export default function ReportCard({ report }: { report: any }) {
  return (
    <div className="card space-y-2">
      <h2 className="font-semibold">Explainable Report</h2>
      <p className="text-sm opacity-80">{report.summary}</p>
      <ul className="list-disc pl-5 text-sm">
        {(report.explanations||[]).map((e:string, i:number)=> <li key={i}>{e}</li>)}
      </ul>
      <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-x-auto">{JSON.stringify(report.breakdown, null, 2)}</pre>
    </div>
  );
}

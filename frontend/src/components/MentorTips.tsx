export default function MentorTips({ tip }: { tip?: string }) {
  return (
    <div className="card">
      <h3 className="font-semibold mb-1">AI Mentor</h3>
      <p className="text-sm opacity-80">{tip || 'Analyze content to receive tips.'}</p>
    </div>
  );
}

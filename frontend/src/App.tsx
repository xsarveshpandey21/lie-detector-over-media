import { useState } from 'react';
import UploadPanel from './components/UploadPanel';
import TruthMeter from './components/TruthMeter';
import ReportCard from './components/ReportCard';
import MentorTips from './components/MentorTips';
import Badges from './components/Badges';
import Leaderboard from './components/Leaderboard';
import TrustGraph from './components/TrustGraph';
import Chatbot from './components/Chatbot';
import ThemeToggle from './components/ThemeToggle';
import ConfidenceChart from './components/ConfidenceChart';
import SourcesList from './components/SourcesList';
import ShareReport from './components/ShareReport';
import HelpTooltip from './components/HelpTooltip';
import StanceBarChart from './components/StanceBarChart';
import TrustMap from './components/TrustMap';

function App() {
  const [report, setReport] = useState<any | null>(null);

  return (
    <div className="min-h-screen text-gray-900 dark:text-gray-100">
      <div className="max-w-6xl mx-auto p-4">
        <header className="rounded-xl bg-paper border border-line px-4 py-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 shrink-0" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <circle cx="13" cy="13" r="8" stroke="#8B5E3C" strokeWidth="2.75" fill="#FFFDF7" />
              <path d="M9 10 A 5 5 0 0 1 15 8" stroke="#F6C453" strokeWidth="2" strokeLinecap="round" />
              <circle cx="14" cy="12" r="1.5" fill="#F6C453" />
              <line x1="19" y1="19" x2="27" y2="27" stroke="#8B5E3C" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <div>
              <h1 className="text-xl font-bold font-heading text-ink leading-tight">Satya Lens</h1>
              <p className="text-xs text-muted">See what&apos;s real.</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <UploadPanel onReport={setReport} />

        {report && (
          <div className="grid md:grid-cols-3 gap-4 mt-6">
            <div className="md:col-span-2 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Truth Meter</h2>
                    <HelpTooltip label="Truth Meter" text="Overall likelihood the claim/content is true. Color-coded: green=true, yellow=uncertain, red=false." />
                  </div>
                  <TruthMeter score={report.truthScore} label={report.label} />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold">Confidence</h2>
                    <HelpTooltip label="Confidence" text="Model and heuristics confidence in the assessment, independent of true/false label." />
                  </div>
                  <ConfidenceChart confidence={report.confidence} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold">Explainable Report</h2>
                  <HelpTooltip label="Explainable Report" text="Human-readable reasons: heuristics, artifacts, metadata, and model rationale." />
                </div>
                <ReportCard report={report} />
              </div>

              <SourcesList items={report.breakdown?.crossVerification || []} />
              <div className="grid sm:grid-cols-2 gap-4">
                <StanceBarChart items={report.breakdown?.crossVerification || []} />
                <TrustMap items={report.breakdown?.crossVerification || []} />
              </div>
              <TrustGraph data={report.community?.trustGraph || []} />
              <ShareReport report={report} />
            </div>
            <div className="space-y-4">
              <MentorTips tip={report.education?.tip} />
              <Badges badge={report.gamification?.badge} points={report.gamification?.points} />
              <Leaderboard />
              <Chatbot />
            </div>
          </div>
        )}

        {!report && (
          <div className="mt-8 text-sm text-gray-600 dark:text-gray-300">
            Upload text, image, video, audio, or a URL to verify authenticity. Multilingual support and edge-mode coming soon.
          </div>
        )}
      </div>
    </div>
  );
}

export default App;

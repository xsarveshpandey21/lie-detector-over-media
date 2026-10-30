import React, { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import StepIndicator from './components/StepIndicator';
import UploadPanel from './components/UploadPanel';
import EmptyState from './components/EmptyState';
import ErrorState from './components/ErrorState';
import InputSummaryCard from './components/InputSummaryCard';
import VerdictBanner from './components/VerdictBanner';
import ConfidenceSteps from './components/ConfidenceSteps';
import ScoreBar from './components/ScoreBar';
import ReasonsList from './components/ReasonsList';
import ReferencesSection from './components/ReferencesSection';
import MatchDetailsCard from './components/MatchDetailsCard';
import MediaMetadataTable from './components/MediaMetadataTable';
import NextSteps from './components/NextSteps';
import ChecksTransparency from './components/ChecksTransparency';
import TechnicalDetails from './components/TechnicalDetails';
import ReportActions from './components/ReportActions';
import Notices from './components/Notices';
import Chatbot from './components/Chatbot';
import Toast from './components/Toast';
import { useAnalyze } from './hooks/useAnalyze';
import enTranslations from './i18n/en.json';
import hiTranslations from './i18n/hi.json';
import { ContentType } from './types';

export default function App() {
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const t = lang === 'hi' ? hiTranslations : enTranslations;

  const {
    status,
    data: report,
    error,
    errorCode,
    loadingMessage,
    runAnalysis,
    cancel,
    reset
  } = useAnalyze();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const resultRef = useRef<HTMLElement>(null);

  // Focus result heading when report arrives
  useEffect(() => {
    if (status === 'success' && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth' });
      resultRef.current.focus();
    }
  }, [status]);

  function handleCheck(payload: {
    type: ContentType;
    text?: string;
    url?: string;
    file?: File | null;
  }) {
    runAnalysis({ ...payload, language: lang });
  }

  const currentStep = status === 'success' && report ? 3 : status === 'loading' ? 2 : 1;

  return (
    <div className="min-h-screen bg-cream dark:bg-brown-900 text-ink dark:text-cream flex flex-col font-sans selection:bg-yellow-300 selection:text-ink">
      <Header language={lang} onLanguageChange={setLang} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 sm:py-6 space-y-6">
        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} t={t} />

        {/* STEP 1: Content Input Panel (Shown when idle or loading) */}
        {(!report || status === 'loading') && (
          <UploadPanel
            onCheck={handleCheck}
            loading={status === 'loading'}
            loadingMessage={loadingMessage}
            onCancel={cancel}
            onError={(msg) => setToastMessage(msg)}
            t={t}
          />
        )}

        {/* Error State */}
        {status === 'error' && error && (
          <ErrorState
            error={error}
            errorCode={errorCode}
            onRetry={reset}
          />
        )}

        {/* Empty State before check */}
        {status === 'idle' && !report && (
          <EmptyState t={t} />
        )}

        {/* RESULTS SECTION: Shown after successful check */}
        {status === 'success' && report && (
          <section
            ref={resultRef}
            tabIndex={-1}
            aria-live="polite"
            className="space-y-6 outline-none"
          >
            {/* STEP 2: What You Gave Us */}
            <InputSummaryCard
              input={report.input}
              onEdit={reset}
              onReset={reset}
              t={t}
            />

            {/* STEP 3: What We Found */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted dark:text-brown-300">
                  {t.step3Title}
                </h3>
                <span className="text-xs text-muted dark:text-brown-400">
                  {t.stepBadge3}
                </span>
              </div>

              {/* 1. Verdict Banner */}
              <VerdictBanner verdict={report.verdict} />

              {/* 2 & 3. Evidence Strength & Reliability Score Grid */}
              <div className="grid sm:grid-cols-2 gap-4">
                <ConfidenceSteps level={report.verdict.confidenceLevel} reason={report.confidence?.reason} />
                <ScoreBar score={report.verdict.score} />
              </div>

              {/* Match Details (only displayed when matches exist) */}
              {report.matches && report.matches.length > 0 && (
                <MatchDetailsCard matches={report.matches} userText={report.input.preview} />
              )}

              {/* What we read from your file / link (Metadata Table) */}
              <MediaMetadataTable type={report.type} input={report.input} technical={report.technical} />

              {/* Notices (if any, e.g. translation notes) */}
              <Notices notices={report.notices} />

              {/* 4. Why we think this (Plain English reasons with [1] markers) */}
              <ReasonsList reasons={report.reasons} />

              {/* 5. References & Evidence (Replaces legacy sources card) */}
              <ReferencesSection
                references={report.references}
                sources={report.sources}
                onToast={setToastMessage}
              />

              {/* 6. What you can do next */}
              <NextSteps steps={report.nextSteps} />

              {/* 7. How we checked (Transparency) */}
              <ChecksTransparency checks={report.checks} />

              {/* Optional Assistant for current report */}
              <Chatbot report={report} />

              {/* 8. Technical details accordion */}
              <TechnicalDetails technical={report.technical} rawReport={report} />

              {/* 9. Report Actions & Print button */}
              <ReportActions
                report={report}
                onReset={reset}
                onToast={setToastMessage}
                t={t}
              />

              {/* 10. Disclaimer footer */}
              <p className="text-center text-xs text-muted dark:text-brown-300 pt-2">
                {report.disclaimer}
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-line dark:border-brown-700 bg-sand/40 dark:bg-brown-950 text-center text-xs text-muted dark:text-brown-300 space-y-2">
        <p className="font-semibold text-ink dark:text-cream">
          {t.footer.title}
        </p>
        <p className="max-w-md mx-auto">
          {t.footer.tagline}
        </p>
        <p className="text-xs text-muted dark:text-brown-300 font-medium">
          {t.footer.copyright}
        </p>
        <div className="flex items-center justify-center gap-4 pt-1">
          {import.meta.env.VITE_GITHUB_URL && (
            <>
              <a
                href={import.meta.env.VITE_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-brown-700 dark:hover:text-yellow-300 underline underline-offset-2"
              >
                {t.footer.github}
              </a>
              <span>&bull;</span>
            </>
          )}
          <span>{t.footer.privacy}</span>
        </div>
      </footer>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage(null)}
        tone="warn"
      />
    </div>
  );
}

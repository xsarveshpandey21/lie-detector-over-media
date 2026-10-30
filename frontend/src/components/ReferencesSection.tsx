import React, { useState } from 'react';
import { Reference, Sources } from '../types';

interface ReferencesSectionProps {
  references?: Reference[];
  sources?: Sources;
  onToast?: (message: string) => void;
}

export default function ReferencesSection({
  references = [],
  sources,
  onToast
}: ReferencesSectionProps) {
  const [copied, setCopied] = useState(false);

  // Fallback to legacy sources if references array is empty
  const hasReferences = references && references.length > 0;
  const status = sources?.status || (hasReferences ? 'checked' : 'not_checked');

  // Build clean plain text for clipboard copying
  const handleCopy = async () => {
    if (!hasReferences) return;

    const textList = references.map((ref, idx) => {
      const parts = [
        `[${idx + 1}] ${ref.publisher}: "${ref.title || ref.claim}"`,
        `Rating: ${ref.rating} (${ref.ratingMeaning})`,
        `Date: ${ref.date}${ref.verifiedOn ? ` (Verified: ${ref.verifiedOn})` : ''}`,
        ref.url ? `Link: ${ref.url}` : null
      ].filter(Boolean);
      return parts.join('\n');
    }).join('\n\n');

    try {
      await navigator.clipboard.writeText(textList);
      setCopied(true);
      if (onToast) onToast('References copied to clipboard.');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      if (onToast) onToast('Could not copy to clipboard.');
    }
  };

  return (
    <div className="card space-y-4 bg-paper dark:bg-brown-900 border border-line dark:border-brown-700 shadow-sm print:border-none print:shadow-none">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold font-heading text-ink dark:text-cream">
            References & Evidence
          </h4>
          {hasReferences && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sand dark:bg-brown-800 text-muted dark:text-brown-300">
              {references.length}
            </span>
          )}
        </div>

        {hasReferences && (
          <button
            type="button"
            onClick={handleCopy}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-sand dark:bg-brown-800 hover:bg-line dark:hover:bg-brown-700 text-ink dark:text-cream transition-colors flex items-center gap-1.5 print:hidden"
            aria-label="Copy references list with links"
          >
            <span>{copied ? '✔' : '📋'}</span>
            <span>{copied ? 'Copied' : 'Copy references'}</span>
          </button>
        )}
      </div>

      {/* Empty States */}
      {!hasReferences && status === 'not_checked' && (
        <div className="p-4 rounded-xl bg-sand/40 dark:bg-brown-800/60 text-xs text-muted dark:text-brown-300 leading-relaxed space-y-1">
          <p className="font-semibold text-ink dark:text-cream">
            Fact-check search is not set up in this version.
          </p>
          <p>
            To search live fact-checks across international registries, configure the Google Fact Check Tools API key in your environment settings.
          </p>
        </div>
      )}

      {!hasReferences && status === 'no_matches_found' && (
        <div className="p-4 rounded-xl bg-sand/40 dark:bg-brown-800/60 text-xs text-muted dark:text-brown-300 leading-relaxed">
          We did not find a published fact-check for this. That does not mean it is true or false.
        </div>
      )}

      {/* References Card List */}
      {hasReferences && (
        <div className="space-y-3">
          {references.map((ref, idx) => {
            const logoLetter = (ref.publisher || 'F').charAt(0).toUpperCase();
            return (
              <div
                key={ref.id || idx}
                id={`ref-${ref.id}`}
                tabIndex={-1}
                className="p-4 rounded-xl border border-line dark:border-brown-700 bg-cream/50 dark:bg-brown-800/50 space-y-2.5 text-xs transition-colors target:ring-2 target:ring-yellow-400 dark:target:ring-yellow-500"
              >
                {/* Publisher Header & Rating Pill */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded-full bg-brown-600 dark:bg-yellow-400 text-cream dark:text-brown-950 font-bold flex items-center justify-center text-xs shrink-0 shadow-sm"
                      aria-hidden="true"
                    >
                      {logoLetter}
                    </span>
                    <div>
                      <span className="font-bold text-ink dark:text-cream text-xs">
                        [{idx + 1}] {ref.publisher}
                      </span>
                      {ref.source && (
                        <span className="block text-[10px] text-muted dark:text-brown-400">
                          {ref.source === 'google_fact_check'
                            ? 'Google Fact Check Tools API'
                            : ref.source === 'registry'
                              ? 'Curated Verified Knowledge Base'
                              : ref.source === 'domain_registry'
                                ? 'Domain Verification List'
                                : 'Metadata & Structural Analysis'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {ref.isOld && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-warn-bg text-warn border border-warn/30">
                        ⚠ This fact-check is old — check for updates
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-md font-semibold text-[11px] bg-yellow-100 dark:bg-brown-700 text-brown-900 dark:text-yellow-200 border border-yellow-300/40">
                      {ref.rating}
                    </span>
                  </div>
                </div>

                {/* Plain English Rating Meaning */}
                {ref.ratingMeaning && (
                  <p className="text-ink dark:text-cream font-medium bg-sand/30 dark:bg-brown-900/60 p-2 rounded-lg leading-relaxed">
                    {ref.ratingMeaning}
                  </p>
                )}

                {/* Claim text */}
                <p className="text-muted dark:text-brown-200 italic line-clamp-2">
                  &ldquo;{ref.claim || ref.title}&rdquo;
                </p>

                {/* Dates & Outbound Link */}
                <div className="flex items-center justify-between text-[11px] pt-1 flex-wrap gap-2 text-muted dark:text-brown-400">
                  <div className="flex items-center gap-3">
                    {ref.date && (
                      <span>Published: {ref.date}</span>
                    )}
                    {ref.verifiedOn && (
                      <span>Last checked: {ref.verifiedOn}</span>
                    )}
                  </div>

                  {ref.url ? (
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-brown-700 dark:text-yellow-400 hover:underline flex items-center gap-1"
                      aria-label={`Read the full fact check on ${ref.publisher} (opens in new tab)`}
                    >
                      <span>Read the full fact-check</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  ) : (
                    <span className="italic text-muted/60">Reference link not available</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


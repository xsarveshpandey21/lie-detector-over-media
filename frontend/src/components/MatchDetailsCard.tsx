import React from 'react';
import { Match } from '../types';
import HelpTooltip from './HelpTooltip';

interface MatchDetailsCardProps {
  matches: Match[];
  userText?: string;
}

/**
 * Highlights matched phrases in text using <mark>
 */
function highlightPhrases(text: string, phrases: string[]) {
  if (!text || !phrases || phrases.length === 0) return text;

  // Build regex from escaped phrases
  const escaped = phrases
    .filter(Boolean)
    .map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .sort((a, b) => b.length - a.length);

  if (escaped.length === 0) return text;

  const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, i) => {
    const isMatch = phrases.some(p => p.toLowerCase() === part.toLowerCase());
    if (isMatch) {
      return (
        <mark
          key={i}
          className="bg-yellow-200 dark:bg-yellow-800/80 text-brown-950 dark:text-yellow-100 font-semibold px-1 py-0.5 rounded"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

export default function MatchDetailsCard({ matches, userText = '' }: MatchDetailsCardProps) {
  if (!matches || matches.length === 0) return null;

  const topMatch = matches[0];
  const strength = topMatch.matchStrength;

  // Plain English strength label
  let strengthLabel = 'Weak';
  let barColor = 'bg-yellow-400 dark:bg-yellow-500';
  if (strength >= 90) {
    strengthLabel = 'Very strong';
    barColor = 'bg-brown-600 dark:bg-yellow-400';
  } else if (strength >= 70) {
    strengthLabel = 'Strong';
    barColor = 'bg-brown-500 dark:bg-yellow-500';
  } else if (strength >= 40) {
    strengthLabel = 'Fair';
    barColor = 'bg-yellow-500 dark:bg-yellow-600';
  }

  // Relationship description
  let relationLabel = 'Similar claim';
  let relationExplanation = 'Fact-checkers reviewed a claim with similar phrasing or themes.';
  if (topMatch.relation === 'same_claim') {
    relationLabel = 'Same claim';
    relationExplanation = 'Published fact-checkers investigated this exact statement.';
  } else if (strength < 50) {
    relationLabel = 'Related topic';
    relationExplanation = 'Fact-checkers investigated a related topic, but key details differ.';
  }

  const claimText = topMatch.reference?.claim || topMatch.reference?.title || '';
  const matchedPhrases = topMatch.matchedPhrases || [];

  return (
    <div className="card space-y-4 bg-paper dark:bg-brown-900 border border-line dark:border-brown-700 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold font-heading text-ink dark:text-cream">
            How well does it match?
          </h4>
          <HelpTooltip
            label="Match Details"
            text="Match strength shows how close the wording is, not whether the claim is true."
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-semibold text-ink dark:text-cream">
            {strengthLabel} match
          </span>
          <span className="text-[11px] text-muted dark:text-brown-300">
            ({strength}%)
          </span>
        </div>
      </div>

      {/* Strength Progress Bar */}
      <div className="space-y-1.5">
        <div className="w-full h-2 rounded-full bg-sand dark:bg-brown-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${barColor}`}
            style={{ width: `${Math.max(5, strength)}%` }}
            role="progressbar"
            aria-valuenow={strength}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Match strength ${strength}%`}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted dark:text-brown-400 font-medium px-0.5">
          <span>Weak (&lt;40%)</span>
          <span>Fair (40-69%)</span>
          <span>Strong (70-89%)</span>
          <span>Very strong (90%+)</span>
        </div>
      </div>

      {/* Relationship Line */}
      <div className="p-3 rounded-xl bg-sand/40 dark:bg-brown-800/60 border border-line dark:border-brown-700 text-xs space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-ink dark:text-cream">Relationship:</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-yellow-100 dark:bg-brown-700 text-brown-900 dark:text-yellow-200 border border-yellow-300/40">
            {relationLabel}
          </span>
        </div>
        <p className="text-muted dark:text-brown-300">
          {relationExplanation}
        </p>
      </div>

      {/* Side-by-side Comparison with Highlighted Phrases */}
      <div className="grid sm:grid-cols-2 gap-3 text-xs">
        {/* Your Input */}
        <div className="p-3 rounded-xl bg-cream/60 dark:bg-brown-800/50 border border-line dark:border-brown-700 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted dark:text-brown-400">
            What you entered
          </span>
          <p className="text-ink dark:text-cream leading-relaxed break-words">
            {highlightPhrases(userText || 'Submitted text', matchedPhrases)}
          </p>
        </div>

        {/* Fact-Checked Claim */}
        <div className="p-3 rounded-xl bg-cream/60 dark:bg-brown-800/50 border border-line dark:border-brown-700 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted dark:text-brown-400">
            Fact-checked claim
          </span>
          <p className="text-ink dark:text-cream leading-relaxed break-words italic">
            &ldquo;{highlightPhrases(claimText, matchedPhrases)}&rdquo;
          </p>
        </div>
      </div>

      {/* Transparency Note */}
      <p className="text-[11px] text-muted dark:text-brown-400 italic">
        💡 Match strength shows how close the wording is, not whether the claim is true.
      </p>
    </div>
  );
}


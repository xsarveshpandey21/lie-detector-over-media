import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import VerdictBanner from '../components/VerdictBanner';
import ScoreBar from '../components/ScoreBar';
import { Verdict } from '../types';

describe('VerdictBanner Component', () => {
  it('renders headline, meaning, and "Needs more context" badge when score is null', () => {
    const verdict: Verdict = {
      label: 'uncertain',
      headline: 'We cannot tell from this photo alone',
      meaning: 'AI manipulation cannot be judged from pixels without original capture history.',
      score: null,
      confidenceLevel: 'low'
    };

    render(<VerdictBanner verdict={verdict} />);

    expect(screen.getByText('We cannot tell from this photo alone')).toBeInTheDocument();
    expect(screen.getByText(/AI manipulation cannot be judged/i)).toBeInTheDocument();
    expect(screen.getByText('Needs more context')).toBeInTheDocument();
  });

  it('renders "Looks Reliable" badge for likely_true verdict', () => {
    const verdict: Verdict = {
      label: 'likely_true',
      headline: 'Content appears reliable',
      meaning: 'Multiple reputable fact-checkers verified this claim.',
      score: 88,
      confidenceLevel: 'high'
    };

    render(<VerdictBanner verdict={verdict} />);

    expect(screen.getByText('Content appears reliable')).toBeInTheDocument();
    expect(screen.getByText('Looks Reliable')).toBeInTheDocument();
  });

  it('renders "Misleading or False" badge for likely_false verdict', () => {
    const verdict: Verdict = {
      label: 'likely_false',
      headline: 'High signs of misinformation',
      meaning: 'Recognized fact-check organizations debunked this specific statement.',
      score: 18,
      confidenceLevel: 'high'
    };

    render(<VerdictBanner verdict={verdict} />);

    expect(screen.getByText('High signs of misinformation')).toBeInTheDocument();
    expect(screen.getByText('Misleading or False')).toBeInTheDocument();
  });

  it('renders "Not scored" when score is null in ScoreBar', () => {
    render(<ScoreBar score={null} />);
    expect(screen.getByText('Not scored')).toBeInTheDocument();
    expect(screen.getByText(/File headers alone cannot guarantee authenticity/i)).toBeInTheDocument();
  });

  it('renders numeric score when score is provided in ScoreBar', () => {
    render(<ScoreBar score={85} />);
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('/ 100')).toBeInTheDocument();
  });
});

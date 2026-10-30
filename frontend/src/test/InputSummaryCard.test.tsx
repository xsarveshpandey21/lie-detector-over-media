import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import InputSummaryCard from '../components/InputSummaryCard';
import { InputSummary } from '../types';
import enTranslations from '../i18n/en.json';

describe('InputSummaryCard Component', () => {
  const defaultProps = {
    onEdit: vi.fn(),
    onReset: vi.fn(),
    t: enTranslations
  };

  it('renders preview text, word count and char count for text input', () => {
    const input: InputSummary = {
      kind: 'text',
      preview: 'Drinking warm lemon water prevents viral infections entirely.',
      meta: {
        words: 8,
        chars: 62
      }
    };

    render(<InputSummaryCard {...defaultProps} input={input} />);

    expect(screen.getByText(/Drinking warm lemon water/i)).toBeInTheDocument();
    expect(screen.getByText(/8 words • 62 characters/i)).toBeInTheDocument();
  });

  it('renders full link preview and domain badge for URL input', () => {
    const input: InputSummary = {
      kind: 'url',
      preview: 'https://www.reuters.com/world/economy-report-2026',
      meta: {
        domain: 'reuters.com'
      }
    };

    render(<InputSummaryCard {...defaultProps} input={input} />);

    expect(screen.getByText('https://www.reuters.com/world/economy-report-2026')).toBeInTheDocument();
    expect(screen.getByText('Domain: reuters.com')).toBeInTheDocument();
  });

  it('renders file name and size metadata for file input', () => {
    const input: InputSummary = {
      kind: 'file',
      preview: 'breaking_news_screengrab.png',
      meta: {
        fileName: 'breaking_news_screengrab.png',
        fileType: 'image/png',
        sizeKB: 245
      }
    };

    render(<InputSummaryCard {...defaultProps} input={input} />);

    expect(screen.getByText('breaking_news_screengrab.png')).toBeInTheDocument();
    expect(screen.getByText(/image\/png • 245 KB/i)).toBeInTheDocument();
  });
});


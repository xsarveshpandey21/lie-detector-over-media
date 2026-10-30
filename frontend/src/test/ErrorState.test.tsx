import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorState from '../components/ErrorState';

describe('ErrorState Component', () => {
  it('renders friendly message for 413 file_too_large error', () => {
    render(
      <ErrorState
        error="The selected file is larger than the 4 MB limit."
        errorCode="413"
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText('File is too large')).toBeInTheDocument();
    expect(screen.getByText(/Please choose a smaller file under 4 MB/i)).toBeInTheDocument();
  });

  it('renders friendly message for 429 rate_limit_exceeded error', () => {
    render(
      <ErrorState
        error="Too many requests from this IP."
        errorCode="429"
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText('Too many requests')).toBeInTheDocument();
    expect(screen.getByText(/Please take a 5-minute break/i)).toBeInTheDocument();
  });

  it('renders friendly message for 504 timeout error', () => {
    render(
      <ErrorState
        error="Analysis timed out after 25 seconds."
        errorCode="504"
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText('Check timed out')).toBeInTheDocument();
    expect(screen.getByText(/The server took too long to analyze this content/i)).toBeInTheDocument();
  });

  it('renders friendly message for empty_text validation error', () => {
    render(
      <ErrorState
        error="Please provide text content."
        errorCode="empty_text"
        onRetry={vi.fn()}
      />
    );

    expect(screen.getByText('Information needed')).toBeInTheDocument();
    expect(screen.getByText(/Please provide text, a link, or select a file/i)).toBeInTheDocument();
  });
});

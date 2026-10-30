import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReferencesSection from '../components/ReferencesSection';
import { Reference } from '../types';

describe('ReferencesSection Component', () => {
  const mockReferences: Reference[] = [
    {
      id: 'fc-who-5g-covid',
      publisher: 'World Health Organization',
      title: '5G mobile networks spread COVID-19',
      rating: 'False',
      ratingMeaning: 'False — mobile networks and radio frequencies cannot transmit biological viruses.',
      claim: '5G mobile networks spread COVID-19 or transmit biological viruses.',
      url: 'https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters',
      date: '2020-04-10',
      language: 'en',
      source: 'registry',
      retrievedAt: '2026-10-30T10:00:00Z',
      verifiedOn: '2026-10-30',
      isOld: true
    }
  ];

  it('renders publisher, rating pill, rating meaning, dates and logo avatar', () => {
    render(<ReferencesSection references={mockReferences} />);

    expect(screen.getByText(/World Health Organization/i)).toBeInTheDocument();
    expect(screen.getByText('False')).toBeInTheDocument();
    expect(screen.getByText(/cannot transmit biological viruses/i)).toBeInTheDocument();
    expect(screen.getByText(/Published: 2020-04-10/i)).toBeInTheDocument();
    expect(screen.getByText(/Last checked: 2026-10-30/i)).toBeInTheDocument();
    expect(screen.getByText('W')).toBeInTheDocument();
  });

  it('renders link with target="_blank" and rel="noopener noreferrer"', () => {
    render(<ReferencesSection references={mockReferences} />);

    const link = screen.getByRole('link', { name: /Read the full fact check on World Health Organization/i });
    expect(link).toHaveAttribute('href', 'https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders warning pill when reference is older than 2 years', () => {
    render(<ReferencesSection references={mockReferences} />);

    expect(screen.getByText(/This fact-check is old — check for updates/i)).toBeInTheDocument();
  });

  it('renders empty state when no match is found', () => {
    render(<ReferencesSection references={[]} sources={{ status: 'no_matches_found', items: [] }} />);

    expect(screen.getByText(/We did not find a published fact-check for this. That does not mean it is true or false./i)).toBeInTheDocument();
  });

  it('renders empty state when search is not checked / configured', () => {
    render(<ReferencesSection references={[]} sources={{ status: 'not_checked', items: [] }} />);

    expect(screen.getByText(/Fact-check search is not set up in this version/i)).toBeInTheDocument();
  });
});


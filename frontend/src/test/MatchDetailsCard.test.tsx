import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MatchDetailsCard from '../components/MatchDetailsCard';
import { Match } from '../types';

describe('MatchDetailsCard Component', () => {
  const mockMatches: Match[] = [
    {
      matchType: 'registry_phrase',
      matchStrength: 85,
      matchedPhrases: ['5g towers spread', 'covid virus radiation'],
      relation: 'similar_claim',
      similarityNote: 'Similar claim previously fact-checked',
      reference: {
        id: 'fc-who-5g-covid',
        publisher: 'World Health Organization',
        title: '5G mobile networks spread COVID-19 or transmit biological viruses.',
        rating: 'False',
        ratingMeaning: 'False — mobile networks do not transmit biological viruses.',
        claim: '5G mobile networks spread COVID-19 or transmit biological viruses.',
        url: 'https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public/myth-busters',
        date: '2020-04-10',
        language: 'en',
        source: 'registry',
        retrievedAt: '2026-10-30T10:00:00Z',
        verifiedOn: '2026-10-30'
      }
    }
  ];

  it('renders match strength bar, percentage, and label', () => {
    render(<MatchDetailsCard matches={mockMatches} userText="5G towers spread covid virus radiation everywhere" />);

    expect(screen.getByText(/Strong match/i)).toBeInTheDocument();
    expect(screen.getByText('(85%)')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '85');
  });

  it('renders relationship line and explanation', () => {
    render(<MatchDetailsCard matches={mockMatches} userText="5G towers spread covid virus radiation everywhere" />);

    expect(screen.getByText('Similar claim')).toBeInTheDocument();
    expect(screen.getByText(/reviewed a claim with similar phrasing or themes/i)).toBeInTheDocument();
  });

  it('highlights matched phrases in user text and fact-checked claim', () => {
    render(<MatchDetailsCard matches={mockMatches} userText="5G towers spread covid virus radiation everywhere" />);

    const marks = screen.getAllByText('5G towers spread');
    expect(marks.length).toBeGreaterThanOrEqual(1);
    expect(marks[0].tagName.toLowerCase()).toBe('mark');
  });

  it('displays transparency tooltip note', () => {
    render(<MatchDetailsCard matches={mockMatches} userText="5G towers spread covid virus radiation" />);

    expect(screen.getByText(/Match strength shows how close the wording is, not whether the claim is true/i)).toBeInTheDocument();
  });
});


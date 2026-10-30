import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ReasonsList from '../components/ReasonsList';
import { ReasonItem } from '../types';

describe('ReasonsList Component with Reference Markers', () => {
  it('renders reasons and links numbered markers to reference anchors', () => {
    const reasons: ReasonItem[] = [
      {
        tone: 'info',
        text: 'Similar claim previously fact-checked by WHO',
        refIds: ['fc-who-5g-covid']
      },
      {
        tone: 'bad',
        text: 'Uses shocking conspiracy words',
        refIds: ['ref-style-nlp']
      }
    ];

    render(<ReasonsList reasons={reasons} />);

    expect(screen.getByText(/Similar claim previously fact-checked by WHO/i)).toBeInTheDocument();
    expect(screen.getByText(/Uses shocking conspiracy words/i)).toBeInTheDocument();

    const link1 = screen.getByRole('link', { name: /Jump to reference evidence fc-who-5g-covid/i });
    expect(link1).toHaveAttribute('href', '#ref-fc-who-5g-covid');
    expect(link1).toHaveTextContent('[1]');

    const link2 = screen.getByRole('link', { name: /Jump to reference evidence ref-style-nlp/i });
    expect(link2).toHaveAttribute('href', '#ref-ref-style-nlp');
    expect(link2).toHaveTextContent('[1]');
  });
});


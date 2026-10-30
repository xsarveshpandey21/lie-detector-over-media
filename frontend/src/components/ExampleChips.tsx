import React from 'react';
import { ContentType } from '../types';

export interface ExampleItem {
  title: string;
  type: ContentType;
  content: string;
}

interface ExampleChipsProps {
  onSelect: (item: ExampleItem) => void;
  disabled?: boolean;
}

export default function ExampleChips({ onSelect, disabled }: ExampleChipsProps) {
  const examples: ExampleItem[] = [
    {
      title: '⚡ Sensational Rumor',
      type: 'text',
      content: 'SHOCKING: Doctors reveal miracle cure that big pharma is desperately trying to suppress! 100% guaranteed!'
    },
    {
      title: '📰 Factual Report',
      type: 'text',
      content: 'According to a study published in Reuters, researchers from Oxford University reported a 15% reduction in cardiovascular risk.'
    },
    {
      title: '🔗 Fact-Check Link',
      type: 'url',
      content: 'https://www.reuters.com/fact-check'
    }
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
      <span className="text-muted dark:text-brown-300 font-medium">Try an example:</span>
      {examples.map((item, idx) => (
        <button
          key={idx}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(item)}
          className="px-2.5 py-1 rounded-full bg-yellow-100 hover:bg-yellow-300/80 text-brown-700 font-medium border border-yellow-300/60 transition-colors disabled:opacity-50"
        >
          {item.title}
        </button>
      ))}
    </div>
  );
}


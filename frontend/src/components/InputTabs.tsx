import React, { useRef } from 'react';
import { ContentType } from '../types';

interface InputTabsProps {
  selectedTab: ContentType;
  onSelectTab: (tab: ContentType) => void;
  disabled?: boolean;
  tabLabels: Record<ContentType, string>;
}

export default function InputTabs({
  selectedTab,
  onSelectTab,
  disabled,
  tabLabels
}: InputTabsProps) {
  const tabs: Array<{ id: ContentType; icon: string }> = [
    { id: 'text', icon: '📝' },
    { id: 'image', icon: '🖼' },
    { id: 'video', icon: '🎥' },
    { id: 'audio', icon: '🎙' },
    { id: 'url', icon: '🔗' }
  ];

  const tabListRef = useRef<HTMLDivElement>(null);

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    let newIndex = index;
    if (e.key === 'ArrowRight') {
      newIndex = (index + 1) % tabs.length;
    } else if (e.key === 'ArrowLeft') {
      newIndex = (index - 1 + tabs.length) % tabs.length;
    } else {
      return;
    }

    e.preventDefault();
    onSelectTab(tabs[newIndex].id);
    const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[newIndex]?.focus();
  }

  return (
    <div
      ref={tabListRef}
      role="tablist"
      aria-label="Content type selector"
      className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 rounded-2xl bg-sand/60 dark:bg-brown-900 border border-line dark:border-brown-700"
    >
      {tabs.map((tab, idx) => {
        const isSelected = selectedTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-selected={isSelected}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={isSelected ? 0 : -1}
            disabled={disabled}
            onClick={() => onSelectTab(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              isSelected
                ? 'bg-paper dark:bg-brown-800 text-brown-900 dark:text-cream shadow-card border border-line dark:border-brown-600'
                : 'text-muted dark:text-brown-300 hover:text-ink hover:bg-paper/50 dark:hover:bg-brown-800/50'
            }`}
          >
            <span aria-hidden="true" className="text-base">{tab.icon}</span>
            <span>{tabLabels[tab.id]}</span>
          </button>
        );
      })}
    </div>
  );
}


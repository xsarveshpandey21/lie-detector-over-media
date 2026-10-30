import React, { useState } from 'react';
import { ContentType } from '../types';
import InputTabs from './InputTabs';
import TextInput from './TextInput';
import LinkInput from './LinkInput';
import FileDrop from './FileDrop';
import ExampleChips, { ExampleItem } from './ExampleChips';

interface UploadPanelProps {
  onCheck: (payload: {
    type: ContentType;
    text?: string;
    url?: string;
    file?: File | null;
  }) => void;
  loading: boolean;
  loadingMessage: string;
  onCancel: () => void;
  onError: (msg: string) => void;
  t: {
    step1Title: string;
    stepBadge1?: string;
    tabs: Record<ContentType, string>;
    tabHelp: Record<ContentType, string>;
    placeholders: {
      text: string;
      url: string;
    };
    dropzones: {
      photo: string;
      video: string;
      audio: string;
      limit: string;
    };
    buttons: {
      check: string;
      cancel: string;
      checking: string;
      remove: string;
    };
  };
  initialValues?: {
    type?: ContentType;
    text?: string;
    url?: string;
    file?: File | null;
  };
}

export default function UploadPanel({
  onCheck,
  loading,
  loadingMessage,
  onCancel,
  onError,
  t,
  initialValues
}: UploadPanelProps) {
  const [selectedTab, setSelectedTab] = useState<ContentType>(initialValues?.type || 'text');
  const [text, setText] = useState<string>(initialValues?.text || '');
  const [url, setUrl] = useState<string>(initialValues?.url || '');
  const [file, setFile] = useState<File | null>(initialValues?.file || null);

  // Requirement 4: Reset file (and preview) when the type tab changes so an image can NEVER be sent as a video
  function handleTabChange(newTab: ContentType) {
    if (newTab !== selectedTab) {
      setSelectedTab(newTab);
      setFile(null); // Clears file immediately on tab change
    }
  }

  function handleExampleSelect(example: ExampleItem) {
    setSelectedTab(example.type);
    setFile(null);
    if (example.type === 'text') {
      setText(example.content);
    } else if (example.type === 'url') {
      setUrl(example.content);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (selectedTab === 'text') {
      if (!text.trim()) {
        onError('Please enter or paste claim text before checking.');
        return;
      }
      onCheck({ type: 'text', text: text.trim() });
    } else if (selectedTab === 'url') {
      if (!url.trim()) {
        onError('Please enter a website link before checking.');
        return;
      }
      onCheck({ type: 'url', url: url.trim() });
    } else {
      if (!file) {
        onError(`Please choose a ${selectedTab} file from your device.`);
        return;
      }
      onCheck({ type: selectedTab, file });
    }
  }

  return (
    <div className="card space-y-5 bg-paper dark:bg-brown-900 border border-line dark:border-brown-700">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted dark:text-brown-300">
          {t.step1Title}
        </h3>
        <span className="text-xs text-muted dark:text-brown-400">
          {t.stepBadge1 || 'Step 1 of 3'}
        </span>
      </div>

      {/* Tabs */}
      <InputTabs
        selectedTab={selectedTab}
        onSelectTab={handleTabChange}
        disabled={loading}
        tabLabels={t.tabs}
      />

      {/* Help text for active tab */}
      <p className="text-xs text-muted dark:text-brown-200 px-1">
        {t.tabHelp[selectedTab]}
      </p>

      {/* Tab Panels */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {selectedTab === 'text' && (
          <TextInput
            value={text}
            onChange={setText}
            disabled={loading}
            placeholder={t.placeholders.text}
          />
        )}

        {selectedTab === 'url' && (
          <LinkInput
            value={url}
            onChange={setUrl}
            disabled={loading}
            placeholder={t.placeholders.url}
          />
        )}

        {(selectedTab === 'image' || selectedTab === 'video' || selectedTab === 'audio') && (
          <FileDrop
            type={selectedTab}
            file={file}
            onFileSelect={setFile}
            disabled={loading}
            t={t}
            onError={onError}
          />
        )}

        {/* Example chips */}
        <ExampleChips
          onSelect={handleExampleSelect}
          disabled={loading}
        />

        {/* Action bar */}
        <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 dark:border-brown-800">
          <div className="flex items-center gap-2">
            {loading && (
              <span className="text-xs text-muted dark:text-brown-300 italic animate-pulse">
                {loadingMessage}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {loading && (
              <button
                type="button"
                onClick={onCancel}
                className="btn-secondary text-xs px-4 py-2"
              >
                {t.buttons.cancel}
              </button>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary text-sm px-6 py-2.5 w-full sm:w-auto shadow-sm"
            >
              {loading ? t.buttons.checking : t.buttons.check}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

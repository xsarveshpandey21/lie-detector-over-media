import React, { useState, useEffect } from 'react';
import { Report } from '../types';
import { askChat, checkHealth } from '../api/client';

interface ChatbotProps {
  report: Report | null;
}

export default function Chatbot({ report }: ChatbotProps) {
  const [available, setAvailable] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkHealth()
      .then((h) => {
        setAvailable(Boolean(h?.integrations?.openAi));
      })
      .catch(() => setAvailable(false));
  }, []);

  if (!available || !report) {
    return null; // Honest: hide when no API key configured or no report active
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const reply = await askChat(userMsg, report);
      setMessages(prev => [...prev, { role: 'assistant', text: reply }]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', text: 'Could not connect to the verification assistant. Please try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-3 bg-sand/30 dark:bg-brown-900 border border-line dark:border-brown-700">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left text-xs font-bold uppercase tracking-wider text-muted dark:text-brown-300"
      >
        <span>Ask questions about this report</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="pt-2 space-y-3 text-xs">
          <p className="text-muted dark:text-brown-300">
            Ask clarification questions specifically about this report. The assistant cannot verify facts outside this check.
          </p>

          <div className="max-h-56 overflow-y-auto space-y-2 p-2 rounded-xl bg-paper dark:bg-brown-950 border border-line dark:border-brown-800">
            {messages.length === 0 ? (
              <p className="text-muted italic text-center py-4">
                Example: &ldquo;Why was the confidence rated medium?&rdquo;
              </p>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl ${
                    m.role === 'user'
                      ? 'bg-sand dark:bg-brown-800 text-ink dark:text-cream ml-6'
                      : 'bg-paper dark:bg-brown-900 text-ink dark:text-cream border border-line dark:border-brown-700 mr-6'
                  }`}
                >
                  <span className="font-bold block text-[10px] text-muted mb-0.5">
                    {m.role === 'user' ? 'You' : 'Lie Detector Over Media Assistant'}
                  </span>
                  {m.text}
                </div>
              ))
            )}
            {loading && (
              <p className="text-muted text-center py-2 animate-pulse">
                Reviewing report data…
              </p>
            )}
          </div>

          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this check…"
              className="flex-1 p-2 rounded-lg border border-line dark:border-brown-700 bg-paper dark:bg-brown-950 text-ink dark:text-cream text-xs outline-none focus:ring-1 focus:ring-yellow-400"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary text-xs px-3 py-1.5"
            >
              Ask
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

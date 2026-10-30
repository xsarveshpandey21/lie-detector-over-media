import { useState } from 'react';
import { analyze } from '../api/client';

export default function UploadPanel({ onReport }: { onReport: (r: any) => void }) {
  const [type, setType] = useState<'text' | 'image' | 'video' | 'audio' | 'url'>('text');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const samples = [
    {
      title: '⚡ Sensational Rumor',
      type: 'text' as const,
      content: 'SHOCKING: Doctors reveal miracle cure that big pharma is desperately trying to suppress! 100% guaranteed!'
    },
    {
      title: '📰 Factual Report',
      type: 'text' as const,
      content: 'According to a study published in Reuters, researchers from Oxford University reported a 15% reduction in cardiovascular risk.'
    },
    {
      title: '🔗 Fact-Checking URL',
      type: 'url' as const,
      content: 'https://www.reuters.com/fact-check'
    }
  ];

  function applySample(sample: typeof samples[0]) {
    setType(sample.type);
    setErrorMessage(null);
    if (sample.type === 'text') {
      setText(sample.content);
    } else if (sample.type === 'url') {
      setUrl(sample.content);
    }
  }

  async function submit() {
    setErrorMessage(null);

    if (type === 'text' && !text.trim()) {
      setErrorMessage('Please enter or paste text to verify.');
      return;
    }
    if (type === 'url' && !url.trim()) {
      setErrorMessage('Please enter a website URL to verify.');
      return;
    }
    if (['image', 'video', 'audio'].includes(type) && !file) {
      setErrorMessage(`Please select a ${type} file from your device.`);
      return;
    }

    setLoading(true);
    try {
      const data = await analyze({ type, text, url, file, language });
      onReport(data);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Verification request failed. Please check backend connection.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card space-y-4">
      {/* Type Selector */}
      <div className="flex flex-wrap gap-2">
        {(['text', 'image', 'video', 'audio', 'url'] as const).map(t => (
          <button
            key={t}
            className={`px-4 py-1.5 rounded-lg font-medium text-sm transition-colors border ${
              type === t
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            onClick={() => {
              setType(t);
              setErrorMessage(null);
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Input area */}
      {type === 'text' && (
        <div className="space-y-1">
          <textarea
            className="w-full h-32 p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm leading-relaxed"
            placeholder="Paste news claim, social media post, or statement..."
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{text.split(/\s+/).filter(Boolean).length} words</span>
            <span>{text.length} characters</span>
          </div>
        </div>
      )}

      {type === 'url' && (
        <div className="space-y-1">
          <input
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            placeholder="https://example.com/article..."
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
        </div>
      )}

      {['image', 'video', 'audio'].includes(type) && (
        <div className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg text-center bg-gray-50 dark:bg-gray-900/50">
          <input
            type="file"
            accept={`${type}/*`}
            id="file-upload"
            className="hidden"
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          <label htmlFor="file-upload" className="cursor-pointer inline-flex flex-col items-center">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
              {file ? file.name : `Select ${type} file from computer`}
            </span>
            <span className="text-xs text-gray-500 mt-1">
              {file ? `${(file.size / 1024).toFixed(1)} KB` : `Supports standard ${type} formats up to 15MB`}
            </span>
          </label>
        </div>
      )}

      {/* Quick Test Samples */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200 dark:border-gray-800 text-xs">
        <span className="text-gray-500 font-medium">Quick Test Samples:</span>
        {samples.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => applySample(s)}
            className="px-2.5 py-1 rounded bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-start justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="ml-3 font-bold hover:text-red-900 dark:hover:text-red-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Language:</label>
          <select
            className="p-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm outline-none"
            value={language}
            onChange={e => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="hi">Hindi (हिंदी)</option>
            <option value="bn">Bengali (বাংলা)</option>
            <option value="te">Telugu (తెలుగు)</option>
            <option value="ta">Tamil (தமிழ்)</option>
            <option value="mr">Marathi (मराठी)</option>
            <option value="gu">Gujarati (ગુજરાતી)</option>
            <option value="kn">Kannada (ಕನ್ನಡ)</option>
            <option value="ml">Malayalam (മലയാളം)</option>
            <option value="pa">Punjabi (ਪੰਜਾਬੀ)</option>
            <option value="ur">Urdu (اردو)</option>
          </select>
        </div>

        <button
          disabled={loading}
          onClick={submit}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg shadow-sm transition-all"
        >
          {loading ? 'Verifying Content...' : 'Verify Authenticity'}
        </button>
      </div>
    </div>
  );
}

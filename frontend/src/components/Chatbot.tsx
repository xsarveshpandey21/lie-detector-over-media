import { useState } from 'react';

export default function Chatbot() {
  const [messages, setMessages] = useState<{role:'user'|'ai',content:string}[]>([]);
  const [input, setInput] = useState('');

  function send() {
    if (!input.trim()) return;
    setMessages([...messages, { role: 'user', content: input }, { role: 'ai', content: 'AI Mentor: Consider source credibility, metadata, and cross-verification.' }]);
    setInput('');
  }

  return (
    <div className="card">
      <h3 className="font-semibold mb-2">AI Assistant</h3>
      <div className="h-32 overflow-auto text-sm space-y-1 mb-2">
        {messages.map((m,i)=> <div key={i}><b>{m.role === 'user' ? 'You' : 'AI'}:</b> {m.content}</div>)}
      </div>
      <div className="flex gap-2">
        <input className="flex-1 p-2 rounded border bg-transparent" value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask about a claim..." />
        <button onClick={send} className="px-3 py-2 bg-blue-600 text-white rounded">Send</button>
      </div>
    </div>
  );
}

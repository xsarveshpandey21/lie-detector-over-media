const express = require('express');
const router = express.Router();
const axios = require('axios');

/**
 * Intelligent open-source report assistant that answers questions using the active report context
 */
function generateLocalAnswer(question, report) {
  if (!report || !report.verdict) {
    return 'Please check a piece of text, photo, audio, or link first so I can answer questions about the specific report.';
  }

  const q = question.toLowerCase().trim();
  const verdict = report.verdict;
  const reasons = (report.reasons || []).map(r => r.text);
  const sources = report.sources?.items || [];
  const checks = report.checks || [];
  const nextSteps = report.nextSteps || [];
  const tech = report.technical || {};

  // 1. Why questions: "Why is this false / true / uncertain?"
  if (q.includes('why') || q.includes('how come') || q.includes('reason')) {
    if (reasons.length > 0) {
      return `Our analysis determined this verdict ("${verdict.headline}") based on these findings:\n\n• ` + reasons.join('\n• ');
    }
    return `The verdict is "${verdict.headline}" because: ${verdict.meaning}`;
  }

  // 2. Sources questions: "What sources did you find?", "Where does this come from?"
  if (q.includes('source') || q.includes('publisher') || q.includes('fact check') || q.includes('who said')) {
    if (sources.length > 0) {
      const srcList = sources.map(s => `• ${s.publisher} rated this "${s.rating}" on ${s.date || 'record'}: ${s.claim}`).join('\n');
      return `We matched verified investigations from these fact-checking publishers:\n\n${srcList}`;
    }
    return 'We did not find a direct fact-checking review in our database for this specific wording. We evaluated the structural style, metadata, and linguistic patterns.';
  }

  // 3. Sharing / Action questions: "Can I share this?", "Should I repost?", "What should I do?"
  if (q.includes('share') || q.includes('forward') || q.includes('post') || q.includes('what should i do') || q.includes('next')) {
    if (verdict.label === 'likely_false') {
      return '⚠️ We recommend NOT forwarding or sharing this message. It shows clear markers of misinformation or clickbait. Here are recommended next steps:\n\n• ' + nextSteps.join('\n• ');
    } else if (verdict.label === 'likely_true') {
      return 'While this content appears structured and reliable, Satya Lens gives signals rather than absolute proof. Verify with primary sources before sharing:\n\n• ' + nextSteps.join('\n• ');
    } else {
      return 'We could not definitively verify this content. Do not forward unverified claims. Follow these steps:\n\n• ' + nextSteps.join('\n• ');
    }
  }

  // 4. Checks questions: "What checks did you run?", "How did you check?"
  if (q.includes('check') || q.includes('test') || q.includes('method') || q.includes('how did you')) {
    const checkList = checks.map(c => `• ${c.name}: ${c.note} (${c.ran ? 'Ran' : 'Not run'})`).join('\n');
    return `Here are the checks evaluated for this ${report.type || 'content'}:\n\n${checkList}`;
  }

  // 5. Confidence / Score questions: "How sure are you?", "What is the score?"
  if (q.includes('sure') || q.includes('confidence') || q.includes('score') || q.includes('percentage')) {
    const scoreText = verdict.score !== null ? `${verdict.score}/100` : 'Not scored (file headers alone cannot guarantee authenticity)';
    return `Our confidence level is "${verdict.confidenceLevel}" with a reliability score of ${scoreText}. Confidence reflects the strength and convergence of evidence gathered.`;
  }

  // 6. Reading level / technical questions
  if (q.includes('reading') || q.includes('words') || q.includes('technical') || q.includes('metadata') || q.includes('exif')) {
    const details = Object.entries(tech).map(([k, v]) => `• ${k}: ${v}`).slice(0, 8).join('\n');
    return `Here are the technical and linguistic metrics extracted:\n\n${details}`;
  }

  // Default fallback answer incorporating report context
  return `Regarding your question about "${report.input?.preview?.slice(0, 60)}…":\n\nVerdict: ${verdict.headline} (${verdict.confidenceLevel} confidence).\n${verdict.meaning}\n\nTop reasons:\n• ` + reasons.slice(0, 3).join('\n• ');
}

router.post('/', async (req, res) => {
  const { message, report } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      error: 'empty_message',
      message: 'Please provide a question about the report.'
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  // If OpenAI key is present, use LLM
  if (apiKey) {
    try {
      const reportContext = report ? JSON.stringify({
        verdict: report.verdict,
        reasons: report.reasons,
        sources: report.sources,
        checks: report.checks,
        technical: report.technical
      }) : 'No active report provided.';

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are the Satya Lens Assistant. You answer questions strictly based on the current verification report provided below in simple, plain English. Never invent or hallucinate facts.
Current Report:
${reportContext}`
            },
            { role: 'user', content: message.slice(0, 1000) }
          ],
          temperature: 0.2,
          max_tokens: 350
        },
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          timeout: 8000
        }
      );

      const reply = response.data?.choices?.[0]?.message?.content?.trim();
      if (reply) {
        return res.json({ reply });
      }
    } catch (err) {
      console.warn('[OpenAI Chat Fallback to Local Engine]:', err.message);
    }
  }

  // Open-Source Intelligent Fallback
  const reply = generateLocalAnswer(message, report);
  return res.json({ reply });
});

module.exports = router;

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { AppError } = require('../utils/errors');

router.post('/', async (req, res, next) => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'ai_chat_unavailable',
      message: 'AI assistant is not configured on this server.'
    });
  }

  const { message, report } = req.body || {};
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({
      error: 'empty_message',
      message: 'Please provide a question about the report.'
    });
  }

  try {
    const reportContext = report ? JSON.stringify({
      verdict: report.verdict,
      reasons: report.reasons,
      sources: report.sources,
      checks: report.checks
    }) : 'No active report provided.';

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are the Satya Lens Assistant. You answer questions strictly based on the current verification report provided below. Never invent or hallucinate facts. If the information is not in the report or cannot be confirmed, say honestly: "The verification report does not contain enough information to confirm that."
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
        timeout: 10000
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content?.trim() || 'No response generated.';
    return res.json({ reply });
  } catch (err) {
    console.warn('[Chat Error]:', err.message);
    return res.status(500).json({
      error: 'chat_error',
      message: 'Could not generate a response at this time.'
    });
  }
});

module.exports = router;


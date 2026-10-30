// Translation service with Google Translate API support and graceful fallbacks
const axios = require('axios');

const SUPPORTED = new Set(['en', 'hi', 'bn', 'te', 'ta', 'mr', 'gu', 'kn', 'ml', 'pa', 'ur']);

async function translateText(text, targetLang = 'en', sourceLang = 'auto') {
  if (!text || typeof text !== 'string') return text;
  if (!targetLang) return text;
  if (sourceLang && targetLang === sourceLang) return text;

  // If Google Translate API key is provided, use official API
  if (process.env.GOOGLE_TRANSLATE_API_KEY) {
    try {
      const key = process.env.GOOGLE_TRANSLATE_API_KEY;
      const url = 'https://translation.googleapis.com/language/translate/v2';
      const { data } = await axios.post(url, {
        q: text,
        target: targetLang,
        source: sourceLang === 'auto' ? undefined : sourceLang,
        format: 'text'
      }, {
        params: { key },
        timeout: 5000
      });
      return data?.data?.translations?.[0]?.translatedText || text;
    } catch (e) {
      console.warn('Google Translate API error:', e.message);
    }
  }

  // Graceful fallback: return original text if no external API configured
  return text;
}

async function translateReport(report, targetLang = 'en') {
  if (!report || targetLang === 'en') return report;
  const copy = { ...report };

  try {
    copy.summary = await translateText(report.summary, targetLang);
    if (Array.isArray(report.explanations)) {
      copy.explanations = await Promise.all(
        report.explanations.map(ex => translateText(ex, targetLang))
      );
    }
    if (copy.education?.tip) {
      copy.education = { ...copy.education, tip: await translateText(copy.education.tip, targetLang) };
    }
    if (copy.breakdown?.crossVerification && Array.isArray(copy.breakdown.crossVerification)) {
      copy.breakdown = { ...copy.breakdown };
      copy.breakdown.crossVerification = await Promise.all(
        copy.breakdown.crossVerification.map(async (cv) => {
          const translated = { ...cv };
          if (cv.note) translated.note = await translateText(cv.note, targetLang);
          return translated;
        })
      );
    }
    if (copy.gamification?.badge) {
      copy.gamification = { ...copy.gamification, badge: await translateText(copy.gamification.badge, targetLang) };
    }
  } catch (err) {
    console.warn('translateReport partial failure:', err.message);
  }

  return copy;
}

module.exports = { translateText, translateReport, SUPPORTED };

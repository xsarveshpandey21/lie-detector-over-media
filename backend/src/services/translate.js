// Batched translation service with Google Translate API support and honest fallbacks
const axios = require('axios');

const SUPPORTED = new Set(['en', 'hi', 'bn', 'te', 'ta', 'mr', 'gu', 'kn', 'ml', 'pa', 'ur']);

/**
 * Translates a list of strings into the target language in a single batched API call.
 * Google Translate v2 accepts an array of strings in `q`.
 *
 * @param {string[]} strings - Array of strings to translate
 * @param {string} targetLang - Target language code
 * @param {string} [sourceLang='auto'] - Source language code
 * @returns {Promise<{ translated: string[], applied: boolean, notice?: string }>}
 */
async function translateBatch(strings, targetLang = 'en', sourceLang = 'auto') {
  if (!Array.isArray(strings) || strings.length === 0) {
    return { translated: [], applied: false };
  }

  // If already target or no target
  if (!targetLang || targetLang === 'en' || (sourceLang && targetLang === sourceLang)) {
    return { translated: strings, applied: false };
  }

  // If no Google Translate API key
  if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
    return {
      translated: strings,
      applied: false,
      notice: 'Translation is not available right now. Results are shown in English.'
    };
  }

  try {
    const key = process.env.GOOGLE_TRANSLATE_API_KEY;
    const url = 'https://translation.googleapis.com/language/translate/v2';

    const { data } = await axios.post(url, {
      q: strings,
      target: targetLang,
      source: sourceLang === 'auto' ? undefined : sourceLang,
      format: 'text'
    }, {
      params: { key },
      timeout: 8000
    });

    const translations = data?.data?.translations;
    if (Array.isArray(translations) && translations.length === strings.length) {
      return {
        translated: translations.map((t, i) => t?.translatedText || strings[i]),
        applied: true
      };
    }

    return { translated: strings, applied: false };
  } catch (err) {
    console.warn('[Translate API Warning]:', err.message);
    return {
      translated: strings,
      applied: false,
      notice: 'Translation service encountered an error. Results are shown in English.'
    };
  }
}

/**
 * Single text translation helper
 */
async function translateText(text, targetLang = 'en', sourceLang = 'auto') {
  if (!text || typeof text !== 'string') return text;
  const res = await translateBatch([text], targetLang, sourceLang);
  return res.translated[0] || text;
}

/**
 * Translates plain-English report fields in ONE batched request.
 *
 * @param {Object} report
 * @param {string} targetLang
 * @returns {Promise<Object>}
 */
async function translateReport(report, targetLang = 'en') {
  if (!report || targetLang === 'en') return report;

  const copy = { ...report };
  copy.notices = Array.isArray(copy.notices) ? [...copy.notices] : [];

  // Collect all plain-English strings to translate in order
  const stringList = [];
  const markers = [];

  if (copy.verdict?.headline) {
    markers.push({ type: 'verdict.headline' });
    stringList.push(copy.verdict.headline);
  }
  if (copy.verdict?.meaning) {
    markers.push({ type: 'verdict.meaning' });
    stringList.push(copy.verdict.meaning);
  }

  if (Array.isArray(copy.reasons)) {
    copy.reasons.forEach((r, idx) => {
      markers.push({ type: 'reason', idx });
      stringList.push(r.text);
    });
  }

  if (Array.isArray(copy.nextSteps)) {
    copy.nextSteps.forEach((s, idx) => {
      markers.push({ type: 'nextStep', idx });
      stringList.push(s);
    });
  }

  // Deprecated summary & explanations if present
  if (copy.summary) {
    markers.push({ type: 'summary' });
    stringList.push(copy.summary);
  }
  if (Array.isArray(copy.explanations)) {
    copy.explanations.forEach((ex, idx) => {
      markers.push({ type: 'explanation', idx });
      stringList.push(ex);
    });
  }

  if (stringList.length === 0) {
    return copy;
  }

  // Execute ONE batched translation call
  const { translated, applied, notice } = await translateBatch(stringList, targetLang);

  if (notice && !copy.notices.includes(notice)) {
    copy.notices.push(notice);
  }

  if (!applied) {
    return copy;
  }

  // Distribute translated strings back to fields
  markers.forEach((marker, index) => {
    const val = translated[index];
    if (marker.type === 'verdict.headline') {
      copy.verdict = { ...copy.verdict, headline: val };
    } else if (marker.type === 'verdict.meaning') {
      copy.verdict = { ...copy.verdict, meaning: val };
    } else if (marker.type === 'reason') {
      copy.reasons = copy.reasons.map((r, i) => i === marker.idx ? { ...r, text: val } : r);
    } else if (marker.type === 'nextStep') {
      copy.nextSteps = copy.nextSteps.map((s, i) => i === marker.idx ? val : s);
    } else if (marker.type === 'summary') {
      copy.summary = val;
    } else if (marker.type === 'explanation') {
      copy.explanations = copy.explanations.map((ex, i) => i === marker.idx ? val : ex);
    }
  });

  return copy;
}

module.exports = { translateText, translateBatch, translateReport, SUPPORTED };

const express = require('express');
const router = express.Router();

const detectText = require('../services/detectors/text');
const detectImage = require('../services/detectors/image');
const detectVideo = require('../services/detectors/video');
const detectAudio = require('../services/detectors/audio');
const detectUrl = require('../services/detectors/url');
const { searchFactChecks } = require('../services/crossVerify');
const { scoreSources } = require('../services/credibility');
const { translateText, translateReport } = require('../services/translate');
const { evaluateConfidence } = require('../services/confidence');
const { AppError } = require('../utils/errors');

const ANALYSIS_TIMEOUT_MS = 25000;

router.post('/', async (req, res, next) => {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new AppError(504, 'timeout', 'The check took too long to complete. Please try again with shorter text or a smaller file.'));
    }, ANALYSIS_TIMEOUT_MS);
  });

  try {
    const result = await Promise.race([
      handleAnalysis(req),
      timeoutPromise
    ]);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
});

async function handleAnalysis(req) {
  const contentType = req.body?.type || inferType(req);
  const userLang = (req.body?.language || 'en').toLowerCase().trim();

  let result;

  switch (contentType) {
    case 'text': {
      const originalText = req.body?.text || '';
      if (!originalText || !originalText.trim()) {
        throw new AppError(400, 'empty_text', 'Please enter or paste text to check.');
      }
      if (originalText.length > 5000) {
        throw new AppError(400, 'text_too_long', 'Text is too long. Please limit text to 5,000 characters.');
      }

      // Translate to English for analysis if needed
      const textForAnalysis = (userLang && userLang !== 'en')
        ? await translateText(originalText, 'en', userLang)
        : originalText;

      result = await detectText(textForAnalysis);

      // Search real Google Fact Check Tools API and Curated Open-Source Registry for text claims
      const sourcesResult = await searchFactChecks(textForAnalysis, userLang);
      result.sources = sourcesResult;

      // Merge matches & references
      const mergedMatches = [...(sourcesResult.matches || []), ...(result.matches || [])];
      result.matches = mergedMatches;

      const mergedRefs = [...(sourcesResult.references || []), ...(result.references || [])];
      // Deduplicate references by ID
      const seenRefIds = new Set();
      result.references = mergedRefs.filter(r => {
        if (!r || !r.id || seenRefIds.has(r.id)) return false;
        seenRefIds.add(r.id);
        return true;
      });

      if (sourcesResult.items && sourcesResult.items.length > 0) {
        // ONLY live Google Fact Check API matches may override verdict or set confidenceLevel to 'high'
        if (sourcesResult.source === 'google_api') {
          const top = sourcesResult.items[0];
          const topRating = top.rating.toLowerCase();
          result.verdict.confidenceLevel = 'high';

          if (topRating.includes('false') || topRating.includes('fire') || topRating.includes('fake') || topRating.includes('myth')) {
            result.verdict.label = 'likely_false';
            result.verdict.score = 15;
            result.verdict.headline = 'Debunked claim / Misleading statement';
            result.verdict.meaning = `This claim was investigated and debunked by ${top.publisher} (rated "${top.rating}").`;
          } else if (topRating.includes('true') || topRating.includes('verified')) {
            result.verdict.label = 'likely_true';
            result.verdict.score = 92;
            result.verdict.headline = 'Verified factual claim';
            result.verdict.meaning = `This claim was investigated and verified as factual by ${top.publisher}.`;
          }

          result.confidence = {
            level: 'high',
            score: 95,
            reason: `High because ${top.publisher} published an independent fact-check investigating this exact claim.`
          };
        }
      }

      // Re-evaluate confidence if not set
      if (!result.confidence) {
        result.confidence = evaluateConfidence({
          matches: result.matches,
          nlpMetrics: result.technical || {},
          externalModel: null,
          contentType: 'text'
        });
      }

      // Add real fact check note to checks transparency
      result.checks.push({
        name: 'Fact-checking registry search',
        ran: sourcesResult.status !== 'not_checked',
        note: sourcesResult.status === 'checked'
          ? (sourcesResult.source === 'google_api'
            ? `Found ${sourcesResult.items.length} verified live fact-check review(s)`
            : `Found ${sourcesResult.items.length} similar claim(s) previously fact-checked`)
          : sourcesResult.status === 'no_matches_found'
          ? 'No published fact-checks found for this exact claim'
          : 'No direct registry matches'
      });

      // Compute honest credibility if real fact checks found
      const cred = scoreSources({ factCheckItems: sourcesResult.items });
      if (cred) {
        result.technical.credibility = cred;
      }
      break;
    }

    case 'image': {
      if (!req.file) {
        throw new AppError(400, 'missing_file', 'Please select an image file to check.');
      }
      const mime = req.file.mimetype || '';
      if (!mime.startsWith('image/')) {
        throw new AppError(400, 'invalid_file_type', 'The selected file is not an image. Please upload a photo (JPEG, PNG, WebP, etc.).');
      }
      result = await detectImage(req.file);
      break;
    }

    case 'video': {
      if (!req.file) {
        throw new AppError(400, 'missing_file', 'Please select a video file to check.');
      }
      const mime = req.file.mimetype || '';
      if (!mime.startsWith('video/')) {
        throw new AppError(400, 'invalid_file_type', 'The selected file is not a video. Please upload a video file (MP4, WebM, etc.).');
      }
      result = await detectVideo(req.file);
      break;
    }

    case 'audio': {
      if (!req.file) {
        throw new AppError(400, 'missing_file', 'Please select an audio file to check.');
      }
      const mime = req.file.mimetype || '';
      if (!mime.startsWith('audio/')) {
        throw new AppError(400, 'invalid_file_type', 'The selected file is not an audio clip. Please upload an audio file (MP3, WAV, etc.).');
      }
      result = await detectAudio(req.file);
      break;
    }

    case 'url': {
      const urlText = req.body?.url || '';
      if (!urlText || !urlText.trim()) {
        throw new AppError(400, 'empty_url', 'Please enter a website link to check.');
      }
      if (urlText.length > 2048) {
        throw new AppError(400, 'url_too_long', 'Link is too long. Links are limited to 2,048 characters.');
      }
      result = await detectUrl(urlText);

      // Compute credibility from verified domain rules
      const cred = scoreSources({ domainMeta: result.technical });
      if (cred) {
        result.technical.credibility = cred;
      }
      break;
    }

    default:
      throw new AppError(400, 'unsupported_type', `Unsupported content type "${contentType}". Supported types: text, image, video, audio, url.`);
  }

  // Guarantee consistent response schema for all content types
  result.matches = result.matches || [];
  result.references = result.references || [];
  if (!result.confidence) {
    result.confidence = evaluateConfidence({
      matches: result.matches,
      nlpMetrics: result.technical || {},
      contentType: result.type
    });
  }

  // If user requested non-English output, translate plain-English fields in one batched call
  if (userLang && userLang !== 'en') {
    result = await translateReport(result, userLang);
  }

  return result;
}

function inferType(req) {
  if (req.file) {
    const mime = req.file.mimetype || '';
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
  }
  if (req.body?.url) return 'url';
  if (req.body?.text) return 'text';
  return 'unknown';
}

module.exports = router;

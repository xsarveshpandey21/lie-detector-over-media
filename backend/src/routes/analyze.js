const express = require('express');
const router = express.Router();

const detectText = require('../services/detectors/text');
const detectImage = require('../services/detectors/image');
const detectVideo = require('../services/detectors/video');
const detectAudio = require('../services/detectors/audio');
const detectUrl = require('../services/detectors/url');
const crossVerify = require('../services/crossVerify');
const education = require('../services/education');
const credibility = require('../services/credibility');
const { translateText, translateReport } = require('../services/translate');

router.post('/', async (req, res) => {
  try {
    const contentType = req.body?.type || inferType(req);
    const userLang = (req.body?.language || 'en').toLowerCase();
    let result;

    switch (contentType) {
      case 'text':
        {
          const originalText = req.body?.text || '';
          // Translate to English for analysis if needed
          const textForAnalysis = userLang !== 'en' ? await translateText(originalText, 'en') : originalText;
          result = await detectText(textForAnalysis);
        }
        break;
      case 'image':
        result = await detectImage(req.file);
        break;
      case 'video':
        result = await detectVideo(req.file);
        break;
      case 'audio':
        result = await detectAudio(req.file);
        break;
      case 'url':
        result = await detectUrl(req.body?.url || '');
        break;
      default:
        return res.status(400).json({ error: 'Unsupported or unknown type' });
    }

    const cross = await crossVerify(result);
    const tip = education.tipFor(result.type);
    const cred = credibility.scoreSources(result);

    let response = {
      ...result,
      breakdown: {
        ...(result.breakdown || {}),
        crossVerification: cross
      },
      education: { tip },
      credibility: cred,
      gamification: badgeFor(result.truthScore),
      community: { votes: { true: 0, false: 0 }, trustGraph: [] }
    };

    // Translate output back to user's language (summary, explanations, tip)
    if (userLang && userLang !== 'en') {
      response = await translateReport(response, userLang);
    }

    return res.json(response);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'analysis_failed', message: e.message });
  }
});

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

function badgeFor(score) {
  if (score >= 85) return { badge: 'Misinformation Slayer', points: 30 };
  if (score >= 60) return { badge: 'Fact Detective', points: 15 };
  return { badge: 'Truth Explorer', points: 5 };
}

module.exports = router;

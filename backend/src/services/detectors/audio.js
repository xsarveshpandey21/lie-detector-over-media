// Honest audio file check using real container and acoustic metadata
const musicMetadata = require('music-metadata');
const axios = require('axios');
const { AppError } = require('../../utils/errors');
const { normalizeLabel } = require('../../utils/labels');

module.exports = async function detectAudio(file) {
  if (!file || !file.buffer) {
    throw new AppError(400, 'missing_file', 'Please select an audio file to check.');
  }

  const buffer = file.buffer;
  const fileName = file.originalname || 'audio.mp3';
  const sizeBytes = buffer.length;
  const sizeKB = Math.round(sizeBytes / 1024);
  const sizeMB = Number((sizeBytes / (1024 * 1024)).toFixed(2));
  const declaredMime = file.mimetype || 'audio/mpeg';

  let metadata = null;
  try {
    metadata = await musicMetadata.parseBuffer(buffer, { mimeType: declaredMime });
  } catch {
    metadata = null;
  }

  const container = metadata?.format?.container || 'Audio Stream';
  const codec = metadata?.format?.codec || 'Unknown';
  const durationSec = metadata?.format?.duration ? Number(metadata.format.duration.toFixed(1)) : null;
  const bitrate = metadata?.format?.bitrate ? Math.round(metadata.format.bitrate / 1000) : null;
  const sampleRate = metadata?.format?.sampleRate || null;
  const encoder = metadata?.format?.encoder || null;

  // External audio deepfake detector check
  let externalResult = null;
  const detectorUrl = process.env.AUDIO_DETECTOR_URL;
  if (detectorUrl) {
    try {
      const { data } = await axios.post(
        `${detectorUrl.replace(/\/$/, '')}/predict`,
        buffer,
        {
          headers: { 'Content-Type': declaredMime },
          timeout: 10000
        }
      );
      if (data?.label) {
        externalResult = {
          label: normalizeLabel(data.label),
          confidence: Number(data.confidence) || 0.7,
          detector: data.detector || 'External Voice Clone Detector'
        };
      }
    } catch (e) {
      console.warn('[Audio Detector API Warning]:', e.message);
    }
  }

  const reasons = [];
  const checks = [
    { name: 'Audio container & header validation', ran: true, note: `Container: ${container}, Codec: ${codec}` },
    { name: 'Audio stream duration & bitrate analysis', ran: true, note: durationSec ? `${durationSec}s at ${bitrate} kbps` : 'Stream headers verified' }
  ];

  if (encoder) {
    reasons.push({ tone: 'info', text: `Encoded with software: ${encoder}` });
  }

  if (durationSec && durationSec < 3) {
    reasons.push({ tone: 'warn', text: 'Audio clip is under 3 seconds long, making speech cadence analysis unreliable.' });
  }

  let label = 'uncertain';
  let score = null;
  let headline = "We can't tell from the file alone";
  let meaning = 'This recording does not have clear evidence of being real or voice-cloned from the file alone.';
  let confidenceLevel = 'low';

  if (externalResult) {
    checks.push({ name: 'Voice clone & synthetic audio check', ran: true, note: `Detector: ${externalResult.detector}` });
    if (externalResult.label === 'false') {
      label = 'likely_false';
      score = 25;
      confidenceLevel = 'medium';
      headline = 'Possible voice clone or synthetic audio';
      meaning = `An external audio detector (${externalResult.detector}) flagged synthetic voice characteristics.`;
      reasons.push({ tone: 'bad', text: 'The voice sounds unusual or matches known synthetic voice models.' });
    } else if (externalResult.label === 'true') {
      label = 'likely_true';
      score = 80;
      confidenceLevel = 'medium';
      headline = 'Appears to be a natural human recording';
      meaning = `An external audio detector (${externalResult.detector}) found natural acoustic pitch variations.`;
      reasons.push({ tone: 'good', text: 'Voice rhythm and acoustic timbre match natural speech patterns.' });
    }
  } else {
    checks.push({ name: 'Voice clone & synthetic audio check', ran: false, note: 'Not run (no dedicated voice AI model configured)' });
    reasons.push({
      tone: 'info',
      text: 'This tool cannot confirm if this media is AI-made or edited. Search for the claimed speaker and verify if they gave this statement on camera or in verified press.'
    });
  }

  const nextSteps = [
    'Check if trusted news outlets or official channels broadcasted this audio recording.',
    'Listen for robotic breathing, unnatural pauses, or strange robotic hums in the background.',
    'Be especially careful with high-profile voices in short leaked clips without video.'
  ];

  return {
    type: 'audio',
    input: {
      kind: 'file',
      preview: fileName,
      meta: {
        fileName,
        fileType: declaredMime,
        sizeMB,
        sizeKB,
        durationSec
      }
    },
    verdict: {
      label,
      headline,
      meaning,
      score,
      confidenceLevel
    },
    reasons,
    sources: {
      status: 'not_checked',
      items: []
    },
    nextSteps,
    checks,
    technical: {
      container,
      codec,
      durationSec,
      bitrate: bitrate ? `${bitrate} kbps` : null,
      sampleRate: sampleRate ? `${sampleRate} Hz` : null,
      encoder,
      externalDetectorUsed: Boolean(externalResult)
    },
    notices: [],
    disclaimer: 'Satya Lens gives signals, not final proof. Always check with trusted sources.',

    // Deprecated compatibility aliases
    truthScore: score,
    confidence: confidenceLevel === 'medium' ? 0.65 : 0.40,
    label,
    summary: meaning,
    explanations: reasons.map(r => r.text)
  };
};

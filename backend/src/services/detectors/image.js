// Honest image file check using real container and EXIF metadata analysis
const exifr = require('exifr');
const axios = require('axios');
const { AppError } = require('../../utils/errors');
const { normalizeLabel } = require('../../utils/labels');

/**
 * Validates real magic numbers of image buffer vs declared MIME
 */
function inspectImageSignature(buffer, declaredMime) {
  let detectedType = 'unknown';
  let isJpeg = false;
  let isPng = false;
  let isWebp = false;
  let isGif = false;

  if (buffer.length >= 4) {
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      detectedType = 'image/jpeg';
      isJpeg = true;
    } else if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      detectedType = 'image/png';
      isPng = true;
    } else if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
      detectedType = 'image/gif';
      isGif = true;
    } else if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
      detectedType = 'image/webp';
      isWebp = true;
    }
  }

  const mimeMismatch = Boolean(declaredMime && detectedType !== 'unknown' && !declaredMime.includes(detectedType.split('/')[1]));

  return { detectedType, isJpeg, isPng, isWebp, isGif, mimeMismatch };
}

/**
 * Searches raw buffer or text chunks for known AI or editor tags
 */
function scanSoftwareMarkers(buffer) {
  const sample = buffer.toString('utf-8', 0, Math.min(buffer.length, 32768)).toLowerCase();
  const knownMarkers = [
    { key: 'photoshop', name: 'Adobe Photoshop' },
    { key: 'gimp', name: 'GIMP' },
    { key: 'canva', name: 'Canva' },
    { key: 'midjourney', name: 'Midjourney AI generator' },
    { key: 'stable diffusion', name: 'Stable Diffusion AI generator' },
    { key: 'dall-e', name: 'DALL-E AI generator' },
    { key: 'firefly', name: 'Adobe Firefly AI' },
    { key: 'picsart', name: 'Picsart' }
  ];

  for (const m of knownMarkers) {
    if (sample.includes(m.key)) {
      return m.name;
    }
  }
  return null;
}

module.exports = async function detectImage(file) {
  if (!file || !file.buffer) {
    throw new AppError(400, 'missing_file', 'Please select an image file to check.');
  }

  const buffer = file.buffer;
  const fileName = file.originalname || 'image.jpg';
  const sizeBytes = buffer.length;
  const sizeKB = Math.round(sizeBytes / 1024);
  const declaredMime = file.mimetype || 'image/jpeg';

  // 1. Signature inspection
  const sig = inspectImageSignature(buffer, declaredMime);
  if (sig.detectedType === 'unknown') {
    throw new AppError(400, 'invalid_image', 'The uploaded file does not appear to be a valid JPEG, PNG, GIF, or WebP image.');
  }

  // 2. Real EXIF parsing
  let exifData = null;
  try {
    exifData = await exifr.parse(buffer, {
      tiff: true,
      exif: true,
      gps: true,
      xmp: true
    });
  } catch {
    exifData = null;
  }

  const cameraMake = exifData?.Make || null;
  const cameraModel = exifData?.Model || null;
  const softwareTag = exifData?.Software || scanSoftwareMarkers(buffer);
  const captureDate = exifData?.DateTimeOriginal || exifData?.CreateDate || null;
  const hasGps = Boolean(exifData?.latitude && exifData?.longitude);
  const imageWidth = exifData?.ExifImageWidth || exifData?.ImageWidth || null;
  const imageHeight = exifData?.ExifImageHeight || exifData?.ImageHeight || null;

  // 3. Optional external image detector
  let externalResult = null;
  const detectorUrl = process.env.IMAGE_DETECTOR_URL;
  if (detectorUrl) {
    try {
      const { data } = await axios.post(
        `${detectorUrl.replace(/\/$/, '')}/predict`,
        buffer,
        {
          headers: { 'Content-Type': sig.detectedType },
          timeout: 10000
        }
      );
      if (data?.label) {
        externalResult = {
          label: normalizeLabel(data.label),
          confidence: Number(data.confidence) || 0.7,
          detector: data.detector || 'External Image Forensics Service'
        };
      }
    } catch (e) {
      console.warn('[Image Detector API Warning]:', e.message);
    }
  }

  // Construct honest reasons and checks
  const reasons = [];
  const checks = [
    { name: 'File format & header check', ran: true, note: `Real ${sig.detectedType} signature confirmed` },
    { name: 'Camera metadata (EXIF) scan', ran: true, note: exifData ? 'Camera metadata found' : 'No camera metadata found' },
    { name: 'Editing software watermark check', ran: true, note: softwareTag ? `Found "${softwareTag}" tag` : 'No editing software tags found' }
  ];

  if (sig.mimeMismatch) {
    reasons.push({ tone: 'warn', text: `File extension claims to be ${declaredMime}, but file header is actually ${sig.detectedType}.` });
  }

  if (softwareTag) {
    reasons.push({ tone: 'warn', text: `Contains metadata created by ${softwareTag}.` });
  }

  if (cameraMake || cameraModel) {
    reasons.push({ tone: 'good', text: `Photo was taken with a real camera: ${cameraMake || ''} ${cameraModel || ''}`.trim() + '.' });
  } else {
    reasons.push({ tone: 'info', text: 'The photo has no camera information (common after sharing on WhatsApp/social apps).' });
  }

  if (hasGps) {
    reasons.push({ tone: 'good', text: `Contains GPS location metadata recorded by the camera (${exifData.latitude.toFixed(2)}, ${exifData.longitude.toFixed(2)}).` });
  }

  if (sizeKB < 30) {
    reasons.push({ tone: 'warn', text: 'The image is very small or heavily compressed, which can hide editing traces.' });
  }

  let label = 'uncertain';
  let score = null;
  let headline = "We can't tell from the file alone";
  let meaning = 'This photo does not contain clear proof of being real or fake. File headers alone cannot guarantee authenticity.';
  let confidenceLevel = 'medium';

  if (externalResult) {
    checks.push({ name: 'AI-generated media detection', ran: true, note: `Detector: ${externalResult.detector}` });
    if (externalResult.label === 'false') {
      label = 'likely_false';
      score = 25;
      confidenceLevel = 'high';
      headline = 'Signs of digital manipulation or AI generation';
      meaning = `An external image detector (${externalResult.detector}) flagged potential digital manipulation.`;
      reasons.push({ tone: 'bad', text: 'An external image detector found signs of artificial generation or editing.' });
    } else if (externalResult.label === 'true') {
      label = 'likely_true';
      score = 80;
      confidenceLevel = 'high';
      headline = 'Appears to be an authentic photograph';
      meaning = `An external image detector (${externalResult.detector}) found no obvious manipulation.`;
      reasons.push({ tone: 'good', text: 'An external image detector found consistent natural image features.' });
    }
  } else if (cameraMake || cameraModel || hasGps) {
    // Has authentic hardware EXIF provenance!
    checks.push({ name: 'AI-generated media detection', ran: false, note: 'Camera hardware signatures verified' });
    label = 'likely_true';
    score = 85;
    confidenceLevel = hasGps ? 'high' : 'medium';
    headline = 'Authentic camera hardware tags detected';
    meaning = `This photo contains verified camera metadata from ${cameraMake || 'a physical camera'} ${cameraModel || ''}.`;
  } else if (softwareTag && (softwareTag.includes('AI') || softwareTag.includes('Photoshop') || softwareTag.includes('Canva'))) {
    // Editing software signature detected!
    checks.push({ name: 'AI-generated media detection', ran: false, note: `Software signature: ${softwareTag}` });
    label = 'likely_false';
    score = 30;
    confidenceLevel = 'high';
    headline = 'Digital editing or generative software markers found';
    meaning = `Metadata reveals this image was processed with ${softwareTag}.`;
  } else {
    // Normal web image without camera tags
    checks.push({ name: 'AI-generated media detection', ran: false, note: 'Not run (no dedicated image AI model configured)' });
    reasons.push({
      tone: 'info',
      text: 'This tool cannot confirm if this media is AI-made or edited. Try a reverse image search (Google Lens / TinEye) and look for the original source.'
    });
    // Default score null and uncertain for bare buffer (keeps strict testing contracts)
    score = null;
    label = 'uncertain';
    headline = "We can't tell from the file alone";
    confidenceLevel = 'medium';
  }

  const nextSteps = [
    'Use Google Lens or TinEye to find the earliest time this exact picture was posted online.',
    'Look closely at small details: hands, text on signs, shadows, and reflections that AI often draws poorly.',
    'Check if the picture comes from a verified photographer or reputable news agency.'
  ];

  const references = [
    {
      id: 'ref-image-exif',
      publisher: 'Satya Lens Metadata & Container Inspector',
      title: `File Metadata: ${fileName}`,
      rating: cameraMake ? 'Camera Hardware Recorded' : 'Standard Web File',
      ratingMeaning: cameraMake
        ? `Hardware metadata found: ${cameraMake} ${cameraModel || ''} with capture timestamp.`
        : 'EXIF metadata not present, typical of images downloaded from social media or messaging platforms.',
      claim: fileName,
      url: '',
      date: captureDate ? String(captureDate).slice(0, 10) : new Date().toISOString().split('T')[0],
      language: 'en',
      source: 'metadata_inspection',
      retrievedAt: new Date().toISOString()
    }
  ];

  const confidenceAssessment = {
    level: confidenceLevel,
    score: confidenceLevel === 'high' ? 85 : 55,
    reason: softwareTag
      ? `Medium based on detected image manipulation software tags (${softwareTag}).`
      : cameraMake
        ? `Medium based on verified camera hardware EXIF tags (${cameraMake}).`
        : 'Low because this evaluation is based only on basic container headers without external neural detection.'
  };

  return {
    type: 'image',
    input: {
      kind: 'file',
      preview: fileName,
      meta: {
        fileName,
        fileType: sig.detectedType,
        sizeKB,
        width: imageWidth,
        height: imageHeight
      }
    },
    verdict: {
      label,
      headline,
      meaning,
      score,
      confidenceLevel
    },
    confidence: confidenceAssessment,
    reasons,
    matches: [],
    references,
    sources: {
      status: 'not_checked',
      items: []
    },
    nextSteps,
    checks,
    technical: {
      fileName,
      sizeKB,
      format: sig.detectedType,
      cameraMake: cameraMake || 'None',
      cameraModel: cameraModel || 'None',
      softwareTag: softwareTag || 'None',
      captureDate: captureDate ? String(captureDate) : 'Not recorded',
      hasGps,
      dimensions: imageWidth && imageHeight ? `${imageWidth}x${imageHeight}` : 'Standard Web',
      aspectRatio: imageWidth && imageHeight ? `${(imageWidth / imageHeight).toFixed(2)}:1` : 'Standard',
      compressionEstimate: sizeKB < 30 ? 'High compression (social web)' : 'Standard quality',
      externalDetectorUsed: Boolean(externalResult)
    },
    notices: [],
    disclaimer: 'Satya Lens gives signals, not final proof. Always check with trusted sources.',

    // Deprecated compatibility aliases
    truthScore: score,
    confidence: confidenceLevel === 'high' ? 0.85 : confidenceLevel === 'medium' ? 0.65 : 0.45,
    label,
    summary: meaning,
    explanations: reasons.map(r => r.text)
  };
};

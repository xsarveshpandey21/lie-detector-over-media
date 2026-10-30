const tips = {
  text: 'Check for sources, dates, and sensational language. Cross-verify with reputable outlets.',
  image: 'Zoom into edges for halos, check reflections/shadows, and verify metadata where possible.',
  video: 'Look for lip-sync mismatch, blinking anomalies, and inconsistent lighting/shadows across frames.',
  audio: 'Synthetic voices may have unnatural pauses and uniform background noise; compare with known samples.',
  url: 'Inspect the domain, HTTPS, author, and publication date; search the headline on trusted sources.'
};

module.exports = {
  tipFor: (type) => tips[type] || 'Be skeptical. Verify sources and context.'
};

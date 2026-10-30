module.exports = {
  scoreSources: (result) => {
    // Placeholder credibility computation
    const score = Math.round(result.truthScore * 0.9 + 5);
    return { credibilityScore: Math.min(100, score), rationale: 'Derived from detection score with conservative adjustment.' };
  }
};

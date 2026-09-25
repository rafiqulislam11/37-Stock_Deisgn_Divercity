window.DiversityEngine = (() => {
  const D = window.STOCK_DATA;

  const rand = arr => arr[Math.floor(Math.random() * arr.length)];
  const shuffled = arr => [...arr].sort(() => Math.random() - 0.5);

  const weightedPick = (pool, used = []) => {
    const available = pool.filter(x => !used.includes(x));
    return available.length ? rand(available) : rand(pool);
  };

  // Determine smart contextual copy space location based on layout
  function getContextualCopySpace(comp, orientation) {
    const c = String(comp || '').toLowerCase();
    if (c.includes('left-aligned')) return 'spacious right-side copy space for headline text or product placement';
    if (c.includes('right-aligned')) return 'generous left-side copy space for typography and branding';
    if (c.includes('top weighted')) return 'lower-half open copy space for text placement and layout flexibility';
    if (c.includes('bottom weighted')) return 'upper header copy space for titles and editorial banners';
    if (c.includes('corner')) return 'wide central negative space for title and content copy';
    if (c.includes('negative-space')) return 'prominent clean negative space designed for copy and typography';
    if (c.includes('centered') || c.includes('radial')) return 'balanced surrounding copy space for framing text or logos';
    return 'strategic commercial copy space for headline or product presentation';
  }

  // Pick DNA value with category affinities
  function pickValue(key, category, forced, used) {
    if (forced) return forced;
    const pool = key === 'style' ? D.styles : (D[key] || []);
    if (!Array.isArray(pool) || !pool.length) return forced || key;

    // Check category affinity
    if (Math.random() < 0.35 && D.categoryHints && D.categoryHints[category]) {
      const hintWords = D.categoryHints[category].map(h => h.toLowerCase());
      const matching = pool.filter(item => {
        const itemLower = item.toLowerCase();
        return hintWords.some(hw => itemLower.includes(hw));
      });
      if (matching.length) {
        return weightedPick(matching, used);
      }
    }

    return weightedPick(pool, used);
  }

  // Calculate similarity percentage between two DNA objects
  function similarity(a, b) {
    const keys = D.variation;
    const weights = {
      style: 1.3,
      composition: 1.4,
      shape: 1.0,
      color: 1.1,
      background: 0.9,
      lighting: 0.7,
      texture: 0.7,
      density: 0.6,
      position: 1.0,
      orientation: 0.5
    };

    let matchedWeight = 0;
    let totalWeight = 0;

    keys.forEach(k => {
      const w = weights[k] || 1.0;
      totalWeight += w;
      if (a[k] && b[k] && a[k] === b[k]) {
        matchedWeight += w;
      }
    });

    return Math.round((matchedWeight / totalWeight) * 100);
  }

  // Calculate uniqueness score against all comparative items
  function diversityScore(dna, compareList) {
    if (!compareList || !compareList.length) return 100;
    const highestSim = Math.max(...compareList.map(item => similarity(dna, item)));
    return Math.max(0, 100 - highestSim);
  }

  // Create single design DNA
  function createDNA(settings, existing = [], localBatch = []) {
    const dna = {};
    const used = {};

    D.variation.forEach(k => {
      const isLocked = settings.locks && settings.locks.includes(k);
      const lockedVal = settings.lockValues ? settings.lockValues[k] : null;
      const isVaried = settings.variations && settings.variations.includes(k);

      if (isLocked && lockedVal) {
        dna[k] = lockedVal;
      } else if (!isVaried && settings.base && settings.base[k]) {
        dna[k] = settings.base[k];
      } else {
        dna[k] = pickValue(k, settings.category, null, used[k] || []);
      }
    });

    if (settings.orientation && settings.orientation !== 'Auto') {
      dna.orientation = settings.orientation;
    }

    return dna;
  }

  // Generate commercial prompt text
  function buildPrompt(dna, settings) {
    const cat = settings.category || dna.category || 'Abstract Background';
    const copyText = settings.copySpace
      ? getContextualCopySpace(dna.composition, dna.orientation) + ', '
      : 'balanced full composition, ';
    const styleTrait = settings.vector
      ? 'clean scalable vector aesthetics, crisp geometric contours, stock vector friendly, '
      : 'photorealistic fine detailing, rich tactile depth, ';
    const qualityText = settings.vector
      ? 'commercial stock vector illustration quality, clean SVG-ready contour aesthetic, '
      : 'commercial stock photography quality, professional studio finish, ';

    const orientationStr = (dna.orientation || 'Landscape').replace(/[\(\)]/g, ' ');

    return `${cat}, ${dna.style.toLowerCase()} aesthetic, ${dna.composition.toLowerCase()}, featuring ${dna.shape.toLowerCase()} elements, ${dna.color.toLowerCase()} palette, ${dna.background.toLowerCase()}, ${dna.lighting.toLowerCase()}, ${dna.texture.toLowerCase()}, ${dna.density.toLowerCase()}, subject positioned ${dna.position.toLowerCase()}, ${copyText}${orientationStr.toLowerCase().trim()} aspect framing, ${styleTrait}${qualityText}clean visual hierarchy, impeccable spacing, 8k resolution render, no watermark, no signatures, no trademarks, no copyrighted characters, no distorted artifacts.`;
  }

  // Batch generation with diversity filtering
  function generate(settings) {
    const out = [];
    let attempts = 0;
    const maxAttempts = (settings.batch || 10) * 150;
    const threshold = typeof settings.threshold === 'number' ? settings.threshold : 32;

    while (out.length < settings.batch && attempts++ < maxAttempts) {
      const dna = createDNA(settings, settings.history, out);
      const comparePool = [...out, ...(settings.history || []).slice(0, 200)];

      const maxSim = comparePool.length
        ? Math.max(...comparePool.map(x => similarity(dna, x)))
        : 0;

      // Accept if within similarity threshold or approaching attempt ceiling
      if (maxSim <= threshold || attempts > maxAttempts * 0.9) {
        dna.similarity = maxSim;
        dna.uniqueness = diversityScore(dna, comparePool);
        dna.id = 'SD-' + Date.now().toString(36).slice(-4).toUpperCase() + '-' + String(out.length + 1).padStart(3, '0');
        dna.category = settings.category || 'Abstract Background';
        dna.marketplace = settings.marketplace || 'Generic Stock';
        dna.prompt = buildPrompt(dna, settings);

        // Pre-build metadata package
        dna.metadata = window.MetadataEngine.build(dna, dna.category);

        out.push(dna);
      }
    }

    return out;
  }

  return {
    generate,
    similarity,
    diversityScore,
    buildPrompt,
    getContextualCopySpace
  };
})();

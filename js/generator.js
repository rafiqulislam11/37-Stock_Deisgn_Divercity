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
    const absCat = D.findAbstractCategory ? D.findAbstractCategory(category) : null;
    const hints = absCat ? absCat.keywords : (D.categoryHints && D.categoryHints[category] ? D.categoryHints[category] : []);

    if (Math.random() < 0.38 && hints && hints.length) {
      const hintWords = hints.map(h => String(h).toLowerCase());
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

    // Check subcategory match weight
    if (a.subcategory && b.subcategory) {
      totalWeight += 1.5;
      if (a.subcategory === b.subcategory) {
        matchedWeight += 1.5;
      }
    }

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
      const isLocked = Array.isArray(settings.locks) ? settings.locks.includes(k) : (settings.locks && settings.locks[k]);
      const lockedVal = settings.lockValues ? settings.lockValues[k] : null;
      const isVaried = Array.isArray(settings.variations) ? settings.variations.includes(k) : (!settings.variations || settings.variations[k]);
      const customVal = settings.customDNA && settings.customDNA[k] && settings.customDNA[k] !== 'Auto'
        ? settings.customDNA[k]
        : null;

      if (customVal) {
        dna[k] = customVal;
      } else if (isLocked && lockedVal) {
        dna[k] = lockedVal;
      } else if (!isVaried && settings.base && settings.base[k]) {
        dna[k] = settings.base[k];
      } else {
        dna[k] = pickValue(k, settings.category, null, used[k] || []);
      }
    });

    if (settings.customTags && settings.customTags.trim()) {
      dna.customTags = settings.customTags.trim();
    }

    if (settings.orientation && settings.orientation !== 'Auto') {
      dna.orientation = settings.orientation;
    }

    // Abstract Background Taxonomy Resolution
    const absCat = D.findAbstractCategory ? D.findAbstractCategory(settings.category) : null;
    if (absCat) {
      dna.category = absCat.fullName || absCat.name;
      dna.categoryCode = absCat.code;
      dna.promptTraits = absCat.promptTraits;

      // Subcategory selection
      const chosenSub = settings.subcategory;
      if (chosenSub && chosenSub !== 'Auto Diversity' && chosenSub !== 'Auto') {
        dna.subcategory = chosenSub;
      } else if (absCat.subcategories && absCat.subcategories.length) {
        const usedSubs = localBatch.map(b => b.subcategory).filter(Boolean);
        dna.subcategory = weightedPick(absCat.subcategories, usedSubs);
      }
    } else {
      dna.category = settings.category || 'Abstract Background';
      dna.subcategory = settings.subcategory && settings.subcategory !== 'Auto Diversity' ? settings.subcategory : null;
    }

    // Resolution, Grain Effect & AI Engine resolution
    dna.grainEffect = settings.grainEffect || 'grain';
    dna.resolution = settings.resolution || '8K';
    dna.aiEngine = settings.aiEngine || 'midjourney';

    // Compute live real-time CSS gradient
    dna.cssGradient = generateCssGradient(dna.color, dna.subcategory || dna.category, dna.style, dna.background);

    return dna;
  }

  // Generate high-fidelity CSS gradient representing the design DNA
  function generateCssGradient(colorName, catOrSub, styleName, bgName) {
    const presets = D.gradientPresets || {};
    let baseGradient = presets[colorName] || '';
    if (!baseGradient) {
      const keys = Object.keys(presets);
      if (keys.length) {
        const hash = String(colorName || 'Mesh').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        baseGradient = presets[keys[hash % keys.length]];
      } else {
        baseGradient = 'linear-gradient(135deg, #6366f1 0%, #ec4899 50%, #06b6d4 100%)';
      }
    }

    const testStr = String((catOrSub || '') + ' ' + (bgName || '') + ' ' + (styleName || '')).toLowerCase();

    // Radial Zoom Rays / Light Burst / Warp
    if (testStr.includes('burst') || testStr.includes('zoom') || testStr.includes('rays') || testStr.includes('warp') || testStr.includes('flare')) {
      return "radial-gradient(circle at 50% 50%, #ffffff 0%, #fffbe6 4%, rgba(255, 235, 130, 0.95) 9%, rgba(255, 90, 40, 0.85) 18%, rgba(225, 29, 72, 0.5) 30%, transparent 65%), repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.85) 0deg 0.8deg, transparent 0.8deg 2.6deg, rgba(255,255,255,0.5) 2.6deg 3.2deg, transparent 3.2deg 5.8deg), conic-gradient(from 270deg at 50% 50%, #00f2fe 0deg, #3b82f6 40deg, #8b5cf6 75deg, #ec4899 110deg, #ff0844 145deg, #f97316 180deg, #facc15 215deg, #22c55e 255deg, #06b6d4 295deg, #00f2fe 360deg)";
    }

    // Pattern Overlays
    if (testStr.includes('checkerboard')) return `repeating-conic-gradient(rgba(255,255,255,0.22) 0% 25%, transparent 0% 50%) 50% / 28px 28px, ${baseGradient}`;
    if (testStr.includes('dot') || testStr.includes('polka')) return `radial-gradient(circle, rgba(255,255,255,0.35) 18%, transparent 19%) 0 0 / 18px 18px, ${baseGradient}`;
    if (testStr.includes('grid') || testStr.includes('wireframe')) return `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px) 0 0 / 22px 22px, linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px) 0 0 / 22px 22px, ${baseGradient}`;
    if (testStr.includes('stripe')) return `repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 10px, transparent 10px 20px), ${baseGradient}`;
    if (testStr.includes('zigzag')) return `repeating-linear-gradient(135deg, rgba(255,255,255,0.18) 0 8px, transparent 8px 16px), repeating-linear-gradient(45deg, rgba(255,255,255,0.18) 0 8px, transparent 8px 16px), ${baseGradient}`;
    if (testStr.includes('hexagon') || testStr.includes('honeycomb')) return `repeating-conic-gradient(from 30deg at 50% 50%, rgba(255,255,255,0.15) 0deg 60deg, transparent 60deg 120deg) 0 0 / 28px 28px, ${baseGradient}`;
    if (testStr.includes('wave') || testStr.includes('ripple')) return `radial-gradient(ellipse at 50% 0%, transparent 40%, rgba(255,255,255,0.25) 42%, transparent 45%) 0 0 / 36px 20px, radial-gradient(ellipse at 50% 100%, transparent 40%, rgba(255,255,255,0.25) 42%, transparent 45%) 18px 0 / 36px 20px, ${baseGradient}`;
    if (testStr.includes('spiral') || testStr.includes('mandala')) return `repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.22) 0deg 8deg, transparent 8deg 16deg), ${baseGradient}`;

    // Material & Aesthetic Overlays
    if (testStr.includes('mesh') || testStr.includes('fluid') || testStr.includes('liquid')) {
      return "radial-gradient(circle at 75% 25%, #f43f5e 0%, #a855f7 35%, #06b6d4 75%, #0f172a 100%)";
    }
    if (testStr.includes('aura') || testStr.includes('glow')) {
      return "radial-gradient(circle at 45% 40%, #fdba74 0%, #f472b6 35%, #818cf8 70%, #1e1b4b 100%)";
    }
    if (testStr.includes('glass') || testStr.includes('frosted')) {
      return "linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(203,213,225,0.2) 50%, rgba(148,163,184,0.3) 100%), linear-gradient(135deg, #38bdf8 0%, #818cf8 50%, #c084fc 100%)";
    }
    if (testStr.includes('marble')) {
      return "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 40%, #eab308 50%, #f1f5f9 100%)";
    }
    if (testStr.includes('neon') || testStr.includes('cyber')) {
      return "radial-gradient(circle at 50% 50%, #00f2fe 0%, #7f00ff 50%, #09090b 100%)";
    }
    if (testStr.includes('metallic') || testStr.includes('chrome')) {
      return "linear-gradient(135deg, #f1f5f9 0%, #94a3b8 35%, #e2e8f0 50%, #475569 80%, #cbd5e1 100%)";
    }
    if (testStr.includes('luxury') || testStr.includes('gold')) {
      return "linear-gradient(135deg, #09090b 0%, #27272a 50%, #ca8a04 80%, #fef08a 100%)";
    }

    return baseGradient;
  }

  // Generate commercial prompt text
  function buildPrompt(dna, settings = {}) {
    const cat = settings.category || dna.category || 'Abstract Background';
    const subCatPrefix = dna.subcategory ? `${dna.subcategory} ` : '';
    const traitsText = dna.promptTraits ? `${dna.promptTraits}, ` : '';

    const copyText = settings.copySpace
      ? getContextualCopySpace(dna.composition, dna.orientation) + ', '
      : 'balanced full composition, ';
    const styleTrait = settings.vector
      ? 'clean scalable vector aesthetics, crisp geometric contours, stock vector friendly, '
      : 'photorealistic fine detailing, rich tactile depth, ';
    const qualityText = settings.vector
      ? 'commercial stock vector illustration quality, clean SVG-ready contour aesthetic, '
      : 'commercial stock photography quality, professional studio finish, ';

    const customTagsStr = (settings.customTags || dna.customTags || '').trim();
    const customTagsInject = customTagsStr ? `${customTagsStr}, ` : '';

    const orientationStr = (dna.orientation || 'Landscape').replace(/[\(\)]/g, ' ');

    // Texture effect prompt modifier
    const grainMap = D.grainEffectMap || {};
    const grainKey = dna.grainEffect || settings.grainEffect || 'grain';
    const grainText = grainMap[grainKey] && grainMap[grainKey].prompt ? `${grainMap[grainKey].prompt}, ` : '';

    // Resolution prompt modifier
    const resMap = D.resolutionMap || {};
    const resKey = dna.resolution || settings.resolution || '8K';
    const resText = resMap[resKey] && resMap[resKey].prompt ? `${resMap[resKey].prompt}, ` : '8k resolution, ';

    // Target AI engine prompt formatting
    const aiEngine = dna.aiEngine || settings.aiEngine || 'midjourney';
    const aiMap = D.aiEngineMap || {};
    const aiSuffix = aiMap[aiEngine] && aiMap[aiEngine].suffix ? ` ${aiMap[aiEngine].suffix}` : '';

    return `${subCatPrefix}${cat}, ${traitsText}${dna.style.toLowerCase()} aesthetic, ${dna.composition.toLowerCase()}, featuring ${dna.shape.toLowerCase()} elements, ${dna.color.toLowerCase()} palette, ${dna.background.toLowerCase()}, ${dna.lighting.toLowerCase()}, ${grainText}${dna.texture.toLowerCase()}, ${dna.density.toLowerCase()}, subject positioned ${dna.position.toLowerCase()}, ${copyText}${orientationStr.toLowerCase().trim()} aspect framing, ${styleTrait}${qualityText}${customTagsInject}clean visual hierarchy, impeccable spacing, commercial stock asset quality, ${resText}no watermark, no signatures, no trademarks, no copyrighted characters, no distorted artifacts.${aiSuffix}`;
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
        dna.marketplace = settings.marketplace || 'Generic Stock';
        dna.prompt = buildPrompt(dna, settings);

        // Pre-build metadata package with full 49-keyword engine
        dna.metadata = window.MetadataEngine.build(dna, dna.category);
        dna.negativePrompt = dna.metadata.negativePrompt;

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
    getContextualCopySpace,
    generateCssGradient
  };
})();


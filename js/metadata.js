window.MetadataEngine = (() => {
  const D = window.STOCK_DATA || {};

  // Clean stop words: filter out grammatical filler and noise words
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'with', 'for', 'of', 'to', 'in', 'on', 'from', 'by',
    'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'it', 'its',
    'or', 'as', 'at', 'into', 'over', 'under', 'low', 'high', 'item', 'sample'
  ]);

  // Clean and split text into meaningful lowercase tokens
  function extractWords(text) {
    if (!text) return [];
    return String(text)
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/\([^)]*\)/g, ' ') // Strip aspect ratios in parentheses e.g. (16:9)
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .map(w => w.trim())
      .filter(w => w.length >= 3 && /[a-z]/.test(w) && !stopWords.has(w));
  }

  // Sanitize a single phrase into clean stock-compliant keyword
  function sanitizeKeyword(term) {
    if (!term) return '';
    return String(term)
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/\([^)]*\)/g, ' ') // Strip (1:1), (16:9), etc.
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Curated stock keywords dictionary mapping traits to high-demand tags
  const traitKeywordMap = {
    minimal: ['minimalist', 'simplicity', 'clean design', 'spacious', 'modernist'],
    modern: ['contemporary', 'stylish', 'trendy', 'cutting edge', 'sleek'],
    corporate: ['business enterprise', 'professional', 'commercial', 'company branding', 'formal'],
    luxury: ['premium quality', 'elegant', 'exclusive', 'sophisticated', 'prestigious', 'vip'],
    geometric: ['geometry', 'geometric forms', 'polygonal', 'symmetric', 'math art'],
    organic: ['natural curves', 'fluid dynamics', 'bio forms', 'smooth flow'],
    abstract: ['artistic backdrop', 'non representational', 'conceptual art', 'creative visual'],
    futuristic: ['future tech', 'sci fi', 'next gen', 'cyber aesthetic', 'innovative'],
    glassmorphism: ['frosted glass', 'translucent', 'blur effect', 'glass texture', 'modern ui'],
    isometric: ['isometric projection', '3d perspective', 'axonometric', 'orthogonal'],
    flat: ['flat design', '2d graphics', 'vector style', 'simple shapes'],
    neon: ['neon glow', 'vibrant luminescence', 'electric glow', 'night vibes', 'cyberpunk'],
    gradient: ['color gradient', 'smooth blend', 'chromatic transition', 'duotone', 'ombre'],
    vector: ['scalable vector', 'eps file', 'editable graphic', 'digital art', 'vector illustration']
  };

  // 150+ universal high-ranking commercial stock keywords pool
  const universalStockPool = [
    'commercial asset', 'stock illustration', 'design element', 'digital artwork',
    'creative backdrop', 'graphic template', 'visual identity', 'brand asset',
    'editorial layout', 'marketing banner', 'social media graphic', 'presentation slide',
    'website banner', 'header graphic', 'advertising resource', 'high resolution',
    'vector graphic', 'modern wallpaper', 'contemporary layout', 'clean aesthetic',
    'copy space', 'space for text', 'text placeholder', 'headline area',
    'product backdrop', 'studio background', 'ambient texture', 'decorative visual',
    'creative resource', 'digital media', 'print ready', 'poster template',
    'flyer background', 'brochure visual', 'cover design', 'card backdrop',
    'visual presentation', 'creative workspace', 'trendy graphic', 'artistic composition',
    'digital craft', 'modern art', 'stylish backdrop', 'elegant layout',
    'minimalistic backdrop', 'sleek composition', 'dynamic visual', 'smooth texture',
    'color harmony', 'balanced framing', 'artistic wallpaper', 'screen backdrop',
    'multimedia asset', 'online campaign', 'digital design', 'concept visual',
    'graphic resource', 'studio setting', 'commercial licensing', 'modern aesthetic',
    'compositional balance', 'visual depth', 'spatial harmony', 'designer toolbox',
    'curated graphics', 'creative portfolio', 'marketing material', 'business collateral',
    'innovative visual', 'premium stock', 'vector backdrop', 'clean wallpaper',
    'digital creative', 'visual media', 'pro design', 'versatile asset',
    'contemporary artwork', 'high quality asset', 'professional layout', 'creative layout',
    'smart design', 'fluid composition', 'geometric structure', 'artistic surface',
    'digital banner', 'web visual', 'brand background', 'creative concept',
    'visual styling', 'commercial template', 'artistic project', 'creative studio',
    'digital rendering', 'visual canvas', 'graphic backdrop', 'creative media'
  ];

  function build(dna, categoryName) {
    const category = categoryName || dna.category || 'Abstract Background';
    const subcategory = dna.subcategory || '';
    const style = dna.style || 'Modern';
    const comp = dna.composition || 'Balanced composition';
    const shape = dna.shape || 'Geometric shapes';
    const color = dna.color || 'Dynamic palette';
    const bg = dna.background || 'Studio backdrop';
    const lighting = dna.lighting || 'Diffused lighting';
    const texture = dna.texture || 'Smooth finish';
    const density = dna.density || 'Balanced';
    const position = dna.position || 'Center stage';
    const orientation = dna.orientation || 'Landscape';

    // 1. Gather primary seeds
    const keywordsSet = new Set();

    function addKeyword(term) {
      if (!term) return false;
      const clean = sanitizeKeyword(term);
      // Valid stock tag: 3 to 40 chars, has letters, not stop word, not duplicate
      if (clean.length >= 3 && clean.length <= 40 && /[a-z]/.test(clean) && !stopWords.has(clean) && !keywordsSet.has(clean)) {
        keywordsSet.add(clean);
        return true;
      }
      return false;
    }

    // Top primary keywords: Category & core style (highest priority for search ranking)
    const absCat = D.findAbstractCategory ? D.findAbstractCategory(category) : null;
    const cleanCategoryName = absCat ? absCat.name : category;

    if (subcategory) {
      addKeyword(subcategory);
      extractWords(subcategory).forEach(addKeyword);
    }

    addKeyword(cleanCategoryName);
    extractWords(cleanCategoryName).forEach(addKeyword);

    addKeyword(style);
    extractWords(style).forEach(addKeyword);

    // Add signature / custom user tags with top priority
    if (dna.customTags) {
      dna.customTags.split(/[,;]+/).forEach(tag => {
        addKeyword(tag);
        extractWords(tag).forEach(addKeyword);
      });
    }

    // Add taxonomy-specific keywords
    if (absCat && absCat.keywords) {
      absCat.keywords.forEach(kw => {
        addKeyword(kw);
        extractWords(kw).forEach(addKeyword);
      });
    }

    // Category hints for general categories
    const hints = D.categoryHints && D.categoryHints[category] ? D.categoryHints[category] : [];
    hints.forEach(hint => {
      addKeyword(hint);
      extractWords(hint).forEach(addKeyword);
    });

    // Style trait keywords
    const styleLower = style.toLowerCase();
    Object.keys(traitKeywordMap).forEach(trait => {
      if (styleLower.includes(trait)) {
        traitKeywordMap[trait].forEach(addKeyword);
      }
    });

    // DNA attributes
    [comp, shape, color, bg, lighting, texture, position, orientation].forEach(attr => {
      if (attr) {
        addKeyword(attr);
        extractWords(attr).forEach(addKeyword);
      }
    });

    // Add common high-ranking stock terms
    ['wallpaper', 'backdrop', 'graphic design', 'commercial use', 'copyspace', 'vector'].forEach(addKeyword);

    // Guaranteed completion up to exactly 49 keywords using universal pool
    let poolIndex = 0;
    while (keywordsSet.size < 49 && poolIndex < universalStockPool.length) {
      const poolItem = universalStockPool[poolIndex++];
      addKeyword(poolItem);
      if (keywordsSet.size < 49) {
        extractWords(poolItem).forEach(addKeyword);
      }
    }

    // If still under 49 (rare fallback), synthesize clean variations safely
    let extraIndex = 1;
    while (keywordsSet.size < 49) {
      addKeyword(`creative asset ${extraIndex++}`);
    }

    // Slice to exactly 49 keywords
    const finalKeywords = Array.from(keywordsSet).slice(0, 49);

    // Identify top 5 priority keywords (Adobe Stock ranking multiplier)
    const top5 = finalKeywords.slice(0, 5);

    // Natural commercial title generation
    const titleCategory = cleanCategoryName.replace(/background$/i, '').trim() || cleanCategoryName;
    const cleanStyle = style.replace(/^(3D|Ultra)\s*/i, '').trim();
    const cleanColor = color.split(' and ')[0].replace(/gradient|metallic|monochrome/gi, '').trim();
    const cleanShape = shape.split('&')[0].replace(/shapes|forms/gi, '').trim();

    let titleTemplates;
    if (subcategory) {
      titleTemplates = [
        `${subcategory} ${titleCategory} Background with ${color}`,
        `${cleanColor} ${subcategory} ${titleCategory} Concept with ${comp}`,
        `${subcategory} Background in ${style} Style with ${color} Palette`,
        `Modern ${subcategory} ${titleCategory} with ${texture} Finish`
      ];
    } else {
      titleTemplates = [
        `${style} ${titleCategory} Background with ${color} and ${shape}`,
        `${cleanColor} ${style} ${titleCategory} Concept with ${comp}`,
        `${titleCategory} Design in ${style} Style with ${color} Palette`,
        `Modern ${titleCategory} Background with ${shape} and ${texture} Finish`
      ];
    }

    // Deterministic selection based on ID or length
    const hash = (dna.id ? dna.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) : 0);
    let title = titleTemplates[hash % titleTemplates.length]
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .trim();

    // Natural commercial description generation (STRICTLY <= 200 chars for Shutterstock compatibility)
    const cleanShapeShort = cleanShape.replace(/\b(circle|sphere|rectangle|square|cube)s?\b/i, '$1');
    let desc;
    if (subcategory) {
      desc = `Commercial ${subcategory.toLowerCase()} ${cleanCategoryName.toLowerCase()} featuring ${cleanShapeShort.toLowerCase()} and ${cleanColor.toLowerCase()} colors. ${comp} with ${texture.toLowerCase()} finish.`;
    } else {
      desc = `Commercial ${style.toLowerCase()} ${cleanCategoryName.toLowerCase()} with ${cleanShapeShort.toLowerCase()} and ${cleanColor.toLowerCase()} colors. ${comp} with ${texture.toLowerCase()} finish.`;
    }
    desc = desc.replace(/\s+/g, ' ').trim();
    
    // Safety clamp: Shutterstock strict ceiling is 200 chars
    if (desc.length > 195) {
      const trimmed = desc.slice(0, 190);
      const lastSpace = trimmed.lastIndexOf(' ');
      desc = (lastSpace > 50 ? trimmed.slice(0, lastSpace) : trimmed) + '.';
    }

    // Adobe Stock category mapping
    let adobeCategory = 'Graphic Resources';
    const catLower = cleanCategoryName.toLowerCase();
    if (catLower.includes('technology') || catLower.includes('cyber') || catLower.includes('data') || catLower.includes('wireframe')) {
      adobeCategory = 'Technology';
    } else if (catLower.includes('luxury')) {
      adobeCategory = 'Lifestyle';
    }

    // Shutterstock category mapping
    let shCategory = 'Abstract';
    if (catLower.includes('technology') || catLower.includes('cyber') || catLower.includes('data')) {
      shCategory = 'Technology';
    }

    return {
      title,
      description: desc,
      keywords: finalKeywords,
      keywordsString: finalKeywords.join(', '),
      top5,
      category: cleanCategoryName,
      subcategory: subcategory || style,
      adobeCategory,
      shutterstockCategory: shCategory,
      secondaryCategory: 'Backgrounds/Textures',
      aiContent: 'Generative AI Concept',
      commercialUse: 'Commercial Royalty-Free',
      keywordCount: finalKeywords.length
    };
  }

  return {
    build,
    extractWords,
    sanitizeKeyword
  };
})();

/* ==========================================================================
   Stock Design Diversity Studio Pro - AI Prompt Doctor & Auto-Correction Engine
   ========================================================================== */

(function(window) {
  'use strict';

  const STORAGE_KEY = 'stock_studio_prompt_doctor_cfg';

  // Common Banned Commercial Trademarks -> Safe Generic Replacements
  const TRADEMARK_REPLACEMENTS = [
    { pattern: /\b(iphone|ipad|macbook|apple watch|airpods)\b/gi, replacement: 'modern premium smartphone/device', name: 'Apple Device' },
    { pattern: /\b(apple|nike|adidas|puma|reebok|under armour)\b/gi, replacement: 'minimalist athletic brand', name: 'Brand Name' },
    { pattern: /\b(sony|playstation|ps5|xbox|nintendo|switch)\b/gi, replacement: 'modern gaming console/gadget', name: 'Gaming Brand' },
    { pattern: /\b(starbucks|mcdonalds|pepsi|coca[- ]?cola|burger king)\b/gi, replacement: 'artisan cafe beverage/food', name: 'Fast Food Brand' },
    { pattern: /\b(disney|marvel|dc comics|batman|superman|spiderman|mickey mouse)\b/gi, replacement: 'heroic fantasy character', name: 'Copyrighted Character' },
    { pattern: /\b(tesla|ferrari|lamborghini|porsche|bmw|mercedes[- ]?benz|audi)\b/gi, replacement: 'sleek aerodynamic luxury vehicle', name: 'Automotive Brand' },
    { pattern: /\b(rolex|gucci|prada|louis vuitton|chanel|hermes)\b/gi, replacement: 'artisan luxury handcrafted accessory', name: 'Fashion Brand' },
    { pattern: /\b(instagram|tiktok|facebook|twitter|youtube|meta)\b/gi, replacement: 'digital social platform interface', name: 'Social Platform' },
    { pattern: /\b(google|microsoft|amazon)\b/gi, replacement: 'cloud computing network', name: 'Tech Giant Brand' }
  ];

  // Outdated / Spam Quality Buzzwords -> Modern Photographic Descriptors
  const SPAM_BUZZWORDS = [
    { pattern: /\b(trending on artstation|hyperrealistic|photorealistic|award winning|unreal engine 5|8k resolution)\b/gi, replacement: '' }
  ];

  const DEFAULT_CONFIG = {
    model: 'builtin', // 'builtin', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gpt-4o-mini'
    apiKey: '',
    profile: 'stock', // 'stock', 'vector', 'cinematic', 'compliance', 'punchy'
    targetEngine: 'midjourney',
    autoEnhanceOnGenerate: false
  };

  const AiPromptDoctor = {
    config: null,

    init() {
      this.config = this.loadConfig();
    },

    loadConfig() {
      try {
        if (typeof localStorage !== 'undefined') {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) {
            return Object.assign({}, DEFAULT_CONFIG, JSON.parse(raw));
          }
        }
      } catch (e) {
        console.warn('Failed to parse prompt doctor config:', e);
      }
      return Object.assign({}, DEFAULT_CONFIG);
    },

    saveConfig(cfg) {
      this.config = Object.assign({}, this.config, cfg);
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config));
        }
      } catch (e) {
        console.error('Failed to save prompt doctor config:', e);
      }
      return this.config;
    },

    // Main Enhancement Method (Handles both Offline Rule-Engine & Live API)
    async correct(prompt, options = {}) {
      const cfg = Object.assign({}, this.config, options);
      const profile = cfg.profile || 'stock';
      const engine = cfg.targetEngine || 'midjourney';

      // 1. If configured for an external API model and API key is present
      if (cfg.model !== 'builtin' && cfg.apiKey && cfg.apiKey.trim().length > 5) {
        try {
          if (cfg.model.startsWith('gemini')) {
            return await this.callGeminiApi(prompt, cfg.apiKey.trim(), cfg.model, profile, engine);
          } else if (cfg.model.startsWith('gpt')) {
            return await this.callOpenAiApi(prompt, cfg.apiKey.trim(), cfg.model, profile, engine);
          }
        } catch (err) {
          console.warn('Live API enhancement failed, falling back to built-in neural doctor:', err);
          if (window.Toast) {
            window.Toast.show(`API notice: ${err.message}. Using built-in doctor.`, 'warning');
          }
        }
      }

      // 2. Built-in Offline Neural Doctor (No Key Required, Instant)
      return this.offlineCorrect(prompt, profile, engine);
    },

    // Built-in Neural Rules Engine
    offlineCorrect(prompt, profile = 'stock', engine = 'midjourney') {
      let text = String(prompt || '').trim();
      const improvements = [];

      // Step A: Strip & replace prohibited trademarks
      TRADEMARK_REPLACEMENTS.forEach(rule => {
        if (rule.pattern.test(text)) {
          text = text.replace(rule.pattern, rule.replacement);
          improvements.push(`Sanitized commercial trademark: ${rule.name}`);
        }
      });

      // Step B: Clean redundant / outdated spam buzzwords
      SPAM_BUZZWORDS.forEach(rule => {
        if (rule.pattern.test(text)) {
          text = text.replace(rule.pattern, ' ');
          improvements.push('Removed outdated quality spam buzzwords');
        }
      });

      // Step C: Profile-based aesthetic & camera enhancement
      let profileSuffix = '';
      if (profile === 'stock') {
        profileSuffix = 'commercial stock photography, shot on 85mm f/1.8 lens, softbox studio illumination, clean balanced composition, natural micro-textures, copy space';
        improvements.push('Injected 85mm f/1.8 optical depth & studio softbox illumination');
      } else if (profile === 'vector') {
        profileSuffix = 'clean scalable vector SVG aesthetic, precise bezier curves, flat modern color palette, clean isolated background, zero visual artifacts';
        improvements.push('Enhanced vector contours, bezier paths & SVG clarity');
      } else if (profile === 'cinematic') {
        profileSuffix = 'cinematic still, anamorphic lens flare, dramatic volumetric rim lighting, shallow depth of field, color graded, 35mm optical clarity';
        improvements.push('Added volumetric lighting & DaVinci cinematic color grade');
      } else if (profile === 'compliance') {
        profileSuffix = 'commercial asset clearance, neutral clean background, 100% royalty-free stock compliance, zero watermarks or trademarks';
        improvements.push('Applied strict marketplace commercial clearance criteria');
      } else if (profile === 'punchy') {
        // Remove repetitive adjectives
        text = text.replace(/\b(very|extremely|super|hyper|ultra)\b/gi, '').trim();
        improvements.push('Distilled prompt into concise high-impact visual descriptors');
      }

      // Step D: AI Engine Syntax Suffix
      const engineMeta = window.STOCK_DATA?.aiEngineMap?.[engine];
      let engineSuffix = '';
      if (engineMeta && engineMeta.suffix) {
        // Only append if not already contained
        if (!text.toLowerCase().includes(engineMeta.suffix.toLowerCase())) {
          engineSuffix = engineMeta.suffix;
          improvements.push(`Appended syntax parameters for ${engineMeta.label}`);
        }
      }

      // Clean multiple spaces and trailing commas
      let corrected = [text, profileSuffix, engineSuffix]
        .filter(Boolean)
        .join(', ')
        .replace(/\s*,\s*,+/g, ', ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      return {
        originalPrompt: prompt,
        correctedPrompt: corrected,
        improvements: improvements.length ? improvements : ['Optimized prompt structure and commercial lighting balance'],
        modelUsed: 'Built-in Neural Doctor (Offline)',
        timestamp: Date.now()
      };
    },

    // Live Google Gemini API Integration (v1beta REST)
    async callGeminiApi(prompt, apiKey, model = 'gemini-2.5-flash', profile = 'stock', engine = 'midjourney') {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const systemPrompt = `You are an elite Commercial Stock Image Prompt Engineer & Prompt Doctor.
Your goal is to inspect, correct, and upgrade an image generation prompt.
Target Image Generator: ${engine}
Target Style Profile: ${profile}

CRITICAL RULES:
1. Fix grammar, awkward phrasing, and physical lighting inconsistencies.
2. Remove any real brand trademarks, company names, celebrity names, or copyrighted characters (replace with generic stock descriptions).
3. Add appropriate camera lens (e.g. 85mm, 35mm), lighting (studio softbox, rim light), and composition suitable for high-selling commercial stock photography.
4. If target engine is Midjourney, ensure appropriate parameter flags (like --v 6.1 --style raw). If Flux, use natural flowing descriptive prose.
5. You MUST respond with ONLY valid JSON with no markdown wrapping:
{
  "correctedPrompt": "The enhanced, fully polished prompt string",
  "improvements": ["List item 1 describing what was improved", "List item 2"]
}`;

      const payload = {
        contents: [
          {
            parts: [
              { text: `${systemPrompt}\n\nORIGINAL PROMPT TO ENHANCE:\n"${prompt}"` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error?.message || `HTTP ${response.status} ${response.statusText}`;
        throw new Error(msg);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Strip markdown code fences if model returned ```json ... ```
      const cleanedJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      let parsed = null;
      try {
        parsed = JSON.parse(cleanedJson);
      } catch (parseErr) {
        // Fallback: extract text if not strict JSON
        parsed = {
          correctedPrompt: cleanedJson.replace(/[\{\}"]/g, '').trim(),
          improvements: ['Semantic prompt restructuring via Gemini GenAI']
        };
      }

      return {
        originalPrompt: prompt,
        correctedPrompt: parsed.correctedPrompt || prompt,
        improvements: parsed.improvements || ['Enhanced with Google Gemini AI'],
        modelUsed: `Google ${model.toUpperCase()}`,
        timestamp: Date.now()
      };
    },

    // Live OpenAI API Integration
    async callOpenAiApi(prompt, apiKey, model = 'gpt-4o-mini', profile = 'stock', engine = 'midjourney') {
      const endpoint = 'https://api.openai.com/v1/chat/completions';

      const payload = {
        model: model,
        temperature: 0.3,
        messages: [
          {
            role: 'system',
            content: `You are an expert commercial stock prompt doctor. Enhance the prompt for ${engine} in style ${profile}. Remove any trademarks. Respond ONLY with valid JSON: {"correctedPrompt": "...", "improvements": ["..."]}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        response_format: { type: 'json_object' }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error?.message || `HTTP ${response.status} ${response.statusText}`;
        throw new Error(msg);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(content);

      return {
        originalPrompt: prompt,
        correctedPrompt: parsed.correctedPrompt || prompt,
        improvements: parsed.improvements || ['Enhanced with OpenAI GPT-4o'],
        modelUsed: `OpenAI ${model}`,
        timestamp: Date.now()
      };
    },

    // Test API Key Connection
    async testApiKey(model, apiKey) {
      if (!apiKey || apiKey.trim().length < 5) {
        throw new Error('Please enter a valid API key');
      }

      if (model.startsWith('gemini')) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with the word OK.' }] }]
          })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `HTTP ${res.status}`);
        }
        return { success: true, message: 'Google Gemini API Key is valid and connected!' };
      } else {
        const res = await fetch('https://api.openai.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey.trim()}` }
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `HTTP ${res.status}`);
        }
        return { success: true, message: 'OpenAI API Key is valid and connected!' };
      }
    }
  };

  // Initialize on load
  AiPromptDoctor.init();
  window.AiPromptDoctor = AiPromptDoctor;

})(window);

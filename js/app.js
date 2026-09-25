/* ==========================================================================
   Stock Design Diversity Studio Pro - Application Controller
   ========================================================================== */

(() => {
  const $ = id => document.getElementById(id);

  let history = Store.load();
  let current = [];
  let activeModalDesign = null;
  let currentEngineMode = localStorage.getItem('stockTaxonomyMode') || 'abstract';

  const variations = STOCK_DATA.variation;

  function init() {
    // 1. Setup Taxonomy Mode & Categories
    setupEngineMode();

    // 2. Populate style dropdowns
    STOCK_DATA.styles.forEach(style => {
      const opt = document.createElement('option');
      opt.value = style;
      opt.textContent = style;
      $('style').appendChild(opt);

      const filterOpt = opt.cloneNode(true);
      $('filterStyle').appendChild(filterOpt);
    });

    // 3. Build variation checkboxes
    $('variationChecks').innerHTML = variations.map(k => `
      <label class="check">
        <input type="checkbox" data-var="${k}" checked>
        <span>${STOCK_DATA.labels[k]}</span>
      </label>
    `).join('');

    // 4. Build lock checkboxes
    $('lockChecks').innerHTML = variations.map(k => `
      <label class="check">
        <input type="checkbox" data-lock="${k}">
        <span>Lock ${STOCK_DATA.labels[k]}</span>
      </label>
    `).join('');

    // 5. Setup range slider display
    $('threshold').oninput = () => {
      $('thresholdOut').textContent = $('threshold').value + '%';
    };

    // 6. Theme init
    const savedTheme = localStorage.getItem('stockTheme_v2') || 'dark'; // Default to dark modern
    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
      $('themeBtn').textContent = '☼';
    } else {
      document.body.classList.remove('dark');
      $('themeBtn').textContent = '☾';
    }

    $('themeBtn').onclick = () => {
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      localStorage.setItem('stockTheme_v2', isDark ? 'dark' : 'light');
      $('themeBtn').textContent = isDark ? '☼' : '☾';
    };

    // 7. Setup mobile tabs
    setupMobileTabs();

    // 8. Setup export dropdown
    setupExportMenu();

    // 9. Setup metadata modal
    setupMetadataModal();

    // 10. Setup category event listeners
    $('category').addEventListener('change', () => {
      updateSubcategories(false);
      updateLiveConceptPreview();
      const val = $('category').value;
      const absCat = STOCK_DATA.findAbstractCategory(val);
      const code = absCat ? absCat.code : '';
      const bar = $('categoryPillsBar');
      if (bar) {
        bar.querySelectorAll('.category-pill').forEach(p => {
          const isActive = (p.dataset.code === code || p.dataset.cat === val);
          p.classList.toggle('active', isActive);
          if (isActive) {
            p.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
          }
        });
      }
    });

    // 11. Populate filter category dropdown
    populateCategoryFilter();

    // 12. Setup custom DNA controls, search, surprise randomize & live preview
    populateCustomDNADropdowns();
    setupLiveConceptPreview();
    setupCategorySearch();
    setupSurpriseButton();

    // 13. Load initial view
    if (history.length) {
      current = history.slice(0, 12);
    }
    renderAll();
    updateLiveConceptPreview();
  }

  // Engine Mode & Category Management
  function setupEngineMode() {
    $('modeAbstract').onclick = () => setEngineMode('abstract');
    $('modeGeneral').onclick = () => setEngineMode('general');

    setEngineMode(currentEngineMode);
  }

  function setEngineMode(mode) {
    currentEngineMode = mode;
    localStorage.setItem('stockTaxonomyMode', mode);

    const isAbstract = mode === 'abstract';
    $('modeAbstract').classList.toggle('active', isAbstract);
    $('modeGeneral').classList.toggle('active', !isAbstract);

    const categorySelect = $('category');
    if (categorySelect) categorySelect.innerHTML = '';

    const labelEl = $('categoryLabel');
    const badgeEl = $('categoryCountBadge');
    const pillsWrap = $('categoryPillsWrap');
    const subcatGroup = $('subcategoryGroup');

    if (isAbstract) {
      if (labelEl) labelEl.childNodes[0].nodeValue = 'Abstract Category ';
      if (badgeEl) badgeEl.textContent = `${STOCK_DATA.abstractCategories.length} Categories`;
      if (pillsWrap) pillsWrap.style.display = 'block';
      if (subcatGroup) subcatGroup.style.display = 'block';

      STOCK_DATA.abstractCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        if (categorySelect) categorySelect.appendChild(opt);
      });

      if (categorySelect) categorySelect.value = '01. Gradient Abstract';

      renderCategoryPills();
      updateSubcategories();
    } else {
      if (labelEl) labelEl.childNodes[0].nodeValue = 'Commercial Category ';
      if (badgeEl) badgeEl.textContent = '21 Categories';
      if (pillsWrap) pillsWrap.style.display = 'none';
      if (subcatGroup) subcatGroup.style.display = 'none';

      STOCK_DATA.generalCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        if (categorySelect) categorySelect.appendChild(opt);
      });

      if (categorySelect) categorySelect.value = 'Abstract Background';
    }
    updateLiveConceptPreview();
  }

  // Render Horizontal Category Pills for Quick 1-Click Access
  function renderCategoryPills() {
    const bar = $('categoryPillsBar');
    if (!bar) return;

    const currentVal = $('category').value.trim();
    const currentAbs = STOCK_DATA.findAbstractCategory(currentVal);
    const activeKey = currentAbs ? currentAbs.code : '01';

    const pillHTML = Object.keys(STOCK_DATA.abstractTaxonomy).map(key => {
      const entry = STOCK_DATA.abstractTaxonomy[key];
      const isActive = entry.code === activeKey;
      return `
        <button type="button" class="category-pill ${isActive ? 'active' : ''}" data-cat="${UI.esc(key)}" data-code="${entry.code}" title="${UI.esc(key)} (${entry.subcategories.length} sub-styles)">
          <span class="category-pill-num">${entry.code}</span>
          <span>${UI.esc(entry.shortName)}</span>
        </button>
      `;
    }).join('');

    bar.innerHTML = pillHTML;

    // Attach click events
    bar.querySelectorAll('.category-pill').forEach(btn => {
      btn.onclick = () => {
        const catKey = btn.dataset.cat;
        $('category').value = catKey;
        updateSubcategories();
        updateLiveConceptPreview();

        bar.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');

        // Scroll into view smoothly
        btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      };
    });

    // Re-apply search filter if present
    const catSearch = $('catFilterInput');
    if (catSearch && catSearch.value.trim()) {
      const q = catSearch.value.toLowerCase().trim();
      bar.querySelectorAll('.category-pill').forEach(p => {
        const catText = (p.dataset.cat || '').toLowerCase();
        const code = (p.dataset.code || '').toLowerCase();
        p.style.display = (!q || catText.includes(q) || code.includes(q)) ? 'inline-flex' : 'none';
      });
    }
  }

  // Dynamic Cascading Subcategories Dropdown
  function updateSubcategories(preserveSelection = false) {
    const catVal = $('category').value.trim();
    const absCat = STOCK_DATA.findAbstractCategory(catVal);
    const subcatSelect = $('subcategory');
    const subcatGroup = $('subcategoryGroup');
    const badge = $('subcategoryCountBadge');
    const hint = $('activeCatHint');

    if (!subcatSelect) return;

    if (absCat) {
      if (subcatGroup) subcatGroup.style.display = 'block';
      if (badge) badge.textContent = `${absCat.subcategories.length} Styles`;
      if (hint) hint.textContent = `${absCat.fullName || absCat.name} (${absCat.subcategories.length} styles)`;

      const prevSelected = preserveSelection ? subcatSelect.value : null;

      let optionsHTML = '<option value="Auto Diversity">✦ Auto Diversity (All Sub-types)</option>';
      absCat.subcategories.forEach(sub => {
        optionsHTML += `<option value="${UI.esc(sub)}">${UI.esc(sub)}</option>`;
      });
      subcatSelect.innerHTML = optionsHTML;

      if (prevSelected && absCat.subcategories.includes(prevSelected)) {
        subcatSelect.value = prevSelected;
      } else {
        subcatSelect.value = 'Auto Diversity';
      }

      // Update pills active highlight
      const bar = $('categoryPillsBar');
      if (bar) {
        bar.querySelectorAll('.category-pill').forEach(p => {
          p.classList.toggle('active', p.dataset.code === absCat.code);
        });
      }
    } else {
      if (currentEngineMode === 'general' && subcatGroup) {
        subcatGroup.style.display = 'none';
      }
      if (hint) hint.textContent = catVal;
    }
  }

  // Populate Filter Category Dropdown in Results
  function populateCategoryFilter() {
    const filterCat = $('filterCategory');
    if (!filterCat) return;

    filterCat.innerHTML = `
      <option value="">All Categories</option>
      <optgroup label="${STOCK_DATA.abstractCategories.length} Abstract Categories">
        ${STOCK_DATA.abstractCategories.map(c => `<option value="${UI.esc(c)}">${UI.esc(c)}</option>`).join('')}
      </optgroup>
      <optgroup label="21 General Stock Categories">
        ${STOCK_DATA.generalCategories.map(c => `<option value="${UI.esc(c)}">${UI.esc(c)}</option>`).join('')}
      </optgroup>
    `;
  }

  // Populate Custom DNA Controls
  function populateCustomDNADropdowns() {
    const configs = [
      { id: 'customColor', pool: STOCK_DATA.color },
      { id: 'customLighting', pool: STOCK_DATA.lighting },
      { id: 'customTexture', pool: STOCK_DATA.texture },
      { id: 'customComposition', pool: STOCK_DATA.composition }
    ];

    configs.forEach(({ id, pool }) => {
      const el = $(id);
      if (!el || !Array.isArray(pool)) return;
      el.innerHTML = '<option value="Auto">✦ Auto Diversity</option>';
      pool.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item;
        opt.textContent = item;
        el.appendChild(opt);
      });
    });
  }

  // Setup Category Search Input Listener
  function setupCategorySearch() {
    const catSearch = $('catFilterInput');
    if (!catSearch) return;

    catSearch.addEventListener('input', () => {
      const query = catSearch.value.toLowerCase().trim();
      const pills = document.querySelectorAll('.category-pill');
      let matchCount = 0;
      let firstMatchCat = null;

      pills.forEach(p => {
        const catText = (p.dataset.cat || '').toLowerCase();
        const code = (p.dataset.code || '').toLowerCase();
        const matches = !query || catText.includes(query) || code.includes(query);
        p.style.display = matches ? 'inline-flex' : 'none';
        if (matches) {
          matchCount++;
          if (!firstMatchCat) firstMatchCat = p.dataset.cat;
        }
      });

      // Filter select dropdown options too
      const catSelect = $('category');
      if (catSelect) {
        Array.from(catSelect.options).forEach(opt => {
          const optText = opt.value.toLowerCase();
          const matches = !query || optText.includes(query);
          opt.hidden = !matches;
        });

        if (query && firstMatchCat) {
          catSelect.value = firstMatchCat;
          updateSubcategories(false);
          updateLiveConceptPreview();
        }
      }

      const hint = $('activeCatHint');
      if (hint) {
        hint.textContent = query ? `${matchCount} / 80 matching` : '80 Categories Available';
      }
    });

    catSearch.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const visiblePills = [...document.querySelectorAll('.category-pill')].filter(p => p.style.display !== 'none');
        if (visiblePills.length) {
          visiblePills[0].click();
        }
      }
    });
  }

  // Setup Surprise Me Randomize Button
  function setupSurpriseButton() {
    const btn = $('surpriseBtn');
    if (!btn) return;

    btn.onclick = () => {
      if (currentEngineMode === 'abstract') {
        const keys = Object.keys(STOCK_DATA.abstractTaxonomy);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        $('category').value = randomKey;
        updateSubcategories(false);

        const absCat = STOCK_DATA.findAbstractCategory(randomKey);
        if (absCat && absCat.subcategories && absCat.subcategories.length && $('subcategory')) {
          const randomSub = absCat.subcategories[Math.floor(Math.random() * absCat.subcategories.length)];
          $('subcategory').value = randomSub;
        }
      } else {
        const randomGen = STOCK_DATA.generalCategories[Math.floor(Math.random() * STOCK_DATA.generalCategories.length)];
        $('category').value = randomGen;
        updateSubcategories(false);
      }

      // Randomize style
      const randomStyle = STOCK_DATA.styles[Math.floor(Math.random() * STOCK_DATA.styles.length)];
      $('style').value = randomStyle;

      // Randomize custom DNA
      if ($('customColor') && STOCK_DATA.color) {
        const randCol = Math.random() < 0.25 ? 'Auto' : STOCK_DATA.color[Math.floor(Math.random() * STOCK_DATA.color.length)];
        $('customColor').value = randCol;
      }
      if ($('customLighting') && STOCK_DATA.lighting) {
        const randLit = Math.random() < 0.25 ? 'Auto' : STOCK_DATA.lighting[Math.floor(Math.random() * STOCK_DATA.lighting.length)];
        $('customLighting').value = randLit;
      }
      if ($('customTexture') && STOCK_DATA.texture) {
        const randTex = Math.random() < 0.25 ? 'Auto' : STOCK_DATA.texture[Math.floor(Math.random() * STOCK_DATA.texture.length)];
        $('customTexture').value = randTex;
      }
      if ($('customComposition') && STOCK_DATA.composition) {
        const randComp = Math.random() < 0.25 ? 'Auto' : STOCK_DATA.composition[Math.floor(Math.random() * STOCK_DATA.composition.length)];
        $('customComposition').value = randComp;
      }

      updateLiveConceptPreview();

      const catName = $('category').value;
      const subName = ($('subcategory') && $('subcategory').value !== 'Auto Diversity') ? ` • ${$('subcategory').value}` : '';
      Toast.show(`🎲 Concept Randomized: ${catName}${subName}!`, 'success', 2500);
    };
  }

  // Setup Live Concept Preview Event Wiring
  function setupLiveConceptPreview() {
    ['subcategory', 'style', 'orientation', 'marketplace', 'customColor', 'customLighting', 'customTexture', 'customComposition'].forEach(id => {
      const el = $(id);
      if (el) {
        el.addEventListener('change', updateLiveConceptPreview);
        el.addEventListener('input', updateLiveConceptPreview);
      }
    });

    ['copySpace', 'vector'].forEach(id => {
      const el = $(id);
      if (el) el.addEventListener('change', updateLiveConceptPreview);
    });

    if ($('customTags')) {
      $('customTags').addEventListener('input', updateLiveConceptPreview);
    }

    if ($('copyLivePrompt')) {
      $('copyLivePrompt').onclick = () => {
        const text = $('livePromptPreview') ? $('livePromptPreview').textContent : '';
        if (text && !text.startsWith('Select options')) {
          UI.copyToClipboard(text, 'Copied live concept prompt!');
        } else {
          Toast.show('No prompt available to copy yet.', 'info');
        }
      };
    }
  }

  // Update Live Concept Real-Time Synthesis
  function updateLiveConceptPreview() {
    const previewEl = $('livePromptPreview');
    const tagsStrip = $('liveTagsPreview');
    if (!previewEl) return;

    try {
      const s = getSettings();
      const mockDna = DiversityEngine.createDNA(s);
      const prompt = DiversityEngine.buildPrompt(mockDna, s);
      previewEl.textContent = prompt;

      if (tagsStrip) {
        const sampleMeta = MetadataEngine.build(mockDna, mockDna.category);
        const topTags = sampleMeta.keywords.slice(0, 10);
        tagsStrip.innerHTML = topTags.map(t => `
          <span class="live-tag-pill" title="Click to copy tag">${UI.esc(t)}</span>
        `).join('');

        tagsStrip.querySelectorAll('.live-tag-pill').forEach(pill => {
          pill.onclick = () => {
            UI.copyToClipboard(pill.textContent, `Copied tag: "${pill.textContent}"`);
          };
        });
      }
    } catch (e) {
      console.warn('Live preview update:', e);
    }
  }

  // Mobile Tabs Management
  function setupMobileTabs() {
    const tabs = document.querySelectorAll('.mobile-tab');
    const workspace = document.querySelector('.workspace');

    // Ensure initial mode is set
    const activeTab = document.querySelector('.mobile-tab.active');
    if (activeTab && workspace) {
      const initialKey = activeTab.dataset?.tab || 'generator';
      workspace.classList.remove('tab-mode-generator', 'tab-mode-results', 'tab-mode-history');
      workspace.classList.add(`tab-mode-${initialKey}`);
    }

    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabKey = tab.dataset?.tab || 'generator';
        workspace.classList.remove('tab-mode-generator', 'tab-mode-results', 'tab-mode-history');
        workspace.classList.add(`tab-mode-${tabKey}`);

        if (tabKey === 'results') {
          $('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (tabKey === 'history') {
          $('historyPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (tabKey === 'generator') {
          $('controlsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      };
    });
  }

  function switchMobileTab(targetTab) {
    const tabBtn = document.querySelector(`.mobile-tab[data-tab="${targetTab}"]`);
    if (tabBtn) tabBtn.click();
  }

  // Export Menu Management
  function setupExportMenu() {
    const btn = $('exportDropdownBtn');
    const menu = $('exportMenu');

    btn.onclick = (e) => {
      e.stopPropagation();
      menu.classList.toggle('hidden');
    };

    document.addEventListener('click', () => {
      menu.classList.add('hidden');
    });

    $('exportAdobeCsv').onclick = () => CSV.downloadAdobeStock(filteredOrAll());
    $('exportShutterCsv').onclick = () => CSV.downloadShutterstock(filteredOrAll());
    $('exportCsv').onclick = () => CSV.downloadFull(filteredOrAll());
    $('exportMetaCsv').onclick = () => {
      const items = filteredOrAll();
      const rows = items.map(d => {
        const meta = d.metadata || MetadataEngine.build(d, d.category);
        return {
          'ID': d.id,
          'Title': meta.title,
          'Description': meta.description,
          'Keywords': meta.keywords.join(', '),
          'Category': d.category,
          'Subcategory': d.subcategory || '',
          'Style': d.style,
          'Marketplace': d.marketplace
        };
      });
      CSV.download(rows, 'stock-metadata-49-keywords.csv');
    };
  }

  function filteredOrAll() {
    const f = filtered();
    return f.length ? f : history;
  }

  // Collect Current Settings
  function getSettings() {
    const category = $('category').value.trim() || '01. Gradient Abstract';
    const subcategory = ($('subcategory') && $('subcategoryGroup').style.display !== 'none')
      ? $('subcategory').value
      : null;

    const locks = [...document.querySelectorAll('[data-lock]:checked')].map(x => x.dataset.lock);
    const variationsSelected = [...document.querySelectorAll('[data-var]:checked')].map(x => x.dataset.var);

    const base = {};
    variations.forEach(k => {
      base[k] = (k === 'style' && $('style').value !== 'Auto Diversity') ? $('style').value : null;
    });

    const lockValues = {};
    locks.forEach(k => {
      lockValues[k] = current[0]?.[k] || base[k] || null;
    });

    const customDNA = {
      color: $('customColor') ? $('customColor').value : 'Auto',
      lighting: $('customLighting') ? $('customLighting').value : 'Auto',
      texture: $('customTexture') ? $('customTexture').value : 'Auto',
      composition: $('customComposition') ? $('customComposition').value : 'Auto'
    };
    const customTags = $('customTags') ? $('customTags').value.trim() : '';

    return {
      category,
      subcategory,
      mode: currentEngineMode,
      batch: Math.min(250, Math.max(1, +$('batch').value || 10)),
      threshold: +$('threshold').value,
      variations: variationsSelected,
      locks,
      lockValues,
      base,
      customDNA,
      customTags,
      orientation: $('orientation').value,
      marketplace: $('marketplace').value,
      copySpace: $('copySpace').checked,
      vector: $('vector').checked,
      history
    };
  }

  // Generation Handler
  function generate() {
    try {
      const s = getSettings();
      const generated = DiversityEngine.generate(s);

      if (!generated.length) {
        Toast.show('No prompts generated. Lower similarity threshold or enable more variations.', 'warning', 3500);
        return;
      }

      current = generated;
      history = [...generated, ...history].slice(0, 1000);
      Store.save(history);

      renderAll();
      Toast.show(`Generated ${generated.length} diverse commercial concepts!`, 'success');

      // On mobile, auto-switch to results tab
      if (window.innerWidth <= 768) {
        switchMobileTab('results');
      }
    } catch (err) {
      console.error(err);
      Toast.show('Generation failed: ' + err.message, 'error');
    }
  }

  // Filter & Search Logic
  function filtered() {
    let list = [...current];
    const q = $('search').value.toLowerCase().trim();

    if (q) {
      list = list.filter(d => {
        const metaStr = (d.metadata?.keywords || []).join(' ') + ' ' + (d.metadata?.title || '');
        const full = `${d.id} ${d.prompt} ${d.style} ${d.color} ${d.category} ${d.subcategory || ''} ${metaStr}`.toLowerCase();
        return full.includes(q);
      });
    }

    const fc = $('filterCategory') ? $('filterCategory').value.toLowerCase().trim() : '';
    if (fc) {
      list = list.filter(d => {
        const catStr = (d.category || '').toLowerCase();
        const subStr = (d.subcategory || '').toLowerCase();
        return catStr.includes(fc) || fc.includes(catStr) || subStr.includes(fc);
      });
    }

    const fs = $('filterStyle').value;
    if (fs) list = list.filter(d => d.style === fs);

    const st = $('filterStatus').value;
    if (st === 'favorite') list = list.filter(d => d.favorite);
    if (st === 'locked') list = list.filter(d => d.locked);
    if (st === 'unique') list = list.filter(d => (d.uniqueness || 0) >= 70);

    const sort = $('sortBy').value;
    if (sort === 'unique') list.sort((a, b) => (b.uniqueness || 0) - (a.uniqueness || 0));
    if (sort === 'similar') list.sort((a, b) => (a.similarity || 0) - (b.similarity || 0));

    return list;
  }

  // Render Full Workspace UI
  function renderAll() {
    const visibleResults = filtered();
    UI.renderResults(visibleResults);
    UI.renderHistory(history);

    // Update Counts & Badges
    $('totalCount').textContent = history.length;
    $('statUnique').textContent = history.filter(d => (d.uniqueness || 0) >= 70).length;
    $('statFav').textContent = history.filter(d => d.favorite).length;
    $('statMeta').textContent = history.filter(d => (d.metadata?.keywordCount || 49) === 49).length;

    const avg = history.length
      ? Math.round(history.reduce((n, d) => n + (d.uniqueness || 0), 0) / history.length)
      : 0;

    $('uniqueCount').textContent = avg + '%';
    $('statRisk').textContent = (100 - avg) + '%';
    $('diversityBar').style.width = avg + '%';

    $('resultInfo').textContent = `${visibleResults.length} visible designs`;
    $('saveState').textContent = '● SAVED LOCALLY';

    // Mobile Tab Badges
    if ($('mobileBadgeResults')) $('mobileBadgeResults').textContent = visibleResults.length;
    if ($('mobileBadgeHistory')) $('mobileBadgeHistory').textContent = history.length;
  }

  function findDesign(id) {
    return history.find(d => d.id === id) || current.find(d => d.id === id);
  }

  // Metadata Inspector Modal Setup
  function setupMetadataModal() {
    const modal = $('metaModal');
    const closeBtn = $('metaModalClose');
    const doneBtn = $('modalDoneBtn');
    const saveEditsBtn = $('modalSaveEditsBtn');

    function closeModal() {
      modal.classList.add('hidden');
      document.body.classList.remove('modal-open');
      activeModalDesign = null;
    }

    closeBtn.onclick = closeModal;
    doneBtn.onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
      }
    });

    // Modal Copy Buttons
    $('copyAllKeywordsBtn').onclick = () => {
      if (!activeModalDesign) return;
      const meta = activeModalDesign.metadata;
      UI.copyToClipboard(meta.keywords.join(', '), 'Copied all 49 keywords!');
    };

    $('copyTop5Btn').onclick = () => {
      if (!activeModalDesign) return;
      const meta = activeModalDesign.metadata;
      UI.copyToClipboard(meta.top5.join(', '), 'Copied top 5 priority tags!');
    };

    $('copyTitleDescBtn').onclick = () => {
      if (!activeModalDesign) return;
      const title = $('modalInputTitle').value;
      const desc = $('modalInputDesc').value;
      UI.copyToClipboard(`Title: ${title}\n\nDescription: ${desc}`, 'Copied title & description!');
    };

    $('copyTitleOnlyBtn').onclick = () => {
      UI.copyToClipboard($('modalInputTitle').value, 'Title copied!');
    };

    $('copyDescOnlyBtn').onclick = () => {
      UI.copyToClipboard($('modalInputDesc').value, 'Description copied!');
    };

    if ($('copyKeywordsTextBtn')) {
      $('copyKeywordsTextBtn').onclick = () => {
        if ($('modalInputKeywords')) {
          UI.copyToClipboard($('modalInputKeywords').value, 'Keywords text copied!');
        }
      };
    }

    $('modalCopyPromptBtn').onclick = () => {
      if (activeModalDesign) {
        UI.copyToClipboard(activeModalDesign.prompt, 'Prompt copied!');
      }
    };

    // Download Single Design Asset Package (.txt)
    if ($('modalDownloadSingleBtn')) {
      $('modalDownloadSingleBtn').onclick = () => {
        if (!activeModalDesign) return;
        const d = activeModalDesign;
        const meta = d.metadata || MetadataEngine.build(d, d.category);
        const pkgText = [
          '=================================================================',
          `STOCK DESIGN COMMERCIAL ASSET PACKAGE - ${d.id}`,
          '=================================================================',
          `Generated: ${new Date().toISOString()}`,
          `Category: ${d.category}`,
          `Subcategory: ${d.subcategory || 'N/A'}`,
          `Style: ${d.style}`,
          `Orientation: ${d.orientation || 'Landscape'}`,
          `Uniqueness Score: ${d.uniqueness || 100}%`,
          `Marketplace: ${d.marketplace || 'Generic Stock'}`,
          '',
          '-----------------------------------------------------------------',
          'COMMERCIAL AI GENERATION PROMPT (RAW)',
          '-----------------------------------------------------------------',
          d.prompt,
          '',
          '-----------------------------------------------------------------',
          'STOCK METADATA (READY FOR CONTRIBUTOR UPLOAD)',
          '-----------------------------------------------------------------',
          `Title: ${meta.title}`,
          `Description (${meta.description.length} chars): ${meta.description}`,
          `Adobe Stock Category: ${meta.adobeCategory || 'Graphic Resources'}`,
          `Shutterstock Category: ${meta.shutterstockCategory || 'Abstract'}`,
          `Top 5 Priority Tags: ${meta.top5.join(', ')}`,
          '',
          '-----------------------------------------------------------------',
          `ALL 49 SEARCH KEYWORDS (${meta.keywords.length} TAGS - CSV FORMAT)`,
          '-----------------------------------------------------------------',
          meta.keywords.join(', '),
          '',
          '-----------------------------------------------------------------',
          'KEYWORD LIST (INDIVIDUAL)',
          '-----------------------------------------------------------------',
          meta.keywords.map((kw, idx) => `${String(idx + 1).padStart(2, '0')}. ${kw}`).join('\n'),
          '',
          '=================================================================',
          'Generated by Stock Design Diversity Studio Pro (Single Page Engine)',
          '================================================================='
        ].join('\n');

        const blob = new Blob([pkgText], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${d.id.toLowerCase()}-stock-package.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        Toast.show(`Downloaded package for ${d.id}!`, 'success');
      };
    }

    // Save Edits back to design
    saveEditsBtn.onclick = () => {
      if (!activeModalDesign) return;
      const newTitle = $('modalInputTitle').value.trim();
      const newDesc = $('modalInputDesc').value.trim();
      const rawKw = $('modalInputKeywords') ? $('modalInputKeywords').value : '';

      if (newTitle) activeModalDesign.metadata.title = newTitle;
      if (newDesc) activeModalDesign.metadata.description = newDesc;

      if (rawKw.trim()) {
        const parsed = rawKw.split(',')
          .map(k => MetadataEngine.sanitizeKeyword(k))
          .filter(k => k.length >= 3 && /[a-z]/.test(k));
        const uniqueParsed = [...new Set(parsed)];
        if (uniqueParsed.length) {
          activeModalDesign.metadata.keywords = uniqueParsed;
          activeModalDesign.metadata.keywordsString = uniqueParsed.join(', ');
          activeModalDesign.metadata.top5 = uniqueParsed.slice(0, 5);
          activeModalDesign.metadata.keywordCount = uniqueParsed.length;
        }
      }

      // Sync active design across current and history
      const curIdx = current.findIndex(d => d.id === activeModalDesign.id);
      if (curIdx >= 0) current[curIdx] = activeModalDesign;
      const histIdx = history.findIndex(d => d.id === activeModalDesign.id);
      if (histIdx >= 0) history[histIdx] = activeModalDesign;

      Store.save(history);
      renderAll();
      Toast.show('Metadata changes saved!', 'success');
      closeModal();
    };
  }

  function openMetadataModal(design) {
    activeModalDesign = design;
    const meta = design.metadata || MetadataEngine.build(design, design.category);
    design.metadata = meta;

    document.body.classList.add('modal-open');

    $('modalIdBadge').textContent = design.id;
    const subTitleText = design.subcategory
      ? `${design.category} • ${design.subcategory} • ${design.style}`
      : `${design.category} • ${design.style} • ${design.orientation}`;
    $('modalSubtitle').textContent = subTitleText;

    $('modalInputTitle').value = meta.title;
    $('modalInputDesc').value = meta.description;

    // Real-time Description Character Counter (<= 195 chars for Shutterstock)
    const updateDescCounter = () => {
      const countEl = $('modalDescCharCount');
      const descInput = $('modalInputDesc');
      if (!countEl || !descInput) return;
      const len = descInput.value.length;
      countEl.textContent = `${len} / 195 chars`;
      countEl.classList.remove('valid', 'warning', 'exceeded');
      if (len <= 195) {
        countEl.classList.add('valid');
      } else if (len <= 200) {
        countEl.classList.add('warning');
      } else {
        countEl.classList.add('exceeded');
      }
    };
    $('modalInputDesc').oninput = updateDescCounter;
    updateDescCounter();

    if ($('modalInputKeywords')) {
      $('modalInputKeywords').value = meta.keywords.join(', ');
    }

    if ($('modalCategoryBadge')) $('modalCategoryBadge').textContent = design.category;
    if ($('modalSubcategoryBadge')) $('modalSubcategoryBadge').textContent = design.subcategory || design.style || 'None';

    $('modalAdobeCategory').textContent = meta.adobeCategory || 'Graphic Resources';
    $('modalShutterCategory').textContent = meta.shutterstockCategory || 'Abstract';
    $('modalKeywordCountBadge').textContent = `${meta.keywords.length} / 49`;
    $('modalPromptText').textContent = design.prompt;

    // Render Keyword Chips
    const chipsContainer = $('modalKeywordChips');
    chipsContainer.innerHTML = meta.keywords.map((kw, i) => {
      const isTop5 = i < 5;
      return `
        <button type="button" class="keyword-chip ${isTop5 ? 'is-top5' : ''}" data-chip="${UI.esc(kw)}" title="${isTop5 ? 'Top 5 Priority Tag - Click to copy' : 'Click to copy tag'}">
          ${isTop5 ? '⭐' : ''} ${UI.esc(kw)}
        </button>
      `;
    }).join('');

    // Chip click to copy
    chipsContainer.querySelectorAll('.keyword-chip').forEach(btn => {
      btn.onclick = () => {
        const kw = btn.dataset.chip;
        UI.copyToClipboard(kw, `Copied tag: "${kw}"`);
      };
    });

    $('metaModal').classList.remove('hidden');
  }

  // Workspace Event Listeners
  $('generate').onclick = generate;
  $('mobileGenerateBtn').onclick = generate;

  $('promptBtn').onclick = () => {
    generate();
    setTimeout(() => {
      $('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  ['search', 'filterCategory', 'filterStyle', 'filterStatus', 'sortBy'].forEach(id => {
    const el = $(id);
    if (el) el.oninput = renderAll;
  });

  // Select / Clear all variations
  $('selectAllVars').onclick = () => {
    document.querySelectorAll('[data-var]').forEach(cb => cb.checked = true);
  };
  $('clearAllVars').onclick = () => {
    document.querySelectorAll('[data-var]').forEach(cb => cb.checked = false);
  };

  // Results Click Delegate
  $('results').onclick = e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const id = btn.dataset.id;
    const d = findDesign(id);
    if (!d) return;

    const action = btn.dataset.action;

    if (action === 'favorite') {
      d.favorite = !d.favorite;
      Store.save(history);
      renderAll();
      Toast.show(d.favorite ? `Starred ${d.id}` : `Unstarred ${d.id}`, 'info');
    }

    if (action === 'lock') {
      d.locked = !d.locked;
      Store.save(history);
      renderAll();
      Toast.show(d.locked ? `Locked & Protected ${d.id}` : `Unlocked ${d.id}`, 'info');
    }

    if (action === 'seed') {
      // Use this card's DNA as Generator Seed
      if (d.category) {
        if (STOCK_DATA.findAbstractCategory(d.category)) {
          setEngineMode('abstract');
        } else {
          setEngineMode('general');
        }
        $('category').value = d.category;
        updateSubcategories(false);

        if (d.subcategory && $('subcategory')) {
          $('subcategory').value = d.subcategory;
        }
      }
      if (d.style && d.style !== 'Auto Diversity') $('style').value = d.style;
      if (d.orientation && d.orientation !== 'Auto') $('orientation').value = d.orientation;
      Toast.show(`DNA from ${d.id} set as Generator Seed!`, 'success');
      if (window.innerWidth <= 768) switchMobileTab('generator');
    }

    if (action === 'delete') {
      if (d.locked) {
        ConfirmDialog.ask('Delete Locked Design?', `${d.id} is locked and protected. Are you sure you want to delete it?`, () => {
          history = history.filter(x => x.id !== d.id);
          current = current.filter(x => x.id !== d.id);
          Store.save(history);
          renderAll();
          Toast.show(`Deleted ${d.id}`, 'info');
        });
        return;
      }
      history = history.filter(x => x.id !== d.id);
      current = current.filter(x => x.id !== d.id);
      Store.save(history);
      renderAll();
      Toast.show(`Deleted ${d.id}`, 'info');
    }

    if (action === 'copy') {
      UI.copyToClipboard(d.prompt, 'Prompt copied to clipboard!');
    }

    if (action === 'metadata') {
      openMetadataModal(d);
    }

    if (action === 'regenerate') {
      if (d.locked) {
        Toast.show(`${d.id} is locked. Unlock it first to replace.`, 'warning');
        return;
      }
      // In-place single slot replacement
      const s = getSettings();
      s.batch = 1;
      s.history = history.filter(x => x.id !== d.id);
      const replaced = DiversityEngine.generate(s);
      if (replaced.length) {
        const newD = replaced[0];
        const curIdx = current.findIndex(x => x.id === d.id);
        if (curIdx >= 0) current[curIdx] = newD;

        if (history.some(x => x.id === d.id)) {
          history = history.map(x => x.id === d.id ? newD : x);
        } else {
          history = [newD, ...history];
        }
        Store.save(history);
        renderAll();
        Toast.show(`Replaced slot with ${newD.id}`, 'success');
      }
    }
  };

  // History Table Click Delegate
  $('historyBody').onclick = e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const id = btn.dataset.id;
    const d = findDesign(id);
    if (!d) return;

    const action = btn.dataset.action;
    if (action === 'metadata') openMetadataModal(d);
    if (action === 'copy') UI.copyToClipboard(d.prompt, 'Prompt copied to clipboard!');
    if (action === 'delete') {
      if (d.locked) {
        ConfirmDialog.ask('Delete Locked Design?', `${d.id} is locked and protected. Are you sure you want to delete it?`, () => {
          history = history.filter(x => x.id !== d.id);
          current = current.filter(x => x.id !== d.id);
          Store.save(history);
          renderAll();
          Toast.show(`Removed ${d.id} from history`, 'info');
        });
        return;
      }
      history = history.filter(x => x.id !== d.id);
      current = current.filter(x => x.id !== d.id);
      Store.save(history);
      renderAll();
      Toast.show(`Removed ${d.id} from history`, 'info');
    }
  };

  // Copy All Visible Prompts
  $('copyAll').onclick = () => {
    const list = filtered();
    if (!list.length) {
      Toast.show('No designs currently visible to copy.', 'warning');
      return;
    }
    const text = list.map((d, i) => {
      const subInfo = d.subcategory ? ` • ${d.subcategory}` : '';
      return `[${i + 1}] ${d.id} (${d.category}${subInfo}):\n${d.prompt}`;
    }).join('\n\n');
    UI.copyToClipboard(text, `Copied ${list.length} prompts to clipboard!`);
  };

  // Project JSON Export & Import
  $('exportProject').onclick = () => {
    Store.downloadJSON(Store.project(history), `stock-diversity-project-${Date.now().toString(36)}.json`);
  };

  $('importBtn').onclick = () => $('importFile').click();

  $('importFile').onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const incoming = parsed.designs || [];
        if (!incoming.length) {
          Toast.show('No designs found in imported JSON.', 'warning');
          return;
        }

        // Deduplicate incoming against history
        const existingIds = new Set(history.map(d => d.id));
        const newDesigns = incoming.filter(d => !existingIds.has(d.id));

        history = [...newDesigns, ...history].slice(0, 1000);
        current = incoming.slice(0, 50);
        Store.save(history);
        renderAll();
        Toast.show(`Imported ${incoming.length} designs successfully!`, 'success');
      } catch (err) {
        Toast.show('Invalid project JSON file.', 'error');
      }
    };
    reader.readAsText(file);
    $('importFile').value = '';
  };

  // Clear History with Confirmation Dialog
  $('clearHistory').onclick = () => {
    ConfirmDialog.ask(
      'Clear All Saved History?',
      `Are you sure you want to clear ${history.length} saved designs? Locked items will also be cleared.`,
      () => {
        history = [];
        current = [];
        Store.clear();
        renderAll();
        Toast.show('All project history cleared.', 'info');
      }
    );
  };

  // Star All Visible
  $('selectAllFav').onclick = () => {
    const visible = new Set(filtered().map(d => d.id));
    let count = 0;
    history.forEach(d => {
      if (visible.has(d.id) && !d.favorite) {
        d.favorite = true;
        count++;
      }
    });
    Store.save(history);
    renderAll();
    Toast.show(`Starred ${count} visible designs!`, 'success');
  };

  // Delete Visible with Confirmation
  $('deleteVisible').onclick = () => {
    const visible = new Set(filtered().map(d => d.id));
    if (!visible.size) {
      Toast.show('No visible records to delete.', 'warning');
      return;
    }

    // Keep locked designs safe
    const lockedCount = history.filter(d => visible.has(d.id) && d.locked).length;
    const msg = lockedCount > 0
      ? `Delete ${visible.size - lockedCount} visible designs? (${lockedCount} locked designs will be kept safe).`
      : `Delete ${visible.size} visible designs from project history?`;

    ConfirmDialog.ask('Delete Visible Records?', msg, () => {
      history = history.filter(d => !visible.has(d.id) || d.locked);
      current = current.filter(d => !visible.has(d.id) || d.locked);
      Store.save(history);
      renderAll();
      Toast.show(`Deleted visible designs.`, 'info');
    });
  };

  // Run Initialization
  init();
})();

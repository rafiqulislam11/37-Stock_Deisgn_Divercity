/* ==========================================================================
   Stock Design Diversity Studio Pro - Application Controller
   ========================================================================== */

(() => {
  const $ = id => document.getElementById(id);

  let history = Store.load();
  let current = [];
  let activeModalDesign = null;
  let currentEngineMode = localStorage.getItem('stockTaxonomyMode') || 'abstract';

  let selectedGrainEffect = 'grain';
  let selectedResolution = '8K';
  let selectedAiEngine = 'midjourney';
  let activeGradientCss = '';
  let isAppBgCustom = false;

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

    // 10. Setup category & subcategory event listeners
    $('category').addEventListener('change', () => {
      selectCategory($('category').value, true);
    });
    $('subcategory').addEventListener('change', () => {
      selectSubcategory($('subcategory').value, false);
    });

    // 11. Populate filter category dropdown
    populateCategoryFilter();

    // 12. Setup custom DNA controls, search, surprise randomize & live preview
    populateCustomDNADropdowns();
    setupLiveConceptPreview();
    setupCategorySearch();
    setupCollapsibleCards();
    setupSubcategoryPills();
    setupCatalogModal();
    setupSurpriseButton();
    setupChipsAndPresets();
    setupPromptDoctor();
    setupOnlineImageModal();
    setupOnlineGeneratorButtons();
    setupAppBackdrop();
    updateActiveSelectionTag();

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
    const toggleStripBtn = $('togglePillsStripBtn');

    if (isAbstract) {
      if (labelEl) labelEl.childNodes[0].nodeValue = 'Abstract Category ';
      if (badgeEl) badgeEl.textContent = `${STOCK_DATA.abstractCategories.length} Categories`;
      if (pillsWrap) pillsWrap.style.display = pillsWrap.classList.contains('is-collapsed') ? 'none' : 'block';
      if (subcatGroup) subcatGroup.style.display = 'block';
      if (toggleStripBtn) toggleStripBtn.style.display = 'inline-flex';

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
      if (toggleStripBtn) toggleStripBtn.style.display = 'none';

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

  // Central Category Selection Engine (Instant 1-Click Action)
  function selectCategory(catKey, isUserClick = false, targetSubcat = null) {
    if (!catKey) return;
    const catSelect = $('category');
    if (catSelect) {
      let matched = false;
      for (let i = 0; i < catSelect.options.length; i++) {
        const val = catSelect.options[i].value;
        if (val.toLowerCase() === catKey.toLowerCase() ||
            val.toLowerCase().includes(catKey.toLowerCase()) ||
            catKey.toLowerCase().includes(val.toLowerCase())) {
          catSelect.selectedIndex = i;
          catKey = val;
          matched = true;
          break;
        }
      }
      if (!matched) {
        catSelect.value = catKey;
      }
    }

    updateSubcategories(false);
    if (targetSubcat) {
      selectSubcategory(targetSubcat, false);
    }
    updateLiveConceptPreview();

    const absCat = STOCK_DATA.findAbstractCategory(catKey);
    const code = absCat ? absCat.code : '';
    const bar = $('categoryPillsBar');
    if (bar) {
      bar.querySelectorAll('.category-pill').forEach(p => {
        const isActive = (p.dataset.cat === catKey || p.dataset.code === code);
        p.classList.toggle('active', isActive);
        if (isActive && isUserClick && !bar.classList.contains('is-grid')) {
          p.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      });
    }

    // Also sync filter in Results panel
    const filterCat = $('filterCategory');
    if (filterCat) {
      filterCat.value = catKey;
      renderAll();
    }

    if (isUserClick) {
      Toast.show(`✓ Category Selected: ${catKey}`, 'success', 2200);
    }
  }

  // Render Horizontal Category Pills / Grid for Quick 1-Click Access
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
        <button type="button" class="category-pill ${isActive ? 'active' : ''}" data-cat="${UI.esc(key)}" data-code="${entry.code}" title="${UI.esc(key)} (${entry.subcategories.length} sub-styles) - Click to select">
          <span class="category-pill-num">${entry.code}</span>
          <span>${UI.esc(entry.shortName)}</span>
        </button>
      `;
    }).join('');

    bar.innerHTML = pillHTML;

    // Attach direct button click events
    bar.querySelectorAll('.category-pill').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        selectCategory(btn.dataset.cat, true);
      };
    });

    // Re-apply search filter if present
    const catSearch = $('catFilterInput');
    if (catSearch && catSearch.value.trim()) {
      const q = catSearch.value.toLowerCase().trim();
      bar.querySelectorAll('.category-pill').forEach(p => {
        const catText = (p.dataset.cat || '').toLowerCase();
        const code = (p.dataset.code || '').toLowerCase();
        p.style.display = (!q || catText.includes(q) || code.includes(q)) ? (bar.classList.contains('is-grid') ? 'flex' : 'inline-flex') : 'none';
      });
    }
  }

  // Dynamic Cascading Subcategories Dropdown & Clickable Subcategory Pills
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

      // Render horizontal clickable pills for this active category
      renderSubcategoryPills(absCat, subcatSelect.value);

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
      const subBar = $('subcategoryPillsBar');
      if (subBar) subBar.innerHTML = '';
    }
  }

  // Render Horizontal Clickable Subcategory Pills for Active Category
  function renderSubcategoryPills(absCat, activeSub) {
    const subBar = $('subcategoryPillsBar');
    if (!subBar) return;
    if (!absCat || !absCat.subcategories || !absCat.subcategories.length) {
      subBar.innerHTML = '';
      return;
    }

    const currentSub = activeSub || 'Auto Diversity';
    const isAuto = currentSub === 'Auto Diversity';

    let html = `
      <button type="button" class="subcat-pill ${isAuto ? 'active' : ''}" data-sub="Auto Diversity" title="Auto Diversity (Randomize across all ${absCat.subcategories.length} styles)">
        ✦ Auto Diversity
      </button>
    `;

    absCat.subcategories.forEach(sub => {
      const isActive = currentSub === sub;
      html += `
        <button type="button" class="subcat-pill ${isActive ? 'active' : ''}" data-sub="${UI.esc(sub)}" title="Style: ${UI.esc(sub)}">
          ${UI.esc(sub)}
        </button>
      `;
    });

    subBar.innerHTML = html;
  }

  // Helper to Select Subcategory with bi-directional sync, preview, and toast
  function selectSubcategory(subName, isUserClick = true) {
    const subSelect = $('subcategory');
    if (subSelect) {
      subSelect.value = subName;
    }

    const subBar = $('subcategoryPillsBar');
    if (subBar) {
      subBar.querySelectorAll('.subcat-pill').forEach(p => {
        const isActive = p.dataset.sub === subName;
        p.classList.toggle('active', isActive);
        if (isActive && isUserClick) {
          p.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      });
    }

    updateLiveConceptPreview();

    if (isUserClick) {
      Toast.show(`✓ Style Selected: ${subName}`, 'info', 1800);
    }
  }

  // Setup Event Delegation for Subcategory Pills
  function setupSubcategoryPills() {
    const subBar = $('subcategoryPillsBar');
    if (!subBar) return;

    subBar.addEventListener('click', (e) => {
      const btn = e.target.closest('.subcat-pill');
      if (!btn || !btn.dataset.sub) return;
      e.preventDefault();
      e.stopPropagation();
      selectSubcategory(btn.dataset.sub, true);
    });
  }

  // Setup All 749 Sub-Categories Catalog Modal
  function setupCatalogModal() {
    const modal = $('catalogModal');
    const openBtn = $('browseAll749Btn');
    const closeBtn = $('catalogModalClose');
    const doneBtn = $('catalogDoneBtn');
    const searchInput = $('catalogSearchInput');
    const content = $('catalogContent');

    if (!modal) return;

    const openCatalog = () => {
      renderCatalogModal();
      modal.classList.remove('hidden');
      document.body.classList.add('modal-open');
      if (searchInput) {
        searchInput.value = '';
        setTimeout(() => searchInput.focus(), 120);
      }
    };

    const closeCatalog = () => {
      modal.classList.add('hidden');
      document.body.classList.remove('modal-open');
    };

    if (openBtn) openBtn.onclick = openCatalog;
    if (closeBtn) closeBtn.onclick = closeCatalog;
    if (doneBtn) doneBtn.onclick = closeCatalog;

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeCatalog();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeCatalog();
      }
    });

    // Real-time Search Filtering across 80 Categories & 749 Subcategories
    if (searchInput && content) {
      searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase().trim();
        const cards = content.querySelectorAll('.catalog-cat-card');

        cards.forEach(card => {
          const catName = (card.dataset.cat || '').toLowerCase();
          const code = (card.dataset.code || '').toLowerCase();
          const chips = card.querySelectorAll('.catalog-sub-chip');
          let matchedChipsCount = 0;

          chips.forEach(chip => {
            const sub = (chip.dataset.sub || '').toLowerCase();
            const match = !q || sub.includes(q) || catName.includes(q) || code.includes(q);
            chip.style.display = match ? 'inline-flex' : 'none';
            if (match) matchedChipsCount++;
          });

          // Show card if card name matches or any sub matches
          const showCard = !q || catName.includes(q) || code.includes(q) || matchedChipsCount > 0;
          card.style.display = showCard ? 'block' : 'none';
        });
      });
    }

    // Event Delegation inside Catalog Modal Content
    if (content) {
      content.addEventListener('click', (e) => {
        // 1. Clicked a subcategory chip
        const subChip = e.target.closest('.catalog-sub-chip');
        if (subChip && subChip.dataset.cat && subChip.dataset.sub) {
          e.preventDefault();
          e.stopPropagation();
          const catKey = subChip.dataset.cat;
          const subName = subChip.dataset.sub;

          selectCategory(catKey, false, subName);
          closeCatalog();
          Toast.show(`✓ Selected: ${catKey} • ${subName}`, 'success', 2500);
          return;
        }

        // 2. Clicked "Select Category" button on card header
        const catBtn = e.target.closest('.select-all-cat-btn');
        if (catBtn && catBtn.dataset.cat) {
          e.preventDefault();
          e.stopPropagation();
          const catKey = catBtn.dataset.cat;
          selectCategory(catKey, true, 'Auto Diversity');
          closeCatalog();
        }
      });
    }
  }

  // Render Full 80-Category / 749-Subcategory Catalog Content
  function renderCatalogModal() {
    const content = $('catalogContent');
    if (!content) return;

    const currentCat = $('category') ? $('category').value.trim() : '';
    const currentSub = $('subcategory') ? $('subcategory').value.trim() : '';

    const keys = Object.keys(STOCK_DATA.abstractTaxonomy);
    const html = keys.map(key => {
      const entry = STOCK_DATA.abstractTaxonomy[key];
      const isCurrentCat = (currentCat === key || currentCat.startsWith(entry.code));

      const chipsHTML = entry.subcategories.map(sub => {
        const isActive = isCurrentCat && (currentSub === sub);
        return `
          <button type="button" class="catalog-sub-chip ${isActive ? 'active' : ''}" data-cat="${UI.esc(key)}" data-sub="${UI.esc(sub)}" title="Choose ${UI.esc(key)} • ${UI.esc(sub)}">
            ${UI.esc(sub)}
          </button>
        `;
      }).join('');

      return `
        <div class="catalog-cat-card" data-cat="${UI.esc(key)}" data-code="${entry.code}">
          <div class="catalog-cat-head">
            <div class="catalog-cat-title">
              <span>${entry.code}. ${UI.esc(entry.fullName || entry.name)}</span>
              <span class="catalog-cat-badge">${entry.subcategories.length} Styles</span>
            </div>
            <button type="button" class="mini select-all-cat-btn" data-cat="${UI.esc(key)}" title="Select this category on Auto Diversity">
              Select Category
            </button>
          </div>
          <div class="catalog-subs-grid">
            ${chipsHTML}
          </div>
        </div>
      `;
    }).join('');

    content.innerHTML = html;
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


  // Setup Collapsible Control Cards with Drop Arrow & Toggle All
  function setupCollapsibleCards() {
    const toggleAllBtn = $('toggleAllCardsBtn');
    const cards = document.querySelectorAll('#controlsPanel details.control-card');
    if (!cards.length) return;

    if (toggleAllBtn) {
      toggleAllBtn.onclick = () => {
        const anyOpen = Array.from(cards).some(c => c.open);
        cards.forEach(c => {
          c.open = !anyOpen;
        });
        toggleAllBtn.textContent = anyOpen ? '▸ Expand All' : '▾ Collapse All';
      };

      // Listen to individual card toggle events to sync toggleAllBtn label
      cards.forEach(card => {
        card.addEventListener('toggle', () => {
          const anyOpen = Array.from(cards).some(c => c.open);
          toggleAllBtn.textContent = anyOpen ? '▾ Collapse All' : '▸ Expand All';
        });
      });
    }
  }

  // Setup Category Search Input & Grid Toggle
  function setupCategorySearch() {
    const catSearch = $('catFilterInput');
    const bar = $('categoryPillsBar');
    const toggleBtn = $('toggleCatGridBtn');
    const toggleStripBtn = $('togglePillsStripBtn');
    const pillsWrap = $('categoryPillsWrap');

    // Toggle 80 Pills Filter Bar
    if (toggleStripBtn && pillsWrap) {
      const isCollapsed = pillsWrap.classList.contains('is-collapsed');
      toggleStripBtn.textContent = isCollapsed ? '🔍 Quick Filter' : '✕ Hide Filter';
      toggleStripBtn.classList.toggle('active', !isCollapsed);

      toggleStripBtn.onclick = () => {
        pillsWrap.classList.toggle('is-collapsed');
        const collapsed = pillsWrap.classList.contains('is-collapsed');
        pillsWrap.style.display = collapsed ? 'none' : 'block';
        toggleStripBtn.classList.toggle('active', !collapsed);
        toggleStripBtn.textContent = collapsed ? '🔍 Quick Filter' : '✕ Hide Filter';
        if (!collapsed && catSearch) {
          setTimeout(() => catSearch.focus(), 80);
        }
      };
    }

    // Toggle between single-row strip and expanded full grid view
    if (toggleBtn && bar) {
      toggleBtn.onclick = () => {
        bar.classList.toggle('is-grid');
        const isGrid = bar.classList.contains('is-grid');
        toggleBtn.textContent = isGrid ? '≡ Strip View' : '⊞ Grid View';
        toggleBtn.classList.toggle('active', isGrid);
      };
    }

    // Container event delegation for category pills
    if (bar) {
      bar.addEventListener('click', (e) => {
        const btn = e.target.closest('.category-pill');
        if (!btn || !btn.dataset.cat) return;
        e.preventDefault();
        e.stopPropagation();
        selectCategory(btn.dataset.cat, true);
      });
    }

    if (catSearch) {
      catSearch.addEventListener('input', () => {
        const query = catSearch.value.toLowerCase().trim();
        const pills = document.querySelectorAll('.category-pill');
        let matchCount = 0;
        let firstMatchCat = null;

        pills.forEach(p => {
          const catText = (p.dataset.cat || '').toLowerCase();
          const code = (p.dataset.code || '').toLowerCase();
          const matches = !query || catText.includes(query) || code.includes(query);
          p.style.display = matches ? (bar && bar.classList.contains('is-grid') ? 'flex' : 'inline-flex') : 'none';
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
            selectCategory(firstMatchCat, false);
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
            selectCategory(visiblePills[0].dataset.cat, true);
          }
        }
      });
    }
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

  // Mobile & Tablet Responsive Tabs Management
  function isMobileLayout() {
    const tabs = document.getElementById('mobileTabs');
    return window.innerWidth <= 900 || (tabs && window.getComputedStyle(tabs).display !== 'none');
  }

  function syncMobileStickyBar(tabKey) {
    const stickyBar = document.querySelector('.mobile-sticky-bar');
    if (stickyBar) {
      const activeKey = tabKey || document.querySelector('.mobile-tab.active')?.dataset?.tab || 'generator';
      const shouldShow = activeKey === 'generator' && isMobileLayout() && !document.body.classList.contains('modal-open');
      stickyBar.style.display = shouldShow ? 'block' : 'none';
    }
  }

  function setupMobileTabs() {
    const tabs = document.querySelectorAll('.mobile-tab');
    const workspace = document.querySelector('.workspace');

    // Ensure initial mode is set
    const activeTab = document.querySelector('.mobile-tab.active');
    if (activeTab && workspace) {
      const initialKey = activeTab.dataset?.tab || 'generator';
      workspace.classList.remove('tab-mode-generator', 'tab-mode-results', 'tab-mode-history');
      workspace.classList.add(`tab-mode-${initialKey}`);
      syncMobileStickyBar(initialKey);
    }

    tabs.forEach(tab => {
      tab.onclick = () => {
        tabs.forEach(t => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        const tabKey = tab.dataset?.tab || 'generator';
        workspace.classList.remove('tab-mode-generator', 'tab-mode-results', 'tab-mode-history');
        workspace.classList.add(`tab-mode-${tabKey}`);
        syncMobileStickyBar(tabKey);

        if (isMobileLayout()) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          if (tabKey === 'results') {
            $('resultsPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (tabKey === 'history') {
            $('historyPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else if (tabKey === 'generator') {
            $('controlsPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      };
    });

    window.addEventListener('resize', () => {
      syncMobileStickyBar();
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
      grainEffect: selectedGrainEffect,
      resolution: selectedResolution,
      aiEngine: selectedAiEngine,
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

      // Run AI prompt doctor if auto-enhance is enabled
      if (window.AiPromptDoctor && AiPromptDoctor.config?.autoEnhanceOnGenerate) {
        for (const d of generated) {
          const res = AiPromptDoctor.offlineCorrect(d.prompt, AiPromptDoctor.config.profile, d.aiEngine || selectedAiEngine);
          d.originalPrompt = d.prompt;
          d.prompt = res.correctedPrompt;
          d.aiCorrected = true;
          d.aiDoctorModel = res.modelUsed;
          d.aiImprovements = res.improvements;
          d.metadata = MetadataEngine.build(d, d.category);
        }
      }

      current = generated;
      history = [...generated, ...history].slice(0, 1000);
      Store.save(history);

      renderAll();
      Toast.show(`Generated ${generated.length} diverse commercial concepts!`, 'success');

      // On mobile, auto-switch to results tab
      if (isMobileLayout()) {
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

    // Mockup switcher buttons inside modal
    document.querySelectorAll('.mockup-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.mockup-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const mode = btn.dataset.mockup;
        const d = activeModalDesign;
        const isBurst = String((d?.category || '') + ' ' + (d?.subcategory || '') + ' ' + (d?.background || '')).toLowerCase().includes('burst');
        const burstClass = isBurst ? 'has-burst' : '';
        const grainKey = d?.grainEffect || selectedGrainEffect || 'grain';
        const grainClass = STOCK_DATA?.grainEffectMap?.[grainKey]?.class || '';
        const modalCanvas = $('modalCanvas');
        if (modalCanvas) {
          modalCanvas.className = `modal-canvas ${mode} ${burstClass} ${grainClass}`;
        }
      };
    });

    // Copy CSS Gradient button inside modal
    if ($('modalCopyCssBtn')) {
      $('modalCopyCssBtn').onclick = () => {
        if (!activeModalDesign) return;
        const cssCode = `background: ${activeModalDesign.cssGradient || activeGradientCss};`;
        UI.copyToClipboard(cssCode, '✓ CSS Gradient code copied!');
      };
    }

    // Apply Background to app from inside modal
    if ($('modalApplyBgBtn')) {
      $('modalApplyBgBtn').onclick = () => {
        if (!activeModalDesign) return;
        applyAppBackdrop(activeModalDesign.cssGradient);
      };
    }

    // Copy Negative Prompt button
    if ($('modalCopyNegBtn')) {
      $('modalCopyNegBtn').onclick = () => {
        if (!activeModalDesign) return;
        const neg = $('modalNegPromptText') ? $('modalNegPromptText').textContent : '';
        UI.copyToClipboard(neg, '✓ Rejection Shield Negative Prompt copied!');
      };
    }

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
    const diffBox = $('modalDoctorDiff');
    if (diffBox) {
      if (design.aiImprovements && design.aiImprovements.length) {
        diffBox.classList.remove('hidden');
        diffBox.innerHTML = `
          <div class="doctor-diff-header">
            <b>✨ AI Doctor Improvements (${design.aiDoctorModel || 'AI Doctor'}):</b>
          </div>
          <ul class="doctor-improvements-list">
            ${design.aiImprovements.map(imp => `<li>✓ ${imp}</li>`).join('')}
          </ul>
        `;
      } else {
        diffBox.classList.add('hidden');
        diffBox.innerHTML = '';
      }
    }

    // Canvas Preview & Mockups Initialization
    const testStr = String((design.category || '') + ' ' + (design.subcategory || '') + ' ' + (design.background || '')).toLowerCase();
    const isBurst = testStr.includes('burst') || testStr.includes('zoom') || testStr.includes('rays') || testStr.includes('warp');
    const burstClass = isBurst ? 'has-burst' : '';
    const grainKey = design.grainEffect || selectedGrainEffect || 'grain';
    const grainClass = STOCK_DATA?.grainEffectMap?.[grainKey]?.class || '';
    const modalCanvas = $('modalCanvas');
    if (modalCanvas) {
      modalCanvas.className = `modal-canvas clean ${burstClass} ${grainClass}`;
      modalCanvas.style.background = design.cssGradient || DiversityEngine.generateCssGradient(design.color, design.subcategory || design.category, design.style, design.background);
    }
    activeGradientCss = design.cssGradient || '';

    // Reset mockup active chip
    document.querySelectorAll('.mockup-btn').forEach(b => b.classList.toggle('active', b.dataset.mockup === 'clean'));

    // Populate Negative Prompt Preview
    if ($('modalNegPromptText')) {
      $('modalNegPromptText').textContent = design.negativePrompt || MetadataEngine.generateNegativePrompt(design);
    }

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
    // 1. Check if category or subcategory tag was clicked
    const subcatTag = e.target.closest('.card-subcategory-tag');
    if (subcatTag) {
      const card = subcatTag.closest('.card');
      const cardId = card ? (card.dataset.id || card.dataset.cardId) : null;
      const d = cardId ? findDesign(cardId) : null;
      if (d) {
        if (d.category) selectCategory(d.category, false, d.subcategory || null);
        if (isMobileLayout()) switchMobileTab('generator');
        return;
      }
    }

    const catTag = e.target.closest('.card-category-tag');
    if (catTag) {
      const catName = catTag.textContent.trim();
      selectCategory(catName, true);
      if (isMobileLayout()) switchMobileTab('generator');
      return;
    }

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
      if (isMobileLayout()) switchMobileTab('generator');
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

    if (action === 'copy-css') {
      const gradient = d.cssGradient || DiversityEngine.generateCssGradient(d.color, d.subcategory || d.category, d.style, d.background);
      UI.copyToClipboard(`background: ${gradient};`, '✓ CSS Background gradient copied!');
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
    // Check if table category tag was clicked
    const catTag = e.target.closest('.table-tag');
    if (catTag) {
      const catName = catTag.textContent.trim();
      selectCategory(catName, true);
      return;
    }

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

  // Setup Chips, Presets, and Backdrop Controls
  function setupChipsAndPresets() {
    // 1. Texture Chips
    document.querySelectorAll('.texture-chip').forEach(chip => {
      chip.onclick = () => {
        document.querySelectorAll('.texture-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedGrainEffect = chip.dataset.grain;
        if ($('grainLabel')) $('grainLabel').textContent = STOCK_DATA?.grainEffectMap?.[selectedGrainEffect]?.label || selectedGrainEffect;
        Toast.show(`Texture set to ${STOCK_DATA?.grainEffectMap?.[selectedGrainEffect]?.label || selectedGrainEffect}`, 'info');
        updateActiveSelectionTag();
        updateLiveConceptPreview();
      };
    });

    // 2. Target AI Engine Chips
    document.querySelectorAll('.engine-chip').forEach(chip => {
      chip.onclick = () => {
        document.querySelectorAll('.engine-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedAiEngine = chip.dataset.engine;
        if ($('aiEngineLabel')) $('aiEngineLabel').textContent = STOCK_DATA?.aiEngineMap?.[selectedAiEngine]?.label || selectedAiEngine;
        Toast.show(`AI Engine target set to ${STOCK_DATA?.aiEngineMap?.[selectedAiEngine]?.label}`, 'info');
        updateLiveConceptPreview();
      };
    });

    // 3. Resolution Chips
    document.querySelectorAll('.res-chip').forEach(chip => {
      chip.onclick = () => {
        document.querySelectorAll('.res-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedResolution = chip.dataset.res;
        if ($('resLabel')) $('resLabel').textContent = STOCK_DATA?.resolutionMap?.[selectedResolution]?.label || selectedResolution;
        Toast.show(`Resolution set to ${selectedResolution}`, 'info');
        updateLiveConceptPreview();
      };
    });

    // 4. Quick Preset Chips
    document.querySelectorAll('.preset-chip').forEach(chip => {
      chip.onclick = () => {
        document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const cat = chip.dataset.cat;
        const sub = chip.dataset.sub;
        const grain = chip.dataset.grain;

        if (cat) selectCategory(cat, true);
        if (sub) {
          setTimeout(() => selectSubcategory(sub, true), 80);
        }
        if (grain) {
          selectedGrainEffect = grain;
          document.querySelectorAll('.texture-chip').forEach(c => c.classList.toggle('active', c.dataset.grain === grain));
          if ($('grainLabel')) $('grainLabel').textContent = STOCK_DATA?.grainEffectMap?.[grain]?.label || grain;
        }

        updateActiveSelectionTag();
        generate();
        Toast.show(`Applied preset: ${chip.textContent.trim()}`, 'success');
      };
    });

    // 5. Inspiration Launchpad Starter Cards
    document.querySelectorAll('.starter-card').forEach(card => {
      const activateStarter = () => {
        const cat = card.dataset.cat;
        const sub = card.dataset.sub;
        const grain = card.dataset.grain;

        if (cat) selectCategory(cat, true);
        if (sub) {
          setTimeout(() => selectSubcategory(sub, true), 80);
        }
        if (grain) {
          selectedGrainEffect = grain;
          document.querySelectorAll('.texture-chip').forEach(c => c.classList.toggle('active', c.dataset.grain === grain));
          if ($('grainLabel')) $('grainLabel').textContent = STOCK_DATA?.grainEffectMap?.[grain]?.label || grain;
        }

        updateActiveSelectionTag();
        setTimeout(() => {
          generate();
          Toast.show(`⚡ Generated ${cat} collection!`, 'success');
        }, 100);
      };

      card.onclick = activateStarter;
      card.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          activateStarter();
        }
      };
    });
  }

  function setupAppBackdrop() {
    if ($('applyAppBgBtn')) {
      $('applyAppBgBtn').onclick = () => {
        const grad = activeGradientCss || (current[0] && current[0].cssGradient) || 'radial-gradient(circle at 50% 50%, #6366f1 0%, #ec4899 50%, #06b6d4 100%)';
        applyAppBackdrop(grad);
      };
    }
  }

  function applyAppBackdrop(gradientCss) {
    if (!isAppBgCustom && gradientCss) {
      document.body.style.setProperty('--custom-app-bg', gradientCss);
      document.body.classList.add('custom-gradient-bg');
      isAppBgCustom = true;
      if ($('applyAppBgBtn')) $('applyAppBgBtn').textContent = '↺ Reset BG';
      Toast.show('🎨 Applied background to studio backdrop!', 'success');
    } else {
      document.body.classList.remove('custom-gradient-bg');
      document.body.style.removeProperty('--custom-app-bg');
      isAppBgCustom = false;
      if ($('applyAppBgBtn')) $('applyAppBgBtn').textContent = '🎨 Apply to App';
      Toast.show('↺ Reverted app background to default.', 'info');
    }
  }

  function updateActiveSelectionTag() {
    const tag = $('activeSelectionTag');
    if (!tag) return;
    const cat = $('category') ? $('category').value : 'Auto Diversity';
    const sub = $('subcategory') && $('subcategory').value !== 'Auto Diversity' ? ` • ${$('subcategory').value}` : '';
    const grain = STOCK_DATA?.grainEffectMap?.[selectedGrainEffect]?.label || 'Film Grain';
    tag.textContent = `Active: ${cat}${sub} [${grain}]`;
  }

  // Global window helpers for inline action bindings
  window.copyCss = function(id) {
    const item = current.find(x => x.id === id) || history.find(x => x.id === id);
    if (!item || !item.cssGradient) return;
    UI.copyToClipboard(`background: ${item.cssGradient};`, '✓ CSS Background gradient copied!');
  };


  // Setup AI Prompt Doctor & API Engine
  function setupPromptDoctor() {
    if (!window.AiPromptDoctor) return;
    const cfg = AiPromptDoctor.config;

    const modelSelect = $('aiDoctorModel');
    const profileSelect = $('aiDoctorProfile');
    const keyInput = $('aiDoctorApiKey');
    const keyWrap = $('doctorApiKeyWrap');
    const statusBadge = $('doctorStatusBadge');
    const toggleVisBtn = $('toggleApiKeyVisBtn');
    const testKeyBtn = $('testApiKeyBtn');
    const saveKeyBtn = $('saveApiKeyBtn');
    const feedbackEl = $('apiKeyFeedback');
    const autoCheck = $('autoDoctorOnGenerateCheck');

    if (modelSelect) {
      modelSelect.value = cfg.model || 'builtin';
      profileSelect.value = cfg.profile || 'stock';
      if (keyInput) keyInput.value = cfg.apiKey || '';
      if (autoCheck) autoCheck.checked = !!cfg.autoEnhanceOnGenerate;

      function updateDoctorUI() {
        const isApi = modelSelect.value !== 'builtin';
        if (keyWrap) keyWrap.classList.remove('hidden'); // Always visible for user convenience
        if (statusBadge) {
          if (!isApi) {
            statusBadge.textContent = 'Offline Engine Ready';
            statusBadge.className = 'doctor-badge-offline';
          } else if (cfg.apiKey && cfg.apiKey.trim().length > 5) {
            const shortName = modelSelect.options[modelSelect.selectedIndex]?.text?.split(' ')?.[0] || 'API';
            statusBadge.textContent = `${shortName} Connected`;
            statusBadge.className = 'doctor-badge-connected';
          } else {
            statusBadge.textContent = 'API Key Required';
            statusBadge.className = 'doctor-badge-warning';
          }
        }
        const keyPill = $('apiKeyStatusPill');
        if (keyPill) {
          if (cfg.apiKey && cfg.apiKey.trim().length > 5) {
            keyPill.textContent = '✓ API Key Saved';
            keyPill.className = 'key-status-pill active';
          } else {
            keyPill.textContent = 'Optional: Free Offline Mode';
            keyPill.className = 'key-status-pill';
          }
        }
      }

      updateDoctorUI();

      modelSelect.onchange = () => {
        AiPromptDoctor.saveConfig({ model: modelSelect.value });
        updateDoctorUI();
        Toast.show(`AI Doctor: ${modelSelect.options[modelSelect.selectedIndex].text}`, 'info');
      };

      profileSelect.onchange = () => {
        AiPromptDoctor.saveConfig({ profile: profileSelect.value });
        Toast.show(`Correction Style: ${profileSelect.options[profileSelect.selectedIndex].text}`, 'info');
      };

      if (autoCheck) {
        autoCheck.onchange = () => {
          AiPromptDoctor.saveConfig({ autoEnhanceOnGenerate: autoCheck.checked });
          Toast.show(autoCheck.checked ? '⚡ Auto-Doctor enabled for new batches' : 'Auto-Doctor disabled for new batches', 'info');
        };
      }

      if (toggleVisBtn && keyInput) {
        toggleVisBtn.onclick = () => {
          const isPass = keyInput.type === 'password';
          keyInput.type = isPass ? 'text' : 'password';
          toggleVisBtn.textContent = isPass ? '🔒' : '👁';
        };
      }

      if (saveKeyBtn && keyInput) {
        saveKeyBtn.onclick = () => {
          const key = keyInput.value.trim();
          AiPromptDoctor.saveConfig({ apiKey: key });
          updateDoctorUI();
          Toast.show('✓ API Key saved securely in local browser storage', 'success');
          if (feedbackEl) {
            feedbackEl.textContent = 'API Key saved.';
            feedbackEl.className = 'key-feedback-msg success';
          }
        };
      }

      if (keyInput) {
        keyInput.oninput = () => {
          const val = keyInput.value.trim().replace(/^["']|["']$/g, '');
          if (val.startsWith('AIzaSy')) {
            if (modelSelect.value === 'builtin' || modelSelect.value.startsWith('gpt')) {
              modelSelect.value = 'gemini-3.8-flash';
              AiPromptDoctor.saveConfig({ model: 'gemini-3.8-flash' });
              updateDoctorUI();
            }
          } else if (val.startsWith('sk-')) {
            if (modelSelect.value === 'builtin' || modelSelect.value.startsWith('gemini')) {
              modelSelect.value = 'gpt-4o-mini';
              AiPromptDoctor.saveConfig({ model: 'gpt-4o-mini' });
              updateDoctorUI();
            }
          }
        };
      }

      if (testKeyBtn && keyInput) {
        testKeyBtn.onclick = async () => {
          const rawKey = keyInput.value.trim().replace(/^["']|["']$/g, '');
          keyInput.value = rawKey;
          const model = modelSelect.value;
          if (!rawKey) {
            Toast.show('Please paste an API key first (e.g. AIzaSy...)', 'warning');
            return;
          }
          testKeyBtn.disabled = true;
          testKeyBtn.textContent = 'Testing...';
          if (feedbackEl) {
            feedbackEl.textContent = 'Verifying API connection...';
            feedbackEl.className = 'key-feedback-msg';
          }
          try {
            const res = await AiPromptDoctor.testApiKey(model, rawKey);
            testKeyBtn.disabled = false;
            testKeyBtn.textContent = 'Test';
            Toast.show(`✓ ${res.message}`, 'success', 3500);

            if (res.detectedModel && modelSelect.value !== res.detectedModel) {
              modelSelect.value = res.detectedModel;
            }

            if (feedbackEl) {
              feedbackEl.textContent = `✓ ${res.message}`;
              feedbackEl.className = 'key-feedback-msg success';
            }
            AiPromptDoctor.saveConfig({ apiKey: res.cleanKey || rawKey, model: modelSelect.value });
            updateDoctorUI();
          } catch (err) {
            testKeyBtn.disabled = false;
            testKeyBtn.textContent = 'Test';
            Toast.show(`✕ API Test Failed: ${err.message}`, 'error', 4500);
            if (feedbackEl) {
              feedbackEl.textContent = `✕ ${err.message}`;
              feedbackEl.className = 'key-feedback-msg error';
            }
          }
        };
      }
    }

    // Batch Auto-Doctor Toolbar Button

    // Doctor Direct Playground Setup
    const doctorTestInput = $('doctorTestPrompt');
    const doctorRunBtn = $('doctorDirectGenerateBtn');
    const doctorSampleBtn = $('doctorInsertSampleBtn');
    const doctorResultBox = $('doctorResultBox');
    const doctorResultText = $('doctorResultText');
    const doctorImpList = $('doctorImprovementsList');
    const doctorCopyBtn = $('doctorCopyResultBtn');
    const doctorSendBtn = $('doctorSendToResultsBtn');

    if (doctorSampleBtn && doctorTestInput) {
      doctorSampleBtn.onclick = () => {
        const samples = [
          "Nike running shoes floating in mid-air over dark concrete street with neon lights",
          "Apple iPhone on luxury wooden table with coffee cup and soft morning sunlight",
          "Coca-cola glass bottle on beach sand with sea waves and sun flare",
          "BMW luxury sports car speeding on wet asphalt road at dusk with neon motion blur",
          "Grainy aesthetic aura gradient abstract wallpaper with chromatic blur"
        ];
        const randomSample = samples[Math.floor(Math.random() * samples.length)];
        doctorTestInput.value = randomSample;
        Toast.show('Sample prompt loaded! Click "Polish with AI"', 'info', 2000);
      };
    }

    if (doctorRunBtn && doctorTestInput) {
      doctorRunBtn.onclick = async () => {
        let text = doctorTestInput.value.trim();
        if (!text) {
          // If empty, take current live prompt synthesis
          text = $('livePromptPreview')?.textContent?.trim();
          if (!text || text.includes('Select options')) {
            text = "Smooth gradient abstract background with soft color blend and fine grain";
          }
          doctorTestInput.value = text;
        }

        const activeModelName = modelSelect?.options[modelSelect.selectedIndex]?.text || 'AI Doctor';
        doctorRunBtn.disabled = true;
        doctorRunBtn.innerHTML = '<span class="online-spinner" style="width:14px;height:14px"></span> Polishing...';

        try {
          const res = await AiPromptDoctor.correct(text, {
            targetEngine: selectedAiEngine,
            profile: profileSelect ? profileSelect.value : 'stock'
          });

          doctorRunBtn.disabled = false;
          doctorRunBtn.innerHTML = '<span class="btn-sparkle">✨</span> Polish with AI';

          if (doctorResultBox && doctorResultText) {
            doctorResultBox.classList.remove('hidden');
            doctorResultText.textContent = res.correctedPrompt;
            if (doctorImpList) {
              doctorImpList.innerHTML = (res.improvements || []).map(imp =>
                `<span class="doctor-imp-chip">✓ ${UI.esc(imp)}</span>`
              ).join('');
            }
          }

          Toast.show(`✓ Prompt enhanced with ${res.modelUsed || activeModelName}!`, 'success', 3500);

          // Automatically add this enhanced prompt to Generated Concepts list!
          const cat = $('category')?.value || '01. Gradient Abstract';
          const sub = $('subcategory')?.value || 'Smooth Gradient';
          const newItem = {
            id: 'SD-AI-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
            category: cat,
            subcategory: sub,
            style: $('style')?.value || 'Auto Diversity',
            color: $('customColor')?.value || 'Vibrant',
            lighting: $('customLighting')?.value || 'Studio Softbox',
            texture: $('customTexture')?.value || 'Film Grain',
            composition: $('customComposition')?.value || 'Balanced',
            background: 'Clean commercial backdrop',
            mood: 'Commercial',
            prompt: res.correctedPrompt,
            originalPrompt: text,
            aiCorrected: true,
            aiDoctorModel: res.modelUsed || activeModelName,
            aiImprovements: res.improvements || [],
            uniquenessScore: 94,
            isFavorite: false,
            isLocked: false,
            aspect: $('orientation')?.value || 'Square (1:1)',
            resolution: '8K Ultra',
            timestamp: Date.now()
          };
          newItem.metadata = MetadataEngine.build(newItem, cat);
          newItem.cssGradient = DiversityEngine.generateCssGradient(newItem.color, sub, newItem.style, newItem.background);

          current.unshift(newItem);
          history.unshift(newItem);
          Store.save(history);
          renderAll();

          // Scroll to results or result box
          if (isMobileLayout()) {
            switchMobileTab('results');
          } else {
            $('resultsPanel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        } catch (err) {
          doctorRunBtn.disabled = false;
          doctorRunBtn.innerHTML = '<span class="btn-sparkle">✨</span> Polish with AI';
          Toast.show(`Correction error: ${err.message}`, 'error', 4000);
        }
      };
    }

    if (doctorCopyBtn && doctorResultText) {
      doctorCopyBtn.onclick = () => {
        const txt = doctorResultText.textContent.trim();
        if (txt) UI.copyToClipboard(txt, '✓ Enhanced prompt copied to clipboard!');
      };
    }

    if (doctorSendBtn && doctorResultText) {
      doctorSendBtn.onclick = () => {
        const txt = doctorResultText.textContent.trim();
        if (!txt) return;

        const cat = $('category')?.value || '01. Gradient Abstract';
        const sub = $('subcategory')?.value || 'Smooth Gradient';
        const newItem = {
          id: 'SD-DOC-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
          category: cat,
          subcategory: sub,
          style: $('style')?.value || 'Auto Diversity',
          color: $('customColor')?.value || 'Vibrant',
          lighting: $('customLighting')?.value || 'Studio Softbox',
          texture: $('customTexture')?.value || 'Film Grain',
          composition: $('customComposition')?.value || 'Balanced',
          background: 'Clean commercial backdrop',
          mood: 'Commercial',
          prompt: txt,
          originalPrompt: doctorTestInput?.value || txt,
          aiCorrected: true,
          aiDoctorModel: modelSelect?.options[modelSelect.selectedIndex]?.text || 'AI Doctor',
          uniquenessScore: 92,
          isFavorite: false,
          isLocked: false,
          aspect: $('orientation')?.value || 'Square (1:1)',
          resolution: '8K Ultra',
          timestamp: Date.now()
        };
        newItem.metadata = MetadataEngine.build(newItem, cat);
        newItem.cssGradient = DiversityEngine.generateCssGradient(newItem.color, sub, newItem.style, newItem.background);

        current.unshift(newItem);
        history.unshift(newItem);
        Store.save(history);
        renderAll();

        Toast.show('✓ Added to Generated Concepts cards!', 'success');
        $('resultsPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
      };
    }

    // Top Navbar API Key Quick Jump Button
    const topKeyBtn = $('topApiKeyBtn');
    if (topKeyBtn) {
      topKeyBtn.onclick = () => {
        const card = $('cardArchetype');
        if (card) card.open = true;
        const wrap = $('doctorApiKeyWrap');
        if (wrap) {
          wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
          wrap.classList.remove('pulse-highlight');
          void wrap.offsetWidth;
          wrap.classList.add('pulse-highlight');
        }
        const inp = $('aiDoctorApiKey');
        if (inp) inp.focus();
        Toast.show('Paste your Google Gemini API Key here and click Save or Test', 'info', 3000);
      };
    }


    // Dedicated API Key Modal Logic
    const apiKeyModal = $('apiKeyModal');
    const modalKeyInput = $('modalApiKeyInput');
    const modalModelSelect = $('modalModelSelect');
    const modalVisBtn = $('modalToggleKeyVisBtn');
    const modalTestBtn = $('modalTestKeyBtn');
    const modalSaveBtn = $('modalSaveKeyBtn');
    const modalClearBtn = $('modalClearKeyBtn');
    const modalCloseBtn = $('apiKeyModalClose');
    const modalFeedback = $('modalApiKeyFeedback');
    const sidebarKeyOpenBtn = $('openApiKeyModalFromSidebarBtn');

    function openApiKeyModal() {
      if (!apiKeyModal) return;
      const currentKey = AiPromptDoctor.config.apiKey || '';
      const currentModel = AiPromptDoctor.config.model || 'gemini-3.8-flash';
      if (modalKeyInput) modalKeyInput.value = currentKey;
      if (modalModelSelect) modalModelSelect.value = currentModel;
      if (modalFeedback) {
        modalFeedback.textContent = currentKey ? 'Key currently active' : '';
        modalFeedback.className = 'key-feedback-msg' + (currentKey ? ' success' : '');
      }
      apiKeyModal.classList.remove('hidden');
      if (modalKeyInput) setTimeout(() => modalKeyInput.focus(), 100);
    }

    function closeApiKeyModal() {
      if (apiKeyModal) apiKeyModal.classList.add('hidden');
    }

    if (modalCloseBtn) modalCloseBtn.onclick = closeApiKeyModal;
    if (apiKeyModal) {
      apiKeyModal.onclick = (e) => {
        if (e.target === apiKeyModal) closeApiKeyModal();
      };
    }

    if (sidebarKeyOpenBtn) sidebarKeyOpenBtn.onclick = openApiKeyModal;

    // Connect all API key buttons across devices to open modal directly
    const allApiKeyOpeners = [
      topKeyBtn,
      $('topApiKeyBtn'),
      $('sidebarKeyOpenBtn'),
      $('openApiKeyModalFromSidebarBtn'),
      $('mobileTopApiKeyBtn'),
      $('mobileStickyApiKeyBtn')
    ].filter(Boolean);

    allApiKeyOpeners.forEach(btn => {
      btn.onclick = openApiKeyModal;
    });

    if (modalVisBtn && modalKeyInput) {
      modalVisBtn.onclick = () => {
        const isPass = modalKeyInput.type === 'password';
        modalKeyInput.type = isPass ? 'text' : 'password';
        modalVisBtn.textContent = isPass ? '🔒' : '👁';
      };
    }

    if (modalKeyInput) {
      modalKeyInput.oninput = () => {
        const val = modalKeyInput.value.trim().replace(/^["']|["']$/g, '');
        if (val.startsWith('AIzaSy')) {
          if (modalModelSelect && (modalModelSelect.value === 'builtin' || modalModelSelect.value.startsWith('gpt'))) {
            modalModelSelect.value = 'gemini-3.8-flash';
          }
        } else if (val.startsWith('sk-')) {
          if (modalModelSelect && (modalModelSelect.value === 'builtin' || modalModelSelect.value.startsWith('gemini'))) {
            modalModelSelect.value = 'gpt-4o-mini';
          }
        }
      };
    }

    if (modalTestBtn && modalKeyInput) {
      modalTestBtn.onclick = async () => {
        const rawKey = modalKeyInput.value.trim().replace(/^["']|["']$/g, '');
        modalKeyInput.value = rawKey;
        if (!rawKey) {
          Toast.show('Please enter an API Key first', 'warning');
          return;
        }
        modalTestBtn.disabled = true;
        modalTestBtn.textContent = 'Testing...';
        if (modalFeedback) {
          modalFeedback.textContent = 'Testing connection...';
          modalFeedback.className = 'key-feedback-msg';
        }
        try {
          const res = await AiPromptDoctor.testApiKey(modalModelSelect ? modalModelSelect.value : 'gemini-3.8-flash', rawKey);
          modalTestBtn.disabled = false;
          modalTestBtn.textContent = '⚡ Test Connection';
          Toast.show(`✓ ${res.message}`, 'success', 3500);
          if (modalFeedback) {
            modalFeedback.textContent = `✓ ${res.message}`;
            modalFeedback.className = 'key-feedback-msg success';
          }
          if (res.detectedModel && modalModelSelect) {
            modalModelSelect.value = res.detectedModel;
          }
        } catch (err) {
          modalTestBtn.disabled = false;
          modalTestBtn.textContent = '⚡ Test Connection';
          Toast.show(`✕ ${err.message}`, 'error', 4500);
          if (modalFeedback) {
            modalFeedback.textContent = `✕ ${err.message}`;
            modalFeedback.className = 'key-feedback-msg error';
          }
        }
      };
    }

    if (modalSaveBtn && modalKeyInput) {
      modalSaveBtn.onclick = () => {
        const rawKey = modalKeyInput.value.trim().replace(/^["']|["']$/g, '');
        const selModel = modalModelSelect ? modalModelSelect.value : 'gemini-3.8-flash';
        AiPromptDoctor.saveConfig({ apiKey: rawKey, model: selModel });
        if (keyInput) keyInput.value = rawKey;
        if (modelSelect) modelSelect.value = selModel;
        updateDoctorUI();
        Toast.show('✓ API Key & Model saved and activated!', 'success');
        closeApiKeyModal();
      };
    }

    if (modalClearBtn) {
      modalClearBtn.onclick = () => {
        AiPromptDoctor.saveConfig({ apiKey: '', model: 'builtin' });
        if (modalKeyInput) modalKeyInput.value = '';
        if (keyInput) keyInput.value = '';
        if (modelSelect) modelSelect.value = 'builtin';
        updateDoctorUI();
        Toast.show('API Key removed. Reverted to built-in offline engine.', 'info');
        closeApiKeyModal();
      };
    }

    if ($('autoDoctorBatchBtn')) {
      $('autoDoctorBatchBtn').onclick = async () => {
        const visible = filtered();
        if (!visible.length) {
          Toast.show('No generated concepts to correct.', 'info');
          return;
        }

        const btn = $('autoDoctorBatchBtn');
        btn.disabled = true;
        btn.textContent = '⏳ Optimizing...';
        Toast.show(`✨ AI Doctor: Optimizing ${visible.length} prompts...`, 'info', 2000);

        const isOnline = (AiPromptDoctor.config?.model !== 'builtin' && AiPromptDoctor.config?.apiKey);
        let count = 0;

        for (let i = 0; i < visible.length; i++) {
          const d = visible[i];
          try {
            // In batch mode, apply live API to top concepts and seamlessly use built-in doctor for the rest to preserve 20 RPM quota
            const inCooldown = Date.now() < (AiPromptDoctor.quotaCooldownUntil || 0);
            const preferOffline = isOnline && (i >= 4 || inCooldown);

            const res = preferOffline
              ? AiPromptDoctor.offlineCorrect(d.prompt, AiPromptDoctor.config?.profile, d.aiEngine || selectedAiEngine)
              : await AiPromptDoctor.correct(d.prompt, { 
                  targetEngine: d.aiEngine || selectedAiEngine,
                  silent: i > 0 // Only allow first notice if quota triggers
                });

            d.originalPrompt = d.originalPrompt || d.prompt;
            d.prompt = res.correctedPrompt;
            d.aiCorrected = true;
            d.aiDoctorModel = res.modelUsed;
            d.aiImprovements = res.improvements;
            d.metadata = MetadataEngine.build(d, d.category);
            count++;
          } catch (e) {
            console.warn('Batch doctor item error:', e);
          }
        }

        Store.save(history);
        renderAll();
        btn.disabled = false;
        btn.textContent = '✨ AI Doctor All';
        Toast.show(`✓ Successfully optimized ${count} concepts with AI Doctor!`, 'success', 3500);
      };
    }
  }


  // Online AI Image Generator Modal & Launchers
  let activeOnlineImageDesign = null;

  function setupOnlineImageModal() {
    const modal = $('onlineImageModal');
    if (!modal) return;
    const closeBtn = $('onlineImgModalClose');
    const doneBtn = $('onlineImgModalDoneBtn');
    const copyBtn = $('onlineImgCopyPromptBtn');
    const downloadBtn = $('onlineImgDownloadBtn');

    function closeModal() {
      modal.classList.add('hidden');
      document.body.classList.remove('modal-open');
      activeOnlineImageDesign = null;
    }

    if (closeBtn) closeBtn.onclick = closeModal;
    if (doneBtn) doneBtn.onclick = closeModal;
    modal.onclick = (e) => {
      if (e.target === modal) closeModal();
    };

    if (copyBtn) {
      copyBtn.onclick = () => {
        if (activeOnlineImageDesign) {
          UI.copyToClipboard(activeOnlineImageDesign.prompt, 'Prompt copied for Image Generator!');
        }
      };
    }

    if (downloadBtn) {
      downloadBtn.onclick = () => {
        const img = $('onlineImgPreview');
        if (img && img.src && !img.classList.contains('hidden')) {
          const a = document.createElement('a');
          a.href = img.src;
          a.download = `stock-ai-render-${activeOnlineImageDesign?.id || Date.now()}.jpg`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          Toast.show('Starting image download...', 'success');
        } else {
          Toast.show('Image is still rendering. Please wait a moment...', 'info');
        }
      };
    }
  }

  function openOnlineImageModal(d) {
    const modal = $('onlineImageModal');
    if (!modal) return;
    activeOnlineImageDesign = d;

    $('onlineImgPromptText').textContent = d.prompt;
    $('onlineImgModalTitle').textContent = `🌐 AI Image Generator: ${d.id}`;
    $('onlineImgModalSubtitle').textContent = `${d.category} • ${d.subcategory || d.style} • Cloud AI Render`;

    // Configure Direct Studio Launcher Links
    const encoded = encodeURIComponent(d.prompt);
    const linkBing = $('linkBingDalle');
    if (linkBing) linkBing.href = `https://www.bing.com/images/create?q=${encoded}`;

    const linkMidjourney = $('linkMidjourney');
    if (linkMidjourney) linkMidjourney.href = 'https://discord.com/channels/@me';

    const linkFlux = $('linkFlux');
    if (linkFlux) linkFlux.href = 'https://blackforestlabs.ai/';

    const linkLeonardo = $('linkLeonardo');
    if (linkLeonardo) linkLeonardo.href = 'https://leonardo.ai/';

    // Render Cloud Image with Pollinations.ai Flux Engine
    const loader = $('onlineImgLoading');
    const img = $('onlineImgPreview');
    if (loader) {
      loader.classList.remove('hidden');
      loader.innerHTML = `
        <span class="online-spinner"></span>
        <p>Rendering Online AI Image via Cloud Model...</p>
        <small>Flux.1 / SDXL Cloud Engine (Free Instant Render)</small>
      `;
    }
    if (img) {
      img.classList.add('hidden');
      img.src = '';

      // Clean prompt for cloud renderer (remove midjourney flags like --v 6.1 --ar 16:9 for clean image generation)
      const cleanPromptForRender = d.prompt.replace(/--[a-z0-9\s:.-]+/gi, '').trim();
      const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(cleanPromptForRender)}?width=768&height=768&nologo=true&seed=${Math.floor(Math.random() * 999999)}&model=flux`;

      img.onload = () => {
        if (loader) loader.classList.add('hidden');
        img.classList.remove('hidden');
      };
      img.onerror = () => {
        if (loader) {
          loader.innerHTML = `
            <p style="color:var(--text-secondary)">Cloud image preview render timed out.</p>
            <small style="color:var(--accent-primary)">You can still copy the prompt below and generate in Bing, Midjourney, or Flux!</small>
          `;
        }
      };
      img.src = imageUrl;
    }

    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }

  // Setup Online AI Generator Buttons
  function setupOnlineGeneratorButtons() {
    async function triggerOnlineGeneration() {
      const onlineModel = (window.AiPromptDoctor && AiPromptDoctor.config?.model !== 'builtin')
        ? (AiPromptDoctor.config.model.toUpperCase())
        : 'Google Gemini 2.5 Flash / Cloud Engine';

      const buttons = [
        $('onlineGenerateBtn'),
        $('topOnlineGenBtn'),
        $('mobileOnlineGenerateBtn')
      ].filter(Boolean);

      buttons.forEach(b => {
        b.disabled = true;
        b.classList.add('btn-loading');
      });

      Toast.show(`🌐 Online AI Generator: Generating concepts with ${onlineModel}...`, 'info', 2500);

      try {
        const s = getSettings();
        const generated = DiversityEngine.generate(s);

        if (!generated.length) {
          Toast.show('No prompts generated. Lower similarity threshold or change parameters.', 'warning');
          return;
        }

        // 1. Immediately display generated concepts with zero latency
        current = generated;
        history = [...generated, ...history].slice(0, 1000);
        Store.save(history);
        renderAll();

        Toast.show(`✓ Generated ${generated.length} concepts! AI Doctor polishing prompts...`, 'info', 2000);

        // 2. Enhance concepts with AI Doctor in background (top 3 concepts to preserve 20 RPM quota)
        (async () => {
          for (let i = 0; i < Math.min(generated.length, 3); i++) {
            const d = generated[i];
            try {
              const inCooldown = Date.now() < (AiPromptDoctor.quotaCooldownUntil || 0);
              const res = inCooldown
                ? AiPromptDoctor.offlineCorrect(d.prompt, AiPromptDoctor.config?.profile, d.aiEngine || selectedAiEngine)
                : await AiPromptDoctor.correct(d.prompt, {
                    targetEngine: d.aiEngine || selectedAiEngine,
                    silent: i > 0
                  });
              d.originalPrompt = d.prompt;
              d.prompt = res.correctedPrompt;
              d.aiCorrected = true;
              d.aiDoctorModel = res.modelUsed;
              d.aiImprovements = res.improvements;
              d.metadata = MetadataEngine.build(d, d.category);
            } catch (e) {
              console.warn('Item correction error:', e);
            }
          }
          Store.save(history);
          renderAll();
          Toast.show(`✓ Polished concepts with ${onlineModel}!`, 'success', 3000);
        })();

        Toast.show(`✓ Generated ${generated.length} Online AI Concepts with ${onlineModel}!`, 'success', 3500);

        if (isMobileLayout()) {
          switchMobileTab('results');
        }
      } catch (err) {
        console.error(err);
        Toast.show(`Online generator error: ${err.message}`, 'error');
      } finally {
        buttons.forEach(b => {
          b.disabled = false;
          b.classList.remove('btn-loading');
        });
      }
    }

    if ($('onlineGenerateBtn')) $('onlineGenerateBtn').onclick = triggerOnlineGeneration;
    if ($('topOnlineGenBtn')) $('topOnlineGenBtn').onclick = triggerOnlineGeneration;
    if ($('mobileOnlineGenerateBtn')) $('mobileOnlineGenerateBtn').onclick = triggerOnlineGeneration;
  }

  window.copyPrompt = function(id) {
    const item = current.find(x => x.id === id) || history.find(x => x.id === id);
    if (!item) return;
    UI.copyToClipboard(item.prompt, '✓ Prompt copied to clipboard!');
  };

  window.copyKeywords = function(id) {
    const item = current.find(x => x.id === id) || history.find(x => x.id === id);
    if (!item) return;
    const meta = item.metadata || MetadataEngine.build(item, item.category);
    UI.copyToClipboard(meta.keywords.join(', '), '✓ 49 Keywords copied!');
  };

  // Run Initialization
  init();
})();

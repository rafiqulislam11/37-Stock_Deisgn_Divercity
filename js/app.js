/* ==========================================================================
   Stock Design Diversity Studio Pro - Application Controller
   ========================================================================== */

(() => {
  const $ = id => document.getElementById(id);

  let history = Store.load();
  let current = [];
  let activeModalDesign = null;

  const variations = STOCK_DATA.variation;

  function init() {
    // 1. Populate category datalist
    STOCK_DATA.categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      $('categoryList').appendChild(opt);
    });

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

    // 10. Load initial view
    if (history.length) {
      current = history.slice(0, 12);
    }
    renderAll();
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
    const category = $('category').value.trim() || 'Abstract Background';
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

    return {
      category,
      batch: Math.min(250, Math.max(1, +$('batch').value || 10)),
      threshold: +$('threshold').value,
      variations: variationsSelected,
      locks,
      lockValues,
      base,
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
        const full = `${d.id} ${d.prompt} ${d.style} ${d.color} ${d.category} ${metaStr}`.toLowerCase();
        return full.includes(q);
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
    $('modalSubtitle').textContent = `${design.category} • ${design.style} • ${design.orientation}`;
    $('modalInputTitle').value = meta.title;
    $('modalInputDesc').value = meta.description;
    if ($('modalInputKeywords')) {
      $('modalInputKeywords').value = meta.keywords.join(', ');
    }
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

  ['search', 'filterStyle', 'filterStatus', 'sortBy'].forEach(id => {
    $(id).oninput = renderAll;
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
      if (d.category) $('category').value = d.category;
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
    const text = list.map((d, i) => `[${i + 1}] ${d.id} (${d.category}):\n${d.prompt}`).join('\n\n');
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

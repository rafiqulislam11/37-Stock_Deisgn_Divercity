/* ==========================================================================
   Stock Design Diversity Studio Pro - UI Components & Interactions
   ========================================================================== */

// Global Toast Notification System
window.Toast = {
  show(message, type = 'info', duration = 2600) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
      success: '✓',
      warning: '⚠',
      error: '✕',
      info: 'ℹ'
    };

    toast.innerHTML = `<span style="font-weight:800">${icons[type] || 'ℹ'}</span> <span>${this.esc(message)}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-hide');
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 250);
    }, duration);
  },

  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
  }
};

// Global Confirmation Dialog
window.ConfirmDialog = {
  ask(title, message, onConfirm) {
    const modal = document.getElementById('confirmModal');
    const titleEl = document.getElementById('confirmTitle');
    const msgEl = document.getElementById('confirmMsg');
    const okBtn = document.getElementById('confirmOkBtn');
    const cancelBtn = document.getElementById('confirmCancelBtn');

    if (!modal) {
      if (confirm(`${title}\n\n${message}`)) onConfirm();
      return;
    }

    titleEl.textContent = title;
    msgEl.textContent = message;
    modal.classList.remove('hidden');

    function close() {
      modal.classList.add('hidden');
      okBtn.onclick = null;
      cancelBtn.onclick = null;
    }

    okBtn.onclick = () => {
      close();
      onConfirm();
    };

    cancelBtn.onclick = () => {
      close();
    };

    modal.onclick = (e) => {
      if (e.target === modal) close();
    };
  }
};

window.UI = {
  esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    }[m]));
  },

  // Robust cross-browser clipboard copy with fallback
  copyToClipboard(text, successMsg = 'Copied to clipboard!') {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => Toast.show(successMsg, 'success'))
        .catch(() => this.fallbackCopy(text, successMsg));
    } else {
      this.fallbackCopy(text, successMsg);
    }
  },

  fallbackCopy(text, successMsg) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.top = '-9999px';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand('copy');
      Toast.show(successMsg, 'success');
    } catch (err) {
      Toast.show('Unable to copy. Please select and copy manually.', 'warning');
    }
    document.body.removeChild(ta);
  },

  // Render Single Concept Card
  card(d) {
    const meta = d.metadata || window.MetadataEngine.build(d, d.category);
    d.metadata = meta;

    const topKeywordsPreview = (meta.keywords || []).slice(0, 8).join(', ');

    return `
      <article class="card ${d.favorite ? 'is-fav' : ''} ${d.locked ? 'is-locked' : ''}" data-card-id="${d.id}">
        <div class="card-head">
          <div class="id-badge-wrap">
            <span class="id">${this.esc(d.id)}</span>
            <div class="card-category-tags">
              <span class="card-category-tag">${this.esc(d.category)}</span>
              ${d.subcategory ? `<span class="card-subcategory-tag">${this.esc(d.subcategory)}</span>` : ''}
            </div>
          </div>
          <div class="card-actions">
            <button class="mini ${d.favorite ? 'fav-active' : ''}" data-action="favorite" data-id="${d.id}" title="${d.favorite ? 'Starred Favorite' : 'Star as Favorite'}">
              ★
            </button>
            <button class="mini ${d.locked ? 'active' : ''}" data-action="lock" data-id="${d.id}" title="${d.locked ? 'Locked (Protected)' : 'Lock this design'}">
              🔒
            </button>
            <button class="mini" data-action="seed" data-id="${d.id}" title="Use this DNA as Generator Seed">
              ⚡
            </button>
            <button class="mini danger" data-action="delete" data-id="${d.id}" title="Delete design">
              ✕
            </button>
          </div>
        </div>

        <div class="score-row">
          <span class="score" title="Uniqueness score compared to batch and history">
            ${d.uniqueness || 100}% unique
          </span>
          <span class="risk" title="Similarity to closest matching concept">
            ${d.similarity || 0}% similarity
          </span>
        </div>

        <div class="dna">
          ${d.subcategory ? `<span><b>Sub-Theme:</b> ${this.esc(d.subcategory)}</span>` : ''}
          <span><b>Style:</b> ${this.esc(d.style)}</span>
          <span><b>Comp:</b> ${this.esc(d.composition)}</span>
          <span><b>Shape:</b> ${this.esc(d.shape)}</span>
          <span><b>Color:</b> ${this.esc(d.color)}</span>
          <span><b>Light:</b> ${this.esc(d.lighting)}</span>
          <span><b>Frame:</b> ${this.esc(d.orientation)}</span>
        </div>

        <div class="prompt" title="Full generation prompt">${this.esc(d.prompt)}</div>

        <div class="meta-preview" data-action="metadata" data-id="${d.id}" title="Click to open 49-Keywords Metadata Inspector">
          <div class="meta-preview-header">
            <span class="meta-preview-title">${this.esc(meta.title)}</span>
            <span class="meta-preview-badge">${meta.keywordCount || 49} Tags</span>
          </div>
          <small>${this.esc(topKeywordsPreview)}…</small>
        </div>

        <div class="card-footer">
          <button class="small" data-action="copy" data-id="${d.id}" title="Copy generation prompt">
            📋 Prompt
          </button>
          <button class="small btn-keywords" data-action="metadata" data-id="${d.id}" title="View & copy 49 keywords">
            🏷 49 Tags
          </button>
          <button class="small" data-action="regenerate" data-id="${d.id}" title="Regenerate this single slot">
            🔄 Replace
          </button>
        </div>
      </article>
    `;
  },

  renderResults(arr) {
    const empty = document.getElementById('empty');
    const container = document.getElementById('results');
    if (!container) return;

    if (empty) {
      empty.style.display = arr.length ? 'none' : 'grid';
    }
    container.innerHTML = arr.map(d => this.card(d)).join('');
  },

  renderHistory(arr) {
    const info = document.getElementById('historyInfo');
    const body = document.getElementById('historyBody');
    if (info) info.textContent = `${arr.length} saved records`;
    if (!body) return;

    if (!arr.length) {
      body.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:32px 16px; color:var(--text-muted); font-size:12px;">✦ No history records saved yet. Generated designs will appear here automatically.</td></tr>';
      return;
    }

    body.innerHTML = arr.slice(0, 150).map(d => {
      const meta = d.metadata || window.MetadataEngine.build(d, d.category);
      return `
        <tr>
          <td><b style="color:var(--accent-primary)">${this.esc(d.id)}</b></td>
          <td>${this.esc(d.category)}</td>
          <td><span class="card-subcategory-tag">${this.esc(d.subcategory || d.style || '—')}</span></td>
          <td>${this.esc(d.style)}</td>
          <td>${this.esc(d.composition)}</td>
          <td>${this.esc(d.color)}</td>
          <td><span class="score">${d.uniqueness || 100}%</span></td>
          <td><span class="meta-preview-badge">${meta.keywordCount || 49}/49</span></td>
          <td style="color:${d.favorite ? 'var(--star-gold)' : 'var(--text-muted)'}">${d.favorite ? '★' : '—'}</td>
          <td>
            <div class="table-action-btns">
              <button class="mini-copy-btn" data-action="metadata" data-id="${d.id}" title="View Metadata">Tags</button>
              <button class="mini-copy-btn" data-action="copy" data-id="${d.id}" title="Copy Prompt">Copy</button>
              <button class="mini-copy-btn danger" data-action="delete" data-id="${d.id}" title="Delete">✕</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }
};

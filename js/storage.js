window.Store = {
  key: 'stockDiversityStudioPro_v2',
  settingsKey: 'stockDiversitySettings_v2',

  load() {
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('Storage load failed:', e);
      return [];
    }
  },

  save(data) {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
      document.dispatchEvent(new Event('store:changed'));
    } catch (e) {
      console.error('Storage save failed:', e);
      if (window.Toast) Toast.show('Storage quota exceeded. Some history might not be saved.', 'error');
    }
  },

  clear() {
    try {
      localStorage.removeItem(this.key);
      document.dispatchEvent(new Event('store:changed'));
    } catch (e) {
      console.warn('Storage clear error:', e);
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(this.settingsKey, JSON.stringify(settings));
    } catch (e) {
      console.warn('Settings save error:', e);
    }
  },

  loadSettings() {
    try {
      const s = localStorage.getItem(this.settingsKey);
      return s ? JSON.parse(s) : null;
    } catch (e) {
      return null;
    }
  },

  project(data) {
    return {
      version: 3,
      app: 'Stock Design Diversity Studio Pro',
      timestamp: new Date().toISOString(),
      count: data.length,
      designs: data
    };
  },

  downloadJSON(obj, name = 'stock-diversity-project.json') {
    try {
      const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      if (window.Toast) Toast.show(`Downloaded project JSON: ${name}`, 'success');
    } catch (e) {
      console.error('Download JSON failed:', e);
      if (window.Toast) Toast.show('Failed to download project JSON.', 'error');
    }
  }
};

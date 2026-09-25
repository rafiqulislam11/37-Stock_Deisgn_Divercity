window.CSV = {
  esc(val) {
    if (val === null || val === undefined) return '""';
    return '"' + String(val).replace(/"/g, '""') + '"';
  },

  createCsvString(rows, explicitColumns) {
    if (!rows || !rows.length) return '';
    const cols = explicitColumns || [...new Set(rows.flatMap(x => Object.keys(x)))];
    const headerLine = cols.map(c => this.esc(c)).join(',');
    const dataLines = rows.map(r => {
      return cols.map(c => {
        const v = r[c];
        if (Array.isArray(v)) {
          return this.esc(v.join(', '));
        }
        return this.esc(v);
      }).join(',');
    });
    // Add UTF-8 BOM (\uFEFF) so Excel on Windows properly handles encoding
    return '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
  },

  download(rows, filename = 'stock-designs.csv', explicitColumns = null) {
    if (!rows || !rows.length) {
      if (window.Toast) Toast.show('No items available to export.', 'warning');
      return false;
    }
    const csvContent = this.createCsvString(rows, explicitColumns);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    if (window.Toast) Toast.show(`Exported ${rows.length} records to ${filename}`, 'success');
    return true;
  },

  // Adobe Stock contributor CSV format
  downloadAdobeStock(items, baseFilename = 'adobe-stock-metadata.csv') {
    const rows = items.map((d, index) => {
      const meta = d.metadata || window.MetadataEngine.build(d, d.category);
      return {
        'Filename': `${d.id}.jpg`,
        'Title': meta.title,
        'Keywords': meta.keywords.join(', '),
        'Category': meta.adobeCategory || 'Graphic Resources'
      };
    });
    return this.download(rows, baseFilename, ['Filename', 'Title', 'Keywords', 'Category']);
  },

  // Shutterstock contributor CSV format
  downloadShutterstock(items, baseFilename = 'shutterstock-metadata.csv') {
    const rows = items.map(d => {
      const meta = d.metadata || window.MetadataEngine.build(d, d.category);
      return {
        'Filename': `${d.id}.jpg`,
        'Description': meta.description,
        'Keywords': meta.keywords.join(', '),
        'Categories': `${meta.shutterstockCategory || 'Abstract'}, ${meta.secondaryCategory || 'Backgrounds/Textures'}`,
        'Editorial': 'no',
        'Mature Content': 'no',
        'Illustration': 'yes'
      };
    });
    return this.download(rows, baseFilename, ['Filename', 'Description', 'Keywords', 'Categories', 'Editorial', 'Mature Content', 'Illustration']);
  },

  // Full detailed CSV
  downloadFull(items, baseFilename = 'stock-studio-full-dataset.csv') {
    const rows = items.map(d => {
      const meta = d.metadata || window.MetadataEngine.build(d, d.category);
      return {
        'ID': d.id,
        'Category': d.category,
        'Style': d.style,
        'Composition': d.composition,
        'Shape': d.shape,
        'Color': d.color,
        'Background': d.background,
        'Lighting': d.lighting,
        'Texture': d.texture,
        'Density': d.density,
        'Position': d.position,
        'Orientation': d.orientation,
        'Marketplace': d.marketplace,
        'Uniqueness': `${d.uniqueness}%`,
        'Similarity': `${d.similarity}%`,
        'Title': meta.title,
        'Description': meta.description,
        'Keywords (49)': meta.keywords.join(', '),
        'Top 5 Priority Keywords': meta.top5.join(', '),
        'Prompt': d.prompt
      };
    });
    return this.download(rows, baseFilename);
  }
};

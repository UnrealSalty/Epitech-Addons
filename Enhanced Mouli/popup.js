document.addEventListener('DOMContentLoaded', function() {
    const autoExpandCheckbox = document.getElementById('auto-expand');
    const highContrastCheckbox = document.getElementById('high-contrast');
    browser.storage.local.get(['autoExpand', 'highContrast']).then((result) => {
      autoExpandCheckbox.checked = result.autoExpand || false;
      highContrastCheckbox.checked = result.highContrast || false;
    });
    autoExpandCheckbox.addEventListener('change', function() {
      browser.storage.local.set({ autoExpand: this.checked });
    });
    
    highContrastCheckbox.addEventListener('change', function() {
      browser.storage.local.set({ highContrast: this.checked });
    });
  });
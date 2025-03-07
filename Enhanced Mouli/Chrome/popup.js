document.addEventListener('DOMContentLoaded', function() {
  const autoExpandCheckbox = document.getElementById('auto-expand');
  const highContrastCheckbox = document.getElementById('high-contrast');

  chrome.storage.local.get(['autoExpand', 'highContrast'], (result) => {
    autoExpandCheckbox.checked = result.autoExpand || false;
    highContrastCheckbox.checked = result.highContrast || false;
  });
  
  autoExpandCheckbox.addEventListener('change', function() {
    chrome.storage.local.set({ autoExpand: this.checked });
  });
  
  highContrastCheckbox.addEventListener('change', function() {
    chrome.storage.local.set({ highContrast: this.checked });
  });
});
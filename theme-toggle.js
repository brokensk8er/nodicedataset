// theme-toggle.js
// Shared theme toggle — include via <script src="theme-toggle.js"></script>
// Requires: a button with class "theme-toggle-btn" in the DOM.
// The <head> FOUC-prevention script must remain inline in each HTML file.

(function () {
  var ICONS = { dark: '🌙', light: '☀️', nodice: '🛑' };

  function getTheme() {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }

  function syncIcon() {
    var btn = document.querySelector('.theme-toggle-btn');
    if (btn) btn.textContent = ICONS[getTheme()] || '☀️';
  }

  window.toggleTheme = function () {
    var cur = getTheme();
    var next = cur === 'dark' ? 'light' : cur === 'light' ? 'nodice' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('vaultTheme', next); } catch (e) {}
    syncIcon();
  };

  // Sync icon on load to match whatever data-theme the head script set
  syncIcon();
})();

/* Chogan: the saved colour theme and light/dark choice, applied from <head> (#875).
   chogan.js loads at the end of <body>, so a page painted the default cream first and
   switched palettes a moment later: a flash on every page for anyone who picked another
   colour theme. This tiny file runs before the first paint. chogan.js applies the same
   settings again at boot and owns every later change; the id list below must match
   COLOR_THEMES there and the [data-colors] blocks in chogan.css (a test checks all three). */
(function (global) {
  'use strict';
  var MENU_PATTERNS = ['dots', 'none', 'stripes', 'lattice', 'grid', 'waves', 'rings'];
  var COLOR_THEMES = ['default', 'paper', 'slate', 'forest', 'rose', 'contrast'];
  try {
    var raw = global.localStorage.getItem('chogan.app.settings');
    var s = raw ? JSON.parse(raw) : {};
    if (!s || typeof s !== 'object') s = {};
    s.lang = 'fa';
    global.localStorage.setItem('chogan.app.settings', JSON.stringify(s));
    var root = global.document.documentElement;
    root.setAttribute('lang', 'fa');
    root.setAttribute('dir', 'rtl');
    if (s.theme === 'light' || s.theme === 'dark') root.setAttribute('data-theme', s.theme);
    if (s.colors !== 'default' && COLOR_THEMES.indexOf(s.colors) > 0) root.setAttribute('data-colors', s.colors);
    if (MENU_PATTERNS.indexOf(s.pattern) > 0) root.setAttribute('data-pattern', s.pattern);
  } catch (e) { /* no storage */ }
})(this);

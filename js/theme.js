/* ═══════════════════════════════════════════════════════════════
   MiniDevTools — Theme Manager
   Manejo de modo claro/oscuro con persistencia en localStorage.
   ═══════════════════════════════════════════════════════════════ */

const ThemeManager = (() => {
  const STORAGE_KEY = 'minidevtools-theme';

  function init() {
    // 1. Intentar leer del localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      apply(saved);
    } else {
      // 2. Respetar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      apply(prefersDark ? 'dark' : 'light');
    }

    // Escuchar cambios del sistema (solo si no hay preferencia guardada)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        apply(e.matches ? 'dark' : 'light');
      }
    });

    // Toggle button
    const toggleBtn = document.getElementById('theme-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', toggle);
    }
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function get() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  function toggle() {
    const next = get() === 'dark' ? 'light' : 'dark';
    apply(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  function set(theme) {
    apply(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  return { init, get, toggle, set };
})();

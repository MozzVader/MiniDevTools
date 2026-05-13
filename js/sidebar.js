/* ═══════════════════════════════════════════════════════════════
   MiniDevTools — Sidebar Renderer
   Genera la navegación del sidebar a partir del TOOL_REGISTRY.
   ═══════════════════════════════════════════════════════════════ */

const Sidebar = (() => {
  const nav = document.getElementById('sidebar-nav');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const mobileBtn = document.getElementById('mobile-menu-btn');

  let currentHash = '/home';

  function init() {
    render();
    setupMobile();
  }

  function render() {
    const categories = getToolsByCategory();

    let html = '';

    // Home link
    html += `
      <a href="#/home" class="nav-item ${currentHash === '/home' ? 'active' : ''}" data-route="/home">
        <span class="nav-item__icon">🏠</span>
        <span class="nav-item__label">Inicio</span>
      </a>
    `;

    // Tools grouped by category
    categories.forEach(cat => {
      html += `
        <div class="nav-category">${cat.label}</div>
      `;

      cat.tools.forEach(tool => {
        const isActive = currentHash === `/${tool.id}` ? 'active' : '';
        html += `
          <a href="#/${tool.id}" class="nav-item ${isActive}" data-route="/${tool.id}" title="${tool.description}">
            <span class="nav-item__icon">${tool.icon}</span>
            <span class="nav-item__label">${tool.name}</span>
          </a>
        `;
      });
    });

    nav.innerHTML = html;

    // Click handlers
    nav.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        // Los links <a> con href ya manejan el hash, pero cerramos sidebar en mobile
        closeMobile();
      });
    });
  }

  function setActive(hash) {
    currentHash = hash;
    render();
  }

  /* ─── Mobile ─── */
  function setupMobile() {
    if (mobileBtn) {
      mobileBtn.addEventListener('click', toggleMobile);
    }
    if (backdrop) {
      backdrop.addEventListener('click', closeMobile);
    }
  }

  function toggleMobile() {
    sidebar.classList.toggle('open');
    mobileBtn.classList.toggle('active');
    document.body.style.overflow = sidebar.classList.contains('open') ? 'hidden' : '';
  }

  function closeMobile() {
    sidebar.classList.remove('open');
    if (mobileBtn) mobileBtn.classList.remove('active');
    document.body.style.overflow = '';
  }

  return { init, render, setActive, closeMobile };
})();

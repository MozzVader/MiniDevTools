/* ═══════════════════════════════════════════════════════════════
   MiniDevTools — Sidebar Renderer
   Genera la navegación del sidebar a partir del TOOL_REGISTRY.
   Incluye buscador/filtro en tiempo real.
   ═══════════════════════════════════════════════════════════════ */

const Sidebar = (() => {
  const nav = document.getElementById('sidebar-nav');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const mobileBtn = document.getElementById('mobile-menu-btn');
  const searchInput = document.getElementById('sidebar-search');

  let currentHash = '/home';

  function init() {
    render();
    setupSearch();
    setupMobile();
  }

  function render() {
    const categories = getToolsByCategory();

    let html = '';

    // Home link (siempre visible, no se filtra)
    html += `
      <a href="#/home" class="nav-item nav-item--home ${currentHash === '/home' ? 'active' : ''}" data-route="/home">
        <span class="nav-item__icon"><i class="fa-solid fa-house"></i></span>
        <span class="nav-item__label">Inicio</span>
      </a>
    `;

    // Tools grouped by category
    categories.forEach(cat => {
      html += `
        <div class="nav-category" data-category="${cat.id}">${cat.label}</div>
      `;

      cat.tools.forEach(tool => {
        const isActive = currentHash === `/${tool.id}` ? 'active' : '';
        html += `
          <a href="#/${tool.id}" class="nav-item" data-route="/${tool.id}" data-tool-name="${tool.name.toLowerCase()}" data-tool-desc="${tool.description.toLowerCase()}" data-tool-cat="${cat.label.toLowerCase()}" title="${tool.description}">
            <span class="nav-item__icon"><i class="${tool.icon}"></i></span>
            <span class="nav-item__label">${tool.name}</span>
          </a>
        `;
      });
    });

    nav.innerHTML = html;

    // Click handlers
    nav.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        closeMobile();
      });
    });

    // Re-apply search filter if there's an active query
    if (searchInput && searchInput.value) {
      applyFilter(searchInput.value);
    }
  }

  function setActive(hash) {
    currentHash = hash;
    render();
  }

  /* ─── Search / Filter ─── */
  function setupSearch() {
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      applyFilter(e.target.value);
    });

    // Clear filter on Escape
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        applyFilter('');
        searchInput.blur();
      }
    });

    // Clear button
    const clearBtn = document.getElementById('sidebar-search-clear');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        applyFilter('');
        searchInput.focus();
      });
    }
  }

  function applyFilter(query) {
    const term = query.trim().toLowerCase();

    if (!term) {
      // Show everything
      nav.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('hidden-by-search');
      });
      nav.querySelectorAll('.nav-category').forEach(cat => {
        cat.classList.remove('hidden-by-search');
      });
      return;
    }

    // Hide/show tool items
    nav.querySelectorAll('.nav-item[data-tool-name]').forEach(item => {
      const name = item.getAttribute('data-tool-name');
      const desc = item.getAttribute('data-tool-desc');
      const cat = item.getAttribute('data-tool-cat');
      const matches = name.includes(term) || desc.includes(term) || cat.includes(term);
      item.classList.toggle('hidden-by-search', !matches);
    });

    // Hide category labels that have no visible tools under them
    nav.querySelectorAll('.nav-category').forEach(catLabel => {
      // Find next siblings until the next category or end
      let next = catLabel.nextElementSibling;
      let hasVisible = false;

      while (next && !next.classList.contains('nav-category')) {
        if (next.classList.contains('nav-item') && !next.classList.contains('hidden-by-search')) {
          hasVisible = true;
          break;
        }
        next = next.nextElementSibling;
      }

      catLabel.classList.toggle('hidden-by-search', !hasVisible);
    });
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

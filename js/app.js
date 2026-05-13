/* ═══════════════════════════════════════════════════════════════
   MiniDevTools — App (Router + Init)
   Router ultra simple con hash routing y lazy loading de herramientas.
   ═══════════════════════════════════════════════════════════════ */

const App = (() => {
  const container = document.getElementById('main-content');
  const loadingState = document.getElementById('loading-state');

  // Cache de herramientas cargadas (modules)
  const loadedModules = new Map();

  // Cache de CSS ya inyectados
  const loadedCSS = new Set();

  // Track herramienta activa para cleanup
  let currentToolId = null;

  function init() {
    ThemeManager.init();
    Sidebar.init();
    window.addEventListener('hashchange', route);
    window.addEventListener('DOMContentLoaded', route);
    // Route on first load
    route();
  }

  function route() {
    const hash = window.location.hash.slice(1) || '/home';
    Sidebar.setActive(hash);

    if (hash === '/home') {
      currentToolId = null;
      renderHome();
      return;
    }

    const toolId = hash.replace('/', '');
    const tool = getToolById(toolId);

    if (!tool) {
      render404();
      return;
    }

    loadTool(tool);
  }

  /* ─── HOME PAGE ─── */
  function renderHome() {
    const categories = getToolsByCategory();
    let toolsCardsHtml = '';

    categories.forEach(cat => {
      cat.tools.forEach(tool => {
        toolsCardsHtml += `
          <a href="#/${tool.id}" class="hero__tool-card">
            <span class="hero__tool-card__icon">${tool.icon}</span>
            <div>
              <span class="hero__tool-card__name">${tool.name}</span>
              <span class="hero__tool-card__cat">${cat.label}</span>
            </div>
          </a>
        `;
      });
    });

    container.innerHTML = `
      <div class="hero">
        <div class="hero__icon">🛠️</div>
        <h1 class="hero__title">MiniDevTools</h1>
        <p class="hero__subtitle">
          Tu compendio de mini-herramientas para el día a día.
          Todo funciona offline, sin dependencias externas.
        </p>
        <div class="hero__tools-grid">
          ${toolsCardsHtml}
        </div>
        <p class="hero__footer-text">${TOOL_REGISTRY.length} herramientas disponibles</p>
      </div>
    `;
  }

  /* ─── 404 PAGE ─── */
  function render404() {
    container.innerHTML = `
      <div class="tool-card" style="text-align:center; padding:60px 32px;">
        <div style="font-size:48px; margin-bottom:16px;">🔍</div>
        <h2 style="font-size:24px; font-weight:600; margin-bottom:8px;">Herramienta no encontrada</h2>
        <p style="color:var(--text-secondary); margin-bottom:24px;">La ruta que buscas no existe.</p>
        <a href="#/home" class="btn btn--primary">Volver al inicio</a>
      </div>
    `;
  }

  /* ─── LAZY LOADING DE HERRAMIENTAS ─── */
  async function loadTool(tool) {
    // Si es la misma herramienta, no recargar
    if (currentToolId === tool.id) return;

    // Cleanup de la herramienta anterior
    cleanupCurrentTool();

    currentToolId = tool.id;

    // Mostrar loading
    container.innerHTML = '';
    loadingState.classList.add('visible');

    try {
      // 1. Cargar CSS si tiene
      if (tool.cssFile && !loadedCSS.has(tool.cssFile)) {
        await loadCSS(tool.cssFile);
        loadedCSS.add(tool.cssFile);
      }

      // 2. Cargar JS module con lazy loading
      let module;
      if (loadedModules.has(tool.id)) {
        module = loadedModules.get(tool.id);
      } else {
        module = await loadModule(tool.jsFile, tool.id);
        loadedModules.set(tool.id, module);
      }

      // 3. Ocultar loading
      loadingState.classList.remove('visible');

      // 4. Renderizar
      if (module && typeof module.render === 'function') {
        module.render(container, tool);
      } else if (typeof module === 'function') {
        module(container, tool);
      }

    } catch (error) {
      console.error(`Error loading tool "${tool.id}":`, error);
      loadingState.classList.remove('visible');

      container.innerHTML = `
        <div class="tool-card" style="text-align:center; padding:48px 32px;">
          <div style="font-size:40px; margin-bottom:16px;">⚠️</div>
          <h2 style="font-size:20px; font-weight:600; margin-bottom:8px;">Error al cargar</h2>
          <p style="color:var(--text-secondary); margin-bottom:6px; font-size:14px;">
            No se pudo cargar "${tool.name}".
          </p>
          <p style="color:var(--text-muted); font-size:13px; margin-bottom:24px;">
            ${error.message || 'Error desconocido'}
          </p>
          <a href="#/home" class="btn btn--primary">Volver al inicio</a>
        </div>
      `;
    }
  }

  /* ─── Cargar CSS dinámicamente ─── */
  function loadCSS(href) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = () => reject(new Error(`CSS no encontrado: ${href}`));
      document.head.appendChild(link);
    });
  }

  /* ─── Cargar JS module dinámicamente ─── */
  function loadModule(src, toolId) {
    return new Promise((resolve, reject) => {
      // Agregar timestamp para evitar cache durante desarrollo
      const separator = src.includes('?') ? '&' : '?';
      const url = `${src}${separator}v=${Date.now()}`;

      // Intentar como ES module
      const script = document.createElement('script');
      script.type = 'module';

      // Usamos import() dinamico
      import(url)
        .then(module => {
          // El module debe exportar una funcion `render`
          if (module.render) {
            resolve(module);
          } else if (module.default && module.default.render) {
            resolve(module.default);
          } else if (typeof module.default === 'function') {
            resolve({ render: module.default });
          } else {
            reject(new Error(`El módulo "${toolId}" no exporta una función render.`));
          }
        })
        .catch(err => {
          // Fallback: intentar cargar como script clásico
          loadClassicScript(src, toolId)
            .then(resolve)
            .catch(reject);
        });
    });
  }

  /* ─── Fallback: carga clásica de script ─── */
  function loadClassicScript(src, toolId) {
    return new Promise((resolve, reject) => {
      // Si ya existe la función global, usarla
      if (typeof window[`render_${toolId}`] === 'function') {
        resolve({ render: window[`render_${toolId}`] });
        return;
      }

      const script = document.createElement('script');
      script.src = src;
      script.onload = () => {
        // Buscar la función render registrada globalmente
        if (typeof window[`render_${toolId}`] === 'function') {
          resolve({ render: window[`render_${toolId}`] });
        } else {
          reject(new Error(`No se encontró render_${toolId} después de cargar el script.`));
        }
      };
      script.onerror = () => reject(new Error(`Script no encontrado: ${src}`));
      document.body.appendChild(script);
    });
  }

  /* ─── Cleanup: permitir a la herramienta limpiar su estado ─── */
  function cleanupCurrentTool() {
    if (currentToolId) {
      // Disparar evento de cleanup si la herramienta lo escucha
      const event = new CustomEvent('tool-cleanup', { detail: { toolId: currentToolId } });
      document.dispatchEvent(event);
    }
  }

  return { init, route };
})();

/* ─── Arrancar la app ─── */
document.addEventListener('DOMContentLoaded', () => App.init());

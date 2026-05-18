/* ═══════════════════════════════════════════════════════════════
   HTML Live Preview — Editor HTML con preview en tiempo real
   Features:
   - Textarea con syntax highlighting básico
   - iframe preview en tiempo real (debounced)
   - Viewport presets: Desktop, Tablet, Mobile
   - Modo de entrada: HTML puro / HTML completo (con <html>)
   - Botón de fullscreen para el preview
   - Sample HTML, clear, copy
   - Persistence with ToolStorage
   ═══════════════════════════════════════════════════════════════ */

window['render_html-preview'] = function(container, toolMeta) {

  /* ─── State ─── */
  const saved = ToolStorage.load('html-preview');
  const s = saved ? saved.state : null;
  const state = {
    input: s ? s.input : '',
    viewport: s ? (s.viewport || 'desktop') : 'desktop',
    autoRefresh: s ? (s.autoRefresh !== false) : true,
    layout: s ? (s.layout || 'split') : 'split',  // 'split' | 'code' | 'preview'
    boilerplate: s ? (s.boilerplate !== false) : true,
  };

  /* ═══════════════════════════════════════════════════════
     VIEWPORT SIZES
     ═══════════════════════════════════════════════════════ */
  const viewports = {
    desktop:  { width: '100%', label: 'Desktop', icon: 'fa-solid fa-desktop' },
    laptop:   { width: '1024px', label: 'Laptop', icon: 'fa-solid fa-laptop' },
    tablet:   { width: '768px', label: 'Tablet', icon: 'fa-solid fa-tablet-screen-button' },
    mobile:   { width: '375px', label: 'Mobile', icon: 'fa-solid fa-mobile-screen-button' },
  };

  /* ═══════════════════════════════════════════════════════
     RENDER UI
     ═══════════════════════════════════════════════════════ */

  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title"><i class="${toolMeta.icon}" style="margin-right:8px;"></i>${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <div class="hp-layout hp-layout--${state.layout}">

          <!-- ═══ Editor Panel ═══ -->
          <div class="hp-editor" id="hp-editor">
            <div class="hp-editor-toolbar">
              <span class="hp-panel-label"><i class="fa-solid fa-code"></i> HTML</span>
              <div style="display:flex; gap:6px;">
                <button class="btn btn--ghost btn--sm" id="hp-sample" title="Cargar ejemplo">Ejemplo</button>
                <button class="btn btn--ghost btn--sm" id="hp-clear" title="Limpiar">Limpiar</button>
                <button class="btn btn--ghost btn--sm" id="hp-copy" title="Copiar HTML"><i class="fa-regular fa-copy"></i></button>
              </div>
            </div>
            <textarea class="hp-textarea input" id="hp-input" spellcheck="false"
              placeholder="Escribí o pegá HTML acá...">${escapeHtml(state.input)}</textarea>
            <div class="hp-editor-footer">
              <label class="hp-checkbox">
                <input type="checkbox" id="hp-boilerplate" ${state.boilerplate ? 'checked' : ''}>
                Envolver con &lt;html&gt;
              </label>
              <label class="hp-checkbox">
                <input type="checkbox" id="hp-auto-refresh" ${state.autoRefresh ? 'checked' : ''}>
                Auto-refresh
              </label>
              <button class="btn btn--primary btn--sm" id="hp-run" ${state.autoRefresh ? 'style="display:none"' : ''}>
                <i class="fa-solid fa-play"></i> Run
              </button>
            </div>
          </div>

          <!-- ═══ Preview Panel ═══ -->
          <div class="hp-preview" id="hp-preview">
            <div class="hp-preview-toolbar">
              <span class="hp-panel-label"><i class="fa-solid fa-eye"></i> Preview</span>
              <div class="hp-viewport-btns">
                ${Object.entries(viewports).map(([key, vp]) => `
                  <button class="hp-vp-btn ${state.viewport === key ? 'hp-vp-btn--active' : ''}"
                    data-vp="${key}" title="${vp.label}">
                    <i class="${vp.icon}"></i>
                  </button>
                `).join('')}
              </div>
              <button class="btn btn--ghost btn--sm" id="hp-fullscreen" title="Fullscreen preview">
                <i class="fa-solid fa-expand"></i>
              </button>
            </div>
            <div class="hp-iframe-wrap" id="hp-iframe-wrap">
              <iframe class="hp-iframe" id="hp-iframe" sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"></iframe>
            </div>
          </div>

        </div>

        <!-- ═══ Layout toggle (always visible) ═══ -->
        <div class="hp-layout-bar">
          <div class="hp-layout-btns">
            <button class="hp-layout-btn ${state.layout === 'split' ? 'hp-layout-btn--active' : ''}" data-layout="split" title="Split view">
              <i class="fa-solid fa-columns"></i> Split
            </button>
            <button class="hp-layout-btn ${state.layout === 'code' ? 'hp-layout-btn--active' : ''}" data-layout="code" title="Solo código">
              <i class="fa-solid fa-code"></i> Código
            </button>
            <button class="hp-layout-btn ${state.layout === 'preview' ? 'hp-layout-btn--active' : ''}" data-layout="preview" title="Solo preview">
              <i class="fa-solid fa-eye"></i> Preview
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ═══ Fullscreen overlay ═══ -->
    <div class="hp-fullscreen-overlay" id="hp-fullscreen-overlay" style="display:none;">
      <div class="hp-fullscreen-toolbar">
        <span>Preview — Fullscreen</span>
        <button class="btn btn--ghost btn--sm" id="hp-exit-fullscreen">
          <i class="fa-solid fa-compress"></i> Cerrar
        </button>
      </div>
      <iframe class="hp-fullscreen-iframe" id="hp-fullscreen-iframe" sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"></iframe>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const inputArea = document.getElementById('hp-input');
  const iframe = document.getElementById('hp-iframe');
  const iframeWrap = document.getElementById('hp-iframe-wrap');
  const editorPanel = document.getElementById('hp-editor');
  const previewPanel = document.getElementById('hp-preview');
  const autoRefreshCb = document.getElementById('hp-auto-refresh');
  const boilerplateCb = document.getElementById('hp-boilerplate');
  const runBtn = document.getElementById('hp-run');
  const sampleBtn = document.getElementById('hp-sample');
  const clearBtn = document.getElementById('hp-clear');
  const copyBtn = document.getElementById('hp-copy');
  const fullscreenBtn = document.getElementById('hp-fullscreen');
  const exitFullscreenBtn = document.getElementById('hp-exit-fullscreen');
  const fullscreenOverlay = document.getElementById('hp-fullscreen-overlay');
  const fullscreenIframe = document.getElementById('hp-fullscreen-iframe');
  const layoutEl = container.querySelector('.hp-layout');

  /* ═══════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════ */

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ═══════════════════════════════════════════════════════
     PREVIEW ENGINE
     ═══════════════════════════════════════════════════════ */

  function updatePreview() {
    const raw = inputArea.value;

    let html = raw;
    if (state.boilerplate) {
      /* Check if user already provided a full document */
      if (!/<html[\s>]/i.test(raw)) {
        html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
  </style>
</head>
<body>
${raw}
</body>
</html>`;
      }
    }

    /* Update main iframe */
    writeIframe(iframe, html);

    /* Update fullscreen iframe if visible */
    if (fullscreenOverlay.style.display !== 'none') {
      writeIframe(fullscreenIframe, html);
    }
  }

  function writeIframe(targetIframe, html) {
    try {
      const doc = targetIframe.contentDocument || targetIframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();
    } catch (e) {
      /* Sandbox may block, use srcdoc as fallback */
      targetIframe.srcdoc = html;
    }
  }

  /* ═══════════════════════════════════════════════════════
     VIEWPORT
     ═══════════════════════════════════════════════════════ */

  function setViewport(key) {
    state.viewport = key;
    const vp = viewports[key];

    if (key === 'desktop') {
      iframeWrap.style.maxWidth = '100%';
      iframeWrap.style.width = '100%';
      iframeWrap.style.margin = '0';
    } else {
      iframeWrap.style.width = vp.width;
      iframeWrap.style.maxWidth = '100%';
      iframeWrap.style.margin = '0 auto';
    }

    /* Update active button */
    container.querySelectorAll('.hp-vp-btn').forEach(btn => {
      btn.classList.toggle('hp-vp-btn--active', btn.dataset.vp === key);
    });

    saveState();
  }

  /* ═══════════════════════════════════════════════════════
     LAYOUT
     ═══════════════════════════════════════════════════════ */

  function setLayout(layout) {
    state.layout = layout;
    layoutEl.className = 'hp-layout hp-layout--' + layout;

    container.querySelectorAll('.hp-layout-btn').forEach(btn => {
      btn.classList.toggle('hp-layout-btn--active', btn.dataset.layout === layout);
    });

    saveState();
  }

  /* ═══════════════════════════════════════════════════════
     FULLSCREEN
     ═══════════════════════════════════════════════════════ */

  function openFullscreen() {
    fullscreenOverlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    updatePreview(); /* Refresh fullscreen iframe */
  }

  function closeFullscreen() {
    fullscreenOverlay.style.display = 'none';
    document.body.style.overflow = '';
  }

  /* ═══════════════════════════════════════════════════════
     SAMPLE DATA
     ═══════════════════════════════════════════════════════ */

  function loadSample() {
    inputArea.value = `<div style="padding: 40px; font-family: -apple-system, sans-serif;">
  <div style="max-width: 500px; margin: 0 auto;">
    <h1 style="color: #6366f1; margin-bottom: 8px;">MiniDevTools</h1>
    <p style="color: #64748b; margin-bottom: 24px;">HTML Live Preview</p>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px;">
      <h2 style="font-size: 18px; margin-bottom: 12px;">Tarjeta de ejemplo</h2>
      <p style="color: #475569; line-height: 1.6; margin-bottom: 16px;">
        Este es un ejemplo de HTML renderizado en tiempo real.
        Probá editar el código y ver los cambios al instante.
      </p>
      <div style="display: flex; gap: 8px;">
        <button style="background: #6366f1; color: white; border: none; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;">
          Primario
        </button>
        <button style="background: white; color: #6366f1; border: 1px solid #6366f1; padding: 8px 20px; border-radius: 6px; cursor: pointer; font-size: 14px;">
          Secundario
        </button>
      </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;">
      <div style="background: #ede9fe; padding: 16px; border-radius: 8px; text-align: center;">
        <div style="font-size: 24px; font-weight: 700; color: #6366f1;">26</div>
        <div style="font-size: 12px; color: #64748b;">Herramientas</div>
      </div>
      <div style="background: #dcfce7; padding: 16px; border-radius: 8px; text-align: center;">
        <div style="font-size: 24px; font-weight: 700; color: #16a34a;">4</div>
        <div style="font-size: 12px; color: #64748b;">Categorías</div>
      </div>
      <div style="background: #fef3c7; padding: 16px; border-radius: 8px; text-align: center;">
        <div style="font-size: 24px; font-weight: 700; color: #d97706;">0</div>
        <div style="font-size: 12px; color: #64748b;">Dependencias</div>
      </div>
    </div>

    <ul style="color: #475569; line-height: 2; padding-left: 20px;">
      <li>Edición en tiempo real</li>
      <li>Múltiples viewports</li>
      <li>Modo fullscreen</li>
      <li>Sin dependencias externas</li>
    </ul>
  </div>
</div>`;
    updatePreview();
    saveState();
  }

  /* ═══════════════════════════════════════════════════════
     PERSISTENCE
     ═══════════════════════════════════════════════════════ */

  function saveState() {
    state.input = inputArea.value;
    ToolStorage.setField('html-preview', 'state', { ...state });
  }

  /* ═══════════════════════════════════════════════════════
     EVENTS
     ═══════════════════════════════════════════════════════ */

  /* Auto-refresh with debounce */
  let refreshTimer;
  inputArea.addEventListener('input', () => {
    if (!state.autoRefresh) return;
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      updatePreview();
      saveState();
    }, 300);
  });

  /* Manual run */
  runBtn.addEventListener('click', () => {
    updatePreview();
    saveState();
  });

  /* Also save on blur for non-auto mode */
  inputArea.addEventListener('blur', () => {
    saveState();
  });

  /* Viewport buttons */
  container.querySelectorAll('.hp-vp-btn').forEach(btn => {
    btn.addEventListener('click', () => setViewport(btn.dataset.vp));
  });

  /* Layout buttons */
  container.querySelectorAll('.hp-layout-btn').forEach(btn => {
    btn.addEventListener('click', () => setLayout(btn.dataset.layout));
  });

  /* Auto-refresh toggle */
  autoRefreshCb.addEventListener('change', () => {
    state.autoRefresh = autoRefreshCb.checked;
    runBtn.style.display = state.autoRefresh ? 'none' : '';
    saveState();
    if (state.autoRefresh) updatePreview();
  });

  /* Boilerplate toggle */
  boilerplateCb.addEventListener('change', () => {
    state.boilerplate = boilerplateCb.checked;
    saveState();
    updatePreview();
  });

  /* Sample */
  sampleBtn.addEventListener('click', loadSample);

  /* Clear */
  clearBtn.addEventListener('click', () => {
    inputArea.value = '';
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write('');
    doc.close();
    saveState();
  });

  /* Copy */
  copyBtn.addEventListener('click', () => {
    MiniDevTools.copyToClipboard(inputArea.value, 'HTML copiado al portapapeles');
  });

  /* Fullscreen */
  fullscreenBtn.addEventListener('click', openFullscreen);
  exitFullscreenBtn.addEventListener('click', closeFullscreen);

  /* Close fullscreen on Escape */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && fullscreenOverlay.style.display !== 'none') {
      closeFullscreen();
    }
  });

  /* ═══════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════ */

  /* Set initial viewport */
  setViewport(state.viewport);

  /* Render saved content */
  if (state.input) {
    updatePreview();
  }
};

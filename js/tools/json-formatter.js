/* ═══════════════════════════════════════════════════════════════
   JSON Formatter & Viewer
   Features:
   - Paste raw JSON → format / minify / validate
   - Two views: Formatted Code + Tree View (collapsible)
   - Type badges: string, number, boolean, null, array, object
   - Click to copy JSON path
   - Search/filter within JSON
   - Stats: type, properties/elements, depth, byte size
   - Sample data, clear, copy
   - Persistence with ToolStorage
   ═══════════════════════════════════════════════════════════════ */

window['render_json-formatter'] = function(container, toolMeta) {

  /* ─── State ─── */
  const saved = ToolStorage.load('json-formatter');
  const s = saved ? saved.state : null;
  const state = {
    input: s ? s.input : '',
    viewMode: s ? s.viewMode : 'tree',   // 'tree' | 'code'
    indent: s ? s.indent : 2,
    expandedPaths: s ? (s.expandedPaths || {}) : {},
  };

  let parsedData = null;
  let lastFormatted = '';
  let lastMinified = '';

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

        <div class="jf-layout">

          <!-- ═══ Input Area ═══ -->
          <div class="jf-input-section">
            <div class="jf-input-header">
              <label class="label">JSON de entrada</label>
              <div style="display:flex; gap:6px;">
                <button class="btn btn--ghost btn--sm" id="jf-sample">Ejemplo</button>
                <button class="btn btn--ghost btn--sm" id="jf-clear">Limpiar</button>
              </div>
            </div>
            <textarea class="input jf-textarea" id="jf-input" rows="10"
              placeholder='Pegá tu JSON acá...'
              spellcheck="false">${escapeHtml(state.input)}</textarea>

            <!-- ═══ Action Bar ═══ -->
            <div class="jf-actions">
              <button class="btn btn--primary" id="jf-format">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Formatear
              </button>
              <button class="btn btn--secondary" id="jf-minify">
                <i class="fa-solid fa-compress"></i> Minificar
              </button>
              <button class="btn btn--secondary" id="jf-copy-result" disabled>
                <i class="fa-regular fa-copy"></i> Copiar
              </button>

              <div class="jf-actions-right">
                <select class="input jf-select" id="jf-indent" style="width:auto; padding:6px 10px;">
                  <option value="2" ${state.indent === 2 ? 'selected' : ''}>2 spaces</option>
                  <option value="4" ${state.indent === 4 ? 'selected' : ''}>4 spaces</option>
                  <option value="tab" ${state.indent === 'tab' ? 'selected' : ''}>Tab</option>
                </select>
              </div>
            </div>

            <!-- ═══ Status ═══ -->
            <div class="jf-status" id="jf-status"></div>
          </div>

          <!-- ═══ Output Area ═══ -->
          <div class="jf-output-section jf-output-section--hidden" id="jf-output-section">

            <!-- View mode tabs + search -->
            <div class="jf-toolbar">
              <div class="cf-tabs" style="margin-bottom:0; border-bottom:none; padding-bottom:0;">
                <button class="cf-tab ${state.viewMode === 'tree' ? 'cf-tab--active' : ''}" id="jf-tab-tree">
                  <i class="fa-solid fa-sitemap"></i> Tree View
                </button>
                <button class="cf-tab ${state.viewMode === 'code' ? 'cf-tab--active' : ''}" id="jf-tab-code">
                  <i class="fa-solid fa-code"></i> Code
                </button>
              </div>
              <div class="jf-search-wrap">
                <i class="fa-solid fa-magnifying-glass jf-search-icon"></i>
                <input type="text" class="input jf-search" id="jf-search" placeholder="Buscar clave o valor...">
              </div>
            </div>

            <!-- Tree View -->
            <div class="jf-tree-wrap jf-scroll" id="jf-tree-wrap" style="${state.viewMode === 'tree' ? '' : 'display:none'}">
              <div class="jf-tree" id="jf-tree"></div>
            </div>

            <!-- Code View -->
            <div class="jf-code-wrap jf-scroll" id="jf-code-wrap" style="${state.viewMode === 'code' ? '' : 'display:none'}">
              <pre class="jf-code" id="jf-code"></pre>
            </div>

            <!-- Stats bar -->
            <div class="jf-stats" id="jf-stats"></div>

          </div>

          <!-- ═══ Empty State ═══ -->
          <div class="jf-empty" id="jf-empty">
            <i class="fa-solid fa-braces"></i>
            <p>Pegá JSON y presioná <strong>Formatear</strong> para verlo acá</p>
          </div>

        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const inputArea = document.getElementById('jf-input');
  const statusEl = document.getElementById('jf-status');
  const outputSection = document.getElementById('jf-output-section');
  const emptyEl = document.getElementById('jf-empty');
  const treeWrap = document.getElementById('jf-tree-wrap');
  const codeWrap = document.getElementById('jf-code-wrap');
  const treeEl = document.getElementById('jf-tree');
  const codeEl = document.getElementById('jf-code');
  const statsEl = document.getElementById('jf-stats');
  const copyBtn = document.getElementById('jf-copy-result');
  const searchInput = document.getElementById('jf-search');
  const indentSelect = document.getElementById('jf-indent');
  const tabTree = document.getElementById('jf-tab-tree');
  const tabCode = document.getElementById('jf-tab-code');

  /* ═══════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════ */

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function getIndent() {
    const val = indentSelect.value;
    return val === 'tab' ? '\t' : ' '.repeat(parseInt(val));
  }

  function byteSize(str) {
    return new Blob([str]).size;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    return (bytes / 1024).toFixed(1) + ' KB';
  }

  function setStatus(msg, type) {
    if (!msg) { statusEl.innerHTML = ''; return; }
    const colors = {
      error: 'var(--color-error, #ef4444)',
      success: 'var(--color-success, #22c55e)',
      info: 'var(--accent)'
    };
    statusEl.innerHTML = `<span style="color:${colors[type] || colors.info}; font-weight:500;">${msg}</span>`;
  }

  /* ═══════════════════════════════════════════════════════
     JSON ANALYSIS
     ═══════════════════════════════════════════════════════ */

  function analyzeJSON(data) {
    const info = {
      type: Array.isArray(data) ? 'Array' : 'Object',
      count: Array.isArray(data) ? data.length : Object.keys(data).length,
      depth: 0,
      totalKeys: 0,
      totalValues: 0,
    };

    function walk(obj, depth) {
      if (depth > info.depth) info.depth = depth;
      if (obj && typeof obj === 'object') {
        const keys = Array.isArray(obj) ? obj : Object.keys(obj);
        for (let i = 0; i < keys.length; i++) {
          const key = Array.isArray(obj) ? i : keys[i];
          const val = obj[key];
          if (Array.isArray(obj)) {
            info.totalValues++;
          } else {
            info.totalKeys++;
            info.totalValues++;
          }
          if (val && typeof val === 'object') {
            walk(val, depth + 1);
          }
        }
      }
    }

    walk(data, 1);
    return info;
  }

  /* ═══════════════════════════════════════════════════════
     FORMAT / MINIFY
     ═══════════════════════════════════════════════════════ */

  function doFormat() {
    const raw = inputArea.value.trim();
    if (!raw) {
      setStatus('Pegá un JSON para comenzar', 'info');
      hideOutput();
      return;
    }

    try {
      parsedData = JSON.parse(raw);
      const indent = getIndent();
      lastFormatted = JSON.stringify(parsedData, null, indent);
      lastMinified = JSON.stringify(parsedData);

      const info = analyzeJSON(parsedData);
      const countLabel = info.type === 'Array' ? 'elementos' : 'propiedades';
      setStatus(`${info.type} valido · ${info.count} ${countLabel} · profundidad ${info.depth}`, 'success');

      renderOutput(lastFormatted, false);
      showOutput();
      copyBtn.disabled = false;

      saveState();
    } catch (e) {
      parsedData = null;
      lastFormatted = '';
      lastMinified = '';
      copyBtn.disabled = true;

      /* Try to extract line/column from error */
      const msg = e.message;
      let posInfo = '';
      const posMatch = msg.match(/position\s+(\d+)/i);
      if (posMatch) {
        const pos = parseInt(posMatch[1]);
        const before = raw.substring(0, pos);
        const line = (before.match(/\n/g) || []).length + 1;
        const col = pos - before.lastIndexOf('\n');
        posInfo = ` (linea ${line}, columna ${col})`;
      }
      setStatus(`JSON invalido${posInfo}: ${msg}`, 'error');
      hideOutput();
    }
  }

  function doMinify() {
    const raw = inputArea.value.trim();
    if (!raw) {
      setStatus('Pegá un JSON para comenzar', 'info');
      hideOutput();
      return;
    }

    try {
      parsedData = JSON.parse(raw);
      lastMinified = JSON.stringify(parsedData);
      lastFormatted = JSON.stringify(parsedData, null, getIndent());

      const origSize = byteSize(raw);
      const minSize = byteSize(lastMinified);
      const saved = origSize - minSize;
      const pct = origSize > 0 ? ((saved / origSize) * 100).toFixed(1) : 0;

      setStatus(`Minificado: ${formatBytes(origSize)} → ${formatBytes(minSize)} (${pct}% menor)`, 'success');

      renderOutput(lastMinified, true);
      showOutput();
      copyBtn.disabled = false;

      saveState();
    } catch (e) {
      parsedData = null;
      setStatus(`JSON invalido: ${e.message}`, 'error');
      hideOutput();
    }
  }

  /* ═══════════════════════════════════════════════════════
     SHOW / HIDE OUTPUT
     ═══════════════════════════════════════════════════════ */

  function showOutput() {
    outputSection.classList.remove('jf-output-section--hidden');
    emptyEl.style.display = 'none';
  }

  function hideOutput() {
    outputSection.classList.add('jf-output-section--hidden');
    emptyEl.style.display = '';
  }

  /* ═══════════════════════════════════════════════════════
     RENDER OUTPUT (dispatches to tree or code)
     ═══════════════════════════════════════════════════════ */

  function renderOutput(formatted, isMinified) {
    renderTree(parsedData);
    renderCode(formatted);
    renderStats(parsedData, formatted);
  }

  /* ═══════════════════════════════════════════════════════
     CODE VIEW
     ═══════════════════════════════════════════════════════ */

  function renderCode(json) {
    codeEl.innerHTML = highlightJSON(json);
  }

  function highlightJSON(json) {
    json = escapeHtml(json);
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'json-key' : 'json-string';
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
      }
    );
  }

  /* ═══════════════════════════════════════════════════════
     TREE VIEW
     ═══════════════════════════════════════════════════════ */

  function renderTree(data) {
    treeEl.innerHTML = '';
    const searchTerm = (searchInput.value || '').trim().toLowerCase();

    if (data === null || typeof data !== 'object') {
      /* Primitive root */
      const node = createValueNode(null, data, '$', searchTerm);
      treeEl.appendChild(node);
      return;
    }

    const isArr = Array.isArray(data);
    const rootNode = document.createElement('div');
    rootNode.className = 'jf-tree-root';

    const rootToggle = document.createElement('div');
    rootToggle.className = 'jf-tree-item jf-tree-item--root';

    const arrow = document.createElement('span');
    arrow.className = 'jf-tree-arrow jf-tree-arrow--expanded';
    arrow.innerHTML = '<i class="fa-solid fa-caret-down"></i>';

    const rootBadge = document.createElement('span');
    rootBadge.className = 'jf-tree-badge jf-tree-badge--' + (isArr ? 'array' : 'object');
    rootBadge.textContent = isArr ? `Array[${data.length}]` : `Object{${Object.keys(data).length}}`;

    const rootPath = document.createElement('span');
    rootPath.className = 'jf-tree-path';
    rootPath.textContent = '$';
    rootPath.title = 'Click para copiar: $';

    rootToggle.appendChild(arrow);
    rootToggle.appendChild(rootBadge);
    rootToggle.appendChild(rootPath);

    const rootChildren = document.createElement('div');
    rootChildren.className = 'jf-tree-children';

    /* Expand root by default */
    rootPath.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText('$').then(() => {
        MiniDevTools.showToast('Path copiado: $');
      });
    });

    /* Build children */
    const keys = isArr ? data : Object.keys(data);
    for (let i = 0; i < keys.length; i++) {
      const key = isArr ? i : keys[i];
      const val = data[key];
      const childPath = isArr ? `$[${i}]` : `$.${key}`;
      const childEl = buildTreeNode(key, val, childPath, searchTerm, isArr);
      rootChildren.appendChild(childEl);
    }

    rootToggle.addEventListener('click', () => {
      const expanded = !rootChildren.classList.contains('jf-tree-children--collapsed');
      rootChildren.classList.toggle('jf-tree-children--collapsed', expanded);
      arrow.classList.toggle('jf-tree-arrow--expanded', !expanded);
      arrow.classList.toggle('jf-tree-arrow--collapsed', expanded);
    });

    rootNode.appendChild(rootToggle);
    rootNode.appendChild(rootChildren);
    treeEl.appendChild(rootNode);
  }

  function buildTreeNode(key, value, path, searchTerm, inArray) {
    const type = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;

    const item = document.createElement('div');
    item.className = 'jf-tree-item';

    if (type === 'object' || type === 'array') {
      /* Collapsible node */
      const arrow = document.createElement('span');
      const childKeys = type === 'array' ? value.length : Object.keys(value).length;
      const defaultExpanded = !state.expandedPaths.hasOwnProperty(path) || state.expandedPaths[path];
      arrow.className = 'jf-tree-arrow ' + (defaultExpanded ? 'jf-tree-arrow--expanded' : 'jf-tree-arrow--collapsed');
      arrow.innerHTML = defaultExpanded ? '<i class="fa-solid fa-caret-down"></i>' : '<i class="fa-solid fa-caret-right"></i>';

      const badge = document.createElement('span');
      badge.className = 'jf-tree-badge jf-tree-badge--' + type;
      badge.textContent = type === 'array' ? `Array[${childKeys}]` : `Object{${childKeys}`;

      const keyLabel = document.createElement('span');
      keyLabel.className = 'jf-tree-key';
      keyLabel.textContent = inArray ? `[${key}]` : key;

      const colon = document.createElement('span');
      colon.className = 'jf-tree-colon';
      colon.textContent = ':';

      const pathLabel = document.createElement('span');
      pathLabel.className = 'jf-tree-path';
      pathLabel.textContent = path;
      pathLabel.title = 'Click para copiar: ' + path;

      item.appendChild(arrow);
      item.appendChild(keyLabel);
      item.appendChild(colon);
      item.appendChild(badge);
      item.appendChild(pathLabel);

      const children = document.createElement('div');
      children.className = 'jf-tree-children' + (defaultExpanded ? '' : ' jf-tree-children--collapsed');

      const subKeys = type === 'array' ? value : Object.keys(value);
      const subIsArr = type === 'array';
      for (let i = 0; i < subKeys.length; i++) {
        const sk = subIsArr ? i : subKeys[i];
        const sv = value[sk];
        const sp = subIsArr ? `${path}[${i}]` : `${path}.${sk}`;
        const childEl = buildTreeNode(sk, sv, sp, searchTerm, subIsArr);
        children.appendChild(childEl);
      }

      /* Close bracket label */
      const closeLabel = document.createElement('div');
      closeLabel.className = 'jf-tree-close';
      closeLabel.textContent = type === 'array' ? ']' : '}';
      children.appendChild(closeLabel);

      item.addEventListener('click', (e) => {
        if (e.target.closest('.jf-tree-path')) return;
        const expanded = !children.classList.contains('jf-tree-children--collapsed');
        children.classList.toggle('jf-tree-children--collapsed', expanded);
        arrow.className = 'jf-tree-arrow ' + (expanded ? 'jf-tree-arrow--collapsed' : 'jf-tree-arrow--expanded');
        arrow.innerHTML = expanded ? '<i class="fa-solid fa-caret-right"></i>' : '<i class="fa-solid fa-caret-down"></i>';
        state.expandedPaths[path] = expanded;
      });

      pathLabel.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(path).then(() => {
          MiniDevTools.showToast('Path copiado: ' + path);
        });
      });

      item.appendChild(children);
    } else {
      /* Leaf value */
      item.appendChild(createValueNode(key, value, path, searchTerm));
    }

    return item;
  }

  function createValueNode(key, value, path, searchTerm) {
    const type = value === null ? 'null' : typeof value;

    const item = document.createElement('div');
    item.className = 'jf-tree-item jf-tree-item--leaf';

    const keyLabel = document.createElement('span');
    keyLabel.className = 'jf-tree-key';
    if (key !== null) {
      keyLabel.textContent = `[${key}]`;
    }

    const colon = document.createElement('span');
    colon.className = 'jf-tree-colon';
    colon.textContent = ':';

    const badge = document.createElement('span');
    badge.className = 'jf-tree-badge jf-tree-badge--' + type;
    badge.textContent = type;

    const valSpan = document.createElement('span');
    valSpan.className = 'jf-tree-value jf-tree-value--' + type;
    if (type === 'string') {
      valSpan.textContent = '"' + value + '"';
    } else {
      valSpan.textContent = String(value);
    }

    const pathLabel = document.createElement('span');
    pathLabel.className = 'jf-tree-path';
    pathLabel.textContent = path;
    pathLabel.title = 'Click para copiar: ' + path;

    if (key !== null) item.appendChild(keyLabel);
    item.appendChild(colon);
    item.appendChild(valSpan);
    item.appendChild(badge);
    item.appendChild(pathLabel);

    /* Search highlighting */
    if (searchTerm) {
      const textContent = (typeof value === 'string' ? value : String(value)).toLowerCase();
      const keyContent = key !== null ? String(key).toLowerCase() : '';
      if (textContent.includes(searchTerm) || keyContent.includes(searchTerm)) {
        item.classList.add('jf-tree-item--highlight');
      } else {
        item.classList.add('jf-tree-item--dim');
      }
    }

    pathLabel.addEventListener('click', (e) => {
      e.stopPropagation();
      navigator.clipboard.writeText(path).then(() => {
        MiniDevTools.showToast('Path copiado: ' + path);
      });
    });

    return item;
  }

  /* ═══════════════════════════════════════════════════════
     STATS BAR
     ═══════════════════════════════════════════════════════ */

  function renderStats(data, formatted) {
    if (!data) { statsEl.innerHTML = ''; return; }

    const info = analyzeJSON(data);
    const size = formatBytes(byteSize(formatted));
    const countLabel = info.type === 'Array' ? 'elementos' : 'propiedades';

    statsEl.innerHTML = `
      <span class="jf-stat-item"><i class="fa-solid fa-cube"></i> ${info.type} con ${info.count} ${countLabel}</span>
      <span class="jf-stat-item"><i class="fa-solid fa-layer-group"></i> Profundidad ${info.depth}</span>
      <span class="jf-stat-item"><i class="fa-solid fa-key"></i> ${info.totalKeys} claves</span>
      <span class="jf-stat-item"><i class="fa-solid fa-weight-hanging"></i> ${size}</span>
    `;
  }

  /* ═══════════════════════════════════════════════════════
     VIEW MODE SWITCHING
     ═══════════════════════════════════════════════════════ */

  function switchView(mode) {
    state.viewMode = mode;
    tabTree.classList.toggle('cf-tab--active', mode === 'tree');
    tabCode.classList.toggle('cf-tab--active', mode === 'code');
    treeWrap.style.display = mode === 'tree' ? '' : 'none';
    codeWrap.style.display = mode === 'code' ? '' : 'none';
    saveState();
  }

  /* ═══════════════════════════════════════════════════════
     SAMPLE DATA
     ═══════════════════════════════════════════════════════ */

  function loadSample() {
    const sample = {
      "proyecto": "MiniDevTools",
      "version": "2.5.0",
      "descripcion": "Compendio de mini-herramientas para developers",
      "publicado": true,
      "tags": ["json", "formatter", "viewer", "tools"],
      "autor": {
        "nombre": "MozzVader",
        "rol": "Desarrollador",
        "contacto": {
          "github": "https://github.com/MozzVader",
          "email": "mozz@example.com"
        }
      },
      "herramientas": [
        {
          "id": "json-formatter",
          "nombre": "JSON Formatter",
          "activa": true,
          "categoria": "utils"
        },
        {
          "id": "code-formatter",
          "nombre": "Code Formatter",
          "activa": true,
          "categoria": "utils"
        },
        {
          "id": "grid-playground",
          "nombre": "Grid Playground",
          "activa": true,
          "categoria": "css"
        }
      ],
      "estadisticas": {
        "totalHerramientas": 26,
        "categorias": 4,
        "offline": true,
        "dependencias": null
      },
      "configuracion": {
        "tema": "auto",
        "idioma": "es",
        "persistencia": true,
        "maxStorageKB": 512
      }
    };
    inputArea.value = JSON.stringify(sample);
    doFormat();
  }

  /* ═══════════════════════════════════════════════════════
     PERSISTENCE
     ═══════════════════════════════════════════════════════ */

  function saveState() {
    state.input = inputArea.value;
    ToolStorage.setField('json-formatter', 'state', { ...state });
  }

  /* ═══════════════════════════════════════════════════════
     EVENTS
     ═══════════════════════════════════════════════════════ */

  document.getElementById('jf-format').addEventListener('click', doFormat);
  document.getElementById('jf-minify').addEventListener('click', doMinify);
  document.getElementById('jf-sample').addEventListener('click', loadSample);
  document.getElementById('jf-clear').addEventListener('click', () => {
    inputArea.value = '';
    parsedData = null;
    lastFormatted = '';
    lastMinified = '';
    statusEl.innerHTML = '';
    treeEl.innerHTML = '';
    codeEl.innerHTML = '';
    statsEl.innerHTML = '';
    searchInput.value = '';
    copyBtn.disabled = true;
    hideOutput();
    saveState();
  });

  tabTree.addEventListener('click', () => switchView('tree'));
  tabCode.addEventListener('click', () => switchView('code'));

  indentSelect.addEventListener('change', () => {
    state.indent = indentSelect.value === 'tab' ? 'tab' : parseInt(indentSelect.value);
    saveState();
    /* Re-format if we have data */
    if (parsedData !== null) {
      lastFormatted = JSON.stringify(parsedData, null, getIndent());
      renderCode(lastFormatted);
    }
  });

  copyBtn.addEventListener('click', () => {
    const text = state.viewMode === 'code' ? lastFormatted : lastFormatted;
    if (text) {
      MiniDevTools.copyToClipboard(text, 'JSON copiado al portapapeles');
    }
  });

  /* Search: re-render tree on input */
  let searchTimeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      if (parsedData !== null) {
        renderTree(parsedData);
      }
    }, 200);
  });

  /* ═══════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════ */

  /* Auto-format on load if saved content */
  if (state.input) {
    doFormat();
  }
};

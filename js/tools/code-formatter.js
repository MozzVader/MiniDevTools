/* ═══════════════════════════════════════════════════════════════
   Code Formatter — Formatear, minificar y validar JSON y HTML
   Tabs: JSON | HTML con syntax highlighting propio.
   Usa ToolStorage para persistir preferencias.
   ═══════════════════════════════════════════════════════════════ */

function render_code_formatter(container, toolMeta) {

  /* ─── State ─── */
  let activeTab = ToolStorage.getField('code-formatter', 'activeTab', 'json');
  let lastFormatted = '';

  /* ─── Restore saved inputs ─── */
  const savedJSON = ToolStorage.getField('code-formatter', 'jsonInput', '');
  const savedHTML = ToolStorage.getField('code-formatter', 'htmlInput', '');
  let indentSize = ToolStorage.getField('code-formatter', 'indent', 2);

  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title">${toolMeta.icon} ${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <!-- Tabs -->
        <div class="cf-tabs">
          <button class="cf-tab ${activeTab === 'json' ? 'cf-tab--active' : ''}" data-tab="json">JSON</button>
          <button class="cf-tab ${activeTab === 'html' ? 'cf-tab--active' : ''}" data-tab="html">HTML</button>
        </div>

        <!-- JSON Panel -->
        <div class="cf-panel" id="cf-panel-json" style="${activeTab === 'json' ? '' : 'display:none'}">
          <div class="form-group">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label class="label" style="margin-bottom:0;">JSON de entrada</label>
              <div style="display:flex; gap:6px;">
                <button class="btn btn--ghost btn--sm cf-sample-btn" data-lang="json" data-tooltip="Cargar ejemplo">Ejemplo</button>
                <button class="btn btn--ghost btn--sm cf-clear-btn" data-lang="json" data-tooltip="Limpiar">Limpiar</button>
              </div>
            </div>
            <textarea class="input cf-textarea" id="cf-json-input" data-lang="json" rows="8" placeholder='{"key": "value"}' spellcheck="false">${escapeHtml(savedJSON)}</textarea>
          </div>
        </div>

        <!-- HTML Panel -->
        <div class="cf-panel" id="cf-panel-html" style="${activeTab === 'html' ? '' : 'display:none'}">
          <div class="form-group">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label class="label" style="margin-bottom:0;">HTML de entrada</label>
              <div style="display:flex; gap:6px;">
                <button class="btn btn--ghost btn--sm cf-sample-btn" data-lang="html" data-tooltip="Cargar ejemplo">Ejemplo</button>
                <button class="btn btn--ghost btn--sm cf-clear-btn" data-lang="html" data-tooltip="Limpiar">Limpiar</button>
              </div>
            </div>
            <textarea class="input cf-textarea" id="cf-html-input" data-lang="html" rows="8" placeholder='<div class="app"><h1>Hola</h1></div>' spellcheck="false">${escapeHtml(savedHTML)}</textarea>
          </div>
        </div>

        <!-- Action bar -->
        <div class="cf-actions">
          <button class="btn btn--primary cf-format-btn" id="cf-format">Formatear</button>
          <button class="btn btn--secondary cf-minify-btn" id="cf-minify">Minificar</button>
          <button class="btn btn--secondary" id="cf-copy" disabled>Copiar resultado</button>

          <div class="cf-indent-group">
            <label class="label" style="margin-bottom:0;">Indent:</label>
            <select class="input" id="cf-indent" style="width:auto; padding:6px 10px;">
              <option value="2" ${indentSize === 2 ? 'selected' : ''}>2 espacios</option>
              <option value="4" ${indentSize === 4 ? 'selected' : ''}>4 espacios</option>
              <option value="tab" ${indentSize === 'tab' ? 'selected' : ''}>Tab</option>
            </select>
          </div>
        </div>

        <!-- Status -->
        <div id="cf-status" class="cf-status"></div>

        <!-- Output -->
        <div id="cf-output-wrap">
          <label class="label">Resultado</label>
          <div class="code-output" id="cf-output" style="min-height:120px; max-height:500px; overflow-y:auto;"></div>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const tabs = container.querySelectorAll('.cf-tab');
  const panels = { json: document.getElementById('cf-panel-json'), html: document.getElementById('cf-panel-html') };
  const inputs = { json: document.getElementById('cf-json-input'), html: document.getElementById('cf-html-input') };
  const output = document.getElementById('cf-output');
  const status = document.getElementById('cf-status');
  const copyBtn = document.getElementById('cf-copy');
  const formatBtn = document.getElementById('cf-format');
  const minifyBtn = document.getElementById('cf-minify');
  const indentSelect = document.getElementById('cf-indent');

  /* ─── Tab Switching ─── */
  function switchTab(tab) {
    activeTab = tab;
    tabs.forEach(t => t.classList.toggle('cf-tab--active', t.dataset.tab === tab));
    panels.json.style.display = tab === 'json' ? '' : 'none';
    panels.html.style.display = tab === 'html' ? '' : 'none';
    ToolStorage.setField('code-formatter', 'activeTab', tab);
  }

  container.querySelectorAll('.cf-tab').forEach(t => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });

  /* ─── Indent Helper ─── */
  function getIndent() {
    const val = indentSelect.value;
    return val === 'tab' ? '\t' : ' '.repeat(parseInt(val));
  }

  indentSelect.addEventListener('change', () => {
    indentSize = indentSelect.value === 'tab' ? 'tab' : parseInt(indentSelect.value);
    ToolStorage.setField('code-formatter', 'indent', indentSize);
  });

  /* ─── Status ─── */
  function setStatus(msg, type) {
    if (!msg) { status.innerHTML = ''; return; }
    const colors = {
      error: 'var(--color-error, #ef4444)',
      success: 'var(--color-success, #22c55e)',
      info: 'var(--accent)'
    };
    status.innerHTML = `<span style="color:${colors[type] || colors.info}; font-weight:500;">${msg}</span>`;
  }

  /* ═══════════════════════════════════════════════════════════════
     FORMAT / MINIFY dispatcher
     ═══════════════════════════════════════════════════════════════ */
  function runFormat(minify) {
    const raw = inputs[activeTab].value.trim();
    if (!raw) {
      setStatus(activeTab === 'json' ? 'Pega un JSON para comenzar' : 'Pega un HTML para comenzar', 'info');
      output.textContent = '';
      copyBtn.disabled = true;
      lastFormatted = '';
      return;
    }

    if (activeTab === 'json') {
      formatJSON(raw, minify);
    } else {
      formatHTML(raw, minify);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     JSON Engine
     ═══════════════════════════════════════════════════════════════ */
  function formatJSON(raw, minify) {
    try {
      const parsed = JSON.parse(raw);
      lastFormatted = minify
        ? JSON.stringify(parsed)
        : JSON.stringify(parsed, null, getIndent());

      output.innerHTML = highlightJSON(lastFormatted);
      copyBtn.disabled = false;

      const type = Array.isArray(parsed) ? 'Array' : 'Object';
      const length = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
      const unit = Array.isArray(parsed) ? 'elementos' : 'propiedades';
      setStatus(`${type} valido · ${length} ${unit}`, 'success');

      ToolStorage.setField('code-formatter', 'jsonInput', raw);
    } catch (e) {
      output.textContent = '';
      setStatus(`Error: ${e.message}`, 'error');
      copyBtn.disabled = true;
      lastFormatted = '';
    }
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

  /* ═══════════════════════════════════════════════════════════════
     HTML Engine
     ═══════════════════════════════════════════════════════════════ */
  function formatHTML(raw, minify) {
    if (minify) {
      lastFormatted = minifyHTML(raw);
      output.innerHTML = highlightHTML(lastFormatted);
      copyBtn.disabled = false;
      setStatus('HTML minificado', 'success');
      ToolStorage.setField('code-formatter', 'htmlInput', raw);
      return;
    }

    try {
      lastFormatted = prettyPrintHTML(raw, getIndent());
      output.innerHTML = highlightHTML(lastFormatted);
      copyBtn.disabled = false;

      // Stats
      const doc = new DOMParser().parseFromString(raw, 'text/html');
      const tagCount = doc.querySelectorAll('*').length;
      const errCount = doc.querySelectorAll('parsererror').length;
      if (errCount > 0) {
        setStatus(`Advertencia: se detectaron posibles errores de estructura (${tagCount} elementos)`, 'error');
      } else {
        setStatus(`${tagCount} elementos · HTML valido`, 'success');
      }

      ToolStorage.setField('code-formatter', 'htmlInput', raw);
    } catch (e) {
      output.textContent = '';
      setStatus(`Error: ${e.message}`, 'error');
      copyBtn.disabled = true;
      lastFormatted = '';
    }
  }

  function minifyHTML(html) {
    return html
      .replace(/>\s+</g, '><')          // strip whitespace between tags
      .replace(/\s{2,}/g, ' ')           // collapse multiple spaces
      .replace(/\n/g, '')                // remove newlines
      .replace(/<!--[\s\S]*?-->/g, '');  // remove comments
  }

  function prettyPrintHTML(html, indent) {
    indent = indent || '  ';
    let result = '';
    let level = 0;
    let inPre = false;

    // Tokenize: split into tags, text, comments, doctypes
    const tokens = html.replace(/>\s*</g, '>\n<').split('\n');

    tokens.forEach(token => {
      token = token.trim();
      if (!token) return;

      // Preserve <pre>, <script>, <style> content verbatim
      if (token.match(/^<(pre|script|style)[\s>]/i) && !token.match(/\/\s*>$/)) {
        inPre = true;
      }
      if (inPre) {
        result += indent.repeat(level) + token + '\n';
        if (token.match(/<\/(pre|script|style)>/i)) {
          inPre = false;
          level--;
        }
        return;
      }

      // Closing tag
      if (token.match(/^<\//)) {
        level = Math.max(0, level - 1);
        result += indent.repeat(level) + token + '\n';
      }
      // Self-closing or void element (br, hr, img, input, meta, link, etc.)
      else if (token.match(/^<(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)\b/i) || token.match(/\/\s*>$/)) {
        result += indent.repeat(level) + token + '\n';
      }
      // Opening tag
      else if (token.match(/^</)) {
        result += indent.repeat(level) + token + '\n';
        level++;
      }
      // Text content (not empty)
      else if (token.length > 0) {
        result += indent.repeat(level) + token + '\n';
      }
    });

    return result.trimEnd();
  }

  function highlightHTML(html) {
    // First escape, then wrap tokens
    html = escapeHtml(html);

    // Comments
    html = html.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="html-comment">$1</span>');

    // Doctype
    html = html.replace(/(&lt;!DOCTYPE[^&]*&gt;)/gi, '<span class="html-doctype">$1</span>');

    // Tags: opening, closing, self-closing with attributes
    html = html.replace(
      /(&lt;\/?)([\w-]+)((?:\s+[\w-]+(?:\s*=\s*(?:"[^"]*"|&#39;[^&#39;]*&#39;|[^\s&gt;]+))?)*\s*)(\/?)(&gt;)/g,
      function (match, open, tag, attrs, selfClose, close) {
        let attrHTML = '';
        if (attrs) {
          attrHTML = attrs.replace(
            /([\w-]+)(\s*=\s*)((?:"[^"]*"|&#39;[^&#39;]*&#39;|[^\s&gt;]+))/g,
            '<span class="html-attr-name">$1</span>$2<span class="html-attr-value">$3</span>'
          );
        }
        return '<span class="html-bracket">' + open + '</span>'
             + '<span class="html-tag">' + tag + '</span>'
             + attrHTML
             + '<span class="html-bracket">' + (selfClose ? ' /' : '') + close + '</span>';
      }
    );

    return html;
  }

  /* ─── Shared Helpers ─── */
  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ─── Sample Data ─── */
  const samples = {
    json: () => {
      const obj = {
        "nombre": "MiniDevTools",
        "version": "2.0.0",
        "descripcion": "Compendio de mini-herramientas para developers",
        "herramientas": [
          { "id": "uuid-generator", "nombre": "UUID Generator", "activa": true },
          { "id": "code-formatter", "nombre": "Code Formatter", "activa": true },
          { "id": "shadow-generator", "nombre": "Shadow Generator", "activa": false }
        ],
        "meta": {
          "autor": "MozzVader",
          "stack": ["HTML", "CSS", "JavaScript"],
          "offline": true
        }
      };
      inputs.json.value = JSON.stringify(obj);
      switchTab('json');
      runFormat(false);
    },
    html: () => {
      inputs.html.value = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>MiniDevTools</title><link rel="stylesheet" href="styles.css"></head><body><header class="app-header"><nav><a href="/" class="logo">🛠️ MiniDevTools</a><ul class="nav-links"><li><a href="/tools">Herramientas</a></li><li><a href="/about">Acerca de</a></li></ul></nav></header><main class="content"><section id="hero"><h1>Tu compendio de herramientas</h1><p>Todo funciona offline, sin dependencias.</p><button class="cta-btn">Comenzar</button></section></main><footer><p>&copy; 2025 MozzVader</p></footer></body></html>`;
      switchTab('html');
      runFormat(false);
    }
  };

  /* ─── Event Listeners ─── */
  formatBtn.addEventListener('click', () => runFormat(false));
  minifyBtn.addEventListener('click', () => runFormat(true));
  copyBtn.addEventListener('click', () => {
    if (!lastFormatted) return;
    MiniDevTools.copyToClipboard(lastFormatted, activeTab.toUpperCase() + ' copiado al portapapeles');
  });

  // Sample buttons
  container.querySelectorAll('.cf-sample-btn').forEach(btn => {
    btn.addEventListener('click', () => samples[btn.dataset.lang]());
  });

  // Clear buttons
  container.querySelectorAll('.cf-clear-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      inputs[lang].value = '';
      output.textContent = '';
      status.innerHTML = '';
      copyBtn.disabled = true;
      lastFormatted = '';
      ToolStorage.setField('code-formatter', lang + 'Input', '');
    });
  });

  /* ─── Auto-format on load if saved content ─── */
  if (activeTab === 'json' && savedJSON) runFormat(false);
  if (activeTab === 'html' && savedHTML) runFormat(false);
}

/* Registro global para carga clasica (fallback) */
window['render_code-formatter'] = render_code_formatter;

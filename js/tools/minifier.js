/* ═══════════════════════════════════════════════════════════════
   Minifier CSS/JS/HTML — Comprimir código para producción
   Features:
   - 3 lenguajes: CSS, JavaScript, HTML (botones estilo Boilerplate Generator)
   - Minificación en tiempo real al escribir/pegar
   - Estadísticas: tamaño original vs minificado + % de reducción
   - Copiar resultado / Descargar / Pegar / Limpiar / Ejemplo
   - Usa clases globales: .input, .code-output, .label
   - Persistencia de preferencias con ToolStorage
   ═══════════════════════════════════════════════════════════════ */

function render_minifier(container, toolMeta) {

  /* ─── State ─── */
  let activeTab = ToolStorage.getField('minifier', 'activeTab', 'css');
  let lastMinified = '';

  /* ─── Restore saved input ─── */
  const savedCSS = ToolStorage.getField('minifier', 'cssInput', '');
  const savedJS = ToolStorage.getField('minifier', 'jsInput', '');
  const savedHTML = ToolStorage.getField('minifier', 'htmlInput', '');

  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title"><i class="${toolMeta.icon}" style="margin-right:8px;"></i>${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <!-- Language selector -->
        <label class="label">Lenguaje</label>
        <div class="mn-lang-bar">
          <button class="mn-lang-btn ${activeTab === 'css' ? 'mn-lang-btn--active' : ''}" data-tab="css">
            <i class="fa-brands fa-css3-alt"></i>
            <span>CSS</span>
          </button>
          <button class="mn-lang-btn ${activeTab === 'js' ? 'mn-lang-btn--active' : ''}" data-tab="js">
            <i class="fa-brands fa-js"></i>
            <span>JavaScript</span>
          </button>
          <button class="mn-lang-btn ${activeTab === 'html' ? 'mn-lang-btn--active' : ''}" data-tab="html">
            <i class="fa-brands fa-html5"></i>
            <span>HTML</span>
          </button>
        </div>

        <!-- CSS Panel -->
        <div class="cf-panel" id="mn-panel-css" style="${activeTab === 'css' ? '' : 'display:none'}">
          <div class="form-group">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label class="label" style="margin-bottom:0;">CSS de entrada</label>
              <div style="display:flex; gap:6px;">
                <button class="btn btn--ghost btn--sm mn-sample-btn" data-lang="css">Ejemplo</button>
                <button class="btn btn--ghost btn--sm mn-clear-btn" data-lang="css">Limpiar</button>
              </div>
            </div>
            <textarea class="input cf-textarea" id="mn-css-input" data-lang="css" rows="8" placeholder='/* Pegá tu CSS aquí */' spellcheck="false">${escapeHtml(savedCSS)}</textarea>
          </div>
        </div>

        <!-- JS Panel -->
        <div class="cf-panel" id="mn-panel-js" style="${activeTab === 'js' ? '' : 'display:none'}">
          <div class="form-group">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label class="label" style="margin-bottom:0;">JavaScript de entrada</label>
              <div style="display:flex; gap:6px;">
                <button class="btn btn--ghost btn--sm mn-sample-btn" data-lang="js">Ejemplo</button>
                <button class="btn btn--ghost btn--sm mn-clear-btn" data-lang="js">Limpiar</button>
              </div>
            </div>
            <textarea class="input cf-textarea" id="mn-js-input" data-lang="js" rows="8" placeholder='// Pegá tu JavaScript aquí' spellcheck="false">${escapeHtml(savedJS)}</textarea>
          </div>
        </div>

        <!-- HTML Panel -->
        <div class="cf-panel" id="mn-panel-html" style="${activeTab === 'html' ? '' : 'display:none'}">
          <div class="form-group">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
              <label class="label" style="margin-bottom:0;">HTML de entrada</label>
              <div style="display:flex; gap:6px;">
                <button class="btn btn--ghost btn--sm mn-sample-btn" data-lang="html">Ejemplo</button>
                <button class="btn btn--ghost btn--sm mn-clear-btn" data-lang="html">Limpiar</button>
              </div>
            </div>
            <textarea class="input cf-textarea" id="mn-html-input" data-lang="html" rows="8" placeholder='<!-- Pegá tu HTML aquí -->' spellcheck="false">${escapeHtml(savedHTML)}</textarea>
          </div>
        </div>

        <!-- Action bar -->
        <div class="cf-actions">
          <button class="btn btn--primary" id="mn-minify">Minificar</button>
          <button class="btn btn--secondary" id="mn-copy" disabled>Copiar resultado</button>
          <button class="btn btn--secondary" id="mn-download" disabled>Descargar</button>
          <button class="btn btn--secondary" id="mn-paste"><i class="fa-regular fa-clipboard" style="margin-right:4px;"></i>Pegar</button>
        </div>

        <!-- Status -->
        <div id="mn-status" class="cf-status"></div>

        <!-- Output -->
        <div id="mn-output-wrap">
          <label class="label">Resultado</label>
          <div class="code-output" id="mn-output" style="min-height:120px; max-height:500px; overflow-y:auto;"></div>
        </div>

        <!-- Stats bar -->
        <div id="mn-stats" class="mn-stats"></div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const tabs = container.querySelectorAll('.mn-lang-btn');
  const panels = {
    css: document.getElementById('mn-panel-css'),
    js: document.getElementById('mn-panel-js'),
    html: document.getElementById('mn-panel-html')
  };
  const inputs = {
    css: document.getElementById('mn-css-input'),
    js: document.getElementById('mn-js-input'),
    html: document.getElementById('mn-html-input')
  };
  const output = document.getElementById('mn-output');
  const status = document.getElementById('mn-status');
  const statsEl = document.getElementById('mn-stats');
  const copyBtn = document.getElementById('mn-copy');
  const downloadBtn = document.getElementById('mn-download');
  const minifyBtn = document.getElementById('mn-minify');
  const pasteBtn = document.getElementById('mn-paste');

  /* ═══════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════ */

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function setStatus(msg, type) {
    if (!msg) { status.innerHTML = ''; return; }
    const colors = {
      error: 'var(--color-error, #ef4444)',
      success: 'var(--color-success, #22c55e)',
      info: 'var(--accent)'
    };
    status.innerHTML = `<span style="color:${colors[type] || colors.info}; font-weight:500;">${msg}</span>`;
  }

  /* ─── Tab Switching ─── */
  function switchTab(tab) {
    activeTab = tab;
    tabs.forEach(t => t.classList.toggle('mn-lang-btn--active', t.dataset.tab === tab));
    panels.css.style.display = tab === 'css' ? '' : 'none';
    panels.js.style.display = tab === 'js' ? '' : 'none';
    panels.html.style.display = tab === 'html' ? '' : 'none';
    ToolStorage.setField('minifier', 'activeTab', tab);
  }

  container.querySelectorAll('.mn-lang-btn').forEach(t => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });

  /* ═══════════════════════════════════════════════════════
     MINIFIERS
     ═══════════════════════════════════════════════════════ */

  function minifyCSS(code) {
    let r = code;
    r = r.replace(/\/\*[\s\S]*?\*\//g, '');
    r = r.replace(/\r?\n/g, '');
    r = r.replace(/\s+/g, ' ');
    r = r.replace(/\s*{\s*/g, '{');
    r = r.replace(/\s*}\s*/g, '}');
    r = r.replace(/\s*:\s*/g, ':');
    r = r.replace(/\s*;\s*/g, ';');
    r = r.replace(/\s*,\s*/g, ',');
    r = r.replace(/;}/g, '}');
    return r.trim();
  }

  function minifyJS(code) {
    let result = code;
    const tokens = [];
    let i = 0;
    const len = result.length;

    while (i < len) {
      /* Multi-line comment */
      if (result[i] === '/' && result[i + 1] === '*') {
        const end = result.indexOf('*/', i + 2);
        if (end !== -1) {
          tokens.push({ type: 'comment', value: result.substring(i, end + 2) });
          i = end + 2;
          continue;
        }
      }
      /* Single-line comment */
      if (result[i] === '/' && result[i + 1] === '/') {
        let end = result.indexOf('\n', i);
        if (end === -1) end = len;
        tokens.push({ type: 'comment', value: result.substring(i, end) });
        i = end;
        continue;
      }
      /* String (double quote) */
      if (result[i] === '"') {
        let j = i + 1;
        while (j < len) {
          if (result[j] === '\\') { j += 2; continue; }
          if (result[j] === '"') break;
          j++;
        }
        tokens.push({ type: 'string', value: result.substring(i, j + 1) });
        i = j + 1;
        continue;
      }
      /* String (single quote) */
      if (result[i] === "'") {
        let j = i + 1;
        while (j < len) {
          if (result[j] === '\\') { j += 2; continue; }
          if (result[j] === "'") break;
          j++;
        }
        tokens.push({ type: 'string', value: result.substring(i, j + 1) });
        i = j + 1;
        continue;
      }
      /* Template literal */
      if (result[i] === '`') {
        let j = i + 1;
        while (j < len) {
          if (result[j] === '\\') { j += 2; continue; }
          if (result[j] === '`') break;
          j++;
        }
        tokens.push({ type: 'string', value: result.substring(i, j + 1) });
        i = j + 1;
        continue;
      }
      /* Regex literal (basic detection) */
      if (result[i] === '/' && i > 0) {
        const prev = result.substring(Math.max(0, i - 10), i).trim();
        const lastChar = prev[prev.length - 1];
        if (lastChar && '=(:,;[!&|?{}'.includes(lastChar)) {
          let j = i + 1;
          while (j < len && result[j] !== '/') {
            if (result[j] === '\\') { j += 2; continue; }
            j++;
          }
          if (j < len) {
            j++;
            while (j < len && /[gimsuy]/.test(result[j])) j++;
            tokens.push({ type: 'regex', value: result.substring(i, j) });
            i = j;
            continue;
          }
        }
      }
      tokens.push({ type: 'code', value: result[i] });
      i++;
    }

    let output = '';
    for (const token of tokens) {
      output += token.type === 'comment' ? ' ' : token.value;
    }

    output = output.replace(/\s+/g, ' ');
    output = output.replace(/\s*([{}();,=+\-*/<>!&|?:])\s*/g, '$1');

    const keywords = ['var','let','const','return','typeof','instanceof','in','of','new','delete','void','throw','yield','await','class','extends','import','export','from','default','function','if','else','for','while','do','switch','case','break','continue','try','catch','finally','with','debugger'];
    for (const kw of keywords) {
      output = output.replace(new RegExp('\\b' + kw + '\\b(?=[^\\s;})\\]])', 'g'), kw + ' ');
    }

    output = output.replace(/\s+\(/g, '(');
    output = output.replace(/\s+\[/g, '[');
    output = output.replace(/\(\s+/g, '(');
    output = output.replace(/\s+;/g, ';');
    output = output.replace(/\{\s+/g, '{');
    output = output.replace(/\s+\}/g, '}');
    return output.trim();
  }

  function minifyHTML(code) {
    let r = code;
    r = r.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');
    r = r.replace(/>\s+</g, '><');
    r = r.replace(/\s+>/g, '>');
    r = r.replace(/<\s+/g, '<');
    r = r.replace(/\s{2,}/g, ' ');
    r = r.replace(/(\w+)=["']([a-zA-Z0-9_-]+)["']/g, '$1=$2');
    r = r.replace(/\s*=\s*/g, '=');
    r = r.replace(/\n\s*/g, '');
    return r.trim();
  }

  function minify(code, lang) {
    switch (lang) {
      case 'css': return minifyCSS(code);
      case 'js': return minifyJS(code);
      case 'html': return minifyHTML(code);
      default: return code;
    }
  }

  /* ═══════════════════════════════════════════════════════
     RUN MINIFY
     ═══════════════════════════════════════════════════════ */

  function runMinify() {
    const raw = inputs[activeTab].value.trim();
    if (!raw) {
      setStatus('Pegá código para minificar', 'info');
      output.textContent = '';
      statsEl.innerHTML = '';
      copyBtn.disabled = true;
      downloadBtn.disabled = true;
      lastMinified = '';
      return;
    }

    lastMinified = minify(raw, activeTab);
    output.textContent = lastMinified;
    copyBtn.disabled = false;
    downloadBtn.disabled = false;

    /* Stats */
    const origSize = new Blob([raw]).size;
    const minSize = new Blob([lastMinified]).size;
    const pct = origSize > 0 ? Math.round((1 - minSize / origSize) * 100) : 0;
    const isReduction = pct > 0;
    const savingsColor = isReduction ? 'var(--color-success, #22c55e)' : 'var(--color-error, #ef4444)';
    const savingsSign = isReduction ? '−' : '+';

    const langNames = { css: 'CSS', js: 'JavaScript', html: 'HTML' };
    setStatus(`${langNames[activeTab]} minificado`, 'success');

    statsEl.innerHTML = `
      <span>Original: <strong>${formatBytes(origSize)}</strong></span>
      <span style="opacity:0.4;">→</span>
      <span>Minificado: <strong>${formatBytes(minSize)}</strong></span>
      <span style="color:${savingsColor}; font-weight:600;">${savingsSign}${Math.abs(pct)}%</span>
    `;

    /* Save input */
    ToolStorage.setField('minifier', activeTab + 'Input', raw);
  }

  /* ═══════════════════════════════════════════════════════
     SAMPLE DATA
     ═══════════════════════════════════════════════════════ */

  const samples = {
    css: () => {
      inputs.css.value = `/* Reset y base */\nbody {\n  margin: 0;\n  padding: 20px;\n  background-color: #ffffff;\n  color: #333333;\n  font-family: Arial, sans-serif;\n  line-height: 1.6;\n}\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 0 16px;\n}\n\n.header {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 16px 0;\n  border-bottom: 1px solid #eeeeee;\n}\n\n.btn {\n  display: inline-block;\n  padding: 10px 20px;\n  background-color: #3b82f6;\n  color: #ffffff;\n  border: none;\n  border-radius: 6px;\n  cursor: pointer;\n  transition: background-color 0.2s ease;\n}\n\n.btn:hover {\n  background-color: #2563eb;\n}`;
      switchTab('css');
      runMinify();
    },
    js: () => {
      inputs.js.value = `// Función de ejemplo\nfunction saludar(nombre) {\n  const mensaje = "Hola " + nombre + "!";\n  console.log(mensaje);\n  return mensaje;\n}\n\n// Array de usuarios\nconst usuarios = ["Ana", "Juan", "Pedro"];\n\nusuarios.forEach(function(user) {\n  saludar(user);\n});\n\n// Clase de ejemplo\nclass Calculadora {\n  constructor() {\n    this.resultado = 0;\n  }\n\n  sumar(a, b) {\n    this.resultado = a + b;\n    return this.resultado;\n  }\n\n  restar(a, b) {\n    this.resultado = a - b;\n    return this.resultado;\n  }\n}`;
      switchTab('js');
      runMinify();
    },
    html: () => {
      inputs.html.value = `<!DOCTYPE html>\n<html lang="es">\n  <head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Mi Página</title>\n    <link rel="stylesheet" href="styles.css">\n  </head>\n  <body>\n    <div class="container">\n      <header class="header">\n        <h1>Hola Mundo</h1>\n        <nav>\n          <a href="/inicio">Inicio</a>\n          <a href="/about">Acerca de</a>\n          <a href="/contacto">Contacto</a>\n        </nav>\n      </header>\n      <main>\n        <p>Un párrafo de ejemplo con <strong>texto en negrita</strong> y <em>texto en cursiva</em>.</p>\n        <img src="imagen.jpg" alt="Una imagen descriptiva">\n      </main>\n      <footer>\n        <p>&copy; 2025 Mi Sitio</p>\n      </footer>\n    </div>\n  </body>\n</html>`;
      switchTab('html');
      runMinify();
    }
  };

  /* ═══════════════════════════════════════════════════════
     EVENT LISTENERS
     ═══════════════════════════════════════════════════════ */

  /* Minify button */
  minifyBtn.addEventListener('click', runMinify);

  /* Copy */
  copyBtn.addEventListener('click', () => {
    if (!lastMinified) return;
    MiniDevTools.copyToClipboard(lastMinified, 'Código minificado copiado');
  });

  /* Download */
  downloadBtn.addEventListener('click', () => {
    if (!lastMinified) return;
    const extensions = { css: 'css', js: 'js', html: 'html' };
    const mimeTypes = { css: 'text/css', js: 'application/javascript', html: 'text/html' };
    const ext = extensions[activeTab] || 'txt';
    const mime = mimeTypes[activeTab] || 'text/plain';
    const blob = new Blob([lastMinified], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `minified.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    MiniDevTools.showToast('Archivo descargado', 'success');
  });

  /* Paste */
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      inputs[activeTab].value = text;
      MiniDevTools.showToast('Pegado del portapapeles', 'success');
      runMinify();
    } catch (err) {
      MiniDevTools.showToast('No se pudo acceder al portapapeles', 'error');
    }
  });

  /* Sample buttons */
  container.querySelectorAll('.mn-sample-btn').forEach(btn => {
    btn.addEventListener('click', () => samples[btn.dataset.lang]());
  });

  /* Clear buttons */
  container.querySelectorAll('.mn-clear-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      inputs[lang].value = '';
      output.textContent = '';
      status.innerHTML = '';
      statsEl.innerHTML = '';
      copyBtn.disabled = true;
      downloadBtn.disabled = true;
      lastMinified = '';
      ToolStorage.setField('minifier', lang + 'Input', '');
    });
  });

  /* Tab key in textareas */
  container.querySelectorAll('.cf-textarea').forEach(ta => {
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        ta.value = ta.value.substring(0, start) + '  ' + ta.value.substring(end);
        ta.selectionStart = ta.selectionEnd = start + 2;
      }
    });
  });

  /* ─── Auto-minify on load if saved content ─── */
  if (activeTab === 'css' && savedCSS) runMinify();
  if (activeTab === 'js' && savedJS) runMinify();
  if (activeTab === 'html' && savedHTML) runMinify();
}

/* Registro global para carga clasica (fallback) */
window['render_minifier'] = render_minifier;

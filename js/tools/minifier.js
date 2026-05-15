/* ═══════════════════════════════════════════════════════════════
   Minifier CSS/JS/HTML — Comprimir código para producción
   Features:
   - 3 lenguajes: CSS, JavaScript, HTML
   - Minificación en tiempo real al escribir/pegar
   - Estadísticas: tamaño original vs minificado + % de reducción
   - Copiar resultado al portapapeles
   - Descargar resultado como archivo
   - Botón limpiar / pegar desde portapapeles
   - Líneas de código contadas
   - Persistencia de preferencias con ToolStorage
   ═══════════════════════════════════════════════════════════════ */

window['render_minifier'] = function(container, toolMeta) {

  /* ─── Constants ─── */
  const LANGS = [
    { id: 'css', label: 'CSS', icon: 'fa-brands fa-css3-alt', placeholder: '/* Pegá tu CSS aquí */\nbody {\n  margin: 0;\n  padding: 20px;\n  background-color: #ffffff;\n  color: #333333;\n  font-family: Arial, sans-serif;\n}\n\n.container {\n  max-width: 1200px;\n  margin: 0 auto;\n  padding: 0 16px;\n}' },
    { id: 'js', label: 'JavaScript', icon: 'fa-brands fa-js', placeholder: '// Pegá tu JavaScript aquí\nfunction saludar(nombre) {\n  const mensaje = "Hola " + nombre;\n  console.log(mensaje);\n  return mensaje;\n}\n\nconst usuarios = ["Ana", "Juan", "Pedro"];\nusuarios.forEach(function(user) {\n  saludar(user);\n});' },
    { id: 'html', label: 'HTML', icon: 'fa-brands fa-html5', placeholder: '<!-- Pegá tu HTML aquí -->\n<!DOCTYPE html>\n<html lang="es">\n  <head>\n    <meta charset="UTF-8">\n    <title>Mi Página</title>\n    <link rel="stylesheet" href="styles.css">\n  </head>\n  <body>\n    <div class="container">\n      <h1>Hola Mundo</h1>\n      <p>Un párrafo de ejemplo</p>\n    </div>\n  </body>\n</html>' },
  ];

  /* ─── State ─── */
  const saved = ToolStorage.load('minifier');
  const s = saved ? saved.state : null;
  let currentLang = s ? (s.lang ?? 'css') : 'css';
  let inputCode = '';
  let minifiedCode = '';

  /* ═══════════════════════════════════════════════════════
     RENDER UI
     ═══════════════════════════════════════════════════════ */

  const langBtnsHTML = LANGS.map(l =>
    `<button class="mn-lang-btn ${currentLang === l.id ? 'active' : ''}" data-lang="${l.id}">
      <i class="${l.icon}"></i> ${l.label}
    </button>`
  ).join('');

  const activeLang = LANGS.find(l => l.id === currentLang);

  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title"><i class="${toolMeta.icon}" style="margin-right:8px;"></i>${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <!-- Language Selector -->
        <div class="mn-lang-bar" id="mn-lang-bar">
          ${langBtnsHTML}
        </div>

        <!-- Editor + Output Layout -->
        <div class="mn-layout">

          <!-- LEFT: Input -->
          <div class="mn-panel">
            <div class="mn-panel__header">
              <span class="mn-panel__title">Entrada</span>
              <div class="mn-panel__actions">
                <button class="btn btn--ghost btn--sm" id="mn-paste" title="Pegar del portapapeles">
                  <i class="fa-regular fa-clipboard"></i> Pegar
                </button>
                <button class="btn btn--ghost btn--sm" id="mn-clear" title="Limpiar">
                  <i class="fa-solid fa-eraser"></i> Limpiar
                </button>
              </div>
            </div>
            <div class="mn-editor-wrap">
              <textarea class="mn-editor" id="mn-input" placeholder="${activeLang.placeholder}" spellcheck="false"></textarea>
            </div>
            <div class="mn-stats" id="mn-input-stats">
              <span id="mn-input-chars">0 caracteres</span>
              <span class="mn-stats__sep">·</span>
              <span id="mn-input-lines">0 líneas</span>
              <span class="mn-stats__sep">·</span>
              <span id="mn-input-bytes">0 B</span>
            </div>
          </div>

          <!-- RIGHT: Output -->
          <div class="mn-panel">
            <div class="mn-panel__header">
              <span class="mn-panel__title">Minificado</span>
              <div class="mn-panel__actions">
                <button class="btn btn--ghost btn--sm" id="mn-copy" disabled>
                  <i class="fa-regular fa-copy"></i> Copiar
                </button>
                <button class="btn btn--ghost btn--sm" id="mn-download" disabled>
                  <i class="fa-solid fa-download"></i> Descargar
                </button>
              </div>
            </div>
            <div class="mn-output-wrap" id="mn-output-wrap">
              <pre class="mn-output" id="mn-output"><span class="mn-output-empty">El resultado aparecerá aquí...</span></pre>
            </div>
            <div class="mn-stats mn-stats--output" id="mn-output-stats">
              <span id="mn-output-chars">0 caracteres</span>
              <span class="mn-stats__sep">·</span>
              <span id="mn-output-lines">0 líneas</span>
              <span class="mn-stats__sep">·</span>
              <span id="mn-output-bytes">0 B</span>
              <span class="mn-stats__sep">·</span>
              <span id="mn-savings" class="mn-savings">—</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const langBar = document.getElementById('mn-lang-bar');
  const inputEditor = document.getElementById('mn-input');
  const outputEl = document.getElementById('mn-output');
  const copyBtn = document.getElementById('mn-copy');
  const downloadBtn = document.getElementById('mn-download');
  const pasteBtn = document.getElementById('mn-paste');
  const clearBtn = document.getElementById('mn-clear');
  const inputChars = document.getElementById('mn-input-chars');
  const inputLines = document.getElementById('mn-input-lines');
  const inputBytes = document.getElementById('mn-input-bytes');
  const outputChars = document.getElementById('mn-output-chars');
  const outputLines = document.getElementById('mn-output-lines');
  const outputBytesEl = document.getElementById('mn-output-bytes');
  const savingsEl = document.getElementById('mn-savings');

  /* ═══════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════ */

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function countLines(str) {
    if (!str) return 0;
    return str.split('\n').length;
  }

  function updateInputStats() {
    const val = inputCode;
    inputChars.textContent = val.length.toLocaleString('es-AR') + ' caracteres';
    inputLines.textContent = countLines(val).toLocaleString('es-AR') + ' líneas';
    inputBytes.textContent = formatBytes(new Blob([val]).size);
  }

  function updateOutputStats() {
    const val = minifiedCode;
    outputChars.textContent = val.length.toLocaleString('es-AR') + ' caracteres';
    outputLines.textContent = countLines(val).toLocaleString('es-AR') + ' líneas';
    outputBytesEl.textContent = formatBytes(new Blob([val]).size);

    if (inputCode.length > 0 && val.length > 0) {
      const origSize = new Blob([inputCode]).size;
      const minSize = new Blob([val]).size;
      if (origSize > 0) {
        const pct = Math.round((1 - minSize / origSize) * 100);
        const isReduction = pct > 0;
        savingsEl.textContent = (isReduction ? '−' : '+') + Math.abs(pct) + '%';
        savingsEl.className = 'mn-savings ' + (isReduction ? 'mn-savings--good' : 'mn-savings--bad');
      }
    } else {
      savingsEl.textContent = '—';
      savingsEl.className = 'mn-savings';
    }
  }

  /* ═══════════════════════════════════════════════════════
     MINIFIERS
     ═══════════════════════════════════════════════════════ */

  function minifyCSS(code) {
    let result = code;
    /* Remove multi-line comments */
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');
    /* Remove newlines and surrounding whitespace */
    result = result.replace(/\r?\n/g, '');
    /* Collapse multiple spaces/tabs into one */
    result = result.replace(/\s+/g, ' ');
    /* Remove space around { } : ; , */
    result = result.replace(/\s*{\s*/g, '{');
    result = result.replace(/\s*}\s*/g, '}');
    result = result.replace(/\s*:\s*/g, ':');
    result = result.replace(/\s*;\s*/g, ';');
    result = result.replace(/\s*,\s*/g, ',');
    /* Remove last semicolon before closing brace */
    result = result.replace(/;}/g, '}');
    /* Remove leading space */
    result = result.trim();
    return result;
  }

  function minifyJS(code) {
    let result = code;
    /* Tokenize: split into strings, regex, comments, and code */
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
            j++; /* closing slash */
            while (j < len && /[gimsuy]/.test(result[j])) j++;
            tokens.push({ type: 'regex', value: result.substring(i, j) });
            i = j;
            continue;
          }
        }
      }
      /* Regular character */
      tokens.push({ type: 'code', value: result[i] });
      i++;
    }

    /* Process tokens */
    let output = '';
    for (const token of tokens) {
      if (token.type === 'comment') {
        output += ' ';
      } else if (token.type === 'string' || token.type === 'regex') {
        output += token.value;
      } else {
        output += token.value;
      }
    }

    /* Collapse whitespace */
    output = output.replace(/\s+/g, ' ');
    /* Remove spaces around operators (safe ones) */
    output = output.replace(/\s*([{}();,=+\-*/<>!&|?:])\s*/g, '$1');
    /* Restore space after keywords */
    const keywords = ['var', 'let', 'const', 'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'yield', 'await', 'class', 'extends', 'import', 'export', 'from', 'default', 'function', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'with', 'debugger'];
    for (const kw of keywords) {
      const re = new RegExp('\\b' + kw + '\\b(?=[^\\s;})\\]])', 'g');
      output = output.replace(re, kw + ' ');
    }
    /* Remove space before ( */
    output = output.replace(/\s+\(/g, '(');
    /* Remove space before [ */
    output = output.replace(/\s+\[/g, '[');
    /* Remove space after ( */
    output = output.replace(/\(\s+/g, '(');
    /* Remove space before ; */
    output = output.replace(/\s+;/g, ';');
    /* Remove space after { */
    output = output.replace(/\{\s+/g, '{');
    /* Remove space before } */
    output = output.replace(/\s+\}/g, '}');
    /* Remove trailing space at start */
    output = output.trim();

    return output;
  }

  function minifyHTML(code) {
    let result = code;
    /* Remove HTML comments (but preserve conditional comments for IE) */
    result = result.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');
    /* Collapse whitespace between tags */
    result = result.replace(/>\s+</g, '><');
    /* Remove leading/trailing whitespace within tags */
    result = result.replace(/\s+>/g, '>');
    result = result.replace(/<\s+/g, '<');
    /* Collapse multiple spaces into one (outside of tags) */
    result = result.replace(/\s{2,}/g, ' ');
    /* Remove optional quotes from simple attribute values */
    result = result.replace(/(\w+)=["']([a-zA-Z0-9_-]+)["']/g, '$1=$2');
    /* Remove spaces around = in attributes */
    result = result.replace(/\s*=\s*/g, '=');
    /* Collapse whitespace in text content */
    result = result.replace(/\n\s*/g, '');
    result = result.trim();
    return result;
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
     MINIFY & UPDATE
     ═══════════════════════════════════════════════════════ */

  let debounceTimer = null;

  function runMinify() {
    inputCode = inputEditor.value;

    if (!inputCode.trim()) {
      outputEl.innerHTML = '<span class="mn-output-empty">El resultado aparecerá aquí...</span>';
      minifiedCode = '';
      copyBtn.disabled = true;
      downloadBtn.disabled = true;
      updateInputStats();
      updateOutputStats();
      return;
    }

    minifiedCode = minify(inputCode, currentLang);
    outputEl.textContent = minifiedCode;
    outputEl.className = 'mn-output mn-output--filled';
    copyBtn.disabled = false;
    downloadBtn.disabled = false;
    updateInputStats();
    updateOutputStats();
  }

  function debouncedMinify() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runMinify, 150);
  }

  /* ═══════════════════════════════════════════════════════
     LANGUAGE TOGGLE
     ═══════════════════════════════════════════════════════ */

  langBar.querySelectorAll('.mn-lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLang = btn.dataset.lang;
      langBar.querySelectorAll('.mn-lang-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      /* Update placeholder */
      const lang = LANGS.find(l => l.id === currentLang);
      inputEditor.placeholder = lang.placeholder;

      /* Re-minify if there's content */
      if (inputCode.trim()) runMinify();
      saveState();
    });
  });

  /* ═══════════════════════════════════════════════════════
     INPUT EVENTS
     ═══════════════════════════════════════════════════════ */

  inputEditor.addEventListener('input', debouncedMinify);

  /* Tab key inserts spaces */
  inputEditor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = inputEditor.selectionStart;
      const end = inputEditor.selectionEnd;
      inputEditor.value = inputEditor.value.substring(0, start) + '  ' + inputEditor.value.substring(end);
      inputEditor.selectionStart = inputEditor.selectionEnd = start + 2;
      debouncedMinify();
    }
  });

  /* ═══════════════════════════════════════════════════════
     ACTION BUTTONS
     ═══════════════════════════════════════════════════════ */

  /* Paste from clipboard */
  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      inputEditor.value = text;
      debouncedMinify();
      MiniDevTools.showToast('Pegado del portapapeles', 'success');
    } catch (err) {
      MiniDevTools.showToast('No se pudo acceder al portapapeles', 'error');
    }
  });

  /* Clear */
  clearBtn.addEventListener('click', () => {
    inputEditor.value = '';
    inputCode = '';
    minifiedCode = '';
    outputEl.innerHTML = '<span class="mn-output-empty">El resultado aparecerá aquí...</span>';
    outputEl.className = 'mn-output';
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
    updateInputStats();
    updateOutputStats();
    inputEditor.focus();
  });

  /* Copy */
  copyBtn.addEventListener('click', () => {
    if (!minifiedCode) return;
    navigator.clipboard.writeText(minifiedCode).then(() => {
      MiniDevTools.showToast('Copiado al portapapeles', 'success');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = minifiedCode;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      MiniDevTools.showToast('Copiado al portapapeles', 'success');
    });
  });

  /* Download */
  downloadBtn.addEventListener('click', () => {
    if (!minifiedCode) return;
    const extensions = { css: 'css', js: 'js', html: 'html' };
    const ext = extensions[currentLang] || 'txt';
    const mimeTypes = { css: 'text/css', js: 'application/javascript', html: 'text/html' };
    const mime = mimeTypes[currentLang] || 'text/plain';
    const blob = new Blob([minifiedCode], { type: mime });
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

  /* ═══════════════════════════════════════════════════════
     ROUTE CHANGE CLEANUP
     ═══════════════════════════════════════════════════════ */

  function cleanup() {
    inputCode = '';
    minifiedCode = '';
    clearTimeout(debounceTimer);
  }

  const onHashChange = () => {
    if (!container.offsetParent) cleanup();
  };
  window.addEventListener('hashchange', onHashChange);

  /* ═══════════════════════════════════════════════════════
     PERSISTENCE
     ═══════════════════════════════════════════════════════ */

  function saveState() {
    ToolStorage.setField('minifier', 'state', { lang: currentLang });
  }

  /* ─── Init stats ─── */
  updateInputStats();
  updateOutputStats();
};

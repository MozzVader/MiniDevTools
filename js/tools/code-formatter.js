/* ═══════════════════════════════════════════════════════════════
   Code Formatter — Formatear, minificar y validar código
   Auto-detect: JSON, HTML, CSS, JavaScript
   Syntax highlighting propio para cada lenguaje.
   Usa ToolStorage para persistir preferencias.
   ═══════════════════════════════════════════════════════════════ */

function render_code_formatter(container, toolMeta) {

  /* ─── State ─── */
  const saved = ToolStorage.load('code-formatter');
  const s = saved ? saved.state : null;
  const state = {
    input: s ? s.input : '',
    detectedLang: null,
    indent: s ? s.indent : 2,
  };

  let lastFormatted = '';

  /* ─── Language metadata ─── */
  const langInfo = {
    json:   { label: 'JSON',   icon: 'fa-solid fa-braces',     color: '#ea580c' },
    html:   { label: 'HTML',   icon: 'fa-solid fa-code',       color: '#2563eb' },
    css:    { label: 'CSS',    icon: 'fa-solid fa-palette',    color: '#7c3aed' },
    js:     { label: 'JavaScript', icon: 'fa-brands fa-js',    color: '#d97706' },
    unknown:{ label: 'Texto',  icon: 'fa-solid fa-file-lines', color: '#64748b' },
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

        <!-- Input -->
        <div class="form-group">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label class="label" style="margin-bottom:0;">Código de entrada</label>
            <div style="display:flex; gap:6px;">
              <button class="btn btn--ghost btn--sm" id="cf-sample">Ejemplo</button>
              <button class="btn btn--ghost btn--sm" id="cf-clear">Limpiar</button>
            </div>
          </div>
          <textarea class="input cf-textarea" id="cf-input" rows="10"
            placeholder='Pegá JSON, HTML, CSS o JavaScript acá...'
            spellcheck="false">${escapeHtml(state.input)}</textarea>
        </div>

        <!-- Action bar -->
        <div class="cf-actions">
          <button class="btn btn--primary" id="cf-format">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Formatear
          </button>
          <button class="btn btn--secondary" id="cf-minify">
            <i class="fa-solid fa-compress"></i> Minificar
          </button>
          <button class="btn btn--secondary" id="cf-copy" disabled>
            <i class="fa-regular fa-copy"></i> Copiar
          </button>

          <!-- Detected language badge -->
          <span class="cf-lang-badge cf-lang-badge--hidden" id="cf-lang-badge"></span>

          <div class="cf-indent-group">
            <label class="label" style="margin-bottom:0;">Indent:</label>
            <select class="input" id="cf-indent" style="width:auto; padding:6px 10px;">
              <option value="2" ${state.indent === 2 ? 'selected' : ''}>2 espacios</option>
              <option value="4" ${state.indent === 4 ? 'selected' : ''}>4 espacios</option>
              <option value="tab" ${state.indent === 'tab' ? 'selected' : ''}>Tab</option>
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
  const inputArea = document.getElementById('cf-input');
  const output = document.getElementById('cf-output');
  const status = document.getElementById('cf-status');
  const copyBtn = document.getElementById('cf-copy');
  const formatBtn = document.getElementById('cf-format');
  const minifyBtn = document.getElementById('cf-minify');
  const indentSelect = document.getElementById('cf-indent');
  const langBadge = document.getElementById('cf-lang-badge');

  /* ─── Indent Helper ─── */
  function getIndent() {
    const val = indentSelect.value;
    return val === 'tab' ? '\t' : ' '.repeat(parseInt(val));
  }

  indentSelect.addEventListener('change', () => {
    state.indent = indentSelect.value === 'tab' ? 'tab' : parseInt(indentSelect.value);
    ToolStorage.setField('code-formatter', 'state', { ...state });
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

  /* ═══════════════════════════════════════════════════════
     AUTO-DETECT LANGUAGE
     ═══════════════════════════════════════════════════════ */

  function detectLanguage(raw) {
    const trimmed = raw.trim();

    /* JSON: starts with { or [ and parses */
    if (/^[\[\{]/.test(trimmed)) {
      try {
        JSON.parse(trimmed);
        return 'json';
      } catch (e) {
        /* Not valid JSON, continue */
      }
    }

    /* HTML: contains HTML tags */
    if (/(?:<!DOCTYPE|<html|<head|<body|<div|<span|<table|<form|<section|<article|<header|<footer|<nav|<main|<ul|<ol|<p\b|<h[1-6]\b|<meta\b|<link\b|<script\b|<style\b)/i.test(trimmed)) {
      return 'html';
    }

    /* CSS: contains CSS rules (selector { property: value; }) */
    if (/(?:^|\n|\})\s*[\w\.\#\@\[\:\>\*\+\~][\w\-\.\#\:\[\]\*\>\+\~\,\s]*\{/m.test(trimmed) &&
        /(?:color|background|margin|padding|border|font|display|position|width|height|flex|grid|opacity|overflow|z-index|transition|animation)\s*:/im.test(trimmed)) {
      return 'css';
    }

    /* JavaScript: contains JS keywords/patterns */
    if (/\b(?:function|const|let|var|import|export|class|async|await|return|if\s*\(|for\s*\(|while\s*\(|switch\s*\(|try\s*\{|=>|\.\.)/.test(trimmed) &&
        !/<[a-z][\s\S]*>/i.test(trimmed)) {
      return 'js';
    }

    return 'unknown';
  }

  function updateLangBadge(lang) {
    state.detectedLang = lang;
    const info = langInfo[lang] || langInfo.unknown;

    langBadge.innerHTML = `<i class="${info.icon}"></i> ${info.label} detectado`;
    langBadge.style.setProperty('--cf-badge-color', info.color);
    langBadge.classList.remove('cf-lang-badge--hidden');
  }

  function hideLangBadge() {
    langBadge.classList.add('cf-lang-badge--hidden');
  }

  /* ═══════════════════════════════════════════════════════
     FORMAT / MINIFY dispatcher
     ═══════════════════════════════════════════════════════ */

  function runFormat(minify) {
    const raw = inputArea.value.trim();
    if (!raw) {
      setStatus('Pegá código para comenzar', 'info');
      output.textContent = '';
      copyBtn.disabled = true;
      lastFormatted = '';
      hideLangBadge();
      return;
    }

    const lang = detectLanguage(raw);
    updateLangBadge(lang);

    if (lang === 'json') {
      formatJSON(raw, minify);
    } else if (lang === 'html') {
      formatHTML(raw, minify);
    } else if (lang === 'css') {
      formatCSS(raw, minify);
    } else if (lang === 'js') {
      formatJS(raw, minify);
    } else {
      setStatus('No se pudo detectar el lenguaje. Intentá con JSON, HTML, CSS o JavaScript.', 'info');
      output.textContent = '';
      copyBtn.disabled = true;
      lastFormatted = '';
    }
  }

  /* ═══════════════════════════════════════════════════════
     JSON Engine
     ═══════════════════════════════════════════════════════ */

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

      saveState();
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

  /* ═══════════════════════════════════════════════════════
     HTML Engine
     ═══════════════════════════════════════════════════════ */

  function formatHTML(raw, minify) {
    if (minify) {
      lastFormatted = minifyHTML(raw);
      output.innerHTML = highlightHTML(lastFormatted);
      copyBtn.disabled = false;
      setStatus('HTML minificado', 'success');
      saveState();
      return;
    }

    try {
      lastFormatted = prettyPrintHTML(raw, getIndent());
      output.innerHTML = highlightHTML(lastFormatted);
      copyBtn.disabled = false;

      const doc = new DOMParser().parseFromString(raw, 'text/html');
      const tagCount = doc.querySelectorAll('*').length;
      const errCount = doc.querySelectorAll('parsererror').length;
      if (errCount > 0) {
        setStatus(`Advertencia: posibles errores de estructura (${tagCount} elementos)`, 'error');
      } else {
        setStatus(`${tagCount} elementos · HTML valido`, 'success');
      }

      saveState();
    } catch (e) {
      output.textContent = '';
      setStatus(`Error: ${e.message}`, 'error');
      copyBtn.disabled = true;
      lastFormatted = '';
    }
  }

  function minifyHTML(html) {
    return html
      .replace(/>\s+</g, '><')
      .replace(/\s{2,}/g, ' ')
      .replace(/\n/g, '')
      .replace(/<!--[\s\S]*?-->/g, '');
  }

  function prettyPrintHTML(html, indent) {
    indent = indent || '  ';
    let result = '';
    let level = 0;
    let inPre = false;

    const tokens = html.replace(/>\s*</g, '>\n<').split('\n');

    tokens.forEach(token => {
      token = token.trim();
      if (!token) return;

      if (token.match(/^<(pre|script|style)[\s>]/i) && !token.match(/\/\s*>$/)) {
        inPre = true;
      }
      if (inPre) {
        result += indent.repeat(level) + token + '\n';
        if (token.match(/<\/(pre|script|style)>$/i)) {
          inPre = false;
          level--;
        }
        return;
      }

      if (token.match(/^<\//)) {
        level = Math.max(0, level - 1);
        result += indent.repeat(level) + token + '\n';
      }
      else if (token.match(/^<(area|base|br|col|embed|hr|img|input|link|meta|source|track|wbr)\b/i) || token.match(/\/\s*>$/)) {
        result += indent.repeat(level) + token + '\n';
      }
      else if (token.match(/^</)) {
        result += indent.repeat(level) + token + '\n';
        level++;
      }
      else if (token.length > 0) {
        result += indent.repeat(level) + token + '\n';
      }
    });

    return result.trimEnd();
  }

  function highlightHTML(html) {
    html = escapeHtml(html);
    html = html.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="html-comment">$1</span>');
    html = html.replace(/(&lt;!DOCTYPE[^&]*&gt;)/gi, '<span class="html-doctype">$1</span>');
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

  /* ═══════════════════════════════════════════════════════
     CSS Engine
     ═══════════════════════════════════════════════════════ */

  function formatCSS(raw, minify) {
    try {
      if (minify) {
        lastFormatted = minifyCSS(raw);
      } else {
        lastFormatted = prettyPrintCSS(raw, getIndent());
      }

      output.innerHTML = highlightCSS(lastFormatted);
      copyBtn.disabled = false;

      const ruleCount = (lastFormatted.match(/\{/g) || []).length;
      setStatus(`${ruleCount} regla${ruleCount !== 1 ? 's' : ''} · CSS formateado`, 'success');

      saveState();
    } catch (e) {
      output.textContent = '';
      setStatus(`Error: ${e.message}`, 'error');
      copyBtn.disabled = true;
      lastFormatted = '';
    }
  }

  function minifyCSS(css) {
    return css
      .replace(/\/\*[\s\S]*?\*\//g, '')        // remove comments
      .replace(/\s*([{}:;,])\s*/g, '$1')        // strip spaces around punctuation
      .replace(/;\}/g, '}')                      // remove last semicolons
      .replace(/\n/g, '')                        // remove newlines
      .trim();
  }

  function prettyPrintCSS(css, indent) {
    indent = indent || '  ';
    let result = '';
    let level = 0;

    /* Remove existing indentation */
    css = css.replace(/^\s+/gm, '');

    /* Remove extra blank lines */
    css = css.replace(/\n{2,}/g, '\n');

    /* Split by opening braces to process rules */
    const parts = css.split(/(\{)/);

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();

      if (part === '{') {
        result += ' {\n';
        level++;
        continue;
      }

      if (part === '}') {
        level = Math.max(0, level - 1);
        result += indent.repeat(level) + '}\n';
        continue;
      }

      if (!part) continue;

      if (level === 0) {
        /* Selector line */
        result += part + '';
      } else {
        /* Inside a rule — properties */
        const props = part.split(';').filter(p => p.trim());
        for (const prop of props) {
          const trimmed = prop.trim();
          if (!trimmed) continue;
          /* Align colon */
          const colonIdx = trimmed.indexOf(':');
          if (colonIdx > -1) {
            const propName = trimmed.substring(0, colonIdx).trim();
            const propValue = trimmed.substring(colonIdx + 1).trim();
            result += indent.repeat(level) + propName + ': ' + propValue + ';\n';
          } else {
            result += indent.repeat(level) + trimmed + '\n';
          }
        }
      }
    }

    return result.trimEnd();
  }

  function highlightCSS(css) {
    css = escapeHtml(css);

    /* Comments */
    css = css.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="css-comment">$1</span>');

    /* Properties: name: value; */
    css = css.replace(/([\w-]+)(\s*:\s*)([^;{}]+)/g,
      '<span class="css-prop">$1</span>$2<span class="css-value">$3</span>'
    );

    /* Selectors (everything before { that isn't a property) */
    css = css.replace(/^([^{}\n][^\n]*?)(?=\s*\{)/gm,
      '<span class="css-selector">$1</span>'
    );

    /* Braces */
    css = css.replace(/([{}])/g, '<span class="css-bracket">$1</span>');

    /* @rules */
    css = css.replace(/(@[\w-]+)/g, '<span class="css-atrule">$1</span>');

    /* Units */
    css = css.replace(/\b(\d+\.?\d*)(px|em|rem|%|vh|vw|s|ms|deg|fr)\b/g,
      '$1<span class="css-unit">$2</span>'
    );

    /* Colors (#hex) */
    css = css.replace(/(#[0-9a-fA-F]{3,8})\b/g, '<span class="css-color">$1</span>');

    return css;
  }

  /* ═══════════════════════════════════════════════════════
     JavaScript Engine (basic brace-based indentation)
     ═══════════════════════════════════════════════════════ */

  function formatJS(raw, minify) {
    try {
      if (minify) {
        lastFormatted = minifyJS(raw);
      } else {
        lastFormatted = prettyPrintJS(raw, getIndent());
      }

      output.innerHTML = highlightJS(lastFormatted);
      copyBtn.disabled = false;

      const lineCount = lastFormatted.split('\n').length;
      setStatus(`${lineCount} lineas · JavaScript formateado`, 'success');

      saveState();
    } catch (e) {
      output.textContent = '';
      setStatus(`Error: ${e.message}`, 'error');
      copyBtn.disabled = true;
      lastFormatted = '';
    }
  }

  function minifyJS(js) {
    return js
      .replace(/\/\/.*$/gm, '')                     // single line comments
      .replace(/\/\*[\s\S]*?\*\//g, '')             // multi line comments
      .replace(/\s{2,}/g, ' ')                      // collapse spaces
      .replace(/\n/g, ' ')                           // collapse newlines
      .replace(/\s*([{}();,=+\-*/<>!&|?:])\s*/g, '$1')  // strip spaces around operators
      .trim();
  }

  function prettyPrintJS(js, indent) {
    indent = indent || '  ';
    const lines = js.split('\n');
    let result = '';
    let level = 0;
    let inComment = false;
    let inString = false;
    let stringChar = '';

    /* First pass: remove existing indentation */
    const cleaned = lines.map(l => {
      /* Detect if line starts with spaces/tabs and strip them */
      const match = l.match(/^([\s]*)(.*)/);
      return match ? match[2] : l;
    });

    for (let i = 0; i < cleaned.length; i++) {
      let line = cleaned[i];
      if (line === undefined) continue;
      let trimmed = line.trim();

      if (!trimmed) {
        result += '\n';
        continue;
      }

      /* Track multi-line comments */
      if (inComment) {
        result += indent.repeat(level) + trimmed + '\n';
        if (trimmed.includes('*/')) inComment = false;
        continue;
      }
      if (trimmed.startsWith('/*') && !trimmed.includes('*/')) {
        inComment = true;
        result += indent.repeat(level) + trimmed + '\n';
        continue;
      }

      /* Track strings (simplified — won't handle all edge cases) */
      let effectiveLine = trimmed;
      for (let c = 0; c < effectiveLine.length; c++) {
        const ch = effectiveLine[c];
        if (inString) {
          if (ch === stringChar && effectiveLine[c - 1] !== '\\') inString = false;
        } else {
          if (ch === '"' || ch === "'" || ch === '`') inString = true, stringChar = ch;
        }
      }

      /* Count braces (only outside strings and comments) */
      if (!inString) {
        /* Decrease before line for closing braces */
        const openBraces = (effectiveLine.match(/{/g) || []).length;
        const closeBraces = (effectiveLine.match(/}/g) || []).length;

        if (closeBraces > 0 && !trimmed.startsWith('//')) {
          /* For lines that start with }, decrease first */
          const netClose = Math.min(closeBraces, level);
          if (trimmed.startsWith('}') || trimmed.startsWith(']')) {
            level = Math.max(0, level - netClose);
          }
        }

        result += indent.repeat(level) + trimmed + '\n';

        /* Increase after line for opening braces */
        if (openBraces > closeBraces && !trimmed.startsWith('//')) {
          level += (openBraces - closeBraces);
        }

        /* Adjust for net closing that wasn't at start */
        if (closeBraces > openBraces && !trimmed.startsWith('}') && !trimmed.startsWith(']') && !trimmed.startsWith('//')) {
          level = Math.max(0, level - (closeBraces - openBraces));
        }
      } else {
        result += indent.repeat(level) + trimmed + '\n';
      }
    }

    return result.trimEnd();
  }

  function highlightJS(js) {
    js = escapeHtml(js);

    /* Comments */
    js = js.replace(/(\/\/.*$)/gm, '<span class="js-comment">$1</span>');
    js = js.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="js-comment">$1</span>');

    /* Strings */
    js = js.replace(/(&quot;(?:[^&]|&(?!quot;))*?&quot;)/g, '<span class="js-string">$1</span>');
    js = js.replace(/(&#39;(?:[^&]|&(?!#39;))*?&#39;)/g, '<span class="js-string">$1</span>');
    js = js.replace(/(`(?:[^`\\]|\\.)*`)/g, '<span class="js-string">$1</span>');

    /* Keywords */
    js = js.replace(/\b(function|const|let|var|if|else|for|while|do|switch|case|break|continue|return|new|class|extends|import|export|from|default|try|catch|finally|throw|typeof|instanceof|in|of|async|await|yield|this|super|static|get|set)\b/g,
      '<span class="js-keyword">$1</span>'
    );

    /* Booleans & special */
    js = js.replace(/\b(true|false|null|undefined|NaN|Infinity)\b/g, '<span class="js-boolean">$1</span>');

    /* Numbers */
    js = js.replace(/\b(\d+\.?\d*(?:e[+-]?\d+)?)\b/g, '<span class="js-number">$1</span>');

    /* Functions (word followed by parenthesis) */
    js = js.replace(/\b([a-zA-Z_$][\w$]*)\s*(?=\()/g, '<span class="js-function">$1</span>');

    return js;
  }

  /* ─── Shared Helpers ─── */
  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ─── Sample Data ─── */
  function loadSample() {
    const samples = {
      json: `{"proyecto":"MiniDevTools","version":"2.5","offline":true,"herramientas":["json-formatter","code-formatter","html-preview"],"autor":{"nombre":"MozzVader","repos":5}}`,
      html: `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>MiniDevTools</title></head><body><header><nav><a href="/">Inicio</a><a href="/tools">Herramientas</a></nav></header><main><h1>Hola Mundo</h1><p>Probá el Code Formatter</p></main></body></html>`,
      css: `.container{display:flex;flex-direction:column;gap:16px;padding:24px;max-width:1200px;margin:0 auto;}.header{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:20px;border-radius:12px;}.header h1{font-size:24px;font-weight:700;margin-bottom:8px;}@media(max-width:768px){.container{padding:16px;}}`,
      js: `function saludar(nombre){const mensaje="Hola, "+nombre+"!";console.log(mensaje);return{saludo:mensaje,timestamp:Date.now()};}const usuarios=["Ana","Juan","Maria"];usuarios.forEach(u=>{const resp=saludar(u);if(resp.saludo){document.body.innerHTML+="<p>"+resp.saludo+"</p>";}});`,
    };

    /* Cycle through samples */
    const keys = Object.keys(samples);
    const current = state.detectedLang;
    let nextIndex = 0;
    if (current && keys.indexOf(current) > -1) {
      nextIndex = (keys.indexOf(current) + 1) % keys.length;
    }
    const lang = keys[nextIndex];
    inputArea.value = samples[lang];

    /* Auto-format */
    runFormat(false);
  }

  /* ═══════════════════════════════════════════════════════
     PERSISTENCE
     ═══════════════════════════════════════════════════════ */

  function saveState() {
    state.input = inputArea.value;
    ToolStorage.setField('code-formatter', 'state', { ...state });
  }

  /* ═══════════════════════════════════════════════════════
     EVENTS
     ═══════════════════════════════════════════════════════ */

  formatBtn.addEventListener('click', () => runFormat(false));
  minifyBtn.addEventListener('click', () => runFormat(true));

  copyBtn.addEventListener('click', () => {
    if (!lastFormatted) return;
    const lang = state.detectedLang ? (langInfo[state.detectedLang] || langInfo.unknown).label : 'Codigo';
    MiniDevTools.copyToClipboard(lastFormatted, lang + ' copiado al portapapeles');
  });

  document.getElementById('cf-sample').addEventListener('click', loadSample);

  document.getElementById('cf-clear').addEventListener('click', () => {
    inputArea.value = '';
    output.textContent = '';
    status.innerHTML = '';
    copyBtn.disabled = true;
    lastFormatted = '';
    state.detectedLang = null;
    hideLangBadge();
    saveState();
  });

  /* ─── Auto-format on load if saved content ─── */
  if (state.input) {
    runFormat(false);
  }
}

/* Registro global para carga clasica (fallback) */
window['render_code-formatter'] = render_code_formatter;

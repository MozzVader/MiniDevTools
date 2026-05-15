/* ═══════════════════════════════════════════════════════════════
   URL Encode/Decode — Encodear y decodear URLs y componentes
   Features:
   - Encode: texto/URL → percent-encoded
   - Decode: percent-encoded → texto legible
   - Dos modos de encode: full (todo) vs component (preserva / : ? & = #)
   - Detección automática: si pega algo con %XX, sugiere decode
   - Info de tamaño: original vs convertido
   - Copiar resultado, Pegar, Limpiar
   - Persistencia con ToolStorage
   ═══════════════════════════════════════════════════════════════ */

window['render_url-encoder'] = function(container, toolMeta) {

  /* ─── State ─── */
  const saved = ToolStorage.load('url-encoder');
  const s = saved ? saved.state : null;
  let mode = s ? (s.mode ?? 'encode') : 'encode';
  let encodeType = s ? (s.encodeType ?? 'component') : 'component';
  let lastOutput = '';

  /* ─── Restore ─── */
  const savedInput = s ? (s.input ?? '') : '';

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

        <!-- Mode Toggle -->
        <label class="label">Modo</label>
        <div class="ue-mode-bar">
          <button class="ue-mode-btn ${mode === 'encode' ? 'ue-mode-btn--active' : ''}" data-mode="encode">
            <i class="fa-solid fa-lock"></i>
            <span>Encode</span>
          </button>
          <button class="ue-mode-btn ${mode === 'decode' ? 'ue-mode-btn--active' : ''}" data-mode="decode">
            <i class="fa-solid fa-lock-open"></i>
            <span>Decode</span>
          </button>
        </div>

        <!-- Encode Type (only visible in encode mode) -->
        <div id="ue-encode-type-wrap" style="${mode === 'encode' ? '' : 'display:none;'}">
          <label class="label" style="margin-top:14px;">Tipo de encode</label>
          <div class="ue-type-bar">
            <button class="ue-type-btn ${encodeType === 'component' ? 'ue-type-btn--active' : ''}" data-type="component">
              <i class="fa-solid fa-link"></i>
              <span>Componente</span>
            </button>
            <button class="ue-type-btn ${encodeType === 'full' ? 'ue-type-btn--active' : ''}" data-type="full">
              <i class="fa-solid fa-shield-halved"></i>
              <span>Full (todo)</span>
            </button>
          </div>
          <p class="ue-type-hint" id="ue-type-hint">
            ${encodeType === 'component'
              ? 'Preserva la estructura de la URL: <code>/</code> <code>:</code> <code>?</code> <code>&amp;</code> <code>=</code> <code>#</code>. Ideal para query params.'
              : 'Encodea todos los caracteres especiales. Ideal para valores individuales.'}
          </p>
        </div>

        <!-- Input -->
        <div class="form-group" style="margin-top:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label class="label" style="margin-bottom:0;" id="ue-input-label">${mode === 'encode' ? 'Texto / URL' : 'URL Encodeada'}</label>
            <div style="display:flex; gap:6px;">
              <button class="btn btn--ghost btn--sm" id="ue-paste"><i class="fa-regular fa-clipboard" style="margin-right:4px;"></i>Pegar</button>
              <button class="btn btn--ghost btn--sm" id="ue-clear"><i class="fa-solid fa-eraser" style="margin-right:4px;"></i>Limpiar</button>
            </div>
          </div>
          <textarea class="input ue-textarea" id="ue-input" rows="6" placeholder="${mode === 'encode' ? 'Escribí o pegá texto/URL aquí...' : 'Pegá texto encodeado aquí...'}" spellcheck="false">${escapeHtml(savedInput)}</textarea>
        </div>

        <!-- Process button -->
        <button class="btn btn--primary" id="ue-process" style="width:100%;">
          <i class="fa-solid fa-${mode === 'encode' ? 'lock' : 'lock-open'}" style="margin-right:6px;"></i>
          ${mode === 'encode' ? 'Encodear URL' : 'Decodear URL'}
        </button>

        <!-- Output -->
        <div id="ue-output-wrap">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label class="label" style="margin-bottom:0;">Resultado</label>
            <button class="btn btn--ghost btn--sm" id="ue-copy"><i class="fa-regular fa-copy" style="margin-right:4px;"></i>Copiar</button>
          </div>
          <div class="code-output" id="ue-output" style="min-height:80px; max-height:300px; overflow-y:auto; word-break:break-all;">
            <span style="color:var(--text-muted); font-style:italic;">El resultado aparecerá aquí...</span>
          </div>
        </div>

        <!-- Size info -->
        <div id="ue-info" class="ue-info"></div>

        <!-- Hint -->
        <div id="ue-hint" class="ue-hint"></div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const inputEl = document.getElementById('ue-input');
  const outputEl = document.getElementById('ue-output');
  const processBtn = document.getElementById('ue-process');
  const copyBtn = document.getElementById('ue-copy');
  const pasteBtn = document.getElementById('ue-paste');
  const clearBtn = document.getElementById('ue-clear');
  const inputLabel = document.getElementById('ue-input-label');
  const infoEl = document.getElementById('ue-info');
  const hintEl = document.getElementById('ue-hint');
  const encodeTypeWrap = document.getElementById('ue-encode-type-wrap');
  const typeHintEl = document.getElementById('ue-type-hint');
  const modeBtns = container.querySelectorAll('.ue-mode-btn');
  const typeBtns = container.querySelectorAll('.ue-type-btn');

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

  /* Check if string contains percent-encoded sequences */
  function isLikelyEncoded(str) {
    const trimmed = str.trim();
    if (trimmed.length < 3) return false;
    /* Count %XX sequences */
    const matches = trimmed.match(/%[0-9A-Fa-f]{2}/g);
    return matches && matches.length >= 1;
  }

  /* Encode: component mode (preserves URL structure chars) */
  function encodeComponent(str) {
    /* Split URL into parts, encode only the meaningful parts */
    try {
      /* If it looks like a full URL, parse it intelligently */
      if (/^https?:\/\//i.test(str)) {
        return encodeSmartUrl(str);
      }
      /* Otherwise, just encode as a component (preserves / ? = & # for user convenience) */
      return encodeURIComponent(str)
        .replace(/%20/g, '+')
        .replace(/%2F/g, '/')
        .replace(/%3A/g, ':')
        .replace(/%3D/g, '=')
        .replace(/%3F/g, '?')
        .replace(/%26/g, '&')
        .replace(/%23/g, '#')
        .replace(/%40/g, '@')
        .replace(/%2C/g, ',')
        .replace(/%24/g, '$')
        .replace(/%21/g, '!')
        .replace(/%27/g, "'")
        .replace(/%28/g, '(')
        .replace(/%29/g, ')')
        .replace(/%2A/g, '*')
        .replace(/%7E/g, '~')
        .replace(/%2B/g, '+');
    } catch (e) {
      return encodeURIComponent(str);
    }
  }

  /* Smart URL encoder: preserves protocol, host, path slashes, encodes query & hash values */
  function encodeSmartUrl(url) {
    try {
      /* Extract protocol */
      const protocolMatch = url.match(/^(https?:)\/\//i);
      const protocol = protocolMatch ? protocolMatch[0] : '';
      let rest = protocol ? url.slice(protocol.length) : url;

      /* Split by # for fragment */
      let fragment = '';
      if (rest.includes('#')) {
        const idx = rest.indexOf('#');
        fragment = rest.slice(idx);
        rest = rest.slice(0, idx);
      }

      /* Split by ? for query string */
      let queryString = '';
      let path = rest;
      if (rest.includes('?')) {
        const idx = rest.indexOf('?');
        queryString = rest.slice(idx + 1);
        path = rest.slice(0, idx);
      }

      /* Encode path segments individually (preserve slashes) */
      const encodedPath = path.split('/').map(segment => {
        if (!segment) return segment; /* keep leading/trailing slash */
        return encodeURIComponent(segment);
      }).join('/');

      /* Encode query param values (preserve = and &) */
      let encodedQuery = '';
      if (queryString) {
        encodedQuery = '?' + queryString.split('&').map(param => {
          const eqIdx = param.indexOf('=');
          if (eqIdx === -1) return encodeURIComponent(param);
          const key = encodeURIComponent(param.slice(0, eqIdx));
          const value = encodeURIComponent(param.slice(eqIdx + 1));
          return key + '=' + value;
        }).join('&');
      }

      /* Encode fragment */
      let encodedFragment = '';
      if (fragment) {
        encodedFragment = '#' + encodeURIComponent(fragment.slice(1));
      }

      return protocol + encodedPath + encodedQuery + encodedFragment;
    } catch (e) {
      /* Fallback to simple component encode */
      return encodeComponent(url);
    }
  }

  /* Encode: full mode (encodes everything) */
  function encodeFull(str) {
    return Array.from(str).map(ch => {
      const code = ch.codePointAt(0);
      /* Keep safe ASCII chars */
      if (
        (code >= 48 && code <= 57) ||   /* 0-9 */
        (code >= 65 && code <= 90) ||   /* A-Z */
        (code >= 97 && code <= 122)     /* a-z */
      ) {
        return ch;
      }
      /* Encode as UTF-8 percent */
      const bytes = new TextEncoder().encode(ch);
      return Array.from(bytes).map(b => '%' + b.toString(16).toUpperCase().padStart(2, '0')).join('');
    }).join('');
  }

  /* Decode */
  function decodeUrl(str) {
    try {
      /* Try decodeURIComponent first (handles full decode) */
      return decodeURIComponent(str);
    } catch (e) {
      /* If it fails, try a character-by-character approach */
      try {
        return decodeURIComponentPlus(str);
      } catch (e2) {
        throw new Error('No se pudo decodificar el texto. Verificá que sea un string encodeado válido.');
      }
    }
  }

  /* Robust decode: handles double-encoded or mixed content */
  function decodeURIComponentPlus(str) {
    return str.replace(/%[0-9A-Fa-f]{2}/g, match => {
      try {
        return decodeURIComponent(match);
      } catch (e) {
        return match; /* leave as-is if invalid */
      }
    });
  }

  /* ═══════════════════════════════════════════════════════
     PROCESS
     ═══════════════════════════════════════════════════════ */

  function process() {
    const raw = inputEl.value;

    if (!raw.trim()) {
      outputEl.innerHTML = '<span style="color:var(--text-muted); font-style:italic;">El resultado aparecerá aquí...</span>';
      lastOutput = '';
      infoEl.innerHTML = '';
      hintEl.innerHTML = '';
      return;
    }

    try {
      if (mode === 'encode') {
        if (encodeType === 'component') {
          lastOutput = encodeComponent(raw);
        } else {
          lastOutput = encodeFull(raw);
        }
      } else {
        /* Decode */
        lastOutput = decodeUrl(raw.trim());
      }

      /* Show result with highlighted % sequences */
      outputEl.innerHTML = highlightEncoded(lastOutput);

      /* Size info */
      const origSize = new Blob([raw]).size;
      const outSize = new Blob([lastOutput]).size;
      const pct = origSize > 0 ? Math.round(((outSize - origSize) / origSize) * 100) : 0;
      const isLarger = outSize > origSize;
      const sizeColor = isLarger ? 'var(--color-error, #ef4444)' : 'var(--color-success, #22c55e)';
      const sizeSign = isLarger ? '+' : '';

      infoEl.innerHTML = `
        <span>Entrada: <strong>${formatBytes(origSize)}</strong></span>
        <span style="opacity:0.4;">→</span>
        <span>Salida: <strong>${formatBytes(outSize)}</strong></span>
        <span style="color:${sizeColor}; font-weight:600;">${sizeSign}${pct}%</span>
      `;

      hintEl.innerHTML = '';

      /* Save */
      ToolStorage.setField('url-encoder', 'state', { mode, encodeType, input: raw });
    } catch (err) {
      outputEl.innerHTML = `<span style="color:var(--color-error, #ef4444);">Error: ${escapeHtml(err.message)}</span>`;
      lastOutput = '';
      infoEl.innerHTML = '';
    }
  }

  /* Highlight %XX sequences in the output for visual clarity */
  function highlightEncoded(str) {
    if (mode === 'encode') {
      /* Highlight encoded sequences */
      return escapeHtml(str).replace(/%[0-9A-Fa-f]{2}/g,
        '<span style="color:var(--accent); font-weight:600;">$&</span>');
    }
    /* Decode mode: just show plain text */
    return escapeHtml(str);
  }

  /* ═══════════════════════════════════════════════════════
     MODE SWITCH
     ═══════════════════════════════════════════════════════ */

  function setMode(newMode) {
    mode = newMode;
    modeBtns.forEach(b => b.classList.toggle('ue-mode-btn--active', b.dataset.mode === mode));
    inputLabel.textContent = mode === 'encode' ? 'Texto / URL' : 'URL Encodeada';
    inputEl.placeholder = mode === 'encode' ? 'Escribí o pegá texto/URL aquí...' : 'Pegá texto encodeado aquí...';
    processBtn.innerHTML = `<i class="fa-solid fa-${mode === 'encode' ? 'lock' : 'lock-open'}" style="margin-right:6px;"></i>${mode === 'encode' ? 'Encodear URL' : 'Decodear URL'}`;

    /* Toggle encode type section */
    encodeTypeWrap.style.display = mode === 'encode' ? '' : 'none';

    outputEl.innerHTML = '<span style="color:var(--text-muted); font-style:italic;">El resultado aparecerá aquí...</span>';
    lastOutput = '';
    infoEl.innerHTML = '';
    hintEl.innerHTML = '';
    ToolStorage.setField('url-encoder', 'state', { mode, encodeType, input: inputEl.value });
  }

  function setEncodeType(newType) {
    encodeType = newType;
    typeBtns.forEach(b => b.classList.toggle('ue-type-btn--active', b.dataset.type === encodeType));
    typeHintEl.innerHTML = encodeType === 'component'
      ? 'Preserva la estructura de la URL: <code>/</code> <code>:</code> <code>?</code> <code>&amp;</code> <code>=</code> <code>#</code>. Ideal para query params.'
      : 'Encodea todos los caracteres especiales. Ideal para valores individuales.';
    ToolStorage.setField('url-encoder', 'state', { mode, encodeType, input: inputEl.value });

    /* Re-process if there's input */
    if (inputEl.value.trim()) process();
  }

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });

  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => setEncodeType(btn.dataset.type));
  });

  /* ═══════════════════════════════════════════════════════
     EVENT LISTENERS
     ═══════════════════════════════════════════════════════ */

  processBtn.addEventListener('click', process);

  /* Keyboard shortcut: Enter/Ctrl+Enter to process */
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      process();
    }
  });

  /* Auto-detect on input: if mode is encode but looks encoded, show hint */
  inputEl.addEventListener('input', () => {
    const val = inputEl.value.trim();
    if (val.length > 3 && mode === 'encode' && isLikelyEncoded(val)) {
      hintEl.innerHTML = '<span style="color:var(--accent); font-size:12px;"><i class="fa-solid fa-lightbulb" style="margin-right:4px;"></i>Esto parece estar encodeado. ¿Querés decodificarlo? <button class="ue-hint-btn" id="ue-switch-hint" style="background:none;border:none;color:var(--accent);cursor:pointer;font-weight:600;text-decoration:underline;font-size:12px;padding:0;">Cambiar a Decode</button></span>';
      const hintBtn = document.getElementById('ue-switch-hint');
      if (hintBtn) {
        hintBtn.addEventListener('click', () => {
          setMode('decode');
          process();
        });
      }
    } else {
      hintEl.innerHTML = '';
    }
  });

  /* Copy */
  copyBtn.addEventListener('click', () => {
    if (!lastOutput) return;
    navigator.clipboard.writeText(lastOutput).then(() => {
      MiniDevTools.showToast('Copiado al portapapeles', 'success');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = lastOutput;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      MiniDevTools.showToast('Copiado al portapapeles', 'success');
    });
  });

  /* Paste */
  pasteBtn.addEventListener('click', async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      inputEl.value = clipText;
      MiniDevTools.showToast('Pegado del portapapeles', 'success');
      /* Trigger hint detection */
      inputEl.dispatchEvent(new Event('input'));
    } catch (err) {
      MiniDevTools.showToast('No se pudo acceder al portapapeles', 'error');
    }
  });

  /* Clear */
  clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    outputEl.innerHTML = '<span style="color:var(--text-muted); font-style:italic;">El resultado aparecerá aquí...</span>';
    lastOutput = '';
    infoEl.innerHTML = '';
    hintEl.innerHTML = '';
    inputEl.focus();
    ToolStorage.setField('url-encoder', 'state', { mode, encodeType, input: '' });
  });

  /* ═══════════════════════════════════════════════════════
     ROUTE CHANGE CLEANUP
     ═══════════════════════════════════════════════════════ */

  function cleanup() {
    lastOutput = '';
  }

  const onHashChange = () => {
    if (!container.offsetParent) cleanup();
  };
  window.addEventListener('hashchange', onHashChange);
};

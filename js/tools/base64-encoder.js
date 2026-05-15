/* ═══════════════════════════════════════════════════════════════
   Base64 Encode/Decode — Codificar y decodificar en base64
   Features:
   - Encode: texto plano → base64
   - Decode: base64 → texto plano
   - UTF-8 safe (soporta ñ, acentos, emojis)
   - Botones de dirección: Encode ↔ Decode (como flechas swap)
   - Copiar resultado, Pegar, Limpiar
   - Detección automática: si pega algo que parece base64, sugiere decode
   - Info de tamaño: original vs convertido
   - Persistencia con ToolStorage
   ═══════════════════════════════════════════════════════════════ */

window['render_base64-encoder'] = function(container, toolMeta) {

  /* ─── State ─── */
  const saved = ToolStorage.load('base64-encoder');
  const s = saved ? saved.state : null;
  let mode = s ? (s.mode ?? 'encode') : 'encode';
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
        <div class="b64-mode-bar">
          <button class="b64-mode-btn ${mode === 'encode' ? 'b64-mode-btn--active' : ''}" data-mode="encode">
            <i class="fa-solid fa-lock"></i>
            <span>Encode</span>
          </button>
          <button class="b64-mode-btn ${mode === 'decode' ? 'b64-mode-btn--active' : ''}" data-mode="decode">
            <i class="fa-solid fa-lock-open"></i>
            <span>Decode</span>
          </button>
        </div>

        <!-- Input -->
        <div class="form-group" style="margin-top:16px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label class="label" style="margin-bottom:0;" id="b64-input-label">${mode === 'encode' ? 'Texto plano' : 'Base64'}</label>
            <div style="display:flex; gap:6px;">
              <button class="btn btn--ghost btn--sm" id="b64-paste"><i class="fa-regular fa-clipboard" style="margin-right:4px;"></i>Pegar</button>
              <button class="btn btn--ghost btn--sm" id="b64-clear"><i class="fa-solid fa-eraser" style="margin-right:4px;"></i>Limpiar</button>
            </div>
          </div>
          <textarea class="input b64-textarea" id="b64-input" rows="6" placeholder="${mode === 'encode' ? 'Escribí o pegá texto aquí...' : 'Pegá texto base64 aquí...'}" spellcheck="false">${escapeHtml(savedInput)}</textarea>
        </div>

        <!-- Process button -->
        <button class="btn btn--primary" id="b64-process" style="width:100%;">
          <i class="fa-solid fa-${mode === 'encode' ? 'lock' : 'lock-open'}" style="margin-right:6px;"></i>
          ${mode === 'encode' ? 'Codificar a Base64' : 'Decodificar desde Base64'}
        </button>

        <!-- Output -->
        <div id="b64-output-wrap">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label class="label" style="margin-bottom:0;">Resultado</label>
            <button class="btn btn--ghost btn--sm" id="b64-copy"><i class="fa-regular fa-copy" style="margin-right:4px;"></i>Copiar</button>
          </div>
          <div class="code-output" id="b64-output" style="min-height:80px; max-height:300px; overflow-y:auto; word-break:break-all;">
            <span style="color:var(--text-muted); font-style:italic;">El resultado aparecerá aquí...</span>
          </div>
        </div>

        <!-- Size info -->
        <div id="b64-info" class="b64-info"></div>

        <!-- Hint -->
        <div id="b64-hint" class="b64-hint"></div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const inputEl = document.getElementById('b64-input');
  const outputEl = document.getElementById('b64-output');
  const processBtn = document.getElementById('b64-process');
  const copyBtn = document.getElementById('b64-copy');
  const pasteBtn = document.getElementById('b64-paste');
  const clearBtn = document.getElementById('b64-clear');
  const inputLabel = document.getElementById('b64-input-label');
  const infoEl = document.getElementById('b64-info');
  const hintEl = document.getElementById('b64-hint');
  const modeBtns = container.querySelectorAll('.b64-mode-btn');

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

  /* UTF-8 safe Base64 */
  function utf8ToBase64(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }

  function base64ToUtf8(str) {
    const binary = atob(str);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    return decoded;
  }

  /* Check if decoded content is mostly printable text */
  function isPrintableText(str) {
    if (!str) return false;
    let printable = 0;
    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      /* Printable ASCII, common Latin, CJK ranges, newlines/tabs */
      if (code >= 32 && code <= 126 || code === 9 || code === 10 || code === 13 || code === 8230 ||
          code >= 160 && code <= 255 || code >= 0x2000 && code <= 0x206F ||
          code >= 0x20A0 && code <= 0x20CF || code >= 0x2100 && code <= 0x214F ||
          code >= 0x4E00 && code <= 0x9FFF || code >= 0x3040 && code <= 0x30FF) {
        printable++;
      }
    }
    const total = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').length;
    return total > 0 && (printable / total) > 0.8;
  }

  /* Strip data URI prefix if present */
  function stripDataUri(str) {
    const match = str.match(/^data:[^,]+, (.*)$/s);
    return match ? match[1].trim() : str.trim();
  }

  function isLikelyBase64(str) {
    const trimmed = str.trim();
    if (trimmed.length < 4) return false;
    /* Base64 chars only (with optional padding) */
    return /^[A-Za-z0-9+/]*={0,2}$/.test(trimmed) && trimmed.length % 4 === 0;
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
        lastOutput = utf8ToBase64(raw);
      } else {
        /* Validate base64 before decoding */
        const cleaned = raw.trim();
        if (!isLikelyBase64(cleaned)) {
          outputEl.innerHTML = '<span style="color:var(--color-error, #ef4444);">El texto no parece ser base64 válido</span>';
          lastOutput = '';
          infoEl.innerHTML = '';
          return;
        }
        /* Strip data URI prefix if pasted full data URI */
        const pureBase64 = stripDataUri(cleaned);
        lastOutput = base64ToUtf8(pureBase64);

        /* Check if result is binary (e.g. image, file) */
        if (!isPrintableText(lastOutput)) {
          outputEl.innerHTML = '<span style="color:var(--color-error, #ef4444);"><i class="fa-solid fa-triangle-exclamation" style="margin-right:6px;"></i>El contenido decodificado es datos binarios (imagen, archivo, etc.) y no se puede mostrar como texto.</span>';
          lastOutput = '';
          infoEl.innerHTML = '';
          return;
        }
      }

      outputEl.textContent = lastOutput;

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
      ToolStorage.setField('base64-encoder', 'state', { mode, input: raw });
    } catch (err) {
      outputEl.innerHTML = `<span style="color:var(--color-error, #ef4444);">Error: ${escapeHtml(err.message)}</span>`;
      lastOutput = '';
      infoEl.innerHTML = '';
    }
  }

  /* ═══════════════════════════════════════════════════════
     MODE SWITCH
     ═══════════════════════════════════════════════════════ */

  function setMode(newMode) {
    mode = newMode;
    modeBtns.forEach(b => b.classList.toggle('b64-mode-btn--active', b.dataset.mode === mode));
    inputLabel.textContent = mode === 'encode' ? 'Texto plano' : 'Base64';
    inputEl.placeholder = mode === 'encode' ? 'Escribí o pegá texto aquí...' : 'Pegá texto base64 aquí (o un data URI)...';
    processBtn.innerHTML = `<i class="fa-solid fa-${mode === 'encode' ? 'lock' : 'lock-open'}" style="margin-right:6px;"></i>${mode === 'encode' ? 'Codificar a Base64' : 'Decodificar desde Base64'}`;
    outputEl.innerHTML = '<span style="color:var(--text-muted); font-style:italic;">El resultado aparecerá aquí...</span>';
    lastOutput = '';
    infoEl.innerHTML = '';
    hintEl.innerHTML = '';
    ToolStorage.setField('base64-encoder', 'state', { mode, input: inputEl.value });
  }

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode));
  });

  /* ═══════════════════════════════════════════════════════
     EVENT LISTENERS
     ═══════════════════════════════════════════════════════ */

  processBtn.addEventListener('click', process);

  /* Auto-detect on paste: if mode is encode but looks like base64, show hint */
  inputEl.addEventListener('input', () => {
    const val = inputEl.value.trim();
    if (val.length > 8 && mode === 'encode' && isLikelyBase64(val)) {
      hintEl.innerHTML = '<span style="color:var(--accent); font-size:12px;"><i class="fa-solid fa-lightbulb" style="margin-right:4px;"></i>Esto parece base64. ¿Querés decodificarlo? <button class="b64-hint-btn" id="b64-switch-hint" style="background:none;border:none;color:var(--accent);cursor:pointer;font-weight:600;text-decoration:underline;font-size:12px;padding:0;">Cambiar a Decode</button></span>';
      const hintBtn = document.getElementById('b64-switch-hint');
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
    ToolStorage.setField('base64-encoder', 'state', { mode, input: '' });
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

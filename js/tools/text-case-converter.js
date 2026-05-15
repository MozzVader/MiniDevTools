/* ═══════════════════════════════════════════════════════════════
   Text Case Converter — Convertir entre mayúsculas, camelCase, snake_case...
   Features:
   - 10 conversiones: UPPER, lower, Title, Sentence, camelCase, PascalCase,
     snake_case, kebab-case, CONSTANT_CASE, dot.case
   - Input + Output lado a lado
   - Click en cualquier conversión para copiar
   - Botón swap (pasar output a input)
   - Pegar / Limpiar / Copiar
   - Preview en tiempo real de todas las conversiones
   - Persistencia con ToolStorage
   ═══════════════════════════════════════════════════════════════ */

window['render_text-case-converter'] = function(container, toolMeta) {

  /* ─── State ─── */
  const saved = ToolStorage.load('text-case-converter');
  const s = saved ? saved.state : null;
  let lastOutput = '';
  let debounceTimer = null;

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

        <!-- Input -->
        <div class="form-group">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label class="label" style="margin-bottom:0;">Texto de entrada</label>
            <div style="display:flex; gap:6px;">
              <button class="btn btn--ghost btn--sm" id="tc-paste"><i class="fa-regular fa-clipboard" style="margin-right:4px;"></i>Pegar</button>
              <button class="btn btn--ghost btn--sm" id="tc-clear"><i class="fa-solid fa-eraser" style="margin-right:4px;"></i>Limpiar</button>
            </div>
          </div>
          <textarea class="input tc-textarea" id="tc-input" rows="4" placeholder="Escribí o pegá texto aquí..." spellcheck="false">${escapeHtml(savedInput)}</textarea>
        </div>

        <!-- Conversions Grid -->
        <div class="tc-grid" id="tc-grid"></div>

        <!-- Actions -->
        <div class="cf-actions" style="margin-top:12px;">
          <button class="btn btn--secondary" id="tc-copy-output" disabled><i class="fa-regular fa-copy" style="margin-right:4px;"></i>Copiar resultado</button>
          <button class="btn btn--ghost" id="tc-swap"><i class="fa-solid fa-arrow-right-arrow-left" style="margin-right:4px;"></i>Usar como entrada</button>
        </div>

        <!-- Status -->
        <div id="tc-status" class="cf-status"></div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const input = document.getElementById('tc-input');
  const grid = document.getElementById('tc-grid');
  const copyOutputBtn = document.getElementById('tc-copy-output');
  const swapBtn = document.getElementById('tc-swap');
  const pasteBtn = document.getElementById('tc-paste');
  const clearBtn = document.getElementById('tc-clear');
  const statusEl = document.getElementById('tc-status');

  /* ═══════════════════════════════════════════════════════
     CONVERSIONS DEFINITION
     ═══════════════════════════════════════════════════════ */

  const CONVERSIONS = [
    { id: 'upper',      label: 'UPPERCASE',     icon: 'fa-solid fa-arrow-up',       desc: 'Todo en mayúsculas' },
    { id: 'lower',      label: 'lowercase',     icon: 'fa-solid fa-arrow-down',     desc: 'Todo en minúsculas' },
    { id: 'title',      label: 'Title Case',    icon: 'fa-solid fa-heading',        desc: 'Capitalizar cada palabra' },
    { id: 'sentence',   label: 'Sentence case', icon: 'fa-solid fa-align-left',     desc: 'Solo primera letra de cada oración' },
    { id: 'camel',      label: 'camelCase',     icon: 'fa-solid fa-code',           desc: 'Primera minúscula, resto en PascalCase' },
    { id: 'pascal',     label: 'PascalCase',    icon: 'fa-solid fa-code',           desc: 'Cada palabra capitalizada sin espacios' },
    { id: 'snake',      label: 'snake_case',    icon: 'fa-solid fa-underscore',     desc: 'Palabras con guión bajo' },
    { id: 'kebab',      label: 'kebab-case',    icon: 'fa-solid fa-minus',          desc: 'Palabras con guión medio' },
    { id: 'constant',   label: 'CONSTANT_CASE', icon: 'fa-solid fa-bolt',           desc: 'Mayúsculas con guión bajo' },
    { id: 'dot',        label: 'dot.case',      icon: 'fa-solid fa-ellipsis',       desc: 'Palabras con puntos' },
  ];

  /* ═══════════════════════════════════════════════════════
     CONVERSION FUNCTIONS
     ═══════════════════════════════════════════════════════ */

  /* Split text into words, handling camelCase, snake_case, kebab-case, etc. */
  function splitWords(text) {
    /* Replace separators with spaces, split camelCase, then split on spaces */
    return text
      .replace(/([a-z])([A-Z])/g, '$1 $2')      /* camelCase → camel Case */
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') /* XMLParser → XML Parser */
      .replace(/[_\-\.]+/g, ' ')                  /* snake_case, kebab-case, dot.case */
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  function toUpperCase(text) {
    return text.toUpperCase();
  }

  function toLowerCase(text) {
    return text.toLowerCase();
  }

  function toTitleCase(text) {
    return text.replace(/\b\w+/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  }

  function toSentenceCase(text) {
    /* Split on sentence-ending punctuation */
    return text.replace(/(^[a-záéíóúñüàèìòùäëïöüâêîôû]|[\.\!\?]\s+[a-záéíóúñüàèìòùäëïöüâêîôû])/gi,
      match => match.toUpperCase());
  }

  function toCamelCase(text) {
    const words = splitWords(text);
    if (words.length === 0) return '';
    return words[0].toLowerCase() + words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  }

  function toPascalCase(text) {
    const words = splitWords(text);
    return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
  }

  function toSnakeCase(text) {
    const words = splitWords(text);
    return words.map(w => w.toLowerCase()).join('_');
  }

  function toKebabCase(text) {
    const words = splitWords(text);
    return words.map(w => w.toLowerCase()).join('-');
  }

  function toConstantCase(text) {
    const words = splitWords(text);
    return words.map(w => w.toUpperCase()).join('_');
  }

  function toDotCase(text) {
    const words = splitWords(text);
    return words.map(w => w.toLowerCase()).join('.');
  }

  function convert(text, id) {
    switch (id) {
      case 'upper':    return toUpperCase(text);
      case 'lower':    return toLowerCase(text);
      case 'title':    return toTitleCase(text);
      case 'sentence': return toSentenceCase(text);
      case 'camel':    return toCamelCase(text);
      case 'pascal':   return toPascalCase(text);
      case 'snake':    return toSnakeCase(text);
      case 'kebab':    return toKebabCase(text);
      case 'constant': return toConstantCase(text);
      case 'dot':      return toDotCase(text);
      default:         return text;
    }
  }

  /* ═══════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════ */

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function truncate(str, max) {
    if (str.length <= max) return str;
    return str.substring(0, max) + '...';
  }

  /* ═══════════════════════════════════════════════════════
     BUILD GRID
     ═══════════════════════════════════════════════════════ */

  /* Build the cards once */
  grid.innerHTML = CONVERSIONS.map(c => `
    <div class="tc-card" data-id="${c.id}">
      <div class="tc-card__header">
        <div class="tc-card__label">
          <i class="${c.icon}"></i>
          <span>${c.label}</span>
        </div>
        <button class="tc-card__copy" data-id="${c.id}" title="Copiar">
          <i class="fa-regular fa-copy"></i>
        </button>
      </div>
      <div class="tc-card__desc">${c.desc}</div>
      <div class="tc-card__value" id="tc-val-${c.id}">
        <span class="tc-card__empty">—</span>
      </div>
    </div>
  `).join('');

  /* ═══════════════════════════════════════════════════════
     UPDATE CONVERSIONS
     ═══════════════════════════════════════════════════════ */

  let activeConversionId = null;

  function updateConversions() {
    const text = input.value;

    if (!text.trim()) {
      CONVERSIONS.forEach(c => {
        document.getElementById(`tc-val-${c.id}`).innerHTML = '<span class="tc-card__empty">—</span>';
      });
      lastOutput = '';
      copyOutputBtn.disabled = true;
      statusEl.innerHTML = '';
      return;
    }

    let firstResult = true;
    CONVERSIONS.forEach(c => {
      const result = convert(text, c.id);
      const el = document.getElementById(`tc-val-${c.id}`);
      el.textContent = result;
      el.title = result; /* Full text on hover */

      if (firstResult) {
        lastOutput = result;
        firstResult = false;
      }
    });

    copyOutputBtn.disabled = false;

    /* Show char count */
    const wordCount = splitWords(text).length;
    statusEl.innerHTML = `<span style="color:var(--text-muted);">${text.length.toLocaleString('es-AR')} caracteres · ${wordCount} palabras detectadas</span>`;

    /* Save */
    ToolStorage.setField('text-case-converter', 'state', { input: text });
  }

  function debouncedUpdate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateConversions, 100);
  }

  /* ═══════════════════════════════════════════════════════
     EVENT LISTENERS
     ═══════════════════════════════════════════════════════ */

  input.addEventListener('input', debouncedUpdate);

  /* Copy individual conversion */
  grid.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.tc-card__copy');
    if (!copyBtn) return;
    const id = copyBtn.dataset.id;
    const text = input.value;
    if (!text.trim()) return;
    const result = convert(text, id);
    lastOutput = result;
    navigator.clipboard.writeText(result).then(() => {
      MiniDevTools.showToast(`${CONVERSIONS.find(c => c.id === id).label} copiado`, 'success');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = result;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      MiniDevTools.showToast(`${CONVERSIONS.find(c => c.id === id).label} copiado`, 'success');
    });
  });

  /* Click on card value to select that conversion as "active" */
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.tc-card');
    if (!card || e.target.closest('.tc-card__copy')) return;
    const id = card.dataset.id;
    const text = input.value;
    if (!text.trim()) return;
    lastOutput = convert(text, id);

    /* Highlight active card */
    grid.querySelectorAll('.tc-card').forEach(c => c.classList.remove('tc-card--active'));
    card.classList.add('tc-card--active');
    activeConversionId = id;
  });

  /* Copy last active/conversion output */
  copyOutputBtn.addEventListener('click', () => {
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

  /* Swap: move lastOutput to input */
  swapBtn.addEventListener('click', () => {
    if (!lastOutput) {
      MiniDevTools.showToast('No hay resultado para usar', 'error');
      return;
    }
    input.value = lastOutput;
    updateConversions();
    MiniDevTools.showToast('Resultado movido a entrada', 'success');
  });

  /* Paste */
  pasteBtn.addEventListener('click', async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      input.value = clipText;
      updateConversions();
      MiniDevTools.showToast('Pegado del portapapeles', 'success');
    } catch (err) {
      MiniDevTools.showToast('No se pudo acceder al portapapeles', 'error');
    }
  });

  /* Clear */
  clearBtn.addEventListener('click', () => {
    input.value = '';
    updateConversions();
    input.focus();
    grid.querySelectorAll('.tc-card').forEach(c => c.classList.remove('tc-card--active'));
  });

  /* ═══════════════════════════════════════════════════════
     ROUTE CHANGE CLEANUP
     ═══════════════════════════════════════════════════════ */

  function cleanup() {
    lastOutput = '';
    clearTimeout(debounceTimer);
  }

  const onHashChange = () => {
    if (!container.offsetParent) cleanup();
  };
  window.addEventListener('hashchange', onHashChange);

  /* ─── Init ─── */
  if (savedInput) updateConversions();
};

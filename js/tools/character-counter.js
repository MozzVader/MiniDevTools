/* ═══════════════════════════════════════════════════════════════
   Character Counter — Contar caracteres, palabras, oraciones
   Features:
   - Conteo en tiempo real al escribir/pegar
   - Caracteres (con y sin espacios)
   - Palabras, oraciones, párrafos, líneas
   - Tiempo de lectura y tiempo de habla
   - Top 5 palabras más frecuentes
   - Botones: Pegar, Limpiar, Copiar
   - Persistencia del input con ToolStorage
   ═══════════════════════════════════════════════════════════════ */

window['render_character-counter'] = function(container, toolMeta) {

  /* ─── State ─── */
  let text = '';
  let debounceTimer = null;

  /* ─── Restore saved input ─── */
  const savedInput = ToolStorage.getField('character-counter', 'input', '');

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
            <label class="label" style="margin-bottom:0;">Texto</label>
            <div style="display:flex; gap:6px;">
              <button class="btn btn--ghost btn--sm" id="cc-paste"><i class="fa-regular fa-clipboard" style="margin-right:4px;"></i>Pegar</button>
              <button class="btn btn--ghost btn--sm" id="cc-clear"><i class="fa-solid fa-eraser" style="margin-right:4px;"></i>Limpiar</button>
              <button class="btn btn--ghost btn--sm" id="cc-copy-text"><i class="fa-regular fa-copy" style="margin-right:4px;"></i>Copiar texto</button>
            </div>
          </div>
          <textarea class="input cc-textarea" id="cc-input" rows="8" placeholder="Escribí o pegá tu texto aquí..." spellcheck="true">${escapeHtml(savedInput)}</textarea>
        </div>

        <!-- Stats Grid -->
        <div class="cc-stats-grid">

          <div class="cc-stat-card">
            <div class="cc-stat-card__value" id="cc-chars">0</div>
            <div class="cc-stat-card__label">Caracteres</div>
          </div>

          <div class="cc-stat-card">
            <div class="cc-stat-card__value" id="cc-chars-ns">0</div>
            <div class="cc-stat-card__label">Sin espacios</div>
          </div>

          <div class="cc-stat-card">
            <div class="cc-stat-card__value" id="cc-words">0</div>
            <div class="cc-stat-card__label">Palabras</div>
          </div>

          <div class="cc-stat-card">
            <div class="cc-stat-card__value" id="cc-sentences">0</div>
            <div class="cc-stat-card__label">Oraciones</div>
          </div>

          <div class="cc-stat-card">
            <div class="cc-stat-card__value" id="cc-paragraphs">0</div>
            <div class="cc-stat-card__label">Párrafos</div>
          </div>

          <div class="cc-stat-card">
            <div class="cc-stat-card__value" id="cc-lines">0</div>
            <div class="cc-stat-card__label">Líneas</div>
          </div>

          <div class="cc-stat-card">
            <div class="cc-stat-card__value" id="cc-read-time">0 min</div>
            <div class="cc-stat-card__label">Lectura</div>
          </div>

          <div class="cc-stat-card">
            <div class="cc-stat-card__value" id="cc-speak-time">0 min</div>
            <div class="cc-stat-card__label">Habla</div>
          </div>

        </div>

        <!-- Top Words -->
        <div class="cc-top-words" id="cc-top-words" style="display:none;">
          <div class="cc-top-words__title">Palabras más usadas</div>
          <div class="cc-top-words__list" id="cc-top-words-list"></div>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const input = document.getElementById('cc-input');
  const pasteBtn = document.getElementById('cc-paste');
  const clearBtn = document.getElementById('cc-clear');
  const copyTextBtn = document.getElementById('cc-copy-text');

  const charsEl = document.getElementById('cc-chars');
  const charsNsEl = document.getElementById('cc-chars-ns');
  const wordsEl = document.getElementById('cc-words');
  const sentencesEl = document.getElementById('cc-sentences');
  const paragraphsEl = document.getElementById('cc-paragraphs');
  const linesEl = document.getElementById('cc-lines');
  const readTimeEl = document.getElementById('cc-read-time');
  const speakTimeEl = document.getElementById('cc-speak-time');

  const topWordsWrap = document.getElementById('cc-top-words');
  const topWordsList = document.getElementById('cc-top-words-list');

  /* ═══════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════ */

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function countWords(str) {
    if (!str.trim()) return 0;
    return str.trim().split(/\s+/).length;
  }

  function countSentences(str) {
    if (!str.trim()) return 0;
    /* Split on sentence-ending punctuation */
    const matches = str.match(/[.!?]+[\s"')\]]*(?=[A-ZÀ-ÿ\u00C0-\u024F]|\s*$)/g);
    return matches ? matches.length : 0;
  }

  function countParagraphs(str) {
    if (!str.trim()) return 0;
    /* Paragraphs are separated by one or more blank lines */
    const paras = str.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    return paras.length;
  }

  function countLines(str) {
    if (!str) return 0;
    return str.split('\n').length;
  }

  function formatTime(minutes) {
    if (minutes < 1) {
      const secs = Math.ceil(minutes * 60);
      return secs + ' seg';
    }
    if (minutes < 60) {
      const mins = Math.floor(minutes);
      const secs = Math.round((minutes - mins) * 60);
      return secs > 0 ? `${mins} min ${secs} seg` : `${mins} min`;
    }
    const hrs = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return mins > 0 ? `${hrs} h ${mins} min` : `${hrs} h`;
  }

  function getTopWords(str, limit) {
    if (!str.trim()) return [];
    limit = limit || 5;
    /* Normalize and split into words */
    const words = str
      .toLowerCase()
      .replace(/[^a-záéíóúñüàèìòùäëïöüâêîôûßç\d'-]/gi, ' ')
      .trim()
      .split(/\s+/)
      .filter(w => w.length > 1); /* Skip single characters */

    /* Count frequencies */
    const freq = {};
    for (const w of words) {
      freq[w] = (freq[w] || 0) + 1;
    }

    /* Sort by frequency and return top N */
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }

  /* ═══════════════════════════════════════════════════════
     UPDATE STATS
     ═══════════════════════════════════════════════════════ */

  function updateStats() {
    text = input.value;

    /* Basic counts */
    const charCount = text.length;
    const charNsCount = text.replace(/\s/g, '').length;
    const wordCount = countWords(text);
    const sentenceCount = countSentences(text);
    const paragraphCount = countParagraphs(text);
    const lineCount = countLines(text);

    /* Reading/speaking time (based on word count) */
    const WORDS_PER_MIN_READ = 200;
    const WORDS_PER_MIN_SPEAK = 130;
    const readMin = wordCount / WORDS_PER_MIN_READ;
    const speakMin = wordCount / WORDS_PER_MIN_SPEAK;

    /* Update DOM */
    charsEl.textContent = charCount.toLocaleString('es-AR');
    charsNsEl.textContent = charNsCount.toLocaleString('es-AR');
    wordsEl.textContent = wordCount.toLocaleString('es-AR');
    sentencesEl.textContent = sentenceCount.toLocaleString('es-AR');
    paragraphsEl.textContent = paragraphCount.toLocaleString('es-AR');
    linesEl.textContent = lineCount.toLocaleString('es-AR');
    readTimeEl.textContent = formatTime(readMin);
    speakTimeEl.textContent = formatTime(speakMin);

    /* Top words */
    const topWords = getTopWords(text, 5);
    if (topWords.length > 0) {
      topWordsWrap.style.display = '';
      const maxCount = topWords[0][1];
      topWordsList.innerHTML = topWords.map(([word, count]) => {
        const pct = Math.round((count / maxCount) * 100);
        return `
          <div class="cc-word-item">
            <span class="cc-word-item__word">${escapeHtml(word)}</span>
            <div class="cc-word-item__bar-wrap">
              <div class="cc-word-item__bar" style="width:${pct}%;"></div>
            </div>
            <span class="cc-word-item__count">${count}</span>
          </div>
        `;
      }).join('');
    } else {
      topWordsWrap.style.display = 'none';
    }

    /* Save input */
    ToolStorage.setField('character-counter', 'input', text);
  }

  function debouncedUpdate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updateStats, 100);
  }

  /* ═══════════════════════════════════════════════════════
     EVENT LISTENERS
     ═══════════════════════════════════════════════════════ */

  input.addEventListener('input', debouncedUpdate);

  /* Paste */
  pasteBtn.addEventListener('click', async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      input.value = clipText;
      updateStats();
      MiniDevTools.showToast('Pegado del portapapeles', 'success');
    } catch (err) {
      MiniDevTools.showToast('No se pudo acceder al portapapeles', 'error');
    }
  });

  /* Clear */
  clearBtn.addEventListener('click', () => {
    input.value = '';
    updateStats();
    input.focus();
  });

  /* Copy text */
  copyTextBtn.addEventListener('click', () => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      MiniDevTools.showToast('Texto copiado al portapapeles', 'success');
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      MiniDevTools.showToast('Texto copiado al portapapeles', 'success');
    });
  });

  /* ═══════════════════════════════════════════════════════
     ROUTE CHANGE CLEANUP
     ═══════════════════════════════════════════════════════ */

  function cleanup() {
    text = '';
    clearTimeout(debounceTimer);
  }

  const onHashChange = () => {
    if (!container.offsetParent) cleanup();
  };
  window.addEventListener('hashchange', onHashChange);

  /* ─── Init ─── */
  if (savedInput) updateStats();
};

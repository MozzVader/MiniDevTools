/* ═══════════════════════════════════════════════════════════════
   Diff Viewer — Comparador de texto con diferencias resaltadas
   Features:
   - Two text areas for original and modified text
   - LCS-based line diff algorithm
   - Color-coded: red (removed), green (added), default (unchanged)
   - Line numbers for both original and modified sides
   - Stats: additions, deletions, unchanged
   - Options: ignore whitespace, ignore case
   - Copy diff output
   - Persistence with ToolStorage
   ═══════════════════════════════════════════════════════════════ */

window['render_diff-viewer'] = function(container, toolMeta) {

  /* ─── State ─── */
  const saved = ToolStorage.load('diff-viewer');
  const s = saved ? saved.state : null;

  const state = {
    original: s ? s.original : '',
    modified: s ? s.modified : '',
    ignoreWhitespace: s ? (s.ignoreWhitespace ?? false) : false,
    ignoreCase: s ? (s.ignoreCase ?? false) : false,
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

        <div class="dv-layout">

          <!-- ═══ Inputs ═══ -->
          <div class="dv-inputs">
            <div class="dv-input-group">
              <div class="dv-input-label">
                <span><i class="fa-solid fa-file-lines" style="color:#dc2626;"></i> Original</span>
                <span class="dv-line-count" id="dv-orig-count">0 líneas</span>
              </div>
              <textarea class="dv-textarea input" id="dv-original" placeholder="Pegá el texto original aquí...">${escapeHtml(state.original)}</textarea>
            </div>
            <div class="dv-input-group">
              <div class="dv-input-label">
                <span><i class="fa-solid fa-file-pen" style="color:#16a34a;"></i> Modificado</span>
                <span class="dv-line-count" id="dv-mod-count">0 líneas</span>
              </div>
              <textarea class="dv-textarea input" id="dv-modified" placeholder="Pegá el texto modificado aquí...">${escapeHtml(state.modified)}</textarea>
            </div>
          </div>

          <!-- ═══ Options Bar ═══ -->
          <div class="dv-options-bar">
            <label class="dv-checkbox">
              <input type="checkbox" id="dv-ignore-ws"${state.ignoreWhitespace ? ' checked' : ''}>
              Ignorar espacios en blanco
            </label>
            <label class="dv-checkbox">
              <input type="checkbox" id="dv-ignore-case"${state.ignoreCase ? ' checked' : ''}>
              Ignorar mayúsculas/minúsculas
            </label>
            <div class="dv-options-spacer"></div>
            <button class="dv-clear-btn" id="dv-clear">
              <i class="fa-solid fa-eraser"></i> Limpiar
            </button>
            <button class="dv-compare-btn" id="dv-compare">
              <i class="fa-solid fa-code-compare"></i> Comparar
            </button>
          </div>

          <!-- ═══ Stats ═══ -->
          <div class="dv-stats dv-stats--hidden" id="dv-stats">
            <div class="dv-stat dv-stat--modified">
              <i class="fa-solid fa-pen"></i>
              <strong id="dv-modified">0</strong> modificadas
            </div>
            <div class="dv-stat dv-stat--added">
              <i class="fa-solid fa-plus"></i>
              <strong id="dv-added">0</strong> agregadas
            </div>
            <div class="dv-stat dv-stat--removed">
              <i class="fa-solid fa-minus"></i>
              <strong id="dv-removed">0</strong> eliminadas
            </div>
            <div class="dv-stat dv-stat--unchanged">
              <i class="fa-solid fa-equals"></i>
              <strong id="dv-unchanged">0</strong> sin cambios
            </div>
            <div class="dv-stats-spacer"></div>
            <span class="dv-stats-label" id="dv-summary"></span>
          </div>

          <!-- ═══ Diff Result ═══ -->
          <div class="dv-result dv-result--hidden" id="dv-result">
            <div class="dv-scroll" id="dv-scroll">
              <table class="dv-table" id="dv-table">
                <thead>
                  <tr>
                    <th>Orig</th>
                    <th>Mod</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody id="dv-tbody"></tbody>
              </table>
            </div>
          </div>

          <div class="dv-empty" id="dv-empty">
            <i class="fa-solid fa-code-compare"></i>
            Ingresá texto en ambos paneles y presioná "Comparar"
          </div>

          <!-- ═══ Copy ═══ -->
          <div class="dv-copy-bar" id="dv-copy-bar" style="display:none;">
            <button class="dv-copy-btn" id="dv-copy-unified"><i class="fa-regular fa-copy"></i> Copiar diff unificado</button>
          </div>

        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const origArea = document.getElementById('dv-original');
  const modArea = document.getElementById('dv-modified');
  const origCount = document.getElementById('dv-orig-count');
  const modCount = document.getElementById('dv-mod-count');
  const ignoreWs = document.getElementById('dv-ignore-ws');
  const ignoreCase = document.getElementById('dv-ignore-case');
  const statsEl = document.getElementById('dv-stats');
  const resultEl = document.getElementById('dv-result');
  const emptyEl = document.getElementById('dv-empty');
  const tbody = document.getElementById('dv-tbody');
  const modifiedEl = document.getElementById('dv-modified');
  const addedEl = document.getElementById('dv-added');
  const removedEl = document.getElementById('dv-removed');
  const unchangedEl = document.getElementById('dv-unchanged');
  const summaryEl = document.getElementById('dv-summary');
  const copyBar = document.getElementById('dv-copy-bar');

  /* ═══════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════ */

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function updateLineCounts() {
    const origLines = origArea.value.split('\n').length;
    const modLines = modArea.value.split('\n').length;
    origCount.textContent = origLines + ' línea' + (origLines !== 1 ? 's' : '');
    modCount.textContent = modLines + ' línea' + (modLines !== 1 ? 's' : '');
  }

  /* ═══════════════════════════════════════════════════════
     LCS DIFF ALGORITHM
     ═══════════════════════════════════════════════════════ */

  function prepareLine(line) {
    let l = line;
    if (state.ignoreWhitespace) l = l.replace(/\s+/g, ' ').trim();
    if (state.ignoreCase) l = l.toLowerCase();
    return l;
  }

  function lcsTable(a, b) {
    /* Build LCS DP table */
    const m = a.length;
    const n = b.length;
    const dp = [];
    for (let i = 0; i <= m; i++) {
      dp[i] = new Array(n + 1).fill(0);
    }
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (a[i - 1] === b[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }
    return dp;
  }

  function backtrackDiff(dp, a, b) {
    /* Backtrack to get diff operations */
    const ops = [];
    let i = a.length;
    let j = b.length;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
        ops.push({ type: 'equal', origLine: i, modLine: j, text: null /* use originals */ });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        ops.push({ type: 'added', modLine: j, text: null });
        j--;
      } else {
        ops.push({ type: 'removed', origLine: i, text: null });
        i--;
      }
    }

    ops.reverse();

    /* Fill in original text and mod text */
    /* We need the original line arrays */
    return ops;
  }

  function computeDiff(origLines, modLines) {
    const a = origLines.map(l => prepareLine(l));
    const b = modLines.map(l => prepareLine(l));
    const dp = lcsTable(a, b);
    const ops = backtrackDiff(dp, a, b);

    const diffLines = [];
    for (const op of ops) {
      if (op.type === 'equal') {
        diffLines.push({
          type: 'equal',
          origNum: op.origLine,
          modNum: op.modLine,
          text: origLines[op.origLine - 1]
        });
      } else if (op.type === 'removed') {
        diffLines.push({
          type: 'removed',
          origNum: op.origLine,
          modNum: null,
          text: origLines[op.origLine - 1]
        });
      } else {
        diffLines.push({
          type: 'added',
          origNum: null,
          modNum: op.modLine,
          text: modLines[op.modLine - 1]
        });
      }
    }

    return postProcessDiff(diffLines);
  }

  /* ═══════════════════════════════════════════════════════
     POST-PROCESS: Group removed+added pairs as "modified"
     ═══════════════════════════════════════════════════════ */

  function postProcessDiff(diffLines) {
    const result = [];
    let i = 0;

    while (i < diffLines.length) {
      /* Check for a run of consecutive removed followed by consecutive added */
      if (diffLines[i].type === 'removed') {
        /* Collect consecutive removed */
        const removedGroup = [];
        while (i < diffLines.length && diffLines[i].type === 'removed') {
          removedGroup.push(diffLines[i]);
          i++;
        }

        /* Collect consecutive added that follow */
        const addedGroup = [];
        while (i < diffLines.length && diffLines[i].type === 'added') {
          addedGroup.push(diffLines[i]);
          i++;
        }

        /* Pair them up: each removed line pairs with an added line → "modified" */
        const pairCount = Math.min(removedGroup.length, addedGroup.length);

        for (let p = 0; p < pairCount; p++) {
          result.push({
            type: 'modified',
            origNum: removedGroup[p].origNum,
            modNum: addedGroup[p].modNum,
            oldText: removedGroup[p].text,
            newText: addedGroup[p].text,
          });
        }

        /* Unpaired removed lines stay as removed */
        for (let p = pairCount; p < removedGroup.length; p++) {
          result.push(removedGroup[p]);
        }

        /* Unpaired added lines stay as added */
        for (let p = pairCount; p < addedGroup.length; p++) {
          result.push(addedGroup[p]);
        }
      } else {
        result.push(diffLines[i]);
        i++;
      }
    }

    return result;
  }

  /* ═══════════════════════════════════════════════════════
     WORD-LEVEL DIFF within a modified line
     ═══════════════════════════════════════════════════════ */

  function wordDiff(oldText, newText) {
    /* Split by words (keeping spaces/sep as tokens) */
    const oldWords = oldText.split(/(\s+)/);
    const newWords = newText.split(/(\s+)/);

    const m = oldWords.length;
    const n = newWords.length;

    /* Build LCS table for words */
    const dp = [];
    for (let i = 0; i <= m; i++) {
      dp[i] = new Array(n + 1).fill(0);
    }
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (oldWords[i - 1] === newWords[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    /* Backtrack to get word-level operations */
    const fragments = [];
    let wi = m, wj = n;

    while (wi > 0 || wj > 0) {
      if (wi > 0 && wj > 0 && oldWords[wi - 1] === newWords[wj - 1]) {
        fragments.push({ type: 'equal', text: oldWords[wi - 1] });
        wi--;
        wj--;
      } else if (wj > 0 && (wi === 0 || dp[wi][wj - 1] >= dp[wi - 1][wj])) {
        fragments.push({ type: 'added', text: newWords[wj - 1] });
        wj--;
      } else {
        fragments.push({ type: 'removed', text: oldWords[wi - 1] });
        wi--;
      }
    }

    fragments.reverse();

    /* Render HTML: equal = normal, removed = red strikethrough, added = green */
    let html = '';
    for (const frag of fragments) {
      const escaped = escapeHtml(frag.text);
      if (frag.type === 'equal') {
        html += escaped;
      } else if (frag.type === 'removed') {
        html += `<span class="dv-word--removed">${escaped}</span>`;
      } else {
        html += `<span class="dv-word--added">${escaped}</span>`;
      }
    }

    return html;
  }

  /* ═══════════════════════════════════════════════════════
     RENDER DIFF
     ═══════════════════════════════════════════════════════ */

  let lastDiffLines = [];

  function renderDiff(diffLines) {
    lastDiffLines = diffLines;
    tbody.innerHTML = '';

    let modified = 0, added = 0, removed = 0, unchanged = 0;

    for (const line of diffLines) {
      const tr = document.createElement('tr');
      tr.className = 'dv-line-' + line.type;

      /* Original line number */
      const tdOrigNum = document.createElement('td');
      tdOrigNum.textContent = line.origNum !== null ? line.origNum : '';

      /* Modified line number */
      const tdModNum = document.createElement('td');
      tdModNum.textContent = line.modNum !== null ? line.modNum : '';

      /* Marker + content */
      const tdContent = document.createElement('td');

      if (line.type === 'modified') {
        /* Modified line: show word-level diff */
        tdContent.innerHTML = '<span class="dv-marker dv-marker--modified">~</span> ' + wordDiff(line.oldText, line.newText);
        modified++;
      } else if (line.type === 'removed') {
        tdContent.innerHTML = '<span class="dv-marker dv-marker--removed">-</span> ' + escapeHtml(line.text);
        removed++;
      } else if (line.type === 'added') {
        tdContent.innerHTML = '<span class="dv-marker dv-marker--added">+</span> ' + escapeHtml(line.text);
        added++;
      } else {
        tdContent.innerHTML = '<span class="dv-marker dv-marker--equal"> </span> ' + escapeHtml(line.text);
        unchanged++;
      }

      tr.appendChild(tdOrigNum);
      tr.appendChild(tdModNum);
      tr.appendChild(tdContent);
      tbody.appendChild(tr);
    }

    /* Update stats */
    modifiedEl.textContent = modified;
    addedEl.textContent = added;
    removedEl.textContent = removed;
    unchangedEl.textContent = unchanged;

    const total = modified + added + removed;
    if (total === 0) {
      summaryEl.textContent = 'Los textos son idénticos';
      summaryEl.style.color = '#16a34a';
    } else {
      summaryEl.textContent = total + ' cambio' + (total !== 1 ? 's' : '') + ' en total';
      summaryEl.style.color = '';
    }

    statsEl.classList.remove('dv-stats--hidden');
    resultEl.classList.remove('dv-result--hidden');
    emptyEl.style.display = 'none';
    copyBar.style.display = '';
  }

  /* ═══════════════════════════════════════════════════════
     COMPARE
     ═══════════════════════════════════════════════════════ */

  function compare() {
    state.original = origArea.value;
    state.modified = modArea.value;
    state.ignoreWhitespace = ignoreWs.checked;
    state.ignoreCase = ignoreCase.checked;

    const origLines = state.original.split('\n');
    const modLines = state.modified.split('\n');

    const diffLines = computeDiff(origLines, modLines);
    renderDiff(diffLines);
    saveState();
  }

  /* ═══════════════════════════════════════════════════════
     CLEAR
     ═══════════════════════════════════════════════════════ */

  function clearAll() {
    origArea.value = '';
    modArea.value = '';
    state.original = '';
    state.modified = '';
    tbody.innerHTML = '';
    statsEl.classList.add('dv-stats--hidden');
    resultEl.classList.add('dv-result--hidden');
    emptyEl.style.display = '';
    copyBar.style.display = 'none';
    lastDiffLines = [];
    updateLineCounts();
    saveState();
  }

  /* ═══════════════════════════════════════════════════════
     COPY UNIFIED DIFF
     ═══════════════════════════════════════════════════════ */

  function copyUnified() {
    if (lastDiffLines.length === 0) return;
    let text = '';
    for (const line of lastDiffLines) {
      if (line.type === 'modified') text += '~ ' + line.oldText + '\n+ ' + line.newText + '\n';
      else if (line.type === 'removed') text += '- ' + line.text + '\n';
      else if (line.type === 'added') text += '+ ' + line.text + '\n';
      else text += '  ' + line.text + '\n';
    }
    MiniDevTools.copyToClipboard(text, 'Diff copiado!');
  }

  /* ═══════════════════════════════════════════════════════
     EVENTS
     ═══════════════════════════════════════════════════════ */

  document.getElementById('dv-compare').addEventListener('click', compare);
  document.getElementById('dv-clear').addEventListener('click', clearAll);
  document.getElementById('dv-copy-unified').addEventListener('click', copyUnified);

  origArea.addEventListener('input', () => { updateLineCounts(); });
  modArea.addEventListener('input', () => { updateLineCounts(); });

  /* Auto-compare on option change if both areas have content */
  [ignoreWs, ignoreCase].forEach(el => {
    el.addEventListener('change', () => {
      if (origArea.value.trim() || modArea.value.trim()) compare();
    });
  });

  /* ═══════════════════════════════════════════════════════
     PERSISTENCE
     ═══════════════════════════════════════════════════════ */

  function saveState() {
    ToolStorage.setField('diff-viewer', 'state', { ...state });
  }

  /* ═══════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════ */

  updateLineCounts();

  /* Auto-compare if saved content exists */
  if (state.original || state.modified) {
    compare();
  }
};

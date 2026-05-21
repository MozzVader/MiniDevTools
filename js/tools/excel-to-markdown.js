/* ═══════════════════════════════════════════════════════════════
   Excel to Markdown Converter
   Features:
   - Paste from Excel/Sheets (auto-detect TSV)
   - Upload CSV/TSV files
   - Manual textarea input
   - First row as header toggle
   - Column alignment (left/center/right)
   - Outer pipes toggle
   - Cell padding toggle
   - Copy & download .md
   - Persistence with ToolStorage
   ═══════════════════════════════════════════════════════════════ */

window['render_excel-to-markdown'] = function(container, toolMeta) {

  /* ─── State ─── */
  const saved = ToolStorage.load('excel-to-markdown');
  const s = saved ? saved.state : null;
  const state = {
    input: s ? s.input : '',
    hasHeader: s ? (s.hasHeader !== false) : true,
    outerPipes: s ? (s.outerPipes !== false) : true,
    cellPadding: s ? (s.cellPadding !== false) : true,
    align: s ? (s.align || 'auto') : 'auto',  // 'auto' | 'left' | 'center' | 'right'
    delimiter: 'auto',  // 'auto' | 'tab' | 'comma' | 'semicolon'
  };

  let lastMarkdown = '';

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

        <div class="em-layout">

          <!-- ═══ Input Section ═══ -->
          <div class="em-input-section">
            <div class="em-section-header">
              <label class="label" style="margin-bottom:0;">Datos de entrada</label>
              <div style="display:flex; gap:6px;">
                <label class="btn btn--ghost btn--sm em-upload-label" title="Subir CSV o TSV">
                  <i class="fa-solid fa-file-upload"></i> Subir CSV/TSV
                  <input type="file" id="em-file" accept=".csv,.tsv,.txt" style="display:none;">
                </label>
                <button class="btn btn--ghost btn--sm" id="cf-sample">Ejemplo</button>
                <button class="btn btn--ghost btn--sm" id="cf-clear">Limpiar</button>
              </div>
            </div>
            <textarea class="input em-textarea" id="em-input" rows="6"
              placeholder="Copiá desde Excel/Google Sheets y pegá acá...&#10;&#10;o escribí datos separados por tabuladores/comas."
              spellcheck="false">${escapeHtml(state.input)}</textarea>

            <!-- ═══ Options ═══ -->
            <div class="em-options">
              <label class="em-checkbox">
                <input type="checkbox" id="em-header" ${state.hasHeader ? 'checked' : ''}>
                Primera fila como encabezado
              </label>
              <label class="em-checkbox">
                <input type="checkbox" id="em-outer-pipes" ${state.outerPipes ? 'checked' : ''}>
                Outer pipes
              </label>
              <label class="em-checkbox">
                <input type="checkbox" id="em-cell-padding" ${state.cellPadding ? 'checked' : ''}>
                Cell padding
              </label>
              <div class="em-separator"></div>
              <div class="em-align-group">
                <span class="em-label">Alineación:</span>
                <select class="input em-select" id="em-align">
                  <option value="auto" ${state.align === 'auto' ? 'selected' : ''}>Auto</option>
                  <option value="left" ${state.align === 'left' ? 'selected' : ''}>Izquierda (:---)</option>
                  <option value="center" ${state.align === 'center' ? 'selected' : ''}>Centro (:---:)</option>
                  <option value="right" ${state.align === 'right' ? 'selected' : ''}>Derecha (---:)</option>
                </select>
              </div>
            </div>

            <div class="em-hint">
              <i class="fa-solid fa-lightbulb"></i> Seleccioná celdas en Excel y <strong>Ctrl+C</strong>, después pegá acá con <strong>Ctrl+V</strong>
            </div>
          </div>

          <!-- ═══ Output Section ═══ -->
          <div class="em-output-section">
            <div class="em-section-header">
              <label class="label" style="margin-bottom:0;">Markdown</label>
              <div class="em-output-actions">
                <button class="btn btn--primary btn--sm em-action-btn" id="em-copy" disabled>
                  <i class="fa-regular fa-copy"></i> Copiar
                </button>
                <button class="btn btn--primary btn--sm em-action-btn" id="em-download" disabled>
                  <i class="fa-solid fa-download"></i> Descargar .md
                </button>
              </div>
            </div>
            <pre class="em-output" id="em-output"><span class="em-output-placeholder">La tabla Markdown aparecerá acá...</span></pre>
            <!-- ═══ Stats ═══ -->
            <div class="em-stats" id="em-stats"></div>
          </div>

        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const inputArea = document.getElementById('em-input');
  const outputEl = document.getElementById('em-output');
  const statsEl = document.getElementById('em-stats');
  const hintEl = document.getElementById('em-hint');
  const headerCb = document.getElementById('em-header');
  const outerPipesCb = document.getElementById('em-outer-pipes');
  const cellPaddingCb = document.getElementById('em-cell-padding');
  const alignSelect = document.getElementById('em-align');
  const copyBtn = document.getElementById('em-copy');
  const downloadBtn = document.getElementById('em-download');
  const fileInput = document.getElementById('em-file');
  const sampleBtn = document.getElementById('cf-sample');
  const clearBtn = document.getElementById('cf-clear');

  /* ═══════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════ */

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeMarkdownCell(str) {
    /* Escape pipes inside cells */
    return str.replace(/\|/g, '\\|');
  }

  /* ═══════════════════════════════════════════════════════
     DETECT DELIMITER
     ═══════════════════════════════════════════════════════ */

  function detectDelimiter(text) {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return 'tab';

    const firstLine = lines[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const semicolonCount = (firstLine.match(/;/g) || []).length;

    /* Tabs from Excel/Sheets are the most common */
    if (tabCount >= commaCount && tabCount >= semicolonCount && tabCount > 0) return 'tab';
    if (commaCount >= semicolonCount && commaCount > 0) return 'comma';
    if (semicolonCount > 0) return 'semicolon';
    return 'tab';
  }

  /* ═══════════════════════════════════════════════════════
     PARSE & CONVERT
     ═══════════════════════════════════════════════════════ */

  function parseInput(text) {
    const delimiter = detectDelimiter(text);
    const lines = text.split('\n').filter(l => l.trim());

    return lines.map(line => {
      let cells;
      if (delimiter === 'tab') {
        cells = line.split('\t');
      } else if (delimiter === 'comma') {
        cells = parseCSVLine(line);
      } else {
        cells = line.split(';');
      }
      return cells.map(c => c.trim());
    });
  }

  /* Simple CSV parser — handles quoted fields */
  function parseCSVLine(line) {
    const cells = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQuotes) {
        if (ch === '"' && line[i + 1] === '"') {
          current += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ',') {
          cells.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
    }
    cells.push(current);
    return cells;
  }

  function convertToMarkdown(rows) {
    if (rows.length === 0) return '';

    const pipes = state.outerPipes;
    const pad = state.cellPadding;
    const innerSep = pad ? ' | ' : '|';

    /* Determine column count */
    const colCount = Math.max(...rows.map(r => r.length));

    /* Normalize rows to same column count */
    const normalized = rows.map(r => {
      while (r.length < colCount) r.push('');
      return r;
    });

    let result = '';
    let currentLine = 0;

    for (const row of normalized) {
      const escaped = row.map(c => escapeMarkdownCell(c));
      const joined = escaped.join(innerSep);
      const line = pipes
        ? (pad ? '| ' + joined + ' |' : '|' + joined + '|')
        : joined;
      result += line + '\n';
      currentLine++;

      /* Add separator after header */
      if (currentLine === 1 && state.hasHeader) {
        const alignStr = getAlignString(colCount);
        result += alignStr + '\n';
      }
    }

    return result.trimEnd();
  }

  function getAlignString(colCount) {
    const pad = state.cellPadding;
    const pipes = state.outerPipes;
    const innerSep = pad ? ' | ' : '|';

    let align;
    if (state.align === 'auto') {
      align = ':---';
    } else if (state.align === 'left') {
      align = ':---';
    } else if (state.align === 'center') {
      align = ':---:';
    } else {
      align = '---:';
    }

    const cols = [];
    for (let i = 0; i < colCount; i++) {
      cols.push(align);
    }

    const joined = cols.join(innerSep);
    if (pipes) {
      return pad ? '| ' + joined + ' |' : '|' + joined + '|';
    }
    return joined;
  }

  /* ═══════════════════════════════════════════════════════
     AUTO-DETECT ALIGNMENT (when align = "auto")
     ═══════════════════════════════════════════════════════ */

  function detectAlignment(rows) {
    if (state.align !== 'auto') return state.align;
    if (rows.length < 2) return 'left';

    /* Check data rows (skip header if present) */
    const dataStart = state.hasHeader ? 1 : 0;
    const colCount = rows[0].length;

    let align = 'left';
    let numericCols = 0;
    let totalCols = 0;

    for (let c = 0; c < colCount; c++) {
      let numeric = true;
      for (let r = dataStart; r < rows.length; r++) {
        const val = rows[r][c].trim();
        if (val !== '' && isNaN(parseFloat(val)) && !/^[+-]?[\d,.]+$/.test(val.replace(/\s/g, ''))) {
          numeric = false;
          break;
        }
      }
      if (numeric && rows[dataStart][c].trim() !== '') numericCols++;
      totalCols++;
    }

    /* If more than half the columns are numeric, align right */
    if (totalCols > 0 && numericCols / totalCols > 0.5) align = 'right';

    return align;
  }

  /* ═══════════════════════════════════════════════════════
     UPDATE
     ═══════════════════════════════════════════════════════ */

  function update() {
    const raw = inputArea.value;
    if (!raw.trim()) {
      outputEl.innerHTML = '<span class="em-output-placeholder">La tabla Markdown aparecerá acá...</span>';
      statsEl.innerHTML = '';
      copyBtn.disabled = true;
      downloadBtn.disabled = true;
      lastMarkdown = '';
      return;
    }

    const rows = parseInput(raw);
    const detectedAlign = detectAlignment(rows);

    /* Temporarily override align for generation */
    const savedAlign = state.align;
    if (state.align === 'auto') state.align = detectedAlign;

    lastMarkdown = convertToMarkdown(rows);
    state.align = savedAlign;

    /* Highlight output */
    outputEl.innerHTML = highlightMarkdown(lastMarkdown);

    /* Stats */
    const colCount = rows.length > 0 ? Math.max(...rows.map(r => r.length)) : 0;
    const rowCount = rows.length - (state.hasHeader ? 1 : 0);
    const delimiter = detectDelimiter(raw);
    const delimNames = { tab: 'Tabuladores (Excel)', comma: 'Comas (CSV)', semicolon: 'Punto y coma' };

    statsEl.innerHTML = `
      <span><i class="fa-solid fa-table-cells"></i> ${rowCount} filas × ${colCount} columnas</span>
      <span><i class="fa-solid fa-arrows-left-right"></i> ${delimNames[delimiter] || delimiter}</span>
      <span><i class="fa-solid fa-align-${detectedAlign === 'center' ? 'center' : detectedAlign === 'right' ? 'right' : 'left'}"></i> ${detectedAlign === 'center' ? 'Centro' : detectedAlign === 'right' ? 'Derecha' : 'Izquierda'}</span>
    `;

    copyBtn.disabled = false;
    downloadBtn.disabled = false;
  }

  function highlightMarkdown(md) {
    let html = escapeHtml(md);
    /* Highlight header row */
    const lines = html.split('\n');
    let inHeader = state.hasHeader;
    let result = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (inHeader) {
        line = '<span class="em-md-header">' + line + '</span>';
        inHeader = false;
      }
      /* Separator line */
      if (/^\|?[\s\-:|]+\|?$/.test(lines[i].replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<'))) {
        line = '<span class="em-md-separator">' + line + '</span>';
      }
      result.push(line);
    }

    return result.join('\n');
  }

  /* ═══════════════════════════════════════════════════════
     FILE UPLOAD
     ═══════════════════════════════════════════════════════ */

  function handleFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      inputArea.value = e.target.result;
      update();
      saveState();
    };
    reader.readAsText(file);
  }

  /* ═══════════════════════════════════════════════════════
     SAMPLE DATA
     ═══════════════════════════════════════════════════════ */

  function loadSample() {
    /* This will be pasted as tab-separated (simulating Excel copy) */
    inputArea.value = [
      'Nombre\tEdad\tCiudad\tOcupación',
      'Ana García\t30\tBuenos Aires\tDiseñadora',
      'Juan Pérez\t25\tCórdoba\tDesarrollador',
      'María López\t28\tRosario\tProduct Manager',
      'Carlos Ruiz\t35\tMendoza\tData Scientist',
      'Laura Fernández\t32\tLa Plata\tFrontend Dev',
    ].join('\n');
    update();
    saveState();
  }

  /* ═══════════════════════════════════════════════════════
     PERSISTENCE
     ═══════════════════════════════════════════════════════ */

  function saveState() {
    state.input = inputArea.value;
    ToolStorage.setField('excel-to-markdown', 'state', { ...state });
  }

  /* ═══════════════════════════════════════════════════════
     EVENTS
     ═══════════════════════════════════════════════════════ */

  /* Input change (debounced) */
  let debounceTimer;
  inputArea.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      update();
      saveState();
    }, 200);
  });

  /* Options */
  headerCb.addEventListener('change', () => { state.hasHeader = headerCb.checked; update(); saveState(); });
  outerPipesCb.addEventListener('change', () => { state.outerPipes = outerPipesCb.checked; update(); saveState(); });
  cellPaddingCb.addEventListener('change', () => { state.cellPadding = cellPaddingCb.checked; update(); saveState(); });
  alignSelect.addEventListener('change', () => { state.align = alignSelect.value; update(); saveState(); });

  /* File upload */
  fileInput.addEventListener('change', (e) => {
    handleFile(e.target.files[0]);
    fileInput.value = '';
  });

  /* Drag & drop */
  inputArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    inputArea.classList.add('em-textarea--dragover');
  });
  inputArea.addEventListener('dragleave', () => {
    inputArea.classList.remove('em-textarea--dragover');
  });
  inputArea.addEventListener('drop', (e) => {
    e.preventDefault();
    inputArea.classList.remove('em-textarea--dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  });

  /* Copy */
  copyBtn.addEventListener('click', () => {
    if (!lastMarkdown) return;
    MiniDevTools.copyToClipboard(lastMarkdown, 'Markdown copiado al portapapeles');
  });

  /* Download */
  downloadBtn.addEventListener('click', () => {
    if (!lastMarkdown) return;
    const blob = new Blob([lastMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tabla.md';
    a.click();
    URL.revokeObjectURL(url);
  });

  /* Sample */
  sampleBtn.addEventListener('click', loadSample);

  /* Clear */
  clearBtn.addEventListener('click', () => {
    inputArea.value = '';
    outputEl.innerHTML = '<span class="em-output-placeholder">La tabla Markdown aparecerá acá...</span>';
    statsEl.innerHTML = '';
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
    lastMarkdown = '';
    saveState();
  });

  /* ═══════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════ */

  if (state.input) {
    update();
  }
};

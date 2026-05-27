/* ═══════════════════════════════════════════════════════════════
   Table Converter — Excel ↔ Markdown (bidirectional)
   Features:
   Mode 1 — Excel to Markdown:
   - Paste from Excel/Sheets (auto-detect TSV)
   - Upload CSV/TSV files
   - Manual textarea input
   - First row as header toggle
   - Column alignment (left/center/right/auto)
   - Outer pipes & cell padding toggles
   - Copy & download .md

   Mode 2 — Markdown to Excel:
   - Paste Markdown table
   - Upload .md files
   - Parse pipes, separators, alignment
   - HTML table preview
   - Export as CSV, TSV, XLSX (SheetJS)
   - Persistence with ToolStorage
   ═══════════════════════════════════════════════════════════════ */

window['render_excel-to-markdown'] = function(container, toolMeta) {

  /* ─── State ─── */
  const saved = ToolStorage.load('excel-to-markdown');
  const s = saved ? saved.state : null;
  const state = {
    mode: s ? (s.mode || 'excel-md') : 'excel-md',  // 'excel-md' | 'md-excel'
    /* Excel→MD */
    input: s ? s.input : '',
    hasHeader: s ? (s.hasHeader !== false) : true,
    outerPipes: s ? (s.outerPipes !== false) : true,
    cellPadding: s ? (s.cellPadding !== false) : true,
    align: s ? (s.align || 'auto') : 'auto',
    /* MD→Excel */
    mdInput: s ? s.mdInput : '',
    mdFormat: s ? (s.mdFormat || 'xlsx') : 'xlsx', // 'xlsx' | 'csv' | 'tsv'
  };

  let lastMarkdown = '';
  let lastParsedRows = null;
  let lastParsedHeaders = null;

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

        <!-- ═══ Mode Toggle ═══ -->
        <div class="em-mode-toggle">
          <button class="em-mode-btn ${state.mode === 'excel-md' ? 'active' : ''}" id="em-mode-excel-md">
            <i class="fa-solid fa-table"></i> Excel → Markdown
          </button>
          <button class="em-mode-btn ${state.mode === 'md-excel' ? 'active' : ''}" id="em-mode-md-excel">
            <i class="fa-solid fa-file-code"></i> Markdown → Excel
          </button>
        </div>

        <!-- ═══ Excel → Markdown Panel ═══ -->
        <div class="em-layout" id="em-panel-excel-md" ${state.mode !== 'excel-md' ? 'style="display:none"' : ''}>

          <div class="em-input-section">
            <div class="em-section-header">
              <label class="label" style="margin-bottom:0;">Datos de entrada</label>
              <div style="display:flex; gap:6px;">
                <label class="btn btn--ghost btn--sm em-upload-label" title="Subir CSV o TSV">
                  <i class="fa-solid fa-file-upload"></i> CSV/TSV
                  <input type="file" id="em-file" accept=".csv,.tsv,.txt" style="display:none;">
                </label>
                <button class="btn btn--ghost btn--sm" id="cf-sample">Ejemplo</button>
                <button class="btn btn--ghost btn--sm" id="cf-clear">Limpiar</button>
              </div>
            </div>
            <textarea class="input em-textarea" id="em-input" rows="6"
              placeholder="Copiá desde Excel/Google Sheets y pegá acá...&#10;&#10;o escribí datos separados por tabuladores/comas."
              spellcheck="false">${escapeHtml(state.input)}</textarea>

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

          <div class="em-output-section">
            <div class="em-section-header">
              <label class="label" style="margin-bottom:0;">Markdown</label>
              <div class="em-output-actions">
                <button class="btn btn--primary btn--sm em-action-btn" id="em-copy" disabled>
                  <i class="fa-regular fa-copy"></i> Copiar
                </button>
                <button class="btn btn--primary btn--sm em-action-btn" id="em-download" disabled>
                  <i class="fa-solid fa-download"></i> .md
                </button>
              </div>
            </div>
            <pre class="em-output" id="em-output"><span class="em-output-placeholder">La tabla Markdown aparecerá acá...</span></pre>
            <div class="em-stats" id="em-stats"></div>
          </div>

        </div>

        <!-- ═══ Markdown → Excel Panel ═══ -->
        <div class="em-layout" id="em-panel-md-excel" ${state.mode !== 'md-excel' ? 'style="display:none"' : ''}>

          <div class="em-input-section">
            <div class="em-section-header">
              <label class="label" style="margin-bottom:0;">Tabla Markdown</label>
              <div style="display:flex; gap:6px;">
                <label class="btn btn--ghost btn--sm em-upload-label" title="Subir .md">
                  <i class="fa-solid fa-file-upload"></i> .md
                  <input type="file" id="em-md-file" accept=".md,.txt,.markdown" style="display:none;">
                </label>
                <button class="btn btn--ghost btn--sm" id="cf-md-sample">Ejemplo</button>
                <button class="btn btn--ghost btn--sm" id="cf-md-clear">Limpiar</button>
              </div>
            </div>
            <textarea class="input em-textarea" id="em-md-input" rows="6"
              placeholder="Pegá una tabla Markdown acá...&#10;&#10;| Columna 1 | Columna 2 |&#10;|----------|----------|&#10;| dato 1   | dato 2   |"
              spellcheck="false">${escapeHtml(state.mdInput)}</textarea>

            <div class="em-options">
              <div class="em-align-group">
                <span class="em-label">Formato de descarga:</span>
                <select class="input em-select" id="em-md-format">
                  <option value="xlsx" ${state.mdFormat === 'xlsx' ? 'selected' : ''}>XLSX (.xlsx)</option>
                  <option value="csv" ${state.mdFormat === 'csv' ? 'selected' : ''}>CSV (.csv)</option>
                  <option value="tsv" ${state.mdFormat === 'tsv' ? 'selected' : ''}>TSV (.tsv)</option>
                </select>
              </div>
            </div>

            <div class="em-hint">
              <i class="fa-solid fa-lightbulb"></i> Pegá una tabla Markdown con formato <code>| col |</code> y separadores <code>|---|</code>
            </div>
          </div>

          <div class="em-output-section">
            <div class="em-section-header">
              <label class="label" style="margin-bottom:0;">Vista previa</label>
              <div class="em-output-actions">
                <button class="btn btn--primary btn--sm em-action-btn" id="em-md-copy" disabled>
                  <i class="fa-solid fa-table-cells"></i> Copiar como TSV
                </button>
                <button class="btn btn--primary btn--sm em-action-btn" id="em-md-download" disabled>
                  <i class="fa-solid fa-download"></i> <span id="em-md-download-label">.xlsx</span>
                </button>
              </div>
            </div>
            <div class="em-md-preview" id="em-md-preview">
              <span class="em-output-placeholder">La tabla parseada aparecerá acá...</span>
            </div>
            <div class="em-stats" id="em-md-stats"></div>
          </div>

        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs (shared) ─── */
  const modeExcelMd = document.getElementById('em-mode-excel-md');
  const modeMdExcel = document.getElementById('em-mode-md-excel');
  const panelExcelMd = document.getElementById('em-panel-excel-md');
  const panelMdExcel = document.getElementById('em-panel-md-excel');

  /* ─── DOM Refs (Excel→MD) ─── */
  const inputArea = document.getElementById('em-input');
  const outputEl = document.getElementById('em-output');
  const statsEl = document.getElementById('em-stats');
  const headerCb = document.getElementById('em-header');
  const outerPipesCb = document.getElementById('em-outer-pipes');
  const cellPaddingCb = document.getElementById('em-cell-padding');
  const alignSelect = document.getElementById('em-align');
  const copyBtn = document.getElementById('em-copy');
  const downloadBtn = document.getElementById('em-download');
  const fileInput = document.getElementById('em-file');
  const sampleBtn = document.getElementById('cf-sample');
  const clearBtn = document.getElementById('cf-clear');

  /* ─── DOM Refs (MD→Excel) ─── */
  const mdInputArea = document.getElementById('em-md-input');
  const mdPreview = document.getElementById('em-md-preview');
  const mdStats = document.getElementById('em-md-stats');
  const mdFormatSelect = document.getElementById('em-md-format');
  const mdCopyBtn = document.getElementById('em-md-copy');
  const mdDownloadBtn = document.getElementById('em-md-download');
  const mdDownloadLabel = document.getElementById('em-md-download-label');
  const mdFileInput = document.getElementById('em-md-file');
  const mdSampleBtn = document.getElementById('cf-md-sample');
  const mdClearBtn = document.getElementById('cf-md-clear');

  /* ═══════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════ */

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeMarkdownCell(str) {
    return str.replace(/\|/g, '\\|');
  }

  /* ═══════════════════════════════════════════════════════
     MODE SWITCHING
     ═══════════════════════════════════════════════════════ */

  function switchMode(newMode) {
    state.mode = newMode;
    modeExcelMd.classList.toggle('active', newMode === 'excel-md');
    modeMdExcel.classList.toggle('active', newMode === 'md-excel');
    panelExcelMd.style.display = newMode === 'excel-md' ? '' : 'none';
    panelMdExcel.style.display = newMode === 'md-excel' ? '' : 'none';
    saveState();

    /* Trigger update for the new mode */
    if (newMode === 'excel-md') {
      updateExcelToMd();
    } else {
      updateMdToExcel();
    }
  }

  modeExcelMd.addEventListener('click', () => switchMode('excel-md'));
  modeMdExcel.addEventListener('click', () => switchMode('md-excel'));

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

    if (tabCount >= commaCount && tabCount >= semicolonCount && tabCount > 0) return 'tab';
    if (commaCount >= semicolonCount && commaCount > 0) return 'comma';
    if (semicolonCount > 0) return 'semicolon';
    return 'tab';
  }

  /* ═══════════════════════════════════════════════════════
     PARSE & CONVERT (Excel → Markdown)
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

    const colCount = Math.max(...rows.map(r => r.length));

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

    const dataStart = state.hasHeader ? 1 : 0;
    const colCount = rows[0].length;

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
      if (numeric && rows[dataStart] && rows[dataStart][c] && rows[dataStart][c].trim() !== '') numericCols++;
      totalCols++;
    }

    if (totalCols > 0 && numericCols / totalCols > 0.5) return 'right';
    return 'left';
  }

  /* ═══════════════════════════════════════════════════════
     UPDATE: Excel → Markdown
     ═══════════════════════════════════════════════════════ */

  function updateExcelToMd() {
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

    const savedAlign = state.align;
    if (state.align === 'auto') state.align = detectedAlign;

    lastMarkdown = convertToMarkdown(rows);
    state.align = savedAlign;

    outputEl.innerHTML = highlightMarkdown(lastMarkdown);

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
    const lines = html.split('\n');
    let inHeader = state.hasHeader;
    let result = [];

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      if (inHeader) {
        line = '<span class="em-md-header">' + line + '</span>';
        inHeader = false;
      }
      if (/^\|?[\s\-:|]+\|?$/.test(lines[i].replace(/&amp;/g, '&').replace(/&gt;/g, '>').replace(/&lt;/g, '<'))) {
        line = '<span class="em-md-separator">' + line + '</span>';
      }
      result.push(line);
    }

    return result.join('\n');
  }

  /* ═══════════════════════════════════════════════════════
     PARSE: Markdown → Table
     ═══════════════════════════════════════════════════════ */

  function parseMarkdownTable(md) {
    if (!md.trim()) return null;

    const lines = md.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) return null;

    const rows = [];
    let headers = null;
    let colAligns = [];  // per-column alignment from separator
    let separatorFound = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      /* Skip separator line */
      if (/^\|?[\s\-:|]+\|?$/.test(line)) {
        separatorFound = true;

        /* Extract column alignments from separator */
        const cells = splitMarkdownRow(line);
        colAligns = cells.map(c => {
          const trimmed = c.trim();
          if (trimmed.startsWith(':') && trimmed.endsWith(':')) return 'center';
          if (trimmed.endsWith(':')) return 'right';
          if (trimmed.startsWith(':')) return 'left';
          return 'left';
        });
        continue;
      }

      /* Parse data row */
      const cells = splitMarkdownRow(line).map(c => c.trim());
      rows.push(cells);
    }

    if (rows.length === 0) return null;

    /* If separator was found, first row is header */
    if (separatorFound && rows.length >= 1) {
      headers = rows.shift();
    }

    /* Normalize column count */
    const colCount = Math.max(...rows.map(r => r.length), headers ? headers.length : 0);
    if (headers) {
      while (headers.length < colCount) headers.push('');
    }
    for (const row of rows) {
      while (row.length < colCount) row.push('');
    }
    while (colAligns.length < colCount) colAligns.push('left');

    return { headers, rows, colAligns, colCount };
  }

  function splitMarkdownRow(line) {
    /* Remove leading/trailing pipes */
    let trimmed = line.trim();
    if (trimmed.startsWith('|')) trimmed = trimmed.substring(1);
    if (trimmed.endsWith('|')) trimmed = trimmed.substring(0, trimmed.length - 1);

    /* Split by pipe, respecting escaped pipes */
    const cells = [];
    let current = '';
    let inEscape = false;

    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (inEscape) {
        current += ch;
        inEscape = false;
      } else if (ch === '\\') {
        inEscape = true;
      } else if (ch === '|') {
        cells.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current);

    return cells;
  }

  /* ═══════════════════════════════════════════════════════
     UPDATE: Markdown → Excel
     ═══════════════════════════════════════════════════════ */

  function updateMdToExcel() {
    const raw = mdInputArea.value;
    if (!raw.trim()) {
      mdPreview.innerHTML = '<span class="em-output-placeholder">La tabla parseada aparecerá acá...</span>';
      mdStats.innerHTML = '';
      mdCopyBtn.disabled = true;
      mdDownloadBtn.disabled = true;
      lastParsedRows = null;
      lastParsedHeaders = null;
      return;
    }

    const parsed = parseMarkdownTable(raw);
    if (!parsed) {
      mdPreview.innerHTML = '<span class="em-output-placeholder" style="color:var(--error,#ef4444);">No se pudo parsear la tabla. Verificá el formato.</span>';
      mdStats.innerHTML = '';
      mdCopyBtn.disabled = true;
      mdDownloadBtn.disabled = true;
      lastParsedRows = null;
      lastParsedHeaders = null;
      return;
    }

    lastParsedHeaders = parsed.headers;
    lastParsedRows = parsed.rows;

    /* Render HTML preview table */
    let html = '<table class="em-preview-table"><thead><tr>';
    if (parsed.headers) {
      parsed.headers.forEach((h, i) => {
        html += `<th style="text-align:${parsed.colAligns[i] || 'left'}">${escapeHtml(h)}</th>`;
      });
    }
    html += '</tr></thead><tbody>';
    parsed.rows.forEach(row => {
      html += '<tr>';
      row.forEach((cell, i) => {
        html += `<td style="text-align:${parsed.colAligns[i] || 'left'}">${escapeHtml(cell)}</td>`;
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    mdPreview.innerHTML = html;

    /* Stats */
    const rowCount = parsed.rows.length;
    const colCount = parsed.colCount;
    const hasHeaders = parsed.headers ? 'Sí' : 'No';

    mdStats.innerHTML = `
      <span><i class="fa-solid fa-table-cells"></i> ${rowCount} filas × ${colCount} columnas</span>
      <span><i class="fa-solid fa-heading"></i> Encabezado: ${hasHeaders}</span>
      <span><i class="fa-solid fa-align-left"></i> ${colCount} columnas</span>
    `;

    mdCopyBtn.disabled = false;
    mdDownloadBtn.disabled = false;
  }

  /* ═══════════════════════════════════════════════════════
     EXPORT: TSV / CSV / XLSX
     ═══════════════════════════════════════════════════════ */

  function buildExportData() {
    /* Build a flat array: optional headers + rows */
    const allRows = [];
    if (lastParsedHeaders) allRows.push(lastParsedHeaders);
    allRows.push(...(lastParsedRows || []));
    return allRows;
  }

  function toTSV(rows) {
    return rows.map(r => r.map(c => {
      /* Escape tabs and newlines in cells */
      const escaped = c.replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/\r/g, '');
      return escaped;
    }).join('\t')).join('\n');
  }

  function toCSV(rows) {
    return rows.map(r => r.map(c => {
      /* If cell contains comma, quote, or newline, wrap in quotes */
      if (c.includes(',') || c.includes('"') || c.includes('\n')) {
        return '"' + c.replace(/"/g, '""') + '"';
      }
      return c;
    }).join(',')).join('\n');
  }

  async function toXLSX(rows) {
    /* Load SheetJS if not already loaded */
    if (typeof XLSX === 'undefined') {
      await loadSheetJS();
    }
    if (typeof XLSX === 'undefined') {
      MiniDevTools.showToast('Error al cargar SheetJS', 'error');
      return null;
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);

    /* Auto-size columns */
    if (ws['!ref']) {
      const range = XLSX.utils.decode_range(ws['!ref']);
      ws['!cols'] = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        let maxLen = 8; // minimum width
        for (let r = range.s.r; r <= range.e.r; r++) {
          const addr = XLSX.utils.encode_cell({ r, c });
          const cell = ws[addr];
          if (cell && cell.v) {
            maxLen = Math.max(maxLen, String(cell.v).length);
          }
        }
        ws['!cols'].push({ wch: Math.min(maxLen + 2, 50) });
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tabla');
    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  }

  let sheetJSLoading = false;
  function loadSheetJS() {
    if (sheetJSLoading) return sheetJSLoading;
    sheetJSLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return sheetJSLoading;
  }

  /* ═══════════════════════════════════════════════════════
     FILE UPLOAD
     ═══════════════════════════════════════════════════════ */

  function handleFile(file, targetInput) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      targetInput.value = e.target.result;
      if (targetInput === inputArea) updateExcelToMd();
      else updateMdToExcel();
      saveState();
    };
    reader.readAsText(file);
  }

  /* ═══════════════════════════════════════════════════════
     SAMPLE DATA
     ═══════════════════════════════════════════════════════ */

  function loadSampleExcelMd() {
    inputArea.value = [
      'Nombre\tEdad\tCiudad\tOcupación',
      'Ana García\t30\tBuenos Aires\tDiseñadora',
      'Juan Pérez\t25\tCórdoba\tDesarrollador',
      'María López\t28\tRosario\tProduct Manager',
      'Carlos Ruiz\t35\tMendoza\tData Scientist',
      'Laura Fernández\t32\tLa Plata\tFrontend Dev',
    ].join('\n');
    updateExcelToMd();
    saveState();
  }

  function loadSampleMdExcel() {
    mdInputArea.value = [
      '| Herramienta | Lenguaje | Categoría | Estrellas |',
      '|:------------|:---------|:----------|----------:|',
      '| MiniDevTools | JavaScript | Dev Tools | 42 |',
      '| Vite | TypeScript | Build Tool | 65k |',
      '| ESLint | JavaScript | Linter | 23k |',
      '| Prettier | JavaScript | Formatter | 47k |',
      '| Tailwind CSS | CSS | Framework | 78k |',
    ].join('\n');
    updateMdToExcel();
    saveState();
  }

  /* ═══════════════════════════════════════════════════════
     PERSISTENCE
     ═══════════════════════════════════════════════════════ */

  function saveState() {
    state.input = inputArea ? inputArea.value : state.input;
    state.mdInput = mdInputArea ? mdInputArea.value : state.mdInput;
    ToolStorage.setField('excel-to-markdown', 'state', { ...state });
  }

  /* ═══════════════════════════════════════════════════════
     EVENTS: Excel → Markdown
     ═══════════════════════════════════════════════════════ */

  let debounceTimer;
  inputArea.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      updateExcelToMd();
      saveState();
    }, 200);
  });

  headerCb.addEventListener('change', () => { state.hasHeader = headerCb.checked; updateExcelToMd(); saveState(); });
  outerPipesCb.addEventListener('change', () => { state.outerPipes = outerPipesCb.checked; updateExcelToMd(); saveState(); });
  cellPaddingCb.addEventListener('change', () => { state.cellPadding = cellPaddingCb.checked; updateExcelToMd(); saveState(); });
  alignSelect.addEventListener('change', () => { state.align = alignSelect.value; updateExcelToMd(); saveState(); });

  fileInput.addEventListener('change', (e) => {
    handleFile(e.target.files[0], inputArea);
    fileInput.value = '';
  });

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
    if (file) handleFile(file, inputArea);
  });

  copyBtn.addEventListener('click', () => {
    if (!lastMarkdown) return;
    MiniDevTools.copyToClipboard(lastMarkdown, 'Markdown copiado al portapapeles');
  });

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

  sampleBtn.addEventListener('click', loadSampleExcelMd);

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
     EVENTS: Markdown → Excel
     ═══════════════════════════════════════════════════════ */

  let mdDebounceTimer;
  mdInputArea.addEventListener('input', () => {
    clearTimeout(mdDebounceTimer);
    mdDebounceTimer = setTimeout(() => {
      updateMdToExcel();
      saveState();
    }, 200);
  });

  mdFormatSelect.addEventListener('change', () => {
    state.mdFormat = mdFormatSelect.value;
    const labels = { xlsx: '.xlsx', csv: '.csv', tsv: '.tsv' };
    mdDownloadLabel.textContent = labels[state.mdFormat] || '.xlsx';
    saveState();
  });

  mdFileInput.addEventListener('change', (e) => {
    handleFile(e.target.files[0], mdInputArea);
    mdFileInput.value = '';
  });

  mdInputArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    mdInputArea.classList.add('em-textarea--dragover');
  });
  mdInputArea.addEventListener('dragleave', () => {
    mdInputArea.classList.remove('em-textarea--dragover');
  });
  mdInputArea.addEventListener('drop', (e) => {
    e.preventDefault();
    mdInputArea.classList.remove('em-textarea--dragover');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file, mdInputArea);
  });

  mdCopyBtn.addEventListener('click', () => {
    const data = buildExportData();
    if (!data || data.length === 0) return;
    const tsv = toTSV(data);
    MiniDevTools.copyToClipboard(tsv, 'TSV copiado al portapapeles (pegá en Excel)');
  });

  mdDownloadBtn.addEventListener('click', async () => {
    const data = buildExportData();
    if (!data || data.length === 0) return;

    const fmt = state.mdFormat || 'xlsx';

    if (fmt === 'xlsx') {
      /* Show loading state */
      mdDownloadBtn.disabled = true;
      mdDownloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';

      try {
        const xlsxData = await toXLSX(data);
        if (xlsxData) {
          const blob = new Blob([xlsxData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'tabla.xlsx';
          a.click();
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        MiniDevTools.showToast('Error al generar XLSX: ' + err.message, 'error');
      } finally {
        mdDownloadBtn.disabled = false;
        mdDownloadBtn.innerHTML = `<i class="fa-solid fa-download"></i> <span id="em-md-download-label">${mdDownloadLabel ? mdDownloadLabel.textContent : '.xlsx'}</span>`;
      }
    } else if (fmt === 'csv') {
      const csv = toCSV(data);
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }); // BOM for Excel
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tabla.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else if (fmt === 'tsv') {
      const tsv = toTSV(data);
      const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tabla.tsv';
      a.click();
      URL.revokeObjectURL(url);
    }
  });

  mdSampleBtn.addEventListener('click', loadSampleMdExcel);

  mdClearBtn.addEventListener('click', () => {
    mdInputArea.value = '';
    mdPreview.innerHTML = '<span class="em-output-placeholder">La tabla parseada aparecerá acá...</span>';
    mdStats.innerHTML = '';
    mdCopyBtn.disabled = true;
    mdDownloadBtn.disabled = true;
    lastParsedRows = null;
    lastParsedHeaders = null;
    saveState();
  });

  /* ═══════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════ */

  if (state.mode === 'excel-md' && state.input) {
    updateExcelToMd();
  } else if (state.mode === 'md-excel' && state.mdInput) {
    updateMdToExcel();
  }
};

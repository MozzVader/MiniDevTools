/* ═══════════════════════════════════════════════════════════════
   Grid Playground — Visual CSS Grid sandbox interactivo
   Features:
   - Live preview with colored items
   - Container props: template-cols, template-rows, gap, justify/align items/content
   - Item props (per-item): grid-column, grid-row, justify-self, align-self
   - Template quick presets + free text input
   - Add/remove items (1–12), click to select
   - Generated CSS output with copy
   - Presets: 3 Columns, Sidebar, Holy Grail, Gallery, Dashboard, Magazine, Cards, Center
   - Persistence with ToolStorage
   ═══════════════════════════════════════════════════════════════ */

window['render_grid-playground'] = function(container, toolMeta) {

  /* ─── Constants ─── */
  const ITEM_COLORS = [
    '#6366f1', '#ec4899', '#f59e0b', '#22c55e',
    '#06b6d4', '#8b5cf6', '#ef4444', '#14b8a6',
    '#f97316', '#3b82f6', '#a855f7', '#eab308'
  ];

  const COL_PRESETS = [
    { label: '1fr',      value: '1fr' },
    { label: '1fr 1fr',  value: '1fr 1fr' },
    { label: '1fr 1fr 1fr', value: '1fr 1fr 1fr' },
    { label: 'repeat(4)', value: 'repeat(4, 1fr)' },
    { label: 'Sidebar',   value: '250px 1fr' },
    { label: 'auto-fill', value: 'repeat(auto-fill, minmax(120px, 1fr))' },
  ];

  const ROW_PRESETS = [
    { label: 'auto',        value: 'auto' },
    { label: '1fr 1fr',     value: '1fr 1fr' },
    { label: 'auto 1fr',    value: 'auto 1fr' },
    { label: 'hdr/ftr',     value: 'auto 1fr auto' },
    { label: '60 1fr 60',   value: '60px 1fr 60px' },
  ];

  /* ─── State ─── */
  const saved = ToolStorage.load('grid-playground');
  const s = saved ? saved.state : null;

  let activePresetLabels = null;

  const state = {
    templateCols: s ? s.templateCols : '1fr 1fr 1fr',
    templateRows: s ? s.templateRows : 'auto',
    gap: s ? (s.gap ?? 10) : 10,
    justifyItems: s ? (s.justifyItems ?? 'stretch') : 'stretch',
    alignItems: s ? (s.alignItems ?? 'stretch') : 'stretch',
    justifyContent: s ? (s.justifyContent ?? 'stretch') : 'stretch',
    alignContent: s ? (s.alignContent ?? 'stretch') : 'stretch',
    itemCount: s ? (s.itemCount ?? 6) : 6,
    selectedItem: s ? s.selectedItem : null,
    items: s && s.items ? s.items : {},
  };

  /* Ensure all 12 items initialized */
  for (let i = 0; i < 12; i++) {
    if (!state.items[i]) state.items[i] = { gridColumn: 'auto', gridRow: 'auto', justifySelf: 'auto', alignSelf: 'auto' };
  }

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

        <div class="gp-layout">

          <!-- ═══ Left: Preview + Code ═══ -->
          <div class="gp-preview-col">

            <!-- Items bar -->
            <div class="gp-items-bar">
              <span class="gp-items-bar__label">Items</span>
              <button class="gp-items-bar__btn" id="gp-remove-item"><i class="fa-solid fa-minus"></i></button>
              <span class="gp-items-bar__count" id="gp-item-count">${state.itemCount}</span>
              <button class="gp-items-bar__btn" id="gp-add-item"><i class="fa-solid fa-plus"></i></button>
            </div>

            <!-- Preview -->
            <div class="gp-preview" id="gp-preview">
              <div class="gp-grid-container" id="gp-grid"></div>
            </div>

            <!-- Gap slider -->
            <div class="gp-size-row">
              <label>Gap</label>
              <input type="range" class="gp-range" id="gp-gap" min="0" max="40" value="${state.gap}">
              <span class="gp-range-val" id="gp-gap-val">${state.gap}px</span>
            </div>

            <!-- Code output -->
            <div class="gp-code-wrap">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span class="gp-section-title" style="margin-bottom:0;">CSS Generado</span>
                <button class="btn btn--ghost btn--sm" id="gp-copy-css"><i class="fa-regular fa-copy" style="margin-right:4px;"></i>Copiar</button>
              </div>
              <pre class="gp-code" id="gp-code"></pre>
            </div>
          </div>

          <!-- ═══ Right: Controls ═══ -->
          <div class="gp-controls">

            <!-- CONTAINER -->
            <div class="gp-section-title"><i class="fa-solid fa-border-all" style="margin-right:6px;"></i>Contenedor</div>

            <!-- Template Columns -->
            <div class="gp-prop-group">
              <label class="gp-prop-label">grid-template-columns</label>
              <div class="gp-template-presets" id="gp-col-presets">
                ${COL_PRESETS.map(p => `<button class="gp-template-preset${state.templateCols === p.value ? ' gp-template-preset--active' : ''}" data-value="${p.value}">${p.label}</button>`).join('')}
              </div>
              <input type="text" class="gp-template-input" id="gp-cols-input" value="${state.templateCols}" placeholder="Ej: 1fr 1fr 1fr">
            </div>

            <!-- Template Rows -->
            <div class="gp-prop-group">
              <label class="gp-prop-label">grid-template-rows</label>
              <div class="gp-template-presets" id="gp-row-presets">
                ${ROW_PRESETS.map(p => `<button class="gp-template-preset${state.templateRows === p.value ? ' gp-template-preset--active' : ''}" data-value="${p.value}">${p.label}</button>`).join('')}
              </div>
              <input type="text" class="gp-template-input" id="gp-rows-input" value="${state.templateRows}" placeholder="Ej: auto 1fr auto">
            </div>

            <!-- justify-items -->
            <div class="gp-prop-group">
              <label class="gp-prop-label">justify-items</label>
              <div class="gp-prop-btns" data-prop="justifyItems">
                <button class="gp-prop-btn ${state.justifyItems === 'stretch' ? 'gp-prop-btn--active' : ''}" data-value="stretch">stretch</button>
                <button class="gp-prop-btn ${state.justifyItems === 'start' ? 'gp-prop-btn--active' : ''}" data-value="start">start</button>
                <button class="gp-prop-btn ${state.justifyItems === 'end' ? 'gp-prop-btn--active' : ''}" data-value="end">end</button>
                <button class="gp-prop-btn ${state.justifyItems === 'center' ? 'gp-prop-btn--active' : ''}" data-value="center">center</button>
              </div>
            </div>

            <!-- align-items -->
            <div class="gp-prop-group">
              <label class="gp-prop-label">align-items</label>
              <div class="gp-prop-btns" data-prop="alignItems">
                <button class="gp-prop-btn ${state.alignItems === 'stretch' ? 'gp-prop-btn--active' : ''}" data-value="stretch">stretch</button>
                <button class="gp-prop-btn ${state.alignItems === 'start' ? 'gp-prop-btn--active' : ''}" data-value="start">start</button>
                <button class="gp-prop-btn ${state.alignItems === 'end' ? 'gp-prop-btn--active' : ''}" data-value="end">end</button>
                <button class="gp-prop-btn ${state.alignItems === 'center' ? 'gp-prop-btn--active' : ''}" data-value="center">center</button>
              </div>
            </div>

            <!-- justify-content -->
            <div class="gp-prop-group">
              <label class="gp-prop-label">justify-content</label>
              <div class="gp-prop-btns" data-prop="justifyContent">
                <button class="gp-prop-btn ${state.justifyContent === 'stretch' ? 'gp-prop-btn--active' : ''}" data-value="stretch">stretch</button>
                <button class="gp-prop-btn ${state.justifyContent === 'start' ? 'gp-prop-btn--active' : ''}" data-value="start">start</button>
                <button class="gp-prop-btn ${state.justifyContent === 'end' ? 'gp-prop-btn--active' : ''}" data-value="end">end</button>
                <button class="gp-prop-btn ${state.justifyContent === 'center' ? 'gp-prop-btn--active' : ''}" data-value="center">center</button>
                <button class="gp-prop-btn ${state.justifyContent === 'space-between' ? 'gp-prop-btn--active' : ''}" data-value="space-between">space-between</button>
                <button class="gp-prop-btn ${state.justifyContent === 'space-around' ? 'gp-prop-btn--active' : ''}" data-value="space-around">space-around</button>
                <button class="gp-prop-btn ${state.justifyContent === 'space-evenly' ? 'gp-prop-btn--active' : ''}" data-value="space-evenly">space-evenly</button>
              </div>
            </div>

            <!-- align-content -->
            <div class="gp-prop-group">
              <label class="gp-prop-label">align-content</label>
              <div class="gp-prop-btns" data-prop="alignContent">
                <button class="gp-prop-btn ${state.alignContent === 'stretch' ? 'gp-prop-btn--active' : ''}" data-value="stretch">stretch</button>
                <button class="gp-prop-btn ${state.alignContent === 'start' ? 'gp-prop-btn--active' : ''}" data-value="start">start</button>
                <button class="gp-prop-btn ${state.alignContent === 'end' ? 'gp-prop-btn--active' : ''}" data-value="end">end</button>
                <button class="gp-prop-btn ${state.alignContent === 'center' ? 'gp-prop-btn--active' : ''}" data-value="center">center</button>
                <button class="gp-prop-btn ${state.alignContent === 'space-between' ? 'gp-prop-btn--active' : ''}" data-value="space-between">space-between</button>
                <button class="gp-prop-btn ${state.alignContent === 'space-around' ? 'gp-prop-btn--active' : ''}" data-value="space-around">space-around</button>
                <button class="gp-prop-btn ${state.alignContent === 'space-evenly' ? 'gp-prop-btn--active' : ''}" data-value="space-evenly">space-evenly</button>
              </div>
            </div>

            <!-- ITEM (conditional) -->
            <div id="gp-item-section" style="${state.selectedItem !== null ? '' : 'display:none;'}">
              <div class="gp-section-title" style="margin-top:20px;">
                <i class="fa-solid fa-cube" style="margin-right:6px;"></i>Item <span id="gp-item-num">${state.selectedItem !== null ? state.selectedItem + 1 : ''}</span>
              </div>

              <!-- grid-column -->
              <div class="gp-placement-row">
                <label class="gp-placement-label">grid-column</label>
                <input type="text" class="gp-placement-input" id="gp-col-place" value="${state.selectedItem !== null ? state.items[state.selectedItem].gridColumn : 'auto'}" placeholder="auto  |  1 / 3  |  1 / span 2">
              </div>

              <!-- grid-row -->
              <div class="gp-placement-row">
                <label class="gp-placement-label">grid-row</label>
                <input type="text" class="gp-placement-input" id="gp-row-place" value="${state.selectedItem !== null ? state.items[state.selectedItem].gridRow : 'auto'}" placeholder="auto  |  1 / 3  |  1 / span 2">
              </div>

              <!-- justify-self -->
              <div class="gp-prop-group" style="margin-top:8px;">
                <label class="gp-prop-label">justify-self</label>
                <div class="gp-prop-btns" data-item-prop="justifySelf">
                  <button class="gp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].justifySelf === 'auto' ? 'gp-prop-btn--active' : ''}" data-value="auto">auto</button>
                  <button class="gp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].justifySelf === 'start' ? 'gp-prop-btn--active' : ''}" data-value="start">start</button>
                  <button class="gp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].justifySelf === 'end' ? 'gp-prop-btn--active' : ''}" data-value="end">end</button>
                  <button class="gp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].justifySelf === 'center' ? 'gp-prop-btn--active' : ''}" data-value="center">center</button>
                  <button class="gp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].justifySelf === 'stretch' ? 'gp-prop-btn--active' : ''}" data-value="stretch">stretch</button>
                </div>
              </div>

              <!-- align-self -->
              <div class="gp-prop-group">
                <label class="gp-prop-label">align-self</label>
                <div class="gp-prop-btns" data-item-prop="alignSelf">
                  <button class="gp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].alignSelf === 'auto' ? 'gp-prop-btn--active' : ''}" data-value="auto">auto</button>
                  <button class="gp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].alignSelf === 'start' ? 'gp-prop-btn--active' : ''}" data-value="start">start</button>
                  <button class="gp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].alignSelf === 'end' ? 'gp-prop-btn--active' : ''}" data-value="end">end</button>
                  <button class="gp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].alignSelf === 'center' ? 'gp-prop-btn--active' : ''}" data-value="center">center</button>
                  <button class="gp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].alignSelf === 'stretch' ? 'gp-prop-btn--active' : ''}" data-value="stretch">stretch</button>
                </div>
              </div>

              <button class="gp-deselect-btn" id="gp-deselect">
                <i class="fa-solid fa-xmark" style="margin-right:4px;"></i>Deseleccionar item
              </button>
            </div>

            <!-- PRESETS -->
            <div class="gp-section-title" style="margin-top:20px;"><i class="fa-solid fa-wand-magic-sparkles" style="margin-right:6px;"></i>Presets</div>
            <div class="gp-presets" id="gp-presets"></div>

            <!-- RESET -->
            <div class="gp-actions">
              <button class="btn btn--secondary btn--icon" id="gp-reset" data-tooltip="Reset">
                <i class="fa-solid fa-rotate-left"></i>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const gridEl = document.getElementById('gp-grid');
  const codeEl = document.getElementById('gp-code');
  const itemCountEl = document.getElementById('gp-item-count');
  const itemSection = document.getElementById('gp-item-section');
  const itemNumEl = document.getElementById('gp-item-num');
  const colsInput = document.getElementById('gp-cols-input');
  const rowsInput = document.getElementById('gp-rows-input');
  const colPlaceInput = document.getElementById('gp-col-place');
  const rowPlaceInput = document.getElementById('gp-row-place');

  /* ═══════════════════════════════════════════════════════
     RENDER ITEMS
     ═══════════════════════════════════════════════════════ */

  function renderItems() {
    gridEl.innerHTML = '';

    for (let i = 0; i < state.itemCount; i++) {
      const item = state.items[i];
      const color = ITEM_COLORS[i % ITEM_COLORS.length];

      const el = document.createElement('div');
      el.className = 'gp-item' + (state.selectedItem === i ? ' gp-item--selected' : '');
      el.dataset.index = i;
      el.style.backgroundColor = color;

      /* Apply item grid placement */
      if (item.gridColumn && item.gridColumn !== 'auto') {
        el.style.gridColumn = item.gridColumn;
      }
      if (item.gridRow && item.gridRow !== 'auto') {
        el.style.gridRow = item.gridRow;
      }
      if (item.justifySelf && item.justifySelf !== 'auto') {
        el.style.justifySelf = item.justifySelf;
      }
      if (item.alignSelf && item.alignSelf !== 'auto') {
        el.style.alignSelf = item.alignSelf;
      }

      el.innerHTML = `<span class="gp-item__num">${i + 1}</span>`;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        selectItem(i);
      });
      gridEl.appendChild(el);
    }
  }

  /* ═══════════════════════════════════════════════════════
     UPDATE PREVIEW
     ═══════════════════════════════════════════════════════ */

  function updatePreview() {
    /* Apply container grid styles */
    gridEl.style.display = 'grid';
    gridEl.style.gridTemplateColumns = state.templateCols || 'none';
    gridEl.style.gridTemplateRows = state.templateRows || 'none';
    gridEl.style.gap = state.gap + 'px';
    gridEl.style.justifyItems = state.justifyItems;
    gridEl.style.alignItems = state.alignItems;
    gridEl.style.justifyContent = state.justifyContent;
    gridEl.style.alignContent = state.alignContent;

    renderItems();
    updateCode();
    saveState();
  }

  /* ═══════════════════════════════════════════════════════
     GENERATE CSS
     ═══════════════════════════════════════════════════════ */

  function updateCode() {
    let css = '.container {\n';
    css += '  display: grid;\n';
    css += `  grid-template-columns: ${state.templateCols};\n`;
    if (state.templateRows !== 'auto') css += `  grid-template-rows: ${state.templateRows};\n`;
    if (state.gap > 0) css += `  gap: ${state.gap}px;\n`;
    if (state.justifyItems !== 'stretch') css += `  justify-items: ${state.justifyItems};\n`;
    if (state.alignItems !== 'stretch') css += `  align-items: ${state.alignItems};\n`;
    if (state.justifyContent !== 'stretch') css += `  justify-content: ${state.justifyContent};\n`;
    if (state.alignContent !== 'stretch') css += `  align-content: ${state.alignContent};\n`;
    css += '}';

    /* Item styles */
    if (activePresetLabels) {
      /* Preset mode: show ALL items with descriptive labels */
      css += '\n\n/* Items */';
      for (let i = 0; i < state.itemCount; i++) {
        const item = state.items[i];
        const label = activePresetLabels[i] || `item-${i + 1}`;
        const hasCustom = item.gridColumn !== 'auto' || item.gridRow !== 'auto' || item.justifySelf !== 'auto' || item.alignSelf !== 'auto';

        css += `\n\n.${label} {`;
        if (hasCustom) {
          const parts = [];
          if (item.gridColumn !== 'auto') parts.push(`  grid-column: ${item.gridColumn};`);
          if (item.gridRow !== 'auto') parts.push(`  grid-row: ${item.gridRow};`);
          if (item.justifySelf !== 'auto') parts.push(`  justify-self: ${item.justifySelf};`);
          if (item.alignSelf !== 'auto') parts.push(`  align-self: ${item.alignSelf};`);
          css += '\n' + parts.join('\n');
        } else {
          css += '\n  /* Default */';
        }
        css += '\n}';
      }
    } else {
      /* Free mode: show only items with non-default placement */
      const nonDefaultItems = [];
      for (let i = 0; i < state.itemCount; i++) {
        const item = state.items[i];
        const hasCustom = item.gridColumn !== 'auto' || item.gridRow !== 'auto' || item.justifySelf !== 'auto' || item.alignSelf !== 'auto';
        if (hasCustom) nonDefaultItems.push({ index: i, ...item });
      }

      if (nonDefaultItems.length > 0) {
        css += '\n\n/* Items con estilos personalizados */';
        nonDefaultItems.forEach(item => {
          css += `\n\n.item-${item.index + 1} {`;
          const parts = [];
          if (item.gridColumn !== 'auto') parts.push(`  grid-column: ${item.gridColumn};`);
          if (item.gridRow !== 'auto') parts.push(`  grid-row: ${item.gridRow};`);
          if (item.justifySelf !== 'auto') parts.push(`  justify-self: ${item.justifySelf};`);
          if (item.alignSelf !== 'auto') parts.push(`  align-self: ${item.alignSelf};`);
          css += '\n' + parts.join('\n');
          css += '\n}';
        });
      }
    }

    codeEl.textContent = css;
  }

  /* ═══════════════════════════════════════════════════════
     ITEM SELECTION
     ═══════════════════════════════════════════════════════ */

  function selectItem(index) {
    state.selectedItem = index;
    itemSection.style.display = '';
    itemNumEl.textContent = index + 1;

    /* Update placement inputs */
    colPlaceInput.value = state.items[index].gridColumn;
    rowPlaceInput.value = state.items[index].gridRow;

    updateItemPropButtons();
    updatePreview();
  }

  function deselectItem() {
    state.selectedItem = null;
    itemSection.style.display = 'none';
    updatePreview();
  }

  document.getElementById('gp-deselect').addEventListener('click', deselectItem);

  document.getElementById('gp-preview').addEventListener('click', (e) => {
    if (e.target === gridEl || e.target.id === 'gp-preview') {
      deselectItem();
    }
  });

  /* ═══════════════════════════════════════════════════════
     TEMPLATE INPUTS
     ═══════════════════════════════════════════════════════ */

  function syncTemplatePresetButtons(presetWrapId, currentValue) {
    document.getElementById(presetWrapId).querySelectorAll('.gp-template-preset').forEach(btn => {
      btn.classList.toggle('gp-template-preset--active', btn.dataset.value === currentValue);
    });
  }

  /* Column presets */
  document.getElementById('gp-col-presets').addEventListener('click', (e) => {
    const btn = e.target.closest('.gp-template-preset');
    if (!btn) return;
    activePresetLabels = null;
    state.templateCols = btn.dataset.value;
    colsInput.value = state.templateCols;
    syncTemplatePresetButtons('gp-col-presets', state.templateCols);
    updatePreview();
  });

  colsInput.addEventListener('input', () => {
    activePresetLabels = null;
    state.templateCols = colsInput.value;
    syncTemplatePresetButtons('gp-col-presets', state.templateCols);
    updatePreview();
  });

  /* Row presets */
  document.getElementById('gp-row-presets').addEventListener('click', (e) => {
    const btn = e.target.closest('.gp-template-preset');
    if (!btn) return;
    activePresetLabels = null;
    state.templateRows = btn.dataset.value;
    rowsInput.value = state.templateRows;
    syncTemplatePresetButtons('gp-row-presets', state.templateRows);
    updatePreview();
  });

  rowsInput.addEventListener('input', () => {
    activePresetLabels = null;
    state.templateRows = rowsInput.value;
    syncTemplatePresetButtons('gp-row-presets', state.templateRows);
    updatePreview();
  });

  /* ═══════════════════════════════════════════════════════
     CONTAINER PROPERTY BUTTONS
     ═══════════════════════════════════════════════════════ */

  container.querySelectorAll('[data-prop]').forEach(group => {
    const prop = group.dataset.prop;
    group.querySelectorAll('.gp-prop-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activePresetLabels = null;
        state[prop] = btn.dataset.value;
        group.querySelectorAll('.gp-prop-btn').forEach(b => b.classList.remove('gp-prop-btn--active'));
        btn.classList.add('gp-prop-btn--active');
        updatePreview();
      });
    });
  });

  /* ═══════════════════════════════════════════════════════
     ITEM PROPERTY BUTTONS
     ═══════════════════════════════════════════════════════ */

  function updateItemPropButtons() {
    if (state.selectedItem === null) return;
    const item = state.items[state.selectedItem];

    container.querySelectorAll('[data-item-prop]').forEach(group => {
      const prop = group.dataset.itemProp;
      const val = String(item[prop]);
      group.querySelectorAll('.gp-prop-btn').forEach(btn => {
        btn.classList.toggle('gp-prop-btn--active', btn.dataset.value === val);
      });
    });
  }

  container.querySelectorAll('[data-item-prop]').forEach(group => {
    const prop = group.dataset.itemProp;
    group.querySelectorAll('.gp-prop-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.selectedItem === null) return;
        state.items[state.selectedItem][prop] = btn.dataset.value;
        group.querySelectorAll('.gp-prop-btn').forEach(b => b.classList.remove('gp-prop-btn--active'));
        btn.classList.add('gp-prop-btn--active');
        updatePreview();
      });
    });
  });

  /* Placement inputs (grid-column, grid-row) */
  colPlaceInput.addEventListener('input', () => {
    if (state.selectedItem === null) return;
    state.items[state.selectedItem].gridColumn = colPlaceInput.value;
    updatePreview();
  });

  rowPlaceInput.addEventListener('input', () => {
    if (state.selectedItem === null) return;
    state.items[state.selectedItem].gridRow = rowPlaceInput.value;
    updatePreview();
  });

  /* ═══════════════════════════════════════════════════════
     GAP SLIDER
     ═══════════════════════════════════════════════════════ */

  const gapSlider = document.getElementById('gp-gap');
  const gapVal = document.getElementById('gp-gap-val');
  gapSlider.addEventListener('input', () => {
    state.gap = parseInt(gapSlider.value);
    gapVal.textContent = state.gap + 'px';
    updatePreview();
  });

  /* ═══════════════════════════════════════════════════════
     ADD / REMOVE ITEMS
     ═══════════════════════════════════════════════════════ */

  document.getElementById('gp-add-item').addEventListener('click', () => {
    if (state.itemCount >= 12) return;
    activePresetLabels = null;
    state.itemCount++;
    if (state.selectedItem !== null && state.selectedItem >= state.itemCount) {
      state.selectedItem = state.itemCount - 1;
    }
    itemCountEl.textContent = state.itemCount;
    updatePreview();
  });

  document.getElementById('gp-remove-item').addEventListener('click', () => {
    if (state.itemCount <= 1) return;
    activePresetLabels = null;
    state.itemCount--;
    if (state.selectedItem !== null && state.selectedItem >= state.itemCount) {
      state.selectedItem = null;
      itemSection.style.display = 'none';
    }
    itemCountEl.textContent = state.itemCount;
    updatePreview();
  });

  /* ═══════════════════════════════════════════════════════
     PRESETS
     ═══════════════════════════════════════════════════════ */

  const presets = [
    { name: '3 Columns', icon: 'fa-table-columns',
      cols: '1fr 1fr 1fr', rows: 'auto', gap: 12, ji: 'stretch', ai: 'stretch', jc: 'stretch', ac: 'stretch', count: 6,
      labels: ['col-1', 'col-2', 'col-3', 'col-4', 'col-5', 'col-6'] },
    { name: 'Sidebar', icon: 'fa-arrows-left-right',
      cols: '250px 1fr', rows: 'auto', gap: 16, ji: 'stretch', ai: 'stretch', jc: 'stretch', ac: 'stretch', count: 2,
      labels: ['sidebar', 'content'] },
    { name: 'Holy Grail', icon: 'fa-cross',
      cols: '200px 1fr 200px', rows: '60px 1fr 60px', gap: 8, ji: 'stretch', ai: 'stretch', jc: 'stretch', ac: 'stretch', count: 5,
      labels: ['header', 'nav', 'main', 'aside', 'footer'],
      customItems: { 0: { gridColumn: '1 / -1' }, 4: { gridColumn: '1 / -1' } } },
    { name: 'Gallery', icon: 'fa-images',
      cols: 'repeat(auto-fill, minmax(120px, 1fr))', rows: 'auto', gap: 10, ji: 'stretch', ai: 'stretch', jc: 'stretch', ac: 'stretch', count: 8,
      labels: ['photo-1', 'photo-2', 'photo-3', 'photo-4', 'photo-5', 'photo-6', 'photo-7', 'photo-8'] },
    { name: 'Dashboard', icon: 'fa-gauge-high',
      cols: '250px 1fr', rows: '60px 1fr 60px', gap: 12, ji: 'stretch', ai: 'stretch', jc: 'stretch', ac: 'stretch', count: 4,
      labels: ['header', 'sidebar', 'main', 'footer'],
      customItems: { 0: { gridColumn: '1 / -1' }, 3: { gridColumn: '1 / -1' } } },
    { name: 'Magazine', icon: 'fa-newspaper',
      cols: '1fr 1fr', rows: 'auto', gap: 16, ji: 'stretch', ai: 'stretch', jc: 'stretch', ac: 'stretch', count: 5,
      labels: ['headline', 'article-1', 'article-2', 'article-3', 'article-4'],
      customItems: { 0: { gridColumn: '1 / -1' } } },
    { name: 'Cards', icon: 'fa-grip',
      cols: 'repeat(auto-fill, minmax(200px, 1fr))', rows: 'auto', gap: 16, ji: 'stretch', ai: 'stretch', jc: 'stretch', ac: 'stretch', count: 6,
      labels: ['card-1', 'card-2', 'card-3', 'card-4', 'card-5', 'card-6'] },
    { name: 'Center', icon: 'fa-crosshairs',
      cols: '1fr', rows: '1fr', gap: 0, ji: 'center', ai: 'center', jc: 'center', ac: 'center', count: 1,
      labels: ['centered'] },
  ];

  function renderPresets() {
    const wrap = document.getElementById('gp-presets');
    wrap.innerHTML = presets.map((p, i) => `
      <button class="gp-preset" data-pi="${i}" data-tooltip="${p.name}">
        <i class="fa-solid ${p.icon}"></i>
        <span>${p.name}</span>
      </button>
    `).join('');

    wrap.querySelectorAll('.gp-preset').forEach(el => {
      el.addEventListener('click', () => {
        const p = presets[parseInt(el.dataset.pi)];
        applyPreset(p);
      });
    });
  }

  function applyPreset(p) {
    state.templateCols = p.cols;
    state.templateRows = p.rows;
    state.gap = p.gap;
    state.justifyItems = p.ji;
    state.alignItems = p.ai;
    state.justifyContent = p.jc;
    state.alignContent = p.ac;
    state.itemCount = p.count;
    state.selectedItem = null;
    itemSection.style.display = 'none';

    /* Reset all items */
    for (let i = 0; i < 12; i++) {
      state.items[i] = { gridColumn: 'auto', gridRow: 'auto', justifySelf: 'auto', alignSelf: 'auto' };
    }

    /* Apply custom item props */
    if (p.customItems) {
      Object.keys(p.customItems).forEach(idx => {
        const ci = parseInt(idx);
        if (state.items[ci]) Object.assign(state.items[ci], p.customItems[idx]);
      });
    }

    /* Store labels for CSS output */
    activePresetLabels = p.labels || null;

    /* Update UI controls */
    syncContainerButtons();
    syncTemplatePresetButtons('gp-col-presets', state.templateCols);
    syncTemplatePresetButtons('gp-row-presets', state.templateRows);
    colsInput.value = state.templateCols;
    rowsInput.value = state.templateRows;
    gapSlider.value = state.gap;
    gapVal.textContent = state.gap + 'px';
    itemCountEl.textContent = state.itemCount;
    updatePreview();
  }

  function syncContainerButtons() {
    container.querySelectorAll('[data-prop]').forEach(group => {
      const prop = group.dataset.prop;
      group.querySelectorAll('.gp-prop-btn').forEach(btn => {
        btn.classList.toggle('gp-prop-btn--active', btn.dataset.value === state[prop]);
      });
    });
  }

  /* ═══════════════════════════════════════════════════════
     RESET
     ═══════════════════════════════════════════════════════ */

  document.getElementById('gp-reset').addEventListener('click', () => {
    activePresetLabels = null;
    state.templateCols = '1fr 1fr 1fr';
    state.templateRows = 'auto';
    state.gap = 10;
    state.justifyItems = 'stretch';
    state.alignItems = 'stretch';
    state.justifyContent = 'stretch';
    state.alignContent = 'stretch';
    state.itemCount = 6;
    state.selectedItem = null;
    for (let i = 0; i < 12; i++) {
      state.items[i] = { gridColumn: 'auto', gridRow: 'auto', justifySelf: 'auto', alignSelf: 'auto' };
    }
    itemSection.style.display = 'none';
    itemCountEl.textContent = 6;
    colsInput.value = '1fr 1fr 1fr';
    rowsInput.value = 'auto';
    gapSlider.value = 10; gapVal.textContent = '10px';
    syncContainerButtons();
    syncTemplatePresetButtons('gp-col-presets', '1fr 1fr 1fr');
    syncTemplatePresetButtons('gp-row-presets', 'auto');
    updatePreview();
  });

  /* ═══════════════════════════════════════════════════════
     COPY CSS
     ═══════════════════════════════════════════════════════ */

  document.getElementById('gp-copy-css').addEventListener('click', () => {
    MiniDevTools.copyToClipboard(codeEl.textContent, 'CSS copiado!');
  });

  /* ═══════════════════════════════════════════════════════
     PERSISTENCE
     ═══════════════════════════════════════════════════════ */

  function saveState() {
    ToolStorage.setField('grid-playground', 'state', { ...state });
  }

  /* ═══════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════ */

  renderPresets();
  updatePreview();
};

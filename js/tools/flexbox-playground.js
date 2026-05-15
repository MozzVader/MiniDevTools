/* ═══════════════════════════════════════════════════════════════
   Flexbox Playground — Visual flexbox sandbox interactivo
   Features:
   - Live preview with colored items
   - Container props: direction, wrap, justify-content, align-items, align-content, gap
   - Item props (per-item): flex-grow, flex-shrink, flex-basis, align-self, order
   - Add/remove items (1–12), click to select
   - Container width/height sliders
   - Generated CSS output with copy
   - Presets: Center, Navbar, Columns, Sidebar, Card Grid, Holy Grail
   - Persistence with ToolStorage
   ═══════════════════════════════════════════════════════════════ */

window['render_flexbox-playground'] = function(container, toolMeta) {

  /* ─── Constants ─── */
  const ITEM_COLORS = [
    '#6366f1', '#ec4899', '#f59e0b', '#22c55e',
    '#06b6d4', '#8b5cf6', '#ef4444', '#14b8a6',
    '#f97316', '#3b82f6', '#a855f7', '#eab308'
  ];

  /* ─── State ─── */
  const saved = ToolStorage.load('flexbox-playground');
  const s = saved ? saved.state : null;

  const state = {
    flexDirection: s ? s.flexDirection : 'row',
    flexWrap: s ? s.flexWrap : 'nowrap',
    justifyContent: s ? s.justifyContent : 'flex-start',
    alignItems: s ? s.alignItems : 'stretch',
    alignContent: s ? s.alignContent : 'stretch',
    gap: s ? (s.gap ?? 10) : 10,
    containerW: s ? (s.containerW ?? 100) : 100,
    containerH: s ? (s.containerH ?? 300) : 300,
    itemCount: s ? (s.itemCount ?? 4) : 4,
    selectedItem: s ? s.selectedItem : null,
    items: s && s.items ? s.items : {},
    itemSizes: s && s.itemSizes ? s.itemSizes : {},
  };

  /* Ensure all 12 items initialized */
  const defaultSizes = [80, 100, 60, 90, 70, 85, 75, 95, 65, 110, 55, 80];
  for (let i = 0; i < 12; i++) {
    if (!state.items[i]) state.items[i] = { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto', order: 0 };
    if (!state.itemSizes[i]) state.itemSizes[i] = defaultSizes[i];
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

        <div class="fp-layout">

          <!-- ═══ Left: Preview + Code ═══ -->
          <div class="fp-preview-col">

            <!-- Items bar -->
            <div class="fp-items-bar">
              <span class="fp-items-bar__label">Items</span>
              <button class="fp-items-bar__btn" id="fp-remove-item"><i class="fa-solid fa-minus"></i></button>
              <span class="fp-items-bar__count" id="fp-item-count">${state.itemCount}</span>
              <button class="fp-items-bar__btn" id="fp-add-item"><i class="fa-solid fa-plus"></i></button>
            </div>

            <!-- Preview -->
            <div class="fp-preview" id="fp-preview">
              <div class="fp-container" id="fp-container"></div>
            </div>

            <!-- Container size -->
            <div class="fp-size-row">
              <label>Ancho</label>
              <input type="range" class="fp-range" id="fp-cw" min="20" max="100" value="${state.containerW}">
              <span class="fp-range-val" id="fp-cw-val">${state.containerW}%</span>
            </div>
            <div class="fp-size-row">
              <label>Alto</label>
              <input type="range" class="fp-range" id="fp-ch" min="80" max="500" value="${state.containerH}">
              <span class="fp-range-val" id="fp-ch-val">${state.containerH}px</span>
            </div>

            <!-- Code output -->
            <div class="fp-code-wrap">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
                <span class="fp-section-title" style="margin-bottom:0;">CSS Generado</span>
                <button class="btn btn--ghost btn--sm" id="fp-copy-css"><i class="fa-regular fa-copy" style="margin-right:4px;"></i>Copiar</button>
              </div>
              <pre class="fp-code" id="fp-code"></pre>
            </div>
          </div>

          <!-- ═══ Right: Controls ═══ -->
          <div class="fp-controls">

            <!-- CONTAINER -->
            <div class="fp-section-title"><i class="fa-solid fa-layer-group" style="margin-right:6px;"></i>Contenedor</div>

            <div class="fp-prop-group">
              <label class="fp-prop-label">flex-direction</label>
              <div class="fp-prop-btns" data-prop="flexDirection">
                <button class="fp-prop-btn ${state.flexDirection === 'row' ? 'fp-prop-btn--active' : ''}" data-value="row">row</button>
                <button class="fp-prop-btn ${state.flexDirection === 'row-reverse' ? 'fp-prop-btn--active' : ''}" data-value="row-reverse">row-reverse</button>
                <button class="fp-prop-btn ${state.flexDirection === 'column' ? 'fp-prop-btn--active' : ''}" data-value="column">column</button>
                <button class="fp-prop-btn ${state.flexDirection === 'column-reverse' ? 'fp-prop-btn--active' : ''}" data-value="column-reverse">col-reverse</button>
              </div>
            </div>

            <div class="fp-prop-group">
              <label class="fp-prop-label">flex-wrap</label>
              <div class="fp-prop-btns" data-prop="flexWrap">
                <button class="fp-prop-btn ${state.flexWrap === 'nowrap' ? 'fp-prop-btn--active' : ''}" data-value="nowrap">nowrap</button>
                <button class="fp-prop-btn ${state.flexWrap === 'wrap' ? 'fp-prop-btn--active' : ''}" data-value="wrap">wrap</button>
                <button class="fp-prop-btn ${state.flexWrap === 'wrap-reverse' ? 'fp-prop-btn--active' : ''}" data-value="wrap-reverse">wrap-reverse</button>
              </div>
            </div>

            <div class="fp-prop-group">
              <label class="fp-prop-label">justify-content</label>
              <div class="fp-prop-btns fp-prop-btns--wrap" data-prop="justifyContent">
                <button class="fp-prop-btn ${state.justifyContent === 'flex-start' ? 'fp-prop-btn--active' : ''}" data-value="flex-start">flex-start</button>
                <button class="fp-prop-btn ${state.justifyContent === 'flex-end' ? 'fp-prop-btn--active' : ''}" data-value="flex-end">flex-end</button>
                <button class="fp-prop-btn ${state.justifyContent === 'center' ? 'fp-prop-btn--active' : ''}" data-value="center">center</button>
                <button class="fp-prop-btn ${state.justifyContent === 'space-between' ? 'fp-prop-btn--active' : ''}" data-value="space-between">space-between</button>
                <button class="fp-prop-btn ${state.justifyContent === 'space-around' ? 'fp-prop-btn--active' : ''}" data-value="space-around">space-around</button>
                <button class="fp-prop-btn ${state.justifyContent === 'space-evenly' ? 'fp-prop-btn--active' : ''}" data-value="space-evenly">space-evenly</button>
              </div>
            </div>

            <div class="fp-prop-group">
              <label class="fp-prop-label">align-items</label>
              <div class="fp-prop-btns fp-prop-btns--wrap" data-prop="alignItems">
                <button class="fp-prop-btn ${state.alignItems === 'stretch' ? 'fp-prop-btn--active' : ''}" data-value="stretch">stretch</button>
                <button class="fp-prop-btn ${state.alignItems === 'flex-start' ? 'fp-prop-btn--active' : ''}" data-value="flex-start">flex-start</button>
                <button class="fp-prop-btn ${state.alignItems === 'flex-end' ? 'fp-prop-btn--active' : ''}" data-value="flex-end">flex-end</button>
                <button class="fp-prop-btn ${state.alignItems === 'center' ? 'fp-prop-btn--active' : ''}" data-value="center">center</button>
                <button class="fp-prop-btn ${state.alignItems === 'baseline' ? 'fp-prop-btn--active' : ''}" data-value="baseline">baseline</button>
              </div>
            </div>

            <div class="fp-prop-group">
              <label class="fp-prop-label">align-content</label>
              <div class="fp-prop-btns fp-prop-btns--wrap" data-prop="alignContent">
                <button class="fp-prop-btn ${state.alignContent === 'stretch' ? 'fp-prop-btn--active' : ''}" data-value="stretch">stretch</button>
                <button class="fp-prop-btn ${state.alignContent === 'flex-start' ? 'fp-prop-btn--active' : ''}" data-value="flex-start">flex-start</button>
                <button class="fp-prop-btn ${state.alignContent === 'flex-end' ? 'fp-prop-btn--active' : ''}" data-value="flex-end">flex-end</button>
                <button class="fp-prop-btn ${state.alignContent === 'center' ? 'fp-prop-btn--active' : ''}" data-value="center">center</button>
                <button class="fp-prop-btn ${state.alignContent === 'space-between' ? 'fp-prop-btn--active' : ''}" data-value="space-between">space-between</button>
                <button class="fp-prop-btn ${state.alignContent === 'space-around' ? 'fp-prop-btn--active' : ''}" data-value="space-around">space-around</button>
              </div>
            </div>

            <div class="fp-prop-group">
              <label class="fp-prop-label">gap</label>
              <div class="fp-gap-row">
                <input type="range" class="fp-range fp-range--full" id="fp-gap" min="0" max="40" value="${state.gap}">
                <span class="fp-range-val" id="fp-gap-val">${state.gap}px</span>
              </div>
            </div>

            <!-- ITEM (conditional) -->
            <div id="fp-item-section" style="${state.selectedItem !== null ? '' : 'display:none;'}">
              <div class="fp-section-title" style="margin-top:20px;">
                <i class="fa-solid fa-cube" style="margin-right:6px;"></i>Item <span id="fp-item-num">${state.selectedItem !== null ? state.selectedItem + 1 : ''}</span>
              </div>

              <div class="fp-prop-group">
                <label class="fp-prop-label">flex-grow</label>
                <div class="fp-prop-btns" data-item-prop="flexGrow">
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].flexGrow === 0 ? 'fp-prop-btn--active' : ''}" data-value="0">0</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].flexGrow === 1 ? 'fp-prop-btn--active' : ''}" data-value="1">1</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].flexGrow === 2 ? 'fp-prop-btn--active' : ''}" data-value="2">2</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].flexGrow === 3 ? 'fp-prop-btn--active' : ''}" data-value="3">3</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].flexGrow === 4 ? 'fp-prop-btn--active' : ''}" data-value="4">4</button>
                </div>
              </div>

              <div class="fp-prop-group">
                <label class="fp-prop-label">flex-shrink</label>
                <div class="fp-prop-btns" data-item-prop="flexShrink">
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].flexShrink === 0 ? 'fp-prop-btn--active' : ''}" data-value="0">0</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].flexShrink === 1 ? 'fp-prop-btn--active' : ''}" data-value="1">1</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].flexShrink === 2 ? 'fp-prop-btn--active' : ''}" data-value="2">2</button>
                </div>
              </div>

              <div class="fp-prop-group">
                <label class="fp-prop-label">flex-basis</label>
                <div class="fp-prop-btns fp-prop-btns--wrap" data-item-prop="flexBasis">
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].flexBasis === 'auto' ? 'fp-prop-btn--active' : ''}" data-value="auto">auto</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].flexBasis === '0' ? 'fp-prop-btn--active' : ''}" data-value="0">0</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].flexBasis === '50px' ? 'fp-prop-btn--active' : ''}" data-value="50px">50px</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].flexBasis === '100px' ? 'fp-prop-btn--active' : ''}" data-value="100px">100px</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].flexBasis === '150px' ? 'fp-prop-btn--active' : ''}" data-value="150px">150px</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].flexBasis === '25%' ? 'fp-prop-btn--active' : ''}" data-value="25%">25%</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].flexBasis === '50%' ? 'fp-prop-btn--active' : ''}" data-value="50%">50%</button>
                </div>
              </div>

              <div class="fp-prop-group">
                <label class="fp-prop-label">align-self</label>
                <div class="fp-prop-btns fp-prop-btns--wrap" data-item-prop="alignSelf">
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].alignSelf === 'auto' ? 'fp-prop-btn--active' : ''}" data-value="auto">auto</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].alignSelf === 'flex-start' ? 'fp-prop-btn--active' : ''}" data-value="flex-start">flex-start</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].alignSelf === 'flex-end' ? 'fp-prop-btn--active' : ''}" data-value="flex-end">flex-end</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].alignSelf === 'center' ? 'fp-prop-btn--active' : ''}" data-value="center">center</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].alignSelf === 'stretch' ? 'fp-prop-btn--active' : ''}" data-value="stretch">stretch</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].alignSelf === 'baseline' ? 'fp-prop-btn--active' : ''}" data-value="baseline">baseline</button>
                </div>
              </div>

              <div class="fp-prop-group">
                <label class="fp-prop-label">order</label>
                <div class="fp-prop-btns" data-item-prop="order">
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].order === -2 ? 'fp-prop-btn--active' : ''}" data-value="-2">-2</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].order === -1 ? 'fp-prop-btn--active' : ''}" data-value="-1">-1</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].order === 0 ? 'fp-prop-btn--active' : ''}" data-value="0">0</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].order === 1 ? 'fp-prop-btn--active' : ''}" data-value="1">1</button>
                  <button class="fp-prop-btn ${state.selectedItem !== null && state.items[state.selectedItem].order === 2 ? 'fp-prop-btn--active' : ''}" data-value="2">2</button>
                </div>
              </div>

              <button class="fp-deselect-btn" id="fp-deselect">
                <i class="fa-solid fa-xmark" style="margin-right:4px;"></i>Deseleccionar item
              </button>
            </div>

            <!-- PRESETS -->
            <div class="fp-section-title" style="margin-top:20px;"><i class="fa-solid fa-wand-magic-sparkles" style="margin-right:6px;"></i>Presets</div>
            <div class="fp-presets" id="fp-presets"></div>

            <!-- RESET -->
            <div class="fp-actions">
              <button class="btn btn--secondary btn--icon" id="fp-reset" data-tooltip="Reset">
                <i class="fa-solid fa-rotate-left"></i>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const containerEl = document.getElementById('fp-container');
  const codeEl = document.getElementById('fp-code');
  const itemCountEl = document.getElementById('fp-item-count');
  const itemSection = document.getElementById('fp-item-section');
  const itemNumEl = document.getElementById('fp-item-num');

  /* ═══════════════════════════════════════════════════════
     UPDATE PREVIEW
     ═══════════════════════════════════════════════════════ */

  function renderItems() {
    containerEl.innerHTML = '';
    for (let i = 0; i < state.itemCount; i++) {
      const item = state.items[i];
      const color = ITEM_COLORS[i % ITEM_COLORS.length];
      const size = state.itemSizes[i];

      const el = document.createElement('div');
      el.className = 'fp-item' + (state.selectedItem === i ? ' fp-item--selected' : '');
      el.dataset.index = i;
      el.style.backgroundColor = color;
      el.style.width = size + 'px';
      el.style.height = (item.flexBasis === 'auto' ? 50 + (i % 3) * 15 : 'auto') + 'px';

      /* Apply item styles */
      el.style.flexGrow = item.flexGrow;
      el.style.flexShrink = item.flexShrink;
      if (item.flexBasis === 'auto') {
        el.style.flexBasis = 'auto';
      } else {
        el.style.flexBasis = item.flexBasis;
      }
      if (item.alignSelf !== 'auto') {
        el.style.alignSelf = item.alignSelf;
      }
      el.style.order = item.order;

      el.innerHTML = `<span class="fp-item__num">${i + 1}</span>`;
      el.addEventListener('click', () => selectItem(i));
      containerEl.appendChild(el);
    }
  }

  function updatePreview() {
    /* Apply container styles */
    containerEl.style.display = 'flex';
    containerEl.style.flexDirection = state.flexDirection;
    containerEl.style.flexWrap = state.flexWrap;
    containerEl.style.justifyContent = state.justifyContent;
    containerEl.style.alignItems = state.alignItems;
    containerEl.style.alignContent = state.alignContent;
    containerEl.style.gap = state.gap + 'px';
    containerEl.style.width = state.containerW + '%';
    containerEl.style.minHeight = state.containerH + 'px';

    renderItems();
    updateCode();
    saveState();
  }

  /* ═══════════════════════════════════════════════════════
     GENERATE CSS
     ═══════════════════════════════════════════════════════ */

  function updateCode() {
    let css = '.container {\n';
    css += '  display: flex;\n';
    css += `  flex-direction: ${state.flexDirection};\n`;
    if (state.flexWrap !== 'nowrap') css += `  flex-wrap: ${state.flexWrap};\n`;
    if (state.justifyContent !== 'flex-start') css += `  justify-content: ${state.justifyContent};\n`;
    if (state.alignItems !== 'stretch') css += `  align-items: ${state.alignItems};\n`;
    if (state.alignContent !== 'stretch') css += `  align-content: ${state.alignContent};\n`;
    if (state.gap > 0) css += `  gap: ${state.gap}px;\n`;
    css += '}';

    /* Item styles if any have non-default values */
    const nonDefaultItems = [];
    for (let i = 0; i < state.itemCount; i++) {
      const item = state.items[i];
      const hasCustom = item.flexGrow !== 0 || item.flexShrink !== 1 || item.flexBasis !== 'auto' || item.alignSelf !== 'auto' || item.order !== 0;
      if (hasCustom) nonDefaultItems.push({ index: i, ...item });
    }

    if (nonDefaultItems.length > 0) {
      css += '\n\n/* Items con estilos personalizados */';
      nonDefaultItems.forEach(item => {
        css += `\n.item-${item.index + 1} {`;
        const parts = [];
        if (item.flexGrow !== 0) parts.push(`  flex-grow: ${item.flexGrow};`);
        if (item.flexShrink !== 1) parts.push(`  flex-shrink: ${item.flexShrink};`);
        if (item.flexBasis !== 'auto') parts.push(`  flex-basis: ${item.flexBasis};`);
        if (item.alignSelf !== 'auto') parts.push(`  align-self: ${item.alignSelf};`);
        if (item.order !== 0) parts.push(`  order: ${item.order};`);
        css += '\n' + parts.join('\n');
        css += '\n}';
      });
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
    updateItemPropButtons();
    updatePreview();
  }

  function deselectItem() {
    state.selectedItem = null;
    itemSection.style.display = 'none';
    updatePreview();
  }

  document.getElementById('fp-deselect').addEventListener('click', deselectItem);

  /* Click outside items to deselect */
  document.getElementById('fp-preview').addEventListener('click', (e) => {
    if (e.target === containerEl || e.target.id === 'fp-preview') {
      deselectItem();
    }
  });

  /* ═══════════════════════════════════════════════════════
     CONTAINER PROPERTY BUTTONS
     ═══════════════════════════════════════════════════════ */

  container.querySelectorAll('[data-prop]').forEach(group => {
    const prop = group.dataset.prop;
    group.querySelectorAll('.fp-prop-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        state[prop] = btn.dataset.value;
        group.querySelectorAll('.fp-prop-btn').forEach(b => b.classList.remove('fp-prop-btn--active'));
        btn.classList.add('fp-prop-btn--active');
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
      group.querySelectorAll('.fp-prop-btn').forEach(btn => {
        btn.classList.toggle('fp-prop-btn--active', btn.dataset.value === val);
      });
    });
  }

  container.querySelectorAll('[data-item-prop]').forEach(group => {
    const prop = group.dataset.itemProp;
    group.querySelectorAll('.fp-prop-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (state.selectedItem === null) return;
        const val = btn.dataset.value;
        state.items[state.selectedItem][prop] = isNaN(val) ? val : Number(val);
        group.querySelectorAll('.fp-prop-btn').forEach(b => b.classList.remove('fp-prop-btn--active'));
        btn.classList.add('fp-prop-btn--active');
        updatePreview();
      });
    });
  });

  /* ═══════════════════════════════════════════════════════
     GAP SLIDER
     ═══════════════════════════════════════════════════════ */

  const gapSlider = document.getElementById('fp-gap');
  const gapVal = document.getElementById('fp-gap-val');
  gapSlider.addEventListener('input', () => {
    state.gap = parseInt(gapSlider.value);
    gapVal.textContent = state.gap + 'px';
    updatePreview();
  });

  /* ═══════════════════════════════════════════════════════
     CONTAINER SIZE SLIDERS
     ═══════════════════════════════════════════════════════ */

  const cwSlider = document.getElementById('fp-cw');
  const cwVal = document.getElementById('fp-cw-val');
  cwSlider.addEventListener('input', () => {
    state.containerW = parseInt(cwSlider.value);
    cwVal.textContent = state.containerW + '%';
    updatePreview();
  });

  const chSlider = document.getElementById('fp-ch');
  const chVal = document.getElementById('fp-ch-val');
  chSlider.addEventListener('input', () => {
    state.containerH = parseInt(chSlider.value);
    chVal.textContent = state.containerH + 'px';
    updatePreview();
  });

  /* ═══════════════════════════════════════════════════════
     ADD / REMOVE ITEMS
     ═══════════════════════════════════════════════════════ */

  document.getElementById('fp-add-item').addEventListener('click', () => {
    if (state.itemCount >= 12) return;
    state.itemCount++;
    if (state.selectedItem !== null && state.selectedItem >= state.itemCount) {
      state.selectedItem = state.itemCount - 1;
    }
    itemCountEl.textContent = state.itemCount;
    updatePreview();
  });

  document.getElementById('fp-remove-item').addEventListener('click', () => {
    if (state.itemCount <= 1) return;
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
    { name: 'Center', icon: 'fa-crosshairs', dir: 'row', wrap: 'nowrap', jc: 'center', ai: 'center', ac: 'center', gap: 10, count: 3 },
    { name: 'Navbar', icon: 'fa-bars', dir: 'row', wrap: 'nowrap', jc: 'space-between', ai: 'center', ac: 'stretch', gap: 16, count: 4 },
    { name: 'Columns', icon: 'fa-columns', dir: 'row', wrap: 'nowrap', jc: 'flex-start', ai: 'stretch', ac: 'stretch', gap: 12, count: 3, customItems: { 0: { flexGrow: 1 }, 1: { flexGrow: 1 }, 2: { flexGrow: 1 } } },
    { name: 'Sidebar', icon: 'fa-table-columns', dir: 'row', wrap: 'nowrap', jc: 'flex-start', ai: 'stretch', ac: 'stretch', gap: 16, count: 2, customItems: { 0: { flexBasis: '200px', flexShrink: 0 }, 1: { flexGrow: 1 } } },
    { name: 'Cards', icon: 'fa-grip', dir: 'row', wrap: 'wrap', jc: 'flex-start', ai: 'stretch', ac: 'stretch', gap: 16, count: 6 },
    { name: 'Footer', icon: 'fa-arrow-down', dir: 'column', wrap: 'nowrap', jc: 'flex-start', ai: 'stretch', ac: 'stretch', gap: 0, count: 3, customItems: { 0: {}, 1: { flexGrow: 1 }, 2: {} } },
    { name: 'Masonry', icon: 'fa-table-cells', dir: 'row', wrap: 'wrap', jc: 'flex-start', ai: 'flex-start', ac: 'flex-start', gap: 10, count: 6 },
    { name: 'Reverse', icon: 'fa-right-left', dir: 'row-reverse', wrap: 'nowrap', jc: 'flex-start', ai: 'center', ac: 'stretch', gap: 12, count: 4 },
  ];

  function renderPresets() {
    const wrap = document.getElementById('fp-presets');
    wrap.innerHTML = presets.map((p, i) => `
      <button class="fp-preset" data-pi="${i}" data-tooltip="${p.name}">
        <i class="fa-solid ${p.icon}"></i>
        <span>${p.name}</span>
      </button>
    `).join('');

    wrap.querySelectorAll('.fp-preset').forEach(el => {
      el.addEventListener('click', () => {
        const p = presets[parseInt(el.dataset.pi)];
        applyPreset(p);
      });
    });
  }

  function applyPreset(p) {
    state.flexDirection = p.dir;
    state.flexWrap = p.wrap;
    state.justifyContent = p.jc;
    state.alignItems = p.ai;
    state.alignContent = p.ac;
    state.gap = p.gap;
    state.itemCount = p.count;
    state.selectedItem = null;
    itemSection.style.display = 'none';

    /* Reset all items */
    for (let i = 0; i < 12; i++) {
      state.items[i] = { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto', order: 0 };
    }

    /* Apply custom item props */
    if (p.customItems) {
      Object.keys(p.customItems).forEach(idx => {
        const ci = parseInt(idx);
        if (state.items[ci]) Object.assign(state.items[ci], p.customItems[idx]);
      });
    }

    /* Update UI controls */
    syncContainerButtons();
    itemCountEl.textContent = state.itemCount;
    gapSlider.value = state.gap;
    gapVal.textContent = state.gap + 'px';
    updatePreview();
  }

  function syncContainerButtons() {
    container.querySelectorAll('[data-prop]').forEach(group => {
      const prop = group.dataset.prop;
      group.querySelectorAll('.fp-prop-btn').forEach(btn => {
        btn.classList.toggle('fp-prop-btn--active', btn.dataset.value === state[prop]);
      });
    });
  }

  /* ═══════════════════════════════════════════════════════
     RESET
     ═══════════════════════════════════════════════════════ */

  document.getElementById('fp-reset').addEventListener('click', () => {
    state.flexDirection = 'row';
    state.flexWrap = 'nowrap';
    state.justifyContent = 'flex-start';
    state.alignItems = 'stretch';
    state.alignContent = 'stretch';
    state.gap = 10;
    state.containerW = 100;
    state.containerH = 300;
    state.itemCount = 4;
    state.selectedItem = null;
    for (let i = 0; i < 12; i++) {
      state.items[i] = { flexGrow: 0, flexShrink: 1, flexBasis: 'auto', alignSelf: 'auto', order: 0 };
    }
    itemSection.style.display = 'none';
    itemCountEl.textContent = 4;
    cwSlider.value = 100; cwVal.textContent = '100%';
    chSlider.value = 300; chVal.textContent = '300px';
    gapSlider.value = 10; gapVal.textContent = '10px';
    syncContainerButtons();
    updatePreview();
  });

  /* ═══════════════════════════════════════════════════════
     COPY CSS
     ═══════════════════════════════════════════════════════ */

  document.getElementById('fp-copy-css').addEventListener('click', () => {
    MiniDevTools.copyToClipboard(codeEl.textContent, 'CSS copiado!');
  });

  /* ═══════════════════════════════════════════════════════
     PERSISTENCE
     ═══════════════════════════════════════════════════════ */

  function saveState() {
    ToolStorage.setField('flexbox-playground', 'state', { ...state });
  }

  /* ═══════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════ */

  renderPresets();
  updatePreview();
};

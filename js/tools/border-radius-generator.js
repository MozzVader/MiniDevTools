/* ═══════════════════════════════════════════════════════════════
   Border Radius Generator — Visual border-radius builder
   Individual corner control, linked mode, presets, live preview.
   Usa ToolStorage para persistir estado.
   ═══════════════════════════════════════════════════════════════ */

function render_border_radius_generator(container, toolMeta) {

  /* ─── State ─── */
  const saved = ToolStorage.load('border-radius-generator');
  const s = saved ? saved.state : null;

  const state = {
    topLeft:     s ? s.topLeft : 16,
    topRight:    s ? s.topRight : 16,
    bottomRight: s ? s.bottomRight : 16,
    bottomLeft:  s ? s.bottomLeft : 16,
    linked:      s ? (s.linked ?? true) : true,
  };

  /* ─── Render UI ─── */
  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title"><i class="${toolMeta.icon}" style="margin-right:8px;"></i>${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <div class="br-layout">
          <!-- Preview + Code -->
          <div class="br-preview-wrap">
            <div class="br-preview">
              <div class="br-preview__box" id="br-box">
                <!-- Corner indicators -->
                <span class="br-corner-indicator br-corner-indicator--tl" id="br-ind-tl">${state.topLeft}</span>
                <span class="br-corner-indicator br-corner-indicator--tr" id="br-ind-tr">${state.topRight}</span>
                <span class="br-corner-indicator br-corner-indicator--br" id="br-ind-br">${state.bottomRight}</span>
                <span class="br-corner-indicator br-corner-indicator--bl" id="br-ind-bl">${state.bottomLeft}</span>
              </div>
            </div>
            <div class="br-code" id="br-code"></div>
          </div>

          <!-- Controls -->
          <div class="br-controls">

            <!-- Link toggle -->
            <div class="br-link-row">
              <label class="br-option">
                <input type="checkbox" id="br-linked" ${state.linked ? 'checked' : ''}>
                <i class="fa-solid fa-link"></i>
                <i class="fa-solid fa-link-slash"></i>
                <span>Vincular esquinas</span>
              </label>
            </div>

            <!-- Sliders -->
            <div class="br-slider-group">
              <div class="br-slider-row" id="br-row-tl">
                <label class="br-corner-label">
                  <span class="br-corner-dot br-corner-dot--tl"></span>
                  Top Left
                </label>
                <input type="range" class="br-range" id="br-tl" min="0" max="200" value="${state.topLeft}">
                <input type="number" class="br-num-input" id="br-tl-num" min="0" max="999" value="${state.topLeft}">
              </div>
              <div class="br-slider-row" id="br-row-tr">
                <label class="br-corner-label">
                  <span class="br-corner-dot br-corner-dot--tr"></span>
                  Top Right
                </label>
                <input type="range" class="br-range" id="br-tr" min="0" max="200" value="${state.topRight}">
                <input type="number" class="br-num-input" id="br-tr-num" min="0" max="999" value="${state.topRight}">
              </div>
              <div class="br-slider-row" id="br-row-br">
                <label class="br-corner-label">
                  <span class="br-corner-dot br-corner-dot--br"></span>
                  Bottom Right
                </label>
                <input type="range" class="br-range" id="br-br" min="0" max="200" value="${state.bottomRight}">
                <input type="number" class="br-num-input" id="br-br-num" min="0" max="999" value="${state.bottomRight}">
              </div>
              <div class="br-slider-row" id="br-row-bl">
                <label class="br-corner-label">
                  <span class="br-corner-dot br-corner-dot--bl"></span>
                  Bottom Left
                </label>
                <input type="range" class="br-range" id="br-bl" min="0" max="200" value="${state.bottomLeft}">
                <input type="number" class="br-num-input" id="br-bl-num" min="0" max="999" value="${state.bottomLeft}">
              </div>
            </div>

            <!-- Presets -->
            <div>
              <label class="br-presets-label">Presets</label>
              <div class="br-presets" id="br-presets"></div>
            </div>

            <!-- Actions -->
            <div class="br-actions">
              <button class="btn btn--primary" id="br-copy" style="flex:1;">
                <i class="fa-regular fa-copy"></i> Copiar CSS
              </button>
              <button class="btn btn--secondary btn--icon" id="br-reset" data-tooltip="Reset">
                <i class="fa-solid fa-rotate-left"></i>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const box = document.getElementById('br-box');
  const codeEl = document.getElementById('br-code');
  const linkedCb = document.getElementById('br-linked');

  const sliders = {
    topLeft:     { range: document.getElementById('br-tl'),     num: document.getElementById('br-tl-num'),     ind: document.getElementById('br-ind-tl') },
    topRight:    { range: document.getElementById('br-tr'),     num: document.getElementById('br-tr-num'),     ind: document.getElementById('br-ind-tr') },
    bottomRight: { range: document.getElementById('br-br'),     num: document.getElementById('br-br-num'),     ind: document.getElementById('br-ind-br') },
    bottomLeft:  { range: document.getElementById('br-bl'),     num: document.getElementById('br-bl-num'),     ind: document.getElementById('br-ind-bl') },
  };

  const rows = {
    topLeft:     document.getElementById('br-row-tl'),
    topRight:    document.getElementById('br-row-tr'),
    bottomRight: document.getElementById('br-row-br'),
    bottomLeft:  document.getElementById('br-row-bl'),
  };

  let lastCSS = '';

  /* ─── Build CSS ─── */
  function buildRadiusCSS() {
    const tl = state.topLeft;
    const tr = state.topRight;
    const br = state.bottomRight;
    const bl = state.bottomLeft;

    /* Shortest form */
    if (tl === tr && tr === br && br === bl) {
      return `${tl}px`;
    }
    if (tl === br && tr === bl) {
      return `${tl}px ${tr}px`;
    }
    if (tr === bl) {
      return `${tl}px ${tr}px ${br}px`;
    }
    return `${tl}px ${tr}px ${br}px ${bl}px`;
  }

  function update() {
    const css = buildRadiusCSS();
    lastCSS = `border-radius: ${css};`;

    box.style.borderRadius = `${state.topLeft}px ${state.topRight}px ${state.bottomRight}px ${state.bottomLeft}px`;
    codeEl.textContent = lastCSS;

    /* Update indicators */
    sliders.topLeft.ind.textContent = state.topLeft;
    sliders.topRight.ind.textContent = state.topRight;
    sliders.bottomRight.ind.textContent = state.bottomRight;
    sliders.bottomLeft.ind.textContent = state.bottomLeft;

    saveState();
  }

  /* ─── Slider Events ─── */
  function wireCorner(corner) {
    const s = sliders[corner];

    s.range.addEventListener('input', () => {
      const val = parseInt(s.range.value) || 0;
      state[corner] = val;
      s.num.value = val;
      if (state.linked) syncLinked(corner, val);
      update();
    });

    s.num.addEventListener('input', () => {
      let val = parseInt(s.num.value);
      if (isNaN(val) || val < 0) val = 0;
      state[corner] = val;
      s.range.value = Math.min(val, 200);
      if (state.linked) syncLinked(corner, val);
      update();
    });

    s.num.addEventListener('blur', () => {
      s.num.value = state[corner];
    });
  }

  function syncLinked(source, val) {
    Object.keys(sliders).forEach(corner => {
      if (corner !== source) {
        state[corner] = val;
        sliders[corner].range.value = Math.min(val, 200);
        sliders[corner].num.value = val;
      }
    });
  }

  wireCorner('topLeft');
  wireCorner('topRight');
  wireCorner('bottomRight');
  wireCorner('bottomLeft');

  /* ─── Link Toggle ─── */
  function updateLinkedUI() {
    const linked = state.linked;

    /* Show/hide individual sliders */
    Object.keys(rows).forEach(corner => {
      if (linked && corner !== 'topLeft') {
        rows[corner].style.opacity = '0.4';
        rows[corner].style.pointerEvents = 'none';
      } else {
        rows[corner].style.opacity = '';
        rows[corner].style.pointerEvents = '';
      }
    });

    /* If linking, sync all to topLeft */
    if (linked) {
      syncLinked('topLeft', state.topLeft);
      update();
    }
  }

  linkedCb.addEventListener('change', () => {
    state.linked = linkedCb.checked;
    updateLinkedUI();
    saveState();
  });

  /* ─── Reset ─── */
  document.getElementById('br-reset').addEventListener('click', () => {
    state.topLeft = 16;
    state.topRight = 16;
    state.bottomRight = 16;
    state.bottomLeft = 16;
    state.linked = true;

    Object.keys(sliders).forEach(corner => {
      sliders[corner].range.value = 16;
      sliders[corner].num.value = 16;
    });
    linkedCb.checked = true;
    updateLinkedUI();
    update();
  });

  /* ─── Copy ─── */
  document.getElementById('br-copy').addEventListener('click', () => {
    MiniDevTools.copyToClipboard(lastCSS, 'CSS copiado!');
  });

  /* ─── Presets ─── */
  const presets = [
    { name: 'Square',     tl: 0,   tr: 0,   br: 0,   bl: 0 },
    { name: 'Sm',         tl: 4,   tr: 4,   br: 4,   bl: 4 },
    { name: 'Rounded',    tl: 12,  tr: 12,  br: 12,  bl: 12 },
    { name: 'XL',         tl: 24,  tr: 24,  br: 24,  bl: 24 },
    { name: 'Pill',       tl: 999, tr: 999, br: 999, bl: 999 },
    { name: 'Blob',       tl: 30,  tr: 70,  br: 30,  bl: 70 },
    { name: 'Leaf',       tl: 0,   tr: 999, br: 999, bl: 0 },
    { name: 'Tag',        tl: 8,   tr: 8,   br: 0,   bl: 0 },
    { name: 'Bite TL',    tl: 0,   tr: 16,  br: 16,  bl: 16 },
    { name: 'Bite BR',    tl: 16,  tr: 16,  br: 0,   bl: 16 },
    { name: 'Diamond',    tl: 24,  tr: 24,  br: 0,   bl: 0 },
    { name: 'Organic',    tl: 60,  tr: 24,  br: 60,  bl: 24 },
  ];

  function renderPresets() {
    const wrap = document.getElementById('br-presets');
    wrap.innerHTML = presets.map((p, i) => `
      <div class="br-preset" data-pi="${i}" data-tooltip="${p.name}" data-tooltip-bottom>
        <div class="br-preset__shape" style="border-radius:${p.tl}px ${p.tr}px ${p.br}px ${p.bl}px;"></div>
      </div>
    `).join('');

    wrap.querySelectorAll('.br-preset').forEach(el => {
      el.addEventListener('click', () => {
        const p = presets[parseInt(el.dataset.pi)];
        state.topLeft = p.tl;
        state.topRight = p.tr;
        state.bottomRight = p.br;
        state.bottomLeft = p.bl;

        /* Check if all equal → link mode */
        const allEqual = p.tl === p.tr && p.tr === p.br && p.br === p.bl;
        state.linked = allEqual;
        linkedCb.checked = allEqual;

        sliders.topLeft.range.value = Math.min(p.tl, 200);     sliders.topLeft.num.value = p.tl;
        sliders.topRight.range.value = Math.min(p.tr, 200);    sliders.topRight.num.value = p.tr;
        sliders.bottomRight.range.value = Math.min(p.br, 200); sliders.bottomRight.num.value = p.br;
        sliders.bottomLeft.range.value = Math.min(p.bl, 200);  sliders.bottomLeft.num.value = p.bl;

        updateLinkedUI();
        update();
      });
    });
  }

  /* ─── Persistence ─── */
  function saveState() {
    ToolStorage.setField('border-radius-generator', 'state', { ...state });
  }

  /* ─── Init ─── */
  updateLinkedUI();
  renderPresets();
  update();
}

/* Registro global */
window['render_border-radius-generator'] = render_border_radius_generator;

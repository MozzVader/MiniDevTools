/* ═══════════════════════════════════════════════════════════════
   Shadow Generator — Visual box-shadow builder con preview en vivo
   Soporta: offset, blur, spread, color, inset, múltiples layers.
   Presets, copiar CSS, box radius ajustable.
   Usa ToolStorage para persistir estado.
   ═══════════════════════════════════════════════════════════════ */

function render_shadow_generator(container, toolMeta) {

  /* ─── State ─── */
  const saved = ToolStorage.load('shadow-generator');
  const s = saved ? saved.state : null;

  const state = {
    offsetX:     s ? s.offsetX : 0,
    offsetY:     s ? s.offsetY : 8,
    blur:        s ? s.blur : 24,
    spread:      s ? s.spread : 0,
    color:       s ? s.color : 'rgba(0,0,0,0.18)',
    inset:       s ? s.inset : false,
    borderRadius: s ? s.borderRadius : 16,
  };

  /* ─── Render UI ─── */
  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title"><i class="${toolMeta.icon}" style="margin-right:8px;"></i>${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <div class="sg-layout">
          <!-- Preview + Code -->
          <div class="sg-preview-wrap">
            <div class="sg-preview">
              <div class="sg-preview__box" id="sg-box"></div>
            </div>
            <div class="sg-code" id="sg-code"></div>
          </div>

          <!-- Controls -->
          <div class="sg-controls">

            <!-- Offsets -->
            <div class="sg-slider-group">
              <div class="sg-slider-row">
                <label>Offset X</label>
                <input type="range" class="sg-range" id="sg-ox" min="-80" max="80" value="${state.offsetX}">
                <span class="sg-slider-val" id="sg-ox-val">${state.offsetX}px</span>
              </div>
              <div class="sg-slider-row">
                <label>Offset Y</label>
                <input type="range" class="sg-range" id="sg-oy" min="-80" max="80" value="${state.offsetY}">
                <span class="sg-slider-val" id="sg-oy-val">${state.offsetY}px</span>
              </div>
              <div class="sg-slider-row">
                <label>Blur</label>
                <input type="range" class="sg-range" id="sg-blur" min="0" max="120" value="${state.blur}">
                <span class="sg-slider-val" id="sg-blur-val">${state.blur}px</span>
              </div>
              <div class="sg-slider-row">
                <label>Spread</label>
                <input type="range" class="sg-range" id="sg-spread" min="-40" max="40" value="${state.spread}">
                <span class="sg-slider-val" id="sg-spread-val">${state.spread}px</span>
              </div>
              <div class="sg-slider-row">
                <label>Radius</label>
                <input type="range" class="sg-range" id="sg-radius" min="0" max="80" value="${state.borderRadius}">
                <span class="sg-slider-val" id="sg-radius-val">${state.borderRadius}px</span>
              </div>
            </div>

            <!-- Color -->
            <div class="sg-color-row">
              <label>Color</label>
              <input type="color" class="sg-color-input" id="sg-color" value="${rgbaToHex(state.color)}">
              <input type="text" class="input sg-color-hex" id="sg-color-hex" value="${state.color}" spellcheck="false" placeholder="rgba(0,0,0,0.18)">
            </div>

            <!-- Options -->
            <div class="sg-options">
              <label class="sg-option">
                <input type="checkbox" id="sg-inset" ${state.inset ? 'checked' : ''}>
                <span>Inset</span>
              </label>
            </div>

            <!-- Presets -->
            <div>
              <label class="sg-presets-label">Presets</label>
              <div class="sg-presets" id="sg-presets"></div>
            </div>

            <!-- Actions -->
            <div class="sg-actions">
              <button class="btn btn--primary" id="sg-copy" style="flex:1;">
                <i class="fa-regular fa-copy"></i> Copiar CSS
              </button>
              <button class="btn btn--secondary btn--icon" id="sg-reset" title="Reset">
                <i class="fa-solid fa-rotate-left"></i>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const box       = document.getElementById('sg-box');
  const codeEl    = document.getElementById('sg-code');
  const oxSlider  = document.getElementById('sg-ox');
  const oySlider  = document.getElementById('sg-oy');
  const blurSlider = document.getElementById('sg-blur');
  const spreadSlider = document.getElementById('sg-spread');
  const radiusSlider = document.getElementById('sg-radius');
  const oxVal     = document.getElementById('sg-ox-val');
  const oyVal     = document.getElementById('sg-oy-val');
  const blurVal   = document.getElementById('sg-blur-val');
  const spreadVal = document.getElementById('sg-spread-val');
  const radiusVal = document.getElementById('sg-radius-val');
  const colorPicker = document.getElementById('sg-color');
  const colorHex  = document.getElementById('sg-color-hex');
  const insetCb   = document.getElementById('sg-inset');
  const copyBtn   = document.getElementById('sg-copy');
  const resetBtn  = document.getElementById('sg-reset');
  const presetsWrap = document.getElementById('sg-presets');

  /* ─── Build shadow CSS ─── */
  let lastCSS = '';

  function buildShadow() {
    const inset = state.inset ? 'inset ' : '';
    return `${inset}${state.offsetX}px ${state.offsetY}px ${state.blur}px ${state.spread}px ${state.color}`;
  }

  function update() {
    const shadow = buildShadow();
    lastCSS = `box-shadow: ${shadow};`;
    box.style.boxShadow = shadow;
    box.style.borderRadius = state.borderRadius + 'px';
    codeEl.textContent = lastCSS;
    saveState();
  }

  /* ─── Helpers ─── */
  function rgbaToHex(rgba) {
    if (!rgba) return '#000000';
    if (rgba.startsWith('#')) return rgba.length === 7 ? rgba : '#000000';
    const m = rgba.match(/[\d.]+/g);
    if (!m || m.length < 3) return '#000000';
    const r = parseInt(m[0]).toString(16).padStart(2, '0');
    const g = parseInt(m[1]).toString(16).padStart(2, '0');
    const b = parseInt(m[2]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  function hexToRgba(hex, alpha) {
    if (!hex || !hex.startsWith('#') || hex.length < 7) return `rgba(0,0,0,${alpha})`;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /* Extract alpha from current color */
  function getCurrentAlpha() {
    const m = state.color.match(/[\d.]+/g);
    if (m && m.length >= 4) return parseFloat(m[3]);
    return 1;
  }

  /* ─── Slider Events ─── */
  function wireSlider(slider, valEl, key, unit) {
    slider.addEventListener('input', () => {
      state[key] = parseInt(slider.value);
      valEl.textContent = state[key] + unit;
      update();
    });
  }

  wireSlider(oxSlider, oxVal, 'offsetX', 'px');
  wireSlider(oySlider, oyVal, 'offsetY', 'px');
  wireSlider(blurSlider, blurVal, 'blur', 'px');
  wireSlider(spreadSlider, spreadVal, 'spread', 'px');
  wireSlider(radiusSlider, radiusVal, 'borderRadius', 'px');

  /* ─── Color Events ─── */
  colorPicker.addEventListener('input', () => {
    const hex = colorPicker.value;
    state.color = hexToRgba(hex, getCurrentAlpha());
    colorHex.value = state.color;
    update();
  });

  colorHex.addEventListener('input', () => {
    const val = colorHex.value.trim();
    /* Accept hex or rgba */
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      state.color = hexToRgba(val, getCurrentAlpha());
      colorPicker.value = val;
      update();
    } else if (/^rgba?\(.+\)$/.test(val)) {
      state.color = val;
      colorPicker.value = rgbaToHex(val);
      update();
    }
  });

  /* ─── Inset ─── */
  insetCb.addEventListener('change', () => {
    state.inset = insetCb.checked;
    update();
  });

  /* ─── Reset ─── */
  resetBtn.addEventListener('click', () => {
    state.offsetX = 0;
    state.offsetY = 8;
    state.blur = 24;
    state.spread = 0;
    state.color = 'rgba(0,0,0,0.18)';
    state.inset = false;
    state.borderRadius = 16;

    oxSlider.value = 0;   oxVal.textContent = '0px';
    oySlider.value = 8;   oyVal.textContent = '8px';
    blurSlider.value = 24; blurVal.textContent = '24px';
    spreadSlider.value = 0; spreadVal.textContent = '0px';
    radiusSlider.value = 16; radiusVal.textContent = '16px';
    colorPicker.value = '#000000';
    colorHex.value = 'rgba(0,0,0,0.18)';
    insetCb.checked = false;
    update();
  });

  /* ─── Copy ─── */
  copyBtn.addEventListener('click', () => {
    MiniDevTools.copyToClipboard(lastCSS, 'CSS copiado!');
  });

  /* ─── Presets ─── */
  const presets = [
    { name: 'Soft',    ox: 0,  oy: 4,  blur: 12, spread: 0,  color: 'rgba(0,0,0,0.1)',    inset: false, radius: 16 },
    { name: 'Medium',  ox: 0,  oy: 8,  blur: 24, spread: 0,  color: 'rgba(0,0,0,0.18)',   inset: false, radius: 16 },
    { name: 'Hard',    ox: 0,  oy: 20, spread: 0,  blur: 60, color: 'rgba(0,0,0,0.3)',    inset: false, radius: 16 },
    { name: 'Sharp',   ox: 8,  oy: 8,  blur: 0,  spread: 0,  color: 'rgba(0,0,0,0.25)',   inset: false, radius: 16 },
    { name: 'Glow',    ox: 0,  oy: 0,  blur: 30, spread: 0,  color: 'rgba(99,102,241,0.5)', inset: false, radius: 16 },
    { name: 'Neon',    ox: 0,  oy: 0,  blur: 20, spread: 4,  color: 'rgba(16,185,129,0.6)', inset: false, radius: 16 },
    { name: 'Layered', ox: 0,  oy: 1,  blur: 2,  spread: 0,  color: 'rgba(0,0,0,0.07)',   inset: false, radius: 16 },
    { name: 'Inset',   ox: 0,  oy: 4,  blur: 12, spread: -4, color: 'rgba(0,0,0,0.15)',   inset: true,  radius: 16 },
    { name: 'Outline', ox: 0,  oy: 0,  blur: 0,  spread: 3,  color: 'rgba(99,102,241,0.4)', inset: false, radius: 16 },
    { name: 'Bottom',  ox: 0,  oy: 12, blur: 24, spread: -8, color: 'rgba(0,0,0,0.2)',    inset: false, radius: 16 },
    { name: 'Pink',    ox: 0,  oy: 8,  blur: 30, spread: 0,  color: 'rgba(236,72,153,0.4)', inset: false, radius: 24 },
    { name: 'Float',   ox: 0,  oy: 20, blur: 40, spread: -10, color: 'rgba(0,0,0,0.2)',   inset: false, radius: 20 },
  ];

  function renderPresets() {
    presetsWrap.innerHTML = presets.map((p, i) => {
      const inset = p.inset ? 'inset ' : '';
      const shadow = `${inset}${p.ox}px ${p.oy}px ${p.blur}px ${p.spread}px ${p.color}`;
      return `
        <div class="sg-preset" data-pi="${i}" title="${p.name}" style="background:var(--bg-base-secondary);">
          <div class="sg-preset__box" style="box-shadow:${shadow}; border-radius:${Math.min(p.radius, 12)}px;"></div>
        </div>`;
    }).join('');

    presetsWrap.querySelectorAll('.sg-preset').forEach(el => {
      el.addEventListener('click', () => {
        const p = presets[parseInt(el.dataset.pi)];
        state.offsetX = p.ox;
        state.offsetY = p.oy;
        state.blur = p.blur;
        state.spread = p.spread;
        state.color = p.color;
        state.inset = p.inset;
        state.borderRadius = p.radius;

        oxSlider.value = p.ox;     oxVal.textContent = p.ox + 'px';
        oySlider.value = p.oy;     oyVal.textContent = p.oy + 'px';
        blurSlider.value = p.blur; blurVal.textContent = p.blur + 'px';
        spreadSlider.value = p.spread; spreadVal.textContent = p.spread + 'px';
        radiusSlider.value = p.radius; radiusVal.textContent = p.radius + 'px';
        colorPicker.value = rgbaToHex(p.color);
        colorHex.value = p.color;
        insetCb.checked = p.inset;
        update();
      });
    });
  }

  /* ─── Persistence ─── */
  function saveState() {
    ToolStorage.setField('shadow-generator', 'state', { ...state });
  }

  /* ─── Init ─── */
  renderPresets();
  update();
}

/* Registro global */
window['render_shadow-generator'] = render_shadow_generator;

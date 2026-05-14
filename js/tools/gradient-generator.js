/* ═══════════════════════════════════════════════════════════════
   Gradient Generator — Crea gradientes CSS con preview en vivo
   Soporta: linear, radial, conic.
   Color stops dinámicos, ángulo, presets, copiar CSS.
   Usa ToolStorage para persistir estado.
   ═══════════════════════════════════════════════════════════════ */

function render_gradient_generator(container, toolMeta) {

  /* ─── State ─── */
  const saved = ToolStorage.load('gradient-generator');
  const state = saved ? saved.state : null;

  let gradientType = state ? state.type : 'linear';
  let angle = state ? state.angle : 135;
  let stops = state ? state.stops : [
    { color: '#6366f1', position: 0 },
    { color: '#ec4899', position: 50 },
    { color: '#f97316', position: 100 }
  ];

  /* ─── Render UI ─── */
  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title"><i class="${toolMeta.icon}" style="margin-right:8px;"></i>${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <div class="gg-layout">
          <!-- Preview + Code -->
          <div class="gg-preview-wrap">
            <div class="gg-preview">
              <div class="gg-preview__checkerboard"></div>
              <div class="gg-preview__gradient" id="gg-preview"></div>
            </div>
            <div class="gg-code" id="gg-code"></div>
          </div>

          <!-- Controls -->
          <div class="gg-controls">
            <!-- Type selector -->
            <div>
              <label class="label" style="margin-bottom:6px;">Tipo</label>
              <div class="gg-type-selector">
                <button class="gg-type-btn ${gradientType === 'linear' ? 'gg-type-btn--active' : ''}" data-type="linear">
                  <i class="fa-solid fa-arrow-right-long" style="margin-right:4px;"></i> Linear
                </button>
                <button class="gg-type-btn ${gradientType === 'radial' ? 'gg-type-btn--active' : ''}" data-type="radial">
                  <i class="fa-solid fa-circle" style="margin-right:4px; font-size:10px;"></i> Radial
                </button>
                <button class="gg-type-btn ${gradientType === 'conic' ? 'gg-type-btn--active' : ''}" data-type="conic">
                  <i class="fa-solid fa-rotate" style="margin-right:4px;"></i> Conic
                </button>
              </div>
            </div>

            <!-- Angle -->
            <div class="gg-angle-group" id="gg-angle-group">
              <div class="gg-angle-header">
                <label class="label" style="margin-bottom:0;">Angulo</label>
                <span class="gg-angle-value" id="gg-angle-val">${angle}deg</span>
              </div>
              <input type="range" class="gg-range" id="gg-angle" min="0" max="360" value="${angle}">
            </div>

            <!-- Color stops -->
            <div>
              <label class="label" style="margin-bottom:6px;">Color stops</label>
              <div class="gg-stops" id="gg-stops"></div>
              <button class="gg-add-stop" id="gg-add-stop" style="margin-top:8px;">
                <i class="fa-solid fa-plus"></i> Agregar color
              </button>
            </div>

            <!-- Presets -->
            <div>
              <label class="gg-presets-label">Presets</label>
              <div class="gg-presets" id="gg-presets"></div>
            </div>

            <!-- Actions -->
            <div class="gg-actions">
              <button class="btn btn--primary" id="gg-copy" style="flex:1;">
                <i class="fa-regular fa-copy"></i> Copiar CSS
              </button>
              <button class="btn btn--secondary btn--icon" id="gg-random" title="Random">
                <i class="fa-solid fa-shuffle"></i>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const previewEl   = document.getElementById('gg-preview');
  const codeEl      = document.getElementById('gg-code');
  const stopsWrap   = document.getElementById('gg-stops');
  const angleSlider = document.getElementById('gg-angle');
  const angleVal    = document.getElementById('gg-angle-val');
  const angleGroup  = document.getElementById('gg-angle-group');
  const typeBtns    = container.querySelectorAll('.gg-type-btn');
  const addStopBtn  = document.getElementById('gg-add-stop');
  const copyBtn     = document.getElementById('gg-copy');
  const randomBtn   = document.getElementById('gg-random');
  const presetsWrap = document.getElementById('gg-presets');

  /* ─── Presets ─── */
  const presets = [
    { type: 'linear', angle: 135, stops: [{ color: '#6366f1', position: 0 }, { color: '#a855f7', position: 100 }] },
    { type: 'linear', angle: 90,  stops: [{ color: '#14b8a6', position: 0 }, { color: '#06b6d4', position: 50 }, { color: '#3b82f6', position: 100 }] },
    { type: 'linear', angle: 135, stops: [{ color: '#f43f5e', position: 0 }, { color: '#f97316', position: 100 }] },
    { type: 'linear', angle: 45,  stops: [{ color: '#fbbf24', position: 0 }, { color: '#f59e0b', position: 50 }, { color: '#ef4444', position: 100 }] },
    { type: 'radial', angle: 0,   stops: [{ color: '#8b5cf6', position: 0 }, { color: '#ec4899', position: 100 }] },
    { type: 'radial', angle: 0,   stops: [{ color: '#10b981', position: 0 }, { color: '#059669', position: 100 }] },
    { type: 'conic',  angle: 0,   stops: [{ color: '#f43f5e', position: 0 }, { color: '#8b5cf6', position: 33 }, { color: '#3b82f6', position: 66 }, { color: '#10b981', position: 100 }] },
    { type: 'conic',  angle: 45,  stops: [{ color: '#fbbf24', position: 0 }, { color: '#f97316', position: 25 }, { color: '#ef4444', position: 50 }, { color: '#ec4899', position: 75 }, { color: '#8b5cf6', position: 100 }] },
    { type: 'linear', angle: 180, stops: [{ color: '#0f172a', position: 0 }, { color: '#1e293b', position: 100 }] },
    { type: 'linear', angle: 135, stops: [{ color: '#a78bfa', position: 0 }, { color: '#fbbf24', position: 100 }] },
    { type: 'linear', angle: 90,  stops: [{ color: '#667eea', position: 0 }, { color: '#764ba2', position: 100 }] },
    { type: 'linear', angle: 160, stops: [{ color: '#0093E9', position: 0 }, { color: '#80D0C7', position: 100 }] },
  ];

  /* ─── Build CSS string ─── */
  function buildGradientCSS() {
    const stopsStr = stops
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(s => `${s.color} ${s.position}%`)
      .join(', ');

    switch (gradientType) {
      case 'linear':
        return `linear-gradient(${angle}deg, ${stopsStr})`;
      case 'radial':
        return `radial-gradient(circle, ${stopsStr})`;
      case 'conic':
        return `conic-gradient(from ${angle}deg, ${stopsStr})`;
      default:
        return `linear-gradient(${angle}deg, ${stopsStr})`;
    }
  }

  /* ─── Update preview ─── */
  let lastCSS = '';

  function update() {
    const css = buildGradientCSS();
    lastCSS = `background: ${css};`;
    previewEl.style.background = css;
    codeEl.textContent = lastCSS;
    saveState();

    /* Show/hide angle group */
    angleGroup.style.display = (gradientType === 'radial') ? 'none' : '';
  }

  /* ─── Render stops ─── */
  function renderStops() {
    stopsWrap.innerHTML = stops.map((stop, i) => `
      <div class="gg-stop" data-index="${i}">
        <input type="color" class="gg-stop__color" value="${stop.color}" data-i="${i}">
        <input type="text" class="input gg-stop__hex" value="${stop.color}" data-i="${i}" maxlength="7" spellcheck="false">
        <input type="number" class="input gg-stop__pos" value="${stop.position}" data-i="${i}" min="0" max="100">
        <button class="gg-stop__remove" data-i="${i}" title="Eliminar" ${stops.length <= 2 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}>
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `).join('');

    /* Events */
    stopsWrap.querySelectorAll('.gg-stop__color').forEach(el => {
      el.addEventListener('input', (e) => {
        const i = parseInt(e.target.dataset.i);
        stops[i].color = e.target.value;
        syncHex(i);
        update();
      });
    });

    stopsWrap.querySelectorAll('.gg-stop__hex').forEach(el => {
      el.addEventListener('input', (e) => {
        const i = parseInt(e.target.dataset.i);
        let val = e.target.value;
        if (/^#[0-9a-fA-F]{6}$/.test(val)) {
          stops[i].color = val;
          syncColor(i);
          update();
        }
      });
    });

    stopsWrap.querySelectorAll('.gg-stop__pos').forEach(el => {
      el.addEventListener('input', (e) => {
        const i = parseInt(e.target.dataset.i);
        let val = parseInt(e.target.value);
        if (isNaN(val)) val = 0;
        val = Math.max(0, Math.min(100, val));
        stops[i].position = val;
        update();
      });
    });

    stopsWrap.querySelectorAll('.gg-stop__remove').forEach(el => {
      el.addEventListener('click', (e) => {
        const i = parseInt(e.currentTarget.dataset.i);
        if (stops.length <= 2) return;
        stops.splice(i, 1);
        renderStops();
        update();
      });
    });
  }

  function syncHex(i) {
    const hex = stopsWrap.querySelector(`.gg-stop__hex[data-i="${i}"]`);
    if (hex) hex.value = stops[i].color;
  }

  function syncColor(i) {
    const picker = stopsWrap.querySelector(`.gg-stop__color[data-i="${i}"]`);
    if (picker) picker.value = stops[i].color;
  }

  /* ─── Render presets ─── */
  function renderPresets() {
    presetsWrap.innerHTML = presets.map((p, i) => {
      const stopsStr = p.stops.map(s => `${s.color} ${s.position}%`).join(', ');
      let bg;
      switch (p.type) {
        case 'linear': bg = `linear-gradient(${p.angle}deg, ${stopsStr})`; break;
        case 'radial': bg = `radial-gradient(circle, ${stopsStr})`; break;
        case 'conic':  bg = `conic-gradient(from ${p.angle}deg, ${stopsStr})`; break;
      }
      return `<div class="gg-preset" data-pi="${i}" style="background:${bg};" title="Preset ${i + 1}"></div>`;
    }).join('');

    presetsWrap.querySelectorAll('.gg-preset').forEach(el => {
      el.addEventListener('click', () => {
        const p = presets[parseInt(el.dataset.pi)];
        gradientType = p.type;
        angle = p.angle;
        stops = JSON.parse(JSON.stringify(p.stops));
        syncTypeButtons();
        angleSlider.value = angle;
        angleVal.textContent = angle + 'deg';
        renderStops();
        update();
      });
    });
  }

  /* ─── Type buttons ─── */
  function syncTypeButtons() {
    typeBtns.forEach(b => b.classList.toggle('gg-type-btn--active', b.dataset.type === gradientType));
  }

  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      gradientType = btn.dataset.type;
      syncTypeButtons();
      update();
    });
  });

  /* ─── Angle slider ─── */
  angleSlider.addEventListener('input', () => {
    angle = parseInt(angleSlider.value);
    angleVal.textContent = angle + 'deg';
    update();
  });

  /* ─── Add stop ─── */
  addStopBtn.addEventListener('click', () => {
    if (stops.length >= 8) return;
    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    /* Position halfway between last two stops */
    const lastPos = stops.length > 0 ? stops[stops.length - 1].position : 0;
    const newPos = Math.min(100, lastPos + Math.floor((100 - lastPos) / 2));
    stops.push({ color: randomColor, position: newPos });
    renderStops();
    update();
  });

  /* ─── Copy ─── */
  copyBtn.addEventListener('click', () => {
    MiniDevTools.copyToClipboard(lastCSS, 'CSS copiado!');
  });

  /* ─── Random ─── */
  randomBtn.addEventListener('click', () => {
    const count = 2 + Math.floor(Math.random() * 3); // 2-4 stops
    stops = [];
    for (let i = 0; i < count; i++) {
      stops.push({
        color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
        position: Math.round((i / (count - 1)) * 100)
      });
    }
    const types = ['linear', 'radial', 'conic'];
    gradientType = types[Math.floor(Math.random() * 3)];
    angle = Math.floor(Math.random() * 360);
    syncTypeButtons();
    angleSlider.value = angle;
    angleVal.textContent = angle + 'deg';
    renderStops();
    update();
  });

  /* ─── Persistence ─── */
  function saveState() {
    ToolStorage.setField('gradient-generator', 'state', {
      type: gradientType,
      angle: angle,
      stops: stops
    });
  }

  /* ─── Init ─── */
  renderPresets();
  renderStops();
  update();
}

/* Registro global */
window['render_gradient-generator'] = render_gradient_generator;

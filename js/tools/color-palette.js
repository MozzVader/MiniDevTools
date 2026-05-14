/* ═══════════════════════════════════════════════════════════════
   Color Palette Generator — Generar paletas de colores armónicas
   Modos: complementario, análogo, triádico, split, monocromático, random.
   Bloquear colores, editar individuales, exportar CSS/Tailwind/JSON.
   Usa ToolStorage para persistir estado.
   ═══════════════════════════════════════════════════════════════ */

function render_color_palette(container, toolMeta) {

  /* ─── State ─── */
  const saved = ToolStorage.load('color-palette');
  const s = saved ? saved.state : null;

  /* Check for incoming color from URL (e.g. from Image Color Picker) */
  const urlParams = new URLSearchParams(window.location.hash.split('?')[1] || '');
  const incomingColor = urlParams.get('color');

  let mode = s ? s.mode : 'analogous';
  let baseHex = s ? s.base : '#6366f1';
  let colors = s ? s.colors : generatePalette('#6366f1', 'analogous');
  let locked = s ? (s.locked || [false, false, false, false, false]) : [false, false, false, false, false];

  /* Override with incoming color if present */
  if (incomingColor && /^#[0-9a-fA-F]{6}$/.test(incomingColor)) {
    baseHex = incomingColor.toLowerCase();
    colors = generatePalette(baseHex, mode);
  }

  const COUNT = 5;

  /* ─── Color Theory ─── */
  function hexToHSL(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, sat = 0, l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      sat = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(sat * 100), l: Math.round(l * 100) };
  }

  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

  function hexToRGB(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16)
    };
  }

  /* Determine if color is light or dark for contrast text */
  function isLight(hex) {
    const { r, g, b } = hexToRGB(hex);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 150;
  }

  /* Generate palette from base color and mode */
  function generatePalette(baseHex, modeName) {
    const base = hexToHSL(baseHex);
    let palette = [];

    switch (modeName) {
      case 'complementary':
        palette = [
          { h: base.h, s: base.s, l: 20 },
          { h: base.h, s: base.s, l: 40 },
          { h: base.h, s: base.s, l: 60 },
          { h: (base.h + 180) % 360, s: base.s, l: 50 },
          { h: (base.h + 180) % 360, s: base.s, l: 75 },
        ];
        break;

      case 'analogous':
        palette = [
          { h: (base.h - 30 + 360) % 360, s: base.s, l: base.l },
          { h: (base.h - 15 + 360) % 360, s: base.s, l: Math.min(90, base.l + 10) },
          { h: base.h, s: base.s, l: base.l },
          { h: (base.h + 15) % 360, s: base.s, l: Math.max(20, base.l - 10) },
          { h: (base.h + 30) % 360, s: base.s, l: base.l },
        ];
        break;

      case 'triadic':
        palette = [
          { h: base.h, s: base.s, l: 30 },
          { h: base.h, s: base.s, l: 55 },
          { h: (base.h + 120) % 360, s: base.s, l: 50 },
          { h: (base.h + 240) % 360, s: base.s, l: 50 },
          { h: (base.h + 240) % 360, s: base.s, l: 75 },
        ];
        break;

      case 'split':
        palette = [
          { h: base.h, s: base.s, l: 25 },
          { h: base.h, s: base.s, l: 55 },
          { h: (base.h + 150) % 360, s: base.s, l: 50 },
          { h: (base.h + 210) % 360, s: base.s, l: 50 },
          { h: (base.h + 180) % 360, s: Math.max(10, base.s - 20), l: 85 },
        ];
        break;

      case 'monochromatic':
        palette = [
          { h: base.h, s: base.s, l: 15 },
          { h: base.h, s: base.s, l: 30 },
          { h: base.h, s: base.s, l: 50 },
          { h: base.h, s: base.s, l: 70 },
          { h: base.h, s: base.s, l: 90 },
        ];
        break;

      default:
        palette = [
          { h: base.h, s: base.s, l: base.l },
          { h: (base.h + 72) % 360, s: base.s, l: base.l },
          { h: (base.h + 144) % 360, s: base.s, l: base.l },
          { h: (base.h + 216) % 360, s: base.s, l: base.l },
          { h: (base.h + 288) % 360, s: base.s, l: base.l },
        ];
    }

    return palette.map(c => hslToHex(c.h, c.s, c.l));
  }

  /* Generate random hex */
  function randomHex() {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  }

  /* ─── Mode definitions ─── */
  const modes = [
    { id: 'complementary', label: 'Complementario', icon: 'fa-solid fa-arrows-left-right' },
    { id: 'analogous',     label: 'Análogo',        icon: 'fa-solid fa-water' },
    { id: 'triadic',       label: 'Triádico',       icon: 'fa-solid fa-shapes' },
    { id: 'split',         label: 'Split',          icon: 'fa-solid fa-code-branch' },
    { id: 'monochromatic', label: 'Monocromático',  icon: 'fa-solid fa-circle-half-stroke' },
    { id: 'random',        label: 'Random',         icon: 'fa-solid fa-shuffle' },
  ];

  /* ─── Presets ─── */
  const presets = [
    { name: 'Indigo Night',  base: '#6366f1', mode: 'analogous' },
    { name: 'Sunset',        base: '#f97316', mode: 'complementary' },
    { name: 'Ocean',         base: '#0ea5e9', mode: 'analogous' },
    { name: 'Forest',        base: '#22c55e', mode: 'complementary' },
    { name: 'Berry',         base: '#a855f7', mode: 'split' },
    { name: 'Rose Gold',     base: '#e11d48', mode: 'monochromatic' },
    { name: 'Teal Dream',    base: '#14b8a6', mode: 'triadic' },
    { name: 'Lavender',      base: '#8b5cf6', mode: 'analogous' },
    { name: 'Peach',         base: '#fb923c', mode: 'split' },
    { name: 'Midnight',      base: '#1e293b', mode: 'monochromatic' },
    { name: 'Coral Reef',    base: '#f43f5e', mode: 'analogous' },
    { name: 'Nordic',        base: '#38bdf8', mode: 'complementary' },
  ];

  /* ─── Saved Palettes ─── */
  const MAX_SAVED = 24;
  let savedPalettes = s && s.savedPalettes ? s.savedPalettes : [];

  /* ─── Render UI ─── */
  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title"><i class="${toolMeta.icon}" style="margin-right:8px;"></i>${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <div class="cp-layout">
          <!-- Left: Palette Display -->
          <div class="cp-left">
            <!-- Mode selector -->
            <div class="cp-modes">
              ${modes.map(m => `
                <button class="cp-mode-btn ${mode === m.id ? 'cp-mode-btn--active' : ''}" data-mode="${m.id}">
                  <i class="${m.icon}" style="margin-right:5px;"></i>${m.label}
                </button>
              `).join('')}
            </div>

            <!-- Base color picker -->
            <div class="cp-base-row" id="cp-base-row">
              <label class="label">Color base</label>
              <div class="cp-base-picker">
                <input type="color" id="cp-base-color" value="${baseHex}">
                <input type="text" class="input" id="cp-base-hex" value="${baseHex}" maxlength="7" spellcheck="false" style="width:90px;">
              </div>
              <button class="btn btn--secondary btn--icon" id="cp-random" data-tooltip="Random" style="flex-shrink:0;">
                <i class="fa-solid fa-dice"></i>
              </button>
            </div>

            <!-- Palette swatches -->
            <div class="cp-palette" id="cp-palette"></div>

            <!-- Export format -->
            <div class="cp-export-row">
              <label class="label">Exportar como</label>
              <div class="cp-export-btns">
                <button class="cp-export-btn cp-export-btn--active" data-fmt="css">CSS Variables</button>
                <button class="cp-export-btn" data-fmt="tailwind">Tailwind</button>
                <button class="cp-export-btn" data-fmt="json">JSON</button>
                <button class="cp-export-btn" data-fmt="array">Array</button>
              </div>
            </div>

            <!-- Export code -->
            <div class="cp-code-wrap">
              <button class="cp-copy-code" id="cp-copy-code" data-tooltip="Copiar">
                <i class="fa-regular fa-copy"></i>
              </button>
              <pre class="cp-code" id="cp-code"></pre>
            </div>
          </div>

          <!-- Right: Controls -->
          <div class="cp-right">
            <!-- Presets -->
            <div>
              <label class="cp-presets-label">Presets</label>
              <div class="cp-presets" id="cp-presets"></div>
            </div>

            <!-- Actions -->
            <div class="cp-actions">
              <button class="btn btn--primary" id="cp-generate" style="flex:1;">
                <i class="fa-solid fa-wand-magic-sparkles"></i> Generar
              </button>
              <button class="btn btn--secondary btn--icon" id="cp-save" data-tooltip="Guardar paleta">
                <i class="fa-solid fa-bookmark"></i>
              </button>
              <button class="btn btn--secondary btn--icon" id="cp-lock-all" data-tooltip="Lock all">
                <i class="fa-solid fa-lock"></i>
              </button>
              <button class="btn btn--secondary btn--icon" id="cp-unlock-all" data-tooltip="Unlock all">
                <i class="fa-solid fa-lock-open"></i>
              </button>
            </div>

            <!-- Keyboard hint -->
            <div class="cp-hint">
              <i class="fa-regular fa-keyboard"></i> Presioná <kbd>Space</kbd> para generar una nueva paleta
            </div>

            <!-- Saved Palettes -->
            <div class="cp-saved-section" id="cp-saved-section" style="display:none;">
              <div class="cp-saved-header">
                <label class="cp-presets-label">Guardadas <span class="cp-saved-count" id="cp-saved-count">0</span></label>
                <button class="cp-saved-clear" id="cp-saved-clear" data-tooltip="Borrar todas">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
              <div class="cp-saved-list" id="cp-saved-list"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const paletteWrap = document.getElementById('cp-palette');
  const baseColorPicker = document.getElementById('cp-base-color');
  const baseHexInput = document.getElementById('cp-base-hex');
  const randomBtn = document.getElementById('cp-random');
  const generateBtn = document.getElementById('cp-generate');
  const lockAllBtn = document.getElementById('cp-lock-all');
  const unlockAllBtn = document.getElementById('cp-unlock-all');
  const codeEl = document.getElementById('cp-code');
  const copyCodeBtn = document.getElementById('cp-copy-code');
  const presetsWrap = document.getElementById('cp-presets');
  const saveBtn = document.getElementById('cp-save');
  const savedSection = document.getElementById('cp-saved-section');
  const savedList = document.getElementById('cp-saved-list');
  const savedCount = document.getElementById('cp-saved-count');
  const savedClear = document.getElementById('cp-saved-clear');
  const modeBtns = container.querySelectorAll('.cp-mode-btn');
  const exportBtns = container.querySelectorAll('.cp-export-btn');

  let exportFormat = 'css';
  /* baseHex already declared above with incoming color support */

  /* ─── Render Palette ─── */
  function renderPalette() {
    paletteWrap.innerHTML = colors.map((hex, i) => {
      const light = isLight(hex);
      const hsl = hexToHSL(hex);
      const rgb = hexToRGB(hex);
      return `
        <div class="cp-swatch ${light ? 'cp-swatch--light' : ''}" data-i="${i}" style="background:${hex};">
          <!-- Lock button -->
          <button class="cp-swatch__lock" data-i="${i}" ${locked[i] ? 'data-locked' : ''}>
            <i class="fa-solid ${locked[i] ? 'fa-lock' : 'fa-lock-open'}"></i>
          </button>
          <!-- Color info -->
          <div class="cp-swatch__info">
            <span class="cp-swatch__hex">${hex.toUpperCase()}</span>
            <span class="cp-swatch__sub">RGB(${rgb.r}, ${rgb.g}, ${rgb.b})</span>
            <span class="cp-swatch__sub">HSL(${hsl.h}, ${hsl.s}%, ${hsl.l}%)</span>
          </div>
          <!-- Color picker -->
          <input type="color" class="cp-swatch__picker" value="${hex}" data-i="${i}">
          <!-- Copy hex -->
          <button class="cp-swatch__copy" data-i="${i}">
            <i class="fa-regular fa-copy"></i>
          </button>
        </div>`;
    }).join('');

    /* Wire events */
    paletteWrap.querySelectorAll('.cp-swatch__lock').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const i = parseInt(btn.dataset.i);
        locked[i] = !locked[i];
        btn.toggleAttribute('data-locked', locked[i]);
        btn.querySelector('i').className = `fa-solid ${locked[i] ? 'fa-lock' : 'fa-lock-open'}`;
        saveState();
      });
    });

    paletteWrap.querySelectorAll('.cp-swatch__picker').forEach(picker => {
      picker.addEventListener('input', (e) => {
        const i = parseInt(e.target.dataset.i);
        colors[i] = e.target.value;
        locked[i] = true; /* auto-lock when manually changed */
        updateCode();
        saveState();
        /* Re-render to show updated hex/rgb/hsl */
        const swatch = paletteWrap.querySelector(`.cp-swatch[data-i="${i}"]`);
        swatch.style.background = e.target.value;
        swatch.classList.toggle('cp-swatch--light', isLight(e.target.value));
        const hsl = hexToHSL(e.target.value);
        const rgb = hexToRGB(e.target.value);
        swatch.querySelector('.cp-swatch__hex').textContent = e.target.value.toUpperCase();
        swatch.querySelector('.cp-swatch__sub').textContent = `RGB(${rgb.r}, ${rgb.g}, ${rgb.b})`;
        swatch.querySelector('.cp-swatch__sub').nextElementSibling.textContent = `HSL(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
        /* Update lock icon */
        const lockBtn = swatch.querySelector('.cp-swatch__lock');
        lockBtn.toggleAttribute('data-locked', true);
        lockBtn.querySelector('i').className = 'fa-solid fa-lock';
      });
    });

    paletteWrap.querySelectorAll('.cp-swatch__copy').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const i = parseInt(btn.dataset.i);
        MiniDevTools.copyToClipboard(colors[i].toUpperCase(), 'Color copiado!');
      });
    });

    updateCode();
  }

  /* ─── Generate ─── */
  function generate() {
    /* Save previous colors BEFORE generating new ones (for lock preservation) */
    const prevColors = [...colors];

    if (mode === 'random') {
      baseHex = randomHex();
      baseColorPicker.value = baseHex;
      baseHexInput.value = baseHex;
      colors = [];
      for (let i = 0; i < COUNT; i++) {
        colors.push(locked[i] && prevColors[i] ? prevColors[i] : randomHex());
      }
    } else {
      colors = generatePalette(baseHex, mode);
      /* Restore locked colors from previous palette */
      for (let i = 0; i < COUNT; i++) {
        if (locked[i] && prevColors[i]) {
          colors[i] = prevColors[i];
        }
      }
    }
    renderPalette();
    saveState();
  }

  /* ─── Export Code ─── */
  function updateCode() {
    let code = '';
    const names = ['primary', 'secondary', 'accent', 'neutral', 'highlight'];

    switch (exportFormat) {
      case 'css':
        code = ':root {\n' +
          colors.map((c, i) => `  --color-${names[i]}: ${c};`).join('\n') +
          '\n}';
        break;

      case 'tailwind':
        code = '// tailwind.config.js\nmodule.exports = {\n' +
          '  theme: {\n' +
          '    extend: {\n' +
          '      colors: {\n' +
          colors.map((c, i) => `        '${names[i]}': '${c}',`).join('\n') +
          '\n      }\n' +
          '    }\n' +
          '  }\n' +
          '}';
        break;

      case 'json':
        const obj = {};
        colors.forEach((c, i) => { obj[names[i]] = c; });
        code = JSON.stringify(obj, null, 2);
        break;

      case 'array':
        code = '[\n' + colors.map(c => `  '${c}'`).join(',\n') + '\n]';
        break;
    }

    codeEl.textContent = code;
  }

  /* ─── Mode Buttons ─── */
  function syncModeButtons() {
    modeBtns.forEach(b => b.classList.toggle('cp-mode-btn--active', b.dataset.mode === mode));
  }

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      mode = btn.dataset.mode;
      syncModeButtons();
      generate();
    });
  });

  /* ─── Export Format Buttons ─── */
  exportBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      exportFormat = btn.dataset.fmt;
      exportBtns.forEach(b => b.classList.toggle('cp-export-btn--active', b === btn));
      updateCode();
    });
  });

  /* ─── Base Color Events ─── */
  baseColorPicker.addEventListener('input', () => {
    baseHex = baseColorPicker.value;
    baseHexInput.value = baseHex;
    generate();
  });

  baseHexInput.addEventListener('input', () => {
    const val = baseHexInput.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(val)) {
      baseHex = val;
      baseColorPicker.value = val;
      generate();
    }
  });

  /* ─── Random Button ─── */
  randomBtn.addEventListener('click', () => {
    baseHex = randomHex();
    baseColorPicker.value = baseHex;
    baseHexInput.value = baseHex;
    generate();
  });

  /* ─── Generate Button ─── */
  generateBtn.addEventListener('click', generate);

  /* ─── Lock All / Unlock All ─── */
  lockAllBtn.addEventListener('click', () => {
    locked = locked.map(() => true);
    renderPalette();
    saveState();
  });

  unlockAllBtn.addEventListener('click', () => {
    locked = locked.map(() => false);
    renderPalette();
    saveState();
  });

  /* ─── Copy Code ─── */
  copyCodeBtn.addEventListener('click', () => {
    MiniDevTools.copyToClipboard(codeEl.textContent, 'Codigo copiado!');
  });

  /* ─── Save Palette ─── */
  saveBtn.addEventListener('click', () => {
    const entry = {
      colors: [...colors],
      base: baseHex,
      mode: mode,
      ts: Date.now()
    };
    /* Remove duplicate (same colors in same order) */
    savedPalettes = savedPalettes.filter(sp => sp.colors.join(',') !== entry.colors.join(','));
    savedPalettes.unshift(entry);
    if (savedPalettes.length > MAX_SAVED) savedPalettes = savedPalettes.slice(0, MAX_SAVED);
    renderSavedPalettes();
    saveState();
    MiniDevTools.showToast('Paleta guardada!', 'success');
  });

  /* ─── Render Saved Palettes ─── */
  function renderSavedPalettes() {
    if (savedPalettes.length === 0) {
      savedSection.style.display = 'none';
      return;
    }
    savedSection.style.display = '';
    savedCount.textContent = savedPalettes.length;

    savedList.innerHTML = savedPalettes.map((sp, i) => {
      const grad = sp.colors.map((c, ci) => `${c} ${(ci / (sp.colors.length - 1)) * 100}%`).join(', ');
      return `
        <div class="cp-saved-item" data-si="${i}">
          <div class="cp-saved-item__bar" style="background:linear-gradient(90deg, ${grad});"></div>
          <button class="cp-saved-item__delete" data-si="${i}" data-tooltip="Eliminar">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>`;
    }).join('');

    /* Click bar → load palette */
    savedList.querySelectorAll('.cp-saved-item__bar').forEach(el => {
      el.addEventListener('click', () => {
        const sp = savedPalettes[parseInt(el.parentElement.dataset.si)];
        colors = [...sp.colors];
        baseHex = sp.base;
        mode = sp.mode;
        locked = [false, false, false, false, false];
        baseColorPicker.value = baseHex;
        baseHexInput.value = baseHex;
        syncModeButtons();
        renderPalette();
        saveState();
        MiniDevTools.showToast('Paleta cargada', 'info');
      });
    });

    /* Click X → delete */
    savedList.querySelectorAll('.cp-saved-item__delete').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        savedPalettes.splice(parseInt(el.dataset.si), 1);
        renderSavedPalettes();
        saveState();
      });
    });
  }

  /* ─── Clear All Saved Palettes ─── */
  savedClear.addEventListener('click', () => {
    if (savedPalettes.length === 0) return;
    savedPalettes = [];
    renderSavedPalettes();
    saveState();
    MiniDevTools.showToast('Paletas guardadas eliminadas', 'info');
  });

  /* ─── Keyboard: Space to generate ─── */
  container.addEventListener('keydown', (e) => {
    /* Only if not focused on input */
    if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      e.preventDefault();
      baseHex = randomHex();
      baseColorPicker.value = baseHex;
      baseHexInput.value = baseHex;
      mode = 'random';
      syncModeButtons();
      generate();
    }
  });

  /* ─── Render Presets ─── */
  function renderPresets() {
    presetsWrap.innerHTML = presets.map((p, i) => {
      const pal = generatePalette(p.base, p.mode);
      const grad = pal.map((c, ci) => `${c} ${(ci / (pal.length - 1)) * 100}%`).join(', ');
      return `
        <div class="cp-preset" data-pi="${i}" data-tooltip="${p.name}" data-tooltip-bottom>
          <div class="cp-preset__bar" style="background:linear-gradient(90deg, ${grad});"></div>
        </div>`;
    }).join('');

    presetsWrap.querySelectorAll('.cp-preset').forEach(el => {
      el.addEventListener('click', () => {
        const p = presets[parseInt(el.dataset.pi)];
        baseHex = p.base;
        mode = p.mode;
        baseColorPicker.value = baseHex;
        baseHexInput.value = baseHex;
        locked = [false, false, false, false, false];
        syncModeButtons();
        generate();
      });
    });
  }

  /* ─── Persistence ─── */
  function saveState() {
    ToolStorage.setField('color-palette', 'state', {
      mode,
      colors,
      locked,
      base: baseHex,
      savedPalettes
    });
  }

  /* ─── Init ─── */
  renderPresets();
  renderSavedPalettes();
  renderPalette();
}

/* Registro global */
window['render_color-palette'] = render_color_palette;

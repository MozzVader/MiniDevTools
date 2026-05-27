/* ═══════════════════════════════════════════════════════════════
   Logo Generator — Create simple logos from scratch
   Features:
   - Shape base (circle, square, rounded, hexagon, triangle, star, diamond)
   - Text / typography with multiple fonts
   - FontAwesome icons
   - Color palettes (neon, pastel, dark, mono, retro) + custom
   - Linear gradients for shape and background
   - Vertical offset sliders for icon and text
   - Layout modes (shape+icon, shape+text, icon, text, shape+icon+wordmark)
   - Border options
   - Wordmark text below logo
   - Preset templates
   - Export SVG (vectorial) + PNG (256/512/1024)
   - Copy SVG to clipboard
   - Persistence with ToolStorage
   ═══════════════════════════════════════════════════════════════ */

/* Load extra fonts for logo generation */
if (!document.getElementById('lg-fonts-link')) {
  const link = document.createElement('link');
  link.id = 'lg-fonts-link';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@400;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:wght@700;800;900&display=swap';
  document.head.appendChild(link);
}

window['render_logo-generator'] = function(container, toolMeta) {

  /* ─── Constants ─── */

  const PALETTES = {
    neon:   { name: 'Neon',     bg: '#0a0a0a', shape: '#ff006e', accent: '#00f5d4', text: '#ffffff' },
    pastel: { name: 'Pastel',   bg: '#fce4ec', shape: '#f48fb1', accent: '#7e57c2', text: '#4e342e' },
    dark:   { name: 'Oscuro',   bg: '#121212', shape: '#bb86fc', accent: '#03dac6', text: '#e0e0e0' },
    mono:   { name: 'Mono',     bg: '#ffffff', shape: '#222222', accent: '#555555', text: '#222222' },
    retro:  { name: 'Retro',    bg: '#f5e6ca', shape: '#d4a373', accent: '#6b705c', text: '#2b2d42' },
  };

  const FONTS = [
    { value: 'Montserrat',   label: 'Montserrat' },
    { value: 'Poppins',      label: 'Poppins' },
    { value: 'Bebas Neue',   label: 'Bebas Neue' },
    { value: 'Space Grotesk',label: 'Space Grotesk' },
    { value: 'Playfair Display', label: 'Playfair Display' },
    { value: 'Arial',        label: 'Arial' },
    { value: 'Georgia',      label: 'Georgia' },
    { value: 'Courier New',  label: 'Courier New' },
  ];

  const ICONS = [
    { name: 'Rocket',      cls: 'fa-rocket',       unicode: '\uf135' },
    { name: 'Heart',       cls: 'fa-heart',        unicode: '\uf004' },
    { name: 'Star',        cls: 'fa-star',         unicode: '\uf005' },
    { name: 'Code',        cls: 'fa-code',         unicode: '\uf121' },
    { name: 'Bolt',        cls: 'fa-bolt',         unicode: '\uf0e7' },
    { name: 'Gem',         cls: 'fa-gem',          unicode: '\uf3a5' },
    { name: 'Crown',       cls: 'fa-crown',        unicode: '\uf521' },
    { name: 'Fire',        cls: 'fa-fire',         unicode: '\uf06d' },
    { name: 'Leaf',        cls: 'fa-leaf',         unicode: '\uf06c' },
    { name: 'Music',       cls: 'fa-music',        unicode: '\uf001' },
    { name: 'Camera',      cls: 'fa-camera',       unicode: '\uf030' },
    { name: 'Globe',       cls: 'fa-globe',        unicode: '\uf0ac' },
    { name: 'Coffee',      cls: 'fa-mug-hot',      unicode: '\uf7b6' },
    { name: 'Pencil',      cls: 'fa-pencil',       unicode: '\uf303' },
    { name: 'Paintbrush',  cls: 'fa-paintbrush',   unicode: '\uf1fc' },
    { name: 'Cube',        cls: 'fa-cube',         unicode: '\uf1b2' },
    { name: 'Atom',        cls: 'fa-atom',         unicode: '\uf5d2' },
    { name: 'Flask',       cls: 'fa-flask',        unicode: '\uf0c3' },
    { name: 'Bicycle',     cls: 'fa-bicycle',      unicode: '\uf206' },
    { name: 'Plane',       cls: 'fa-plane',        unicode: '\uf072' },
    { name: 'Anchor',      cls: 'fa-anchor',       unicode: '\uf13d' },
    { name: 'Shield',      cls: 'fa-shield-halved',unicode: '\uf3ed' },
    { name: 'Bullseye',    cls: 'fa-bullseye',     unicode: '\uf140' },
    { name: 'Diamond',     cls: 'fa-diamond',      unicode: '\uf219' },
  ];

  const SHAPES = [
    { value: 'circle',  label: 'Circulo',   icon: 'fa-circle' },
    { value: 'square',  label: 'Cuadrado',  icon: 'fa-square' },
    { value: 'rounded', label: 'Redondeado',icon: 'fa-square' },
    { value: 'hexagon', label: 'Hexagono',  icon: 'fa-certificate' },
    { value: 'triangle',label: 'Triangulo', icon: 'fa-play' },
    { value: 'star',    label: 'Estrella',  icon: 'fa-star' },
    { value: 'diamond', label: 'Diamante',  icon: 'fa-diamond' },
    { value: 'none',    label: 'Sin forma', icon: 'fa-ban' },
  ];

  const LAYOUTS = [
    { value: 'shape-icon',    label: 'Forma + Icono',    icon: 'fa-shapes' },
    { value: 'shape-text',    label: 'Forma + Texto',    icon: 'fa-font' },
    { value: 'icon-only',     label: 'Solo Icono',       icon: 'fa-icons' },
    { value: 'text-only',     label: 'Solo Texto',       icon: 'fa-text-width' },
    { value: 'shape-icon-txt',label: 'Forma+Icono+Texto',icon: 'fa-layer-group' },
  ];

  const PRESETS = [
    { name: 'Tech Startup',   shape:'rounded', shapeColor:'#6366f1', shapeGradColor2:'#a78bfa', bg:'#0f172a', accent:'#22d3ee', text:'#f8fafc', iconCls:'fa-rocket', textContent:'Z', font:'Space Grotesk', layout:'shape-icon-txt', wordmark:'LAUNCH', wordmarkFont:'Space Grotesk' },
    { name: 'Cafe',           shape:'circle',  shapeColor:'#92400e', shapeGradColor2:'#b45309', bg:'#fffbeb', accent:'#fbbf24', text:'#451a03', iconCls:'fa-mug-hot', textContent:'', font:'Playfair Display', layout:'shape-icon-txt', wordmark:'BREW', wordmarkFont:'Playfair Display' },
    { name: 'Estudio Creativo',shape:'diamond', shapeColor:'#ec4899', shapeGradColor2:'#f472b6', bg:'#fdf2f8', accent:'#8b5cf6', text:'#1e1b4b', iconCls:'fa-paintbrush', textContent:'C', font:'Poppins', layout:'shape-icon-txt', wordmark:'STUDIO', wordmarkFont:'Poppins' },
    { name: 'Dev Shop',       shape:'hexagon', shapeColor:'#10b981', shapeGradColor2:'#34d399', bg:'#022c22', accent:'#34d399', text:'#ecfdf5', iconCls:'fa-code', textContent:'<>', font:'Bebas Neue', layout:'shape-icon', wordmark:'', wordmarkFont:'Bebas Neue' },
    { name: 'Gaming',         shape:'square',  shapeColor:'#dc2626', shapeGradColor2:'#ef4444', bg:'#18181b', accent:'#fbbf24', text:'#ffffff', iconCls:'fa-fire', textContent:'GG', font:'Bebas Neue', layout:'shape-icon', wordmark:'', wordmarkFont:'Bebas Neue' },
    { name: 'Minimal',        shape:'none',    shapeColor:'',         bg:'#ffffff', accent:'#18181b', text:'#18181b', iconCls:'', textContent:'Mx', font:'Montserrat', layout:'text-only', wordmark:'', wordmarkFont:'Montserrat' },
  ];

  /* ─── State ─── */
  const saved = ToolStorage.load('logo-generator');
  const s = saved ? saved.state : null;

  if (s && !('iconOffsetY' in s)) {
    ToolStorage.clear('logo-generator');
  }
  const clean = ('iconOffsetY' in (s || {})) ? s : null;

  const state = {
    shape:        clean?.shape         ?? 'circle',
    bgColor:      clean?.bgColor       ?? '#0a0a0a',
    shapeColor:   clean?.shapeColor    ?? '#ff006e',
    accentColor:  clean?.accentColor   ?? '#ffffff',
    textColor:    clean?.textColor     ?? '#ffffff',
    text:         clean?.text          ?? '',
    fontSize:     clean?.fontSize      ?? 48,
    fontFamily:   clean?.fontFamily    ?? 'Montserrat',
    icon:         clean?.icon          ?? '',
    iconSize:     clean?.iconSize      ?? 52,
    iconOffsetY:  clean?.iconOffsetY   ?? 0,
    textOffsetY:  clean?.textOffsetY   ?? 0,
    customIconSrc: clean?.customIconSrc ?? '',
    layout:       clean?.layout        ?? 'shape-icon',
    wordmark:     clean?.wordmark      ?? '',
    wordmarkSize: clean?.wordmarkSize   ?? 18,
    wordmarkFont: clean?.wordmarkFont   ?? 'Montserrat',
    borderOn:     clean?.borderOn      ?? false,
    borderColor:  clean?.borderColor   ?? '#ffffff',
    borderWidth:  clean?.borderWidth   ?? 3,
    bgShape:      clean?.bgShape       ?? 'rounded',
    palette:      clean?.palette       ?? 'neon',
    shapeGradOn:  clean?.shapeGradOn   ?? false,
    shapeGradC2:  clean?.shapeGradC2   ?? '#ff6699',
    shapeGradAng: clean?.shapeGradAng  ?? 180,
    bgGradOn:     clean?.bgGradOn      ?? false,
    bgGradC2:     clean?.bgGradC2      ?? '#1a1a2e',
    bgGradAng:    clean?.bgGradAng     ?? 180,
  };

  /* Preview canvas size */
  const PREVIEW_SIZE = 300;

  /* Off-screen canvas */
  const offCanvas = document.createElement('canvas');
  const offCtx = offCanvas.getContext('2d');

  /* ═══════════════════════════════════════════════════════
     RENDER UI
     ═══════════════════════════════════════════════════════ */

  const shapeBtns = SHAPES.map(sh =>
    `<button class="lg-shape-btn${state.shape === sh.value ? ' lg-shape-btn--active' : ''}" data-shape="${sh.value}" title="${sh.label}"><i class="fa-solid ${sh.icon}"></i></button>`
  ).join('');

  const layoutBtns = LAYOUTS.map(l =>
    `<button class="lg-layout-btn${state.layout === l.value ? ' lg-layout-btn--active' : ''}" data-layout="${l.value}" title="${l.label}"><i class="fa-solid ${l.icon}"></i></button>`
  ).join('');

  const paletteBtns = Object.entries(PALETTES).map(([k, v]) =>
    `<button class="lg-pal-btn${state.palette === k ? ' lg-pal-btn--active' : ''}" data-palette="${k}" title="${v.name}">
      <span class="lg-pal-dots">
        <span class="lg-pal-dot" style="background:${v.bg}"></span>
        <span class="lg-pal-dot" style="background:${v.shape}"></span>
        <span class="lg-pal-dot" style="background:${v.accent}"></span>
        <span class="lg-pal-dot" style="background:${v.text}"></span>
      </span>
      <span class="lg-pal-name">${v.name}</span>
    </button>`
  ).join('');

  const fontOptions = FONTS.map(f =>
    `<option value="${f.value}"${state.fontFamily === f.value ? ' selected' : ''} style="font-family:'${f.value}'">${f.label}</option>`
  ).join('');

  const presetBtns = PRESETS.map((p, i) =>
    `<button class="lg-preset-btn" data-preset="${i}">${p.name}</button>`
  ).join('');

  const bgShapeOptions = ['rounded','square','circle'].map(v =>
    `<option value="${v}"${state.bgShape === v ? ' selected' : ''}>${v === 'rounded' ? 'Redondeado' : v === 'square' ? 'Cuadrado' : 'Circulo'}</option>`
  ).join('');

  const selectedIcon = ICONS.find(ic => ic.cls === state.icon);

  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title"><i class="${toolMeta.icon}" style="margin-right:8px;"></i>${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <div class="lg-layout-grid-main">

          <!-- Preview Panel -->
          <div class="lg-preview-panel">
            <div class="lg-canvas-wrap">
              <canvas id="lg-canvas" width="${PREVIEW_SIZE}" height="${PREVIEW_SIZE}"></canvas>
            </div>
            <div class="lg-export-bar">
              <button class="btn btn--primary btn--sm" id="lg-dl-svg"><i class="fa-solid fa-file-code"></i> SVG</button>
              <button class="btn btn--ghost btn--sm" id="lg-copy-svg"><i class="fa-solid fa-copy"></i> Copiar SVG</button>
              <div class="lg-export-sep"></div>
              <button class="btn btn--ghost btn--sm lg-png-btn" data-size="256">PNG 256</button>
              <button class="btn btn--ghost btn--sm lg-png-btn" data-size="512">PNG 512</button>
              <button class="btn btn--ghost btn--sm lg-png-btn" data-size="1024">PNG 1024</button>
            </div>
          </div>

          <!-- Controls Panel -->
          <div class="lg-controls-panel">

            <!-- Templates -->
            <div class="lg-section">
              <label class="lg-section-title">Templates</label>
              <div class="lg-presets-row">${presetBtns}</div>
            </div>

            <!-- Palettes -->
            <div class="lg-section">
              <label class="lg-section-title">Paletas</label>
              <div class="lg-palette-row">${paletteBtns}</div>
            </div>

            <!-- Colors -->
            <div class="lg-section">
              <label class="lg-section-title">Colores</label>
              <div class="lg-colors-grid">
                <div class="lg-color-item">
                  <span class="lg-color-label">Fondo</span>
                  <input type="color" class="lg-color-input" id="lg-bg-color" value="${state.bgColor}">
                  <input type="color" class="lg-color-input" id="lg-bg-grad-c2" value="${state.bgGradC2}" title="Color 2 del gradiente">
                  <label class="lg-check-label"><input type="checkbox" id="lg-bg-grad" ${state.bgGradOn ? 'checked' : ''}> Grad</label>
                </div>
                <div class="lg-color-item">
                  <span class="lg-color-label">Forma</span>
                  <input type="color" class="lg-color-input" id="lg-shape-color" value="${state.shapeColor}">
                  <input type="color" class="lg-color-input" id="lg-shape-grad-c2" value="${state.shapeGradC2}" title="Color 2 del gradiente">
                  <label class="lg-check-label"><input type="checkbox" id="lg-shape-grad" ${state.shapeGradOn ? 'checked' : ''}> Grad</label>
                </div>
                <div class="lg-color-item">
                  <span class="lg-color-label">Texto/Icono</span>
                  <input type="color" class="lg-color-input" id="lg-accent-color" value="${state.accentColor}">
                </div>
              </div>
              <div class="lg-slider-row" style="margin-top:8px;">
                <label class="lg-slider-label">Angulo grad</label>
                <input type="range" class="ipa-range" id="lg-grad-angle" min="0" max="360" value="${state.shapeGradAng}">
                <span class="ipa-value" id="lg-grad-angle-val">${state.shapeGradAng}&deg;</span>
              </div>
            </div>

            <!-- Shape -->
            <div class="lg-section">
              <label class="lg-section-title">Forma</label>
              <div class="lg-shape-row">${shapeBtns}</div>
            </div>

            <!-- Layout -->
            <div class="lg-section">
              <label class="lg-section-title">Layout</label>
              <div class="lg-layout-row">${layoutBtns}</div>
            </div>

            <!-- Text -->
            <div class="lg-section">
              <label class="lg-section-title">Texto</label>
              <div class="lg-text-controls">
                <input type="text" class="input" id="lg-text" value="${state.text}" maxlength="5" placeholder="MAX 5 chars" style="flex:1;">
                <select class="input" id="lg-font" style="flex:1;min-width:0;">${fontOptions}</select>
              </div>
              <div class="lg-slider-row">
                <label class="lg-slider-label">Tamanio</label>
                <input type="range" class="ipa-range" id="lg-font-size" min="16" max="96" value="${state.fontSize}">
                <span class="ipa-value" id="lg-font-size-val">${state.fontSize}</span>
              </div>
              <div class="lg-slider-row">
                <label class="lg-slider-label">Offset Y</label>
                <input type="range" class="ipa-range" id="lg-text-offset" min="-60" max="60" value="${state.textOffsetY}">
                <span class="ipa-value" id="lg-text-offset-val">${state.textOffsetY}</span>
              </div>
            </div>

            <!-- Icon -->
            <div class="lg-section">
              <label class="lg-section-title">Icono</label>
              <div class="lg-icon-controls">
                <button class="btn btn--ghost btn--sm" id="lg-icon-picker">
                  <i class="fa-solid ${selectedIcon ? selectedIcon.cls : 'fa-icons'}"></i>
                  ${selectedIcon ? selectedIcon.name : 'Elegir icono'}
                </button>
                <button class="btn btn--ghost btn--sm" id="lg-icon-upload" title="Subir icono propio">
                  <i class="fa-solid fa-upload"></i>
                </button>
                <input type="file" id="lg-icon-file" accept="image/*" style="display:none;">
                <button class="btn btn--ghost btn--sm" id="lg-icon-clear" title="Quitar icono">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div class="lg-slider-row">
                <label class="lg-slider-label">Tamanio</label>
                <input type="range" class="ipa-range" id="lg-icon-size" min="20" max="96" value="${state.iconSize}">
                <span class="ipa-value" id="lg-icon-size-val">${state.iconSize}</span>
              </div>
              <div class="lg-slider-row">
                <label class="lg-slider-label">Offset Y</label>
                <input type="range" class="ipa-range" id="lg-icon-offset" min="-60" max="60" value="${state.iconOffsetY}">
                <span class="ipa-value" id="lg-icon-offset-val">${state.iconOffsetY}</span>
              </div>
            </div>

            <!-- Wordmark -->
            <div class="lg-section">
              <label class="lg-section-title">Wordmark (texto abajo)</label>
              <div class="lg-text-controls">
                <input type="text" class="input" id="lg-wordmark" value="${state.wordmark}" maxlength="12" placeholder="BRAND" style="flex:1;">
                <select class="input" id="lg-wordmark-font" style="flex:1;min-width:0;">${fontOptions}</select>
              </div>
              <div class="lg-slider-row">
                <label class="lg-slider-label">Tamanio</label>
                <input type="range" class="ipa-range" id="lg-wordmark-size" min="10" max="36" value="${state.wordmarkSize}">
                <span class="ipa-value" id="lg-wordmark-size-val">${state.wordmarkSize}</span>
              </div>
            </div>

            <!-- Border -->
            <div class="lg-section">
              <label class="lg-section-title">Borde</label>
              <div class="lg-border-controls">
                <label class="ipa-checkbox"><input type="checkbox" id="lg-border-on"${state.borderOn ? ' checked' : ''}> Activar</label>
                <input type="color" class="lg-color-input" id="lg-border-color" value="${state.borderColor}">
                <div class="lg-slider-row" style="flex:1;">
                  <label class="lg-slider-label">Grosor</label>
                  <input type="range" class="ipa-range" id="lg-border-width" min="1" max="10" value="${state.borderWidth}">
                  <span class="ipa-value" id="lg-border-width-val">${state.borderWidth}</span>
                </div>
              </div>
            </div>

            <!-- BG Shape -->
            <div class="lg-section">
              <label class="lg-section-title">Fondo del logo</label>
              <div class="lg-text-controls">
                <select class="input" id="lg-bg-shape" style="flex:1;">${bgShapeOptions}</select>
                <label class="ipa-checkbox" style="white-space:nowrap;"><input type="checkbox" id="lg-bg-transp" checked> Visible</label>
              </div>
            </div>

            <!-- Reset -->
            <div class="lg-section" style="margin-top:8px;">
              <button class="btn btn--ghost btn--sm" id="lg-reset" style="width:100%;"><i class="fa-solid fa-rotate-left"></i> Reset todo</button>
            </div>

          </div>
        </div>

        <!-- Icon Picker Modal -->
        <div class="lg-icon-modal" id="lg-icon-modal" style="display:none;">
          <div class="lg-icon-modal__backdrop" id="lg-icon-modal-bg"></div>
          <div class="lg-icon-modal__content">
            <div class="lg-icon-modal__header">
              <span>Elegi un icono</span>
              <button class="btn btn--ghost btn--sm" id="lg-icon-modal-close"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="lg-icon-modal__grid">
              ${ICONS.map(ic =>
                `<button class="lg-icon-opt${state.icon === ic.cls ? ' lg-icon-opt--active' : ''}" data-icon="${ic.cls}" data-unicode="${ic.unicode}" title="${ic.name}"><i class="fa-solid ${ic.cls}"></i></button>`
              ).join('')}
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const canvas = document.getElementById('lg-canvas');
  const ctx = canvas.getContext('2d');
  const bgColorInput = document.getElementById('lg-bg-color');
  const bgGradC2Input = document.getElementById('lg-bg-grad-c2');
  const bgGradCb = document.getElementById('lg-bg-grad');
  const shapeColorInput = document.getElementById('lg-shape-color');
  const shapeGradC2Input = document.getElementById('lg-shape-grad-c2');
  const shapeGradCb = document.getElementById('lg-shape-grad');
  const gradAngleRange = document.getElementById('lg-grad-angle');
  const gradAngleVal = document.getElementById('lg-grad-angle-val');
  const accentColorInput = document.getElementById('lg-accent-color');
  const textInput = document.getElementById('lg-text');
  const fontSelect = document.getElementById('lg-font');
  const fontSizeRange = document.getElementById('lg-font-size');
  const fontSizeVal = document.getElementById('lg-font-size-val');
  const textOffsetRange = document.getElementById('lg-text-offset');
  const textOffsetVal = document.getElementById('lg-text-offset-val');
  const iconPickerBtn = document.getElementById('lg-icon-picker');
  const iconClearBtn = document.getElementById('lg-icon-clear');
  const iconSizeRange = document.getElementById('lg-icon-size');
  const iconSizeVal = document.getElementById('lg-icon-size-val');
  const iconOffsetRange = document.getElementById('lg-icon-offset');
  const iconOffsetVal = document.getElementById('lg-icon-offset-val');
  const wordmarkInput = document.getElementById('lg-wordmark');
  const wordmarkFontSelect = document.getElementById('lg-wordmark-font');
  const wordmarkSizeRange = document.getElementById('lg-wordmark-size');
  const wordmarkSizeVal = document.getElementById('lg-wordmark-size-val');
  const borderOn = document.getElementById('lg-border-on');
  const borderColorInput = document.getElementById('lg-border-color');
  const borderWidthRange = document.getElementById('lg-border-width');
  const borderWidthVal = document.getElementById('lg-border-width-val');
  const bgShapeSelect = document.getElementById('lg-bg-shape');
  const bgTransp = document.getElementById('lg-bg-transp');
  const resetBtn = document.getElementById('lg-reset');
  const iconModal = document.getElementById('lg-icon-modal');
  const iconModalBg = document.getElementById('lg-icon-modal-bg');
  const iconModalClose = document.getElementById('lg-icon-modal-close');

  /* ═══════════════════════════════════════════════════════
     SHAPE DRAWING HELPERS
     ═══════════════════════════════════════════════════════ */

  function polygonPoints(cx, cy, r, sides, startAngle) {
    const pts = [];
    const sa = startAngle !== undefined ? startAngle : -Math.PI / 2;
    for (let i = 0; i < sides; i++) {
      const angle = sa + (2 * Math.PI / sides) * i;
      pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
    }
    return pts;
  }

  function starPoints(cx, cy, outerR, innerR, points) {
    const pts = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (Math.PI / points) * i - Math.PI / 2;
      pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
    }
    return pts;
  }

  function drawShapePath(c, cx, cy, r, shape) {
    c.beginPath();
    switch (shape) {
      case 'circle':
        c.arc(cx, cy, r, 0, Math.PI * 2);
        break;
      case 'square':
        c.rect(cx - r, cy - r, r * 2, r * 2);
        break;
      case 'rounded': {
        const rad = r * 0.22;
        const x = cx - r, y = cy - r, s = r * 2;
        c.moveTo(x + rad, y);
        c.lineTo(x + s - rad, y);
        c.quadraticCurveTo(x + s, y, x + s, y + rad);
        c.lineTo(x + s, y + s - rad);
        c.quadraticCurveTo(x + s, y + s, x + s - rad, y + s);
        c.lineTo(x + rad, y + s);
        c.quadraticCurveTo(x, y + s, x, y + s - rad);
        c.lineTo(x, y + rad);
        c.quadraticCurveTo(x, y, x + rad, y);
        c.closePath();
        break;
      }
      case 'hexagon': {
        const pts = polygonPoints(cx, cy, r, 6);
        c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
        c.closePath();
        break;
      }
      case 'triangle': {
        const pts = polygonPoints(cx, cy, r, 3, -Math.PI / 2);
        c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
        c.closePath();
        break;
      }
      case 'star': {
        const pts = starPoints(cx, cy, r, r * 0.42, 5);
        c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
        c.closePath();
        break;
      }
      case 'diamond': {
        const pts = polygonPoints(cx, cy, r, 4, -Math.PI / 2);
        c.moveTo(pts[0][0], pts[0][1]);
        for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
        c.closePath();
        break;
      }
    }
  }

  function drawBgShape(c, x, y, size, shape) {
    c.beginPath();
    const pad = size * 0.04;
    const s = size - pad * 2;
    switch (shape) {
      case 'circle':
        c.arc(x + size / 2, y + size / 2, s / 2, 0, Math.PI * 2);
        break;
      case 'square':
        c.rect(x + pad, y + pad, s, s);
        break;
      case 'rounded': {
        const rad = s * 0.16;
        c.moveTo(x + pad + rad, y + pad);
        c.lineTo(x + pad + s - rad, y + pad);
        c.quadraticCurveTo(x + pad + s, y + pad, x + pad + s, y + pad + rad);
        c.lineTo(x + pad + s, y + pad + s - rad);
        c.quadraticCurveTo(x + pad + s, y + pad + s, x + pad + s - rad, y + pad + s);
        c.lineTo(x + pad + rad, y + pad + s);
        c.quadraticCurveTo(x + pad, y + pad + s, x + pad, y + pad + s - rad);
        c.lineTo(x + pad, y + pad + rad);
        c.quadraticCurveTo(x + pad, y + pad, x + pad + rad, y + pad);
        c.closePath();
        break;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════
     GRADIENT HELPER
     ═══════════════════════════════════════════════════════ */

  function makeGradient(c, cx, cy, r, color1, color2, angleDeg) {
    const a = (angleDeg || 180) * Math.PI / 180;
    const len = r;
    const x0 = cx - Math.cos(a) * len;
    const y0 = cy - Math.sin(a) * len;
    const x1 = cx + Math.cos(a) * len;
    const y1 = cy + Math.sin(a) * len;
    const grad = c.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, color1);
    grad.addColorStop(1, color2);
    return grad;
  }

  /* ═══════════════════════════════════════════════════════
     CANVAS RENDERING
     ═══════════════════════════════════════════════════════ */

  let customIconImg = null;

  function loadCustomIcon(src) {
    const img = new Image();
    img.onload = () => { customIconImg = img; updatePreview(); };
    img.src = src;
  }
  if (state.customIconSrc) loadCustomIcon(state.customIconSrc);

  function renderToCanvas(c, size) {
    c.clearRect(0, 0, size, size);
    const w = size, h = size;

    /* When wordmark is present, center the logo slightly higher */
    const hasWordmark = !!state.wordmark;
    const cx = w / 2;
    const cy = hasWordmark ? h * 0.43 : h / 2;
    const shapeR = (hasWordmark ? h * 0.30 : h * 0.35);
    const scale = w / PREVIEW_SIZE;

    /* 1. Background */
    const showBg = bgTransp.checked;
    if (showBg) {
      drawBgShape(c, 0, 0, w, state.bgShape);
      if (state.bgGradOn) {
        c.fillStyle = makeGradient(c, w / 2, w / 2, w * 0.5, state.bgColor, state.bgGradC2, state.bgGradAng);
      } else {
        c.fillStyle = state.bgColor;
      }
      c.fill();
    }

    /* 2. Shape */
    if (state.shape !== 'none' && state.shapeColor) {
      drawShapePath(c, cx, cy, shapeR, state.shape);
      if (state.shapeGradOn) {
        c.fillStyle = makeGradient(c, cx, cy, shapeR, state.shapeColor, state.shapeGradC2, state.shapeGradAng);
      } else {
        c.fillStyle = state.shapeColor;
      }
      c.fill();

      if (state.borderOn && state.borderColor) {
        drawShapePath(c, cx, cy, shapeR, state.shape);
        c.strokeStyle = state.borderColor;
        c.lineWidth = state.borderWidth * scale;
        c.stroke();
      }
    }

    /* 3. Icon (FontAwesome) */
    if (state.icon && !customIconImg && (state.layout === 'shape-icon' || state.layout === 'icon-only' || state.layout === 'shape-icon-txt')) {
      const ic = ICONS.find(i => i.cls === state.icon);
      if (ic) {
        const scaledIconSize = state.iconSize * scale;
        c.font = `900 ${scaledIconSize}px "Font Awesome 6 Free"`;
        c.fillStyle = state.accentColor;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        const iconY = cy + state.iconOffsetY * scale;
        c.fillText(ic.unicode, cx, iconY);
      }
    }

    /* 3b. Custom icon (uploaded image) */
    if (customIconImg && (state.layout === 'shape-icon' || state.layout === 'icon-only' || state.layout === 'shape-icon-txt')) {
      const iconDrawSize = state.iconSize * scale;
      const iconY = cy + state.iconOffsetY * scale - iconDrawSize / 2;
      c.drawImage(customIconImg, cx - iconDrawSize / 2, iconY, iconDrawSize, iconDrawSize);
    }

    /* 4. Text inside shape */
    if (state.text && (state.layout === 'shape-text' || state.layout === 'text-only')) {
      const scaledFontSize = state.fontSize * scale;
      c.font = `bold ${scaledFontSize}px "${state.fontFamily}", sans-serif`;
      c.fillStyle = state.accentColor;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(state.text, cx, cy + state.textOffsetY * scale);
    }

    /* 5. Text below icon in shape-icon-txt layout */
    if (state.layout === 'shape-icon-txt' && state.icon && state.text) {
      const scaledFontSize = state.fontSize * 0.5 * scale;
      c.font = `bold ${scaledFontSize}px "${state.fontFamily}", sans-serif`;
      c.fillStyle = state.accentColor;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const textY = cy + shapeR * 0.5 + state.textOffsetY * scale;
      c.fillText(state.text, cx, textY);
    }

    /* 6. Wordmark — inside the square, below the logo */
    if (hasWordmark) {
      const wmSize = state.wordmarkSize * scale;
      const wmY = h * 0.82;
      c.font = `bold ${wmSize}px "${state.wordmarkFont}", sans-serif`;
      c.fillStyle = showBg ? state.accentColor : state.shapeColor || state.accentColor;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(state.wordmark, cx, wmY);
    }
  }

  function updatePreview() {
    renderToCanvas(ctx, PREVIEW_SIZE);
  }

  /* ═══════════════════════════════════════════════════════
     SVG GENERATION
     ═══════════════════════════════════════════════════════ */

  function escapeXml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function shapeToSVG(cx, cy, r, shape) {
    switch (shape) {
      case 'circle': return `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
      case 'square': return `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}"/>`;
      case 'rounded': return `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" rx="${r * 0.22}"/>`;
      case 'hexagon': return `<polygon points="${polygonPoints(cx, cy, r, 6).map(p => p.join(',')).join(' ')}"/>`;
      case 'triangle': return `<polygon points="${polygonPoints(cx, cy, r, 3, -Math.PI / 2).map(p => p.join(',')).join(' ')}"/>`;
      case 'star': return `<polygon points="${starPoints(cx, cy, r, r * 0.42, 5).map(p => p.join(',')).join(' ')}"/>`;
      case 'diamond': return `<polygon points="${polygonPoints(cx, cy, r, 4, -Math.PI / 2).map(p => p.join(',')).join(' ')}"/>`;
    }
    return '';
  }

  function bgShapeToSVG(size, shape) {
    const pad = size * 0.04;
    const s = size - pad * 2;
    switch (shape) {
      case 'circle': return `<circle cx="${size / 2}" cy="${size / 2}" r="${s / 2}"/>`;
      case 'square': return `<rect x="${pad}" y="${pad}" width="${s}" height="${s}"/>`;
      case 'rounded': return `<rect x="${pad}" y="${pad}" width="${s}" height="${s}" rx="${s * 0.16}"/>`;
    }
    return `<rect width="${size}" height="${size}"/>`;
  }

  function svgGradDef(id, color1, color2, angleDeg) {
    const a = (angleDeg || 180) * Math.PI / 180;
    const r = 50;
    const x0 = 50 - Math.cos(a) * r;
    const y0 = 50 - Math.sin(a) * r;
    const x1 = 50 + Math.cos(a) * r;
    const y1 = 50 + Math.sin(a) * r;
    return `<linearGradient id="${id}" x1="${x0}%" y1="${y0}%" x2="${x1}%" y2="${y1}%"><stop offset="0%" stop-color="${color1}"/><stop offset="100%" stop-color="${color2}"/></linearGradient>`;
  }

  function generateSVG() {
    const size = 512;
    const hasWordmark = !!state.wordmark;
    const cx = size / 2;
    const cy = hasWordmark ? size * 0.43 : size / 2;
    const shapeR = hasWordmark ? size * 0.30 : size * 0.35;
    const scale = size / PREVIEW_SIZE;

    let defs = [];
    let parts = [];

    /* Background */
    if (bgTransp.checked) {
      const bgId = 'lgBg';
      defs.push(svgGradDef(bgId, state.bgColor, state.bgGradC2, state.bgGradAng));
      let bgSvg = bgShapeToSVG(size, state.bgShape);
      bgSvg = bgSvg.replace('/>', state.bgGradOn
        ? ` fill="url(#${bgId})"/>`
        : ` fill="${state.bgColor}"/>`);
      parts.push(bgSvg);
    }

    /* Shape */
    if (state.shape !== 'none' && state.shapeColor) {
      const shId = 'lgSh';
      if (state.shapeGradOn) {
        defs.push(svgGradDef(shId, state.shapeColor, state.shapeGradC2, state.shapeGradAng));
      }
      let shapeSvg = shapeToSVG(cx, cy, shapeR, state.shape);
      shapeSvg = shapeSvg.replace('/>', state.shapeGradOn
        ? ` fill="url(#${shId})"/>`
        : ` fill="${state.shapeColor}"/>`);
      if (state.borderOn && state.borderColor) {
        shapeSvg = shapeSvg.replace('/>', ` stroke="${state.borderColor}" stroke-width="${state.borderWidth * scale}"/>`);
      }
      parts.push(shapeSvg);
    }

    /* Icon */
    if (state.icon && (state.layout === 'shape-icon' || state.layout === 'icon-only' || state.layout === 'shape-icon-txt')) {
      const ic = ICONS.find(i => i.cls === state.icon);
      if (ic) {
        const s = state.iconSize * scale;
        const iy = cy + state.iconOffsetY * scale;
        parts.push(`<text x="${cx}" y="${iy}" text-anchor="middle" dominant-baseline="central" font-family="'Font Awesome 6 Free'" font-weight="900" font-size="${s}" fill="${state.accentColor}">${ic.unicode}</text>`);
      }
    }

    /* Text */
    if (state.text && (state.layout === 'shape-text' || state.layout === 'text-only')) {
      const s = state.fontSize * scale;
      parts.push(`<text x="${cx}" y="${cy + state.textOffsetY * scale}" text-anchor="middle" dominant-baseline="central" font-family="'${state.fontFamily}',sans-serif" font-weight="bold" font-size="${s}" fill="${state.accentColor}">${escapeXml(state.text)}</text>`);
    }

    /* Text below icon in shape-icon-txt */
    if (state.layout === 'shape-icon-txt' && state.icon && state.text) {
      const s = state.fontSize * 0.5 * scale;
      const ty = cy + shapeR * 0.5 + state.textOffsetY * scale;
      parts.push(`<text x="${cx}" y="${ty}" text-anchor="middle" dominant-baseline="central" font-family="'${state.fontFamily}',sans-serif" font-weight="bold" font-size="${s}" fill="${state.accentColor}">${escapeXml(state.text)}</text>`);
    }

    /* Wordmark */
    if (hasWordmark) {
      const wmY = size * 0.82;
      parts.push(`<text x="${cx}" y="${wmY}" text-anchor="middle" dominant-baseline="central" font-family="'${state.wordmarkFont}',sans-serif" font-weight="bold" font-size="${state.wordmarkSize * scale}" fill="${state.accentColor}">${escapeXml(state.wordmark)}</text>`);
    }

    const defsStr = defs.length ? `<defs>\n${defs.map(d => '  ' + d).join('\n')}\n</defs>` : '';

    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">\n${defsStr}${parts.map(p => '  ' + p).join('\n')}\n</svg>`;
  }

  /* ═══════════════════════════════════════════════════════
     EXPORT FUNCTIONS
     ═══════════════════════════════════════════════════════ */

  function downloadFile(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportSVG() {
    downloadFile(generateSVG(), 'logo.svg', 'image/svg+xml');
    MiniDevTools.showToast('SVG descargado');
  }

  function copySVG() {
    navigator.clipboard.writeText(generateSVG()).then(() => {
      MiniDevTools.showToast('SVG copiado al portapapeles');
    }).catch(() => {
      MiniDevTools.showToast('Error al copiar', 'error');
    });
  }

  function exportPNG(size) {
    offCanvas.width = size;
    offCanvas.height = size;
    renderToCanvas(offCtx, size);
    offCanvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logo-${size}x${size}.png`;
      a.click();
      URL.revokeObjectURL(url);
      MiniDevTools.showToast(`PNG ${size}x${size} descargado`);
    }, 'image/png');
  }

  /* ═══════════════════════════════════════════════════════
     PERSISTENCE
     ═══════════════════════════════════════════════════════ */

  function saveState() {
    ToolStorage.setField('logo-generator', 'state', { ...state });
  }

  /* ═══════════════════════════════════════════════════════
     APPLY PALETTE
     ═══════════════════════════════════════════════════════ */

  function applyPalette(key) {
    const p = PALETTES[key];
    if (!p) return;
    state.bgColor = p.bg;
    state.shapeColor = p.shape;
    state.accentColor = p.accent;
    state.textColor = p.text;
    state.palette = key;
    state.shapeGradOn = false;
    state.bgGradOn = false;

    bgColorInput.value = p.bg;
    shapeColorInput.value = p.shape;
    accentColorInput.value = p.accent;
    shapeGradCb.checked = false;
    bgGradCb.checked = false;

    updatePaletteBtns();
    updatePreview(); saveState();
  }

  /* ═══════════════════════════════════════════════════════
     APPLY PRESET TEMPLATE
     ═══════════════════════════════════════════════════════ */

  function applyPreset(idx) {
    const p = PRESETS[idx];
    if (!p) return;

    state.shape = p.shape;
    state.shapeColor = p.shapeColor;
    state.shapeGradC2 = p.shapeGradColor2 || '#ff6699';
    state.shapeGradOn = !!(p.shapeGradColor2);
    state.bgColor = p.bg;
    state.bgGradC2 = '#1a1a2e';
    state.bgGradOn = false;
    state.accentColor = p.accent;
    state.textColor = p.text;
    state.icon = p.iconCls;
    state.text = p.textContent;
    state.fontFamily = p.font;
    state.layout = p.layout;
    state.wordmark = p.wordmark || '';
    state.wordmarkFont = p.wordmarkFont || 'Montserrat';
    state.iconOffsetY = 0;
    state.textOffsetY = 0;
    state.customIconSrc = '';
    customIconImg = null;

    /* Update UI */
    bgColorInput.value = state.bgColor;
    bgGradC2Input.value = state.bgGradC2;
    bgGradCb.checked = state.bgGradOn;
    shapeColorInput.value = state.shapeColor;
    shapeGradC2Input.value = state.shapeGradC2;
    shapeGradCb.checked = state.shapeGradOn;
    accentColorInput.value = state.accentColor;
    textInput.value = state.text;
    fontSelect.value = state.fontFamily;
    wordmarkInput.value = state.wordmark;
    wordmarkFontSelect.value = state.wordmarkFont;
    iconOffsetRange.value = 0;
    iconOffsetVal.textContent = '0';
    textOffsetRange.value = 0;
    textOffsetVal.textContent = '0';

    container.querySelectorAll('.lg-shape-btn').forEach(b =>
      b.classList.toggle('lg-shape-btn--active', b.dataset.shape === state.shape));
    container.querySelectorAll('.lg-layout-btn').forEach(b =>
      b.classList.toggle('lg-layout-btn--active', b.dataset.layout === state.layout));
    updateIconButton();
    updatePreview(); saveState();
  }

  function updateIconButton() {
    if (state.customIconSrc) {
      iconPickerBtn.innerHTML = `<i class="fa-solid fa-image"></i> Custom`;
    } else {
      const ic = ICONS.find(i => i.cls === state.icon);
      iconPickerBtn.innerHTML = ic
        ? `<i class="fa-solid ${ic.cls}"></i> ${ic.name}`
        : `<i class="fa-solid fa-icons"></i> Elegir icono`;
    }
  }

  function updatePaletteBtns() {
    container.querySelectorAll('.lg-pal-btn').forEach(b =>
      b.classList.toggle('lg-pal-btn--active', b.dataset.palette === state.palette));
  }

  /* ═══════════════════════════════════════════════════════
     EVENTS
     ═══════════════════════════════════════════════════════ */

  /* Colors */
  bgColorInput.addEventListener('input', () => {
    state.bgColor = bgColorInput.value;
    state.palette = 'custom';
    updatePaletteBtns();
    updatePreview(); saveState();
  });
  bgGradC2Input.addEventListener('input', () => {
    state.bgGradC2 = bgGradC2Input.value;
    updatePreview(); saveState();
  });
  bgGradCb.addEventListener('change', () => {
    state.bgGradOn = bgGradCb.checked;
    updatePreview(); saveState();
  });
  shapeColorInput.addEventListener('input', () => {
    state.shapeColor = shapeColorInput.value;
    state.palette = 'custom';
    updatePaletteBtns();
    updatePreview(); saveState();
  });
  shapeGradC2Input.addEventListener('input', () => {
    state.shapeGradC2 = shapeGradC2Input.value;
    updatePreview(); saveState();
  });
  shapeGradCb.addEventListener('change', () => {
    state.shapeGradOn = shapeGradCb.checked;
    updatePreview(); saveState();
  });
  accentColorInput.addEventListener('input', () => {
    state.accentColor = accentColorInput.value;
    state.palette = 'custom';
    updatePaletteBtns();
    updatePreview(); saveState();
  });
  gradAngleRange.addEventListener('input', () => {
    state.shapeGradAng = parseInt(gradAngleRange.value);
    state.bgGradAng = state.shapeGradAng;
    gradAngleVal.textContent = state.shapeGradAng + '\u00B0';
    updatePreview(); saveState();
  });
  bgTransp.addEventListener('change', () => { updatePreview(); });

  /* Text */
  textInput.addEventListener('input', () => { state.text = textInput.value; updatePreview(); saveState(); });
  fontSelect.addEventListener('change', () => { state.fontFamily = fontSelect.value; updatePreview(); saveState(); });
  fontSizeRange.addEventListener('input', () => {
    state.fontSize = parseInt(fontSizeRange.value);
    fontSizeVal.textContent = state.fontSize;
    updatePreview(); saveState();
  });
  textOffsetRange.addEventListener('input', () => {
    state.textOffsetY = parseInt(textOffsetRange.value);
    textOffsetVal.textContent = state.textOffsetY;
    updatePreview(); saveState();
  });

  /* Icon */
  iconSizeRange.addEventListener('input', () => {
    state.iconSize = parseInt(iconSizeRange.value);
    iconSizeVal.textContent = state.iconSize;
    updatePreview(); saveState();
  });
  iconOffsetRange.addEventListener('input', () => {
    state.iconOffsetY = parseInt(iconOffsetRange.value);
    iconOffsetVal.textContent = state.iconOffsetY;
    updatePreview(); saveState();
  });
  const iconFileInput = document.getElementById('lg-icon-file');
  const iconUploadBtn = document.getElementById('lg-icon-upload');

  iconUploadBtn.addEventListener('click', () => { iconFileInput.click(); });
  iconFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      state.customIconSrc = ev.target.result;
      state.icon = '';
      updateIconButton();
      loadCustomIcon(state.customIconSrc);
      saveState();
    };
    reader.readAsDataURL(file);
    iconFileInput.value = '';
  });

  /* Paste custom icon */
  document.addEventListener('paste', (e) => {
    if (!container.offsetParent) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const reader = new FileReader();
        reader.onload = (ev) => {
          state.customIconSrc = ev.target.result;
          state.icon = '';
          updateIconButton();
          loadCustomIcon(state.customIconSrc);
          saveState();
        };
        reader.readAsDataURL(item.getAsFile());
        return;
      }
    }
  });

  iconPickerBtn.addEventListener('click', () => { iconModal.style.display = ''; });
  iconModalBg.addEventListener('click', () => { iconModal.style.display = 'none'; });
  iconModalClose.addEventListener('click', () => { iconModal.style.display = 'none'; });

  container.querySelectorAll('.lg-icon-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      state.icon = btn.dataset.icon;
      updateIconButton();
      container.querySelectorAll('.lg-icon-opt').forEach(b => b.classList.remove('lg-icon-opt--active'));
      btn.classList.add('lg-icon-opt--active');
      iconModal.style.display = 'none';
      updatePreview(); saveState();
    });
  });

  iconClearBtn.addEventListener('click', () => {
    state.icon = '';
    state.customIconSrc = '';
    customIconImg = null;
    updateIconButton();
    container.querySelectorAll('.lg-icon-opt').forEach(b => b.classList.remove('lg-icon-opt--active'));
    updatePreview(); saveState();
  });

  /* Wordmark */
  wordmarkInput.addEventListener('input', () => { state.wordmark = wordmarkInput.value; updatePreview(); saveState(); });
  wordmarkFontSelect.addEventListener('change', () => { state.wordmarkFont = wordmarkFontSelect.value; updatePreview(); saveState(); });
  wordmarkSizeRange.addEventListener('input', () => {
    state.wordmarkSize = parseInt(wordmarkSizeRange.value);
    wordmarkSizeVal.textContent = state.wordmarkSize;
    updatePreview(); saveState();
  });

  /* Shape */
  container.querySelectorAll('.lg-shape-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.shape = btn.dataset.shape;
      container.querySelectorAll('.lg-shape-btn').forEach(b => b.classList.remove('lg-shape-btn--active'));
      btn.classList.add('lg-shape-btn--active');
      updatePreview(); saveState();
    });
  });

  /* Layout */
  container.querySelectorAll('.lg-layout-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      state.layout = btn.dataset.layout;
      container.querySelectorAll('.lg-layout-btn').forEach(b => b.classList.remove('lg-layout-btn--active'));
      btn.classList.add('lg-layout-btn--active');
      updatePreview(); saveState();
    });
  });

  /* Palettes */
  container.querySelectorAll('.lg-pal-btn').forEach(btn => {
    btn.addEventListener('click', () => { applyPalette(btn.dataset.palette); });
  });

  /* Presets */
  container.querySelectorAll('.lg-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => { applyPreset(parseInt(btn.dataset.preset)); });
  });

  /* Border */
  borderOn.addEventListener('change', () => { state.borderOn = borderOn.checked; updatePreview(); saveState(); });
  borderColorInput.addEventListener('input', () => { state.borderColor = borderColorInput.value; updatePreview(); saveState(); });
  borderWidthRange.addEventListener('input', () => {
    state.borderWidth = parseInt(borderWidthRange.value);
    borderWidthVal.textContent = state.borderWidth;
    updatePreview(); saveState();
  });

  /* BG Shape */
  bgShapeSelect.addEventListener('change', () => { state.bgShape = bgShapeSelect.value; updatePreview(); saveState(); });

  /* Export */
  document.getElementById('lg-dl-svg').addEventListener('click', exportSVG);
  document.getElementById('lg-copy-svg').addEventListener('click', copySVG);
  container.querySelectorAll('.lg-png-btn').forEach(btn => {
    btn.addEventListener('click', () => { exportPNG(parseInt(btn.dataset.size)); });
  });

  /* Reset */
  resetBtn.addEventListener('click', () => {
    ToolStorage.clear('logo-generator');
    location.reload();
  });

  /* ─── Init ─── */
  updatePreview();

  document.addEventListener('tool-cleanup', () => {});
};

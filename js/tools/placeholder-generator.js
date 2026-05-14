/* ═══════════════════════════════════════════════════════════════
   Placeholder Generator — Generar imágenes placeholder SVG/CSS
   Controles: ancho, alto, color de fondo, color de texto, texto,
   formato (SVG, CSS, URL), opacidad, fuentes comunes.
   Preview en tiempo real, copiar código, presets rápidos.
   Usa ToolStorage para persistir estado.
   ═══════════════════════════════════════════════════════════════ */

function render_placeholder_generator(container, toolMeta) {

  /* ─── State ─── */
  const saved = ToolStorage.load('placeholder-generator');
  const s = saved ? saved.state : null;

  let width = s ? s.width : 400;
  let height = s ? s.height : 300;
  let bgColor = s ? s.bgColor : '#94a3b8';
  let textColor = s ? s.textColor : '#ffffff';
  let customText = s ? s.customText : '';
  let showDimensions = s ? s.showDimensions : true;
  let opacity = s ? s.opacity : 100;
  let fontFamily = s ? s.fontFamily : 'sans-serif';
  let fontSize = s ? s.fontSize : 0; /* 0 = auto */
  let format = s ? s.format : 'svg'; /* svg, css, url */

  /* ─── Size Presets ─── */
  const sizePresets = [
    { label: 'Avatar', w: 150, h: 150 },
    { label: 'Icon', w: 64, h: 64 },
    { label: 'Thumb', w: 200, h: 150 },
    { label: 'HD', w: 1280, h: 720 },
    { label: 'FHD', w: 1920, h: 1080 },
    { label: 'Square', w: 500, h: 500 },
    { label: 'Banner', w: 728, h: 90 },
    { label: 'Story', w: 1080, h: 1920 },
  ];

  /* ─── Color Presets ─── */
  const colorPresets = [
    { bg: '#94a3b8', text: '#ffffff', label: 'Slate' },
    { bg: '#cbd5e1', text: '#475569', label: 'Light' },
    { bg: '#1e293b', text: '#e2e8f0', label: 'Dark' },
    { bg: '#6366f1', text: '#ffffff', label: 'Indigo' },
    { bg: '#22c55e', text: '#ffffff', label: 'Green' },
    { bg: '#f43f5e', text: '#ffffff', label: 'Rose' },
    { bg: '#f97316', text: '#ffffff', label: 'Orange' },
    { bg: '#0ea5e9', text: '#ffffff', label: 'Sky' },
    { bg: '#000000', text: '#ffffff', label: 'Black' },
    { bg: '#ffffff', text: '#000000', label: 'White' },
  ];

  /* ─── Font Options ─── */
  const fontOptions = [
    { value: 'sans-serif', label: 'Sans-serif' },
    { value: 'serif', label: 'Serif' },
    { value: 'monospace', label: 'Monospace' },
    { value: 'system-ui', label: 'System UI' },
  ];

  /* ─── Helpers ─── */
  function getDisplayText() {
    if (customText.trim()) return customText.trim();
    if (showDimensions) return `${width} x ${height}`;
    return '';
  }

  function getAutoFontSize() {
    const smaller = Math.min(width, height);
    if (smaller <= 64) return Math.max(10, Math.floor(smaller * 0.28));
    if (smaller <= 150) return Math.max(12, Math.floor(smaller * 0.16));
    if (smaller <= 300) return Math.max(14, Math.floor(smaller * 0.1));
    return Math.max(16, Math.floor(smaller * 0.06));
  }

  function getEffectiveFontSize() {
    return fontSize > 0 ? fontSize : getAutoFontSize();
  }

  /* ─── SVG Generator ─── */
  function generateSVG() {
    const text = getDisplayText();
    const fs = getEffectiveFontSize();
    const alpha = opacity / 100;

    const bgRGB = hexToRGB(bgColor);
    const bgRGBA = `rgba(${bgRGB.r},${bgRGB.g},${bgRGB.b},${alpha})`;

    const txtRGB = hexToRGB(textColor);
    const txtRGBA = `rgba(${txtRGB.r},${txtRGB.g},${txtRGB.b},${alpha})`;

    /* Escape special chars for XML */
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">` +
      `<rect width="${width}" height="${height}" fill="${bgRGBA}"/>` +
      (text
        ? `<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="${fontFamily}, sans-serif" font-size="${fs}" font-weight="600" fill="${txtRGBA}">${escaped}</text>`
        : '') +
      `</svg>`;
  }

  /* ─── Code Output ─── */
  function generateCode() {
    switch (format) {
      case 'svg':
        return generateSVG();

      case 'url': {
        const svg = generateSVG();
        const encoded = 'data:image/svg+xml,' + svg.replace(/"/g, "'").replace(/%/g, '%25').replace(/#/g, '%23').replace(/{/g, '%7B').replace(/}/g, '%7D').replace(/</g, '%3C').replace(/>/g, '%3E');
        return encoded;
      }

      case 'css': {
        const svg = generateSVG();
        const encoded = 'data:image/svg+xml,' + encodeURIComponent(svg);
        return `background-image: url("${encoded}");\nwidth: ${width}px;\nheight: ${height}px;`;
      }
    }
    return '';
  }

  function hexToRGB(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16),
    };
  }

  /* ─── Render UI ─── */
  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title"><i class="${toolMeta.icon}" style="margin-right:8px;"></i>${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <div class="pg-layout">
          <!-- Left: Preview + Code -->
          <div class="pg-left">
            <!-- Preview -->
            <div class="pg-preview-wrap">
              <div class="pg-preview" id="pg-preview">
                <img id="pg-preview-img" alt="Preview" draggable="false">
              </div>
              <div class="pg-preview-info" id="pg-preview-info"></div>
            </div>

            <!-- Code Output -->
            <div class="pg-code-section">
              <div class="pg-code-header">
                <div class="pg-format-btns">
                  <button class="pg-format-btn ${format === 'svg' ? 'pg-format-btn--active' : ''}" data-fmt="svg">SVG</button>
                  <button class="pg-format-btn ${format === 'url' ? 'pg-format-btn--active' : ''}" data-fmt="url">Data URL</button>
                  <button class="pg-format-btn ${format === 'css' ? 'pg-format-btn--active' : ''}" data-fmt="css">CSS</button>
                </div>
                <button class="btn btn--secondary btn--icon" id="pg-copy-code" data-tooltip="Copiar">
                  <i class="fa-regular fa-copy"></i>
                </button>
              </div>
              <div class="pg-code-wrap">
                <pre class="pg-code" id="pg-code"></pre>
              </div>
            </div>
          </div>

          <!-- Right: Controls -->
          <div class="pg-right">
            <!-- Size -->
            <div class="pg-section">
              <label class="label">Tamaño</label>
              <div class="pg-size-row">
                <div class="pg-size-input">
                  <span class="pg-size-label">W</span>
                  <input type="number" class="input pg-num-input" id="pg-width" value="${width}" min="1" max="4096">
                </div>
                <i class="fa-solid fa-xmark pg-size-x"></i>
                <div class="pg-size-input">
                  <span class="pg-size-label">H</span>
                  <input type="number" class="input pg-num-input" id="pg-height" value="${height}" min="1" max="4096">
                </div>
                <button class="btn btn--ghost btn--icon" id="pg-swap" data-tooltip="Intercambiar" style="flex-shrink:0;">
                  <i class="fa-solid fa-arrows-rotate"></i>
                </button>
              </div>
              <!-- Size presets -->
              <div class="pg-size-presets" id="pg-size-presets">
                ${sizePresets.map(p => `<button class="pg-chip" data-w="${p.w}" data-h="${p.h}">${p.label}</button>`).join('')}
              </div>
            </div>

            <!-- Colors -->
            <div class="pg-section">
              <label class="label">Colores</label>
              <div class="pg-color-presets" id="pg-color-presets">
                ${colorPresets.map(p => `
                  <button class="pg-color-preset" data-bg="${p.bg}" data-text="${p.textColor}" data-tooltip="${p.label}" title="${p.label}">
                    <span class="pg-color-dot" style="background:${p.bg};"></span>
                  </button>
                `).join('')}
              </div>
              <div class="pg-colors-row">
                <div class="pg-color-pair">
                  <span class="pg-color-which">Fondo</span>
                  <input type="color" class="pg-color-input" id="pg-bg" value="${bgColor}">
                  <input type="text" class="input pg-hex-input" id="pg-bg-hex" value="${bgColor}" maxlength="7" spellcheck="false">
                </div>
                <div class="pg-color-pair">
                  <span class="pg-color-which">Texto</span>
                  <input type="color" class="pg-color-input" id="pg-text" value="${textColor}">
                  <input type="text" class="input pg-hex-input" id="pg-text-hex" value="${textColor}" maxlength="7" spellcheck="false">
                </div>
              </div>
            </div>

            <!-- Text -->
            <div class="pg-section">
              <label class="label">Texto</label>
              <input type="text" class="input" id="pg-custom-text" value="${customText}" placeholder="Dejar vacío para dimensiones" spellcheck="false" maxlength="100">
              <div class="pg-options">
                <label class="pg-option">
                  <input type="checkbox" id="pg-show-dims" ${showDimensions ? 'checked' : ''}>
                  <span>Mostrar dimensiones</span>
                </label>
              </div>
            </div>

            <!-- Font -->
            <div class="pg-section">
              <label class="label">Fuente</label>
              <div class="pg-font-row">
                <select class="input pg-select" id="pg-font-family">
                  ${fontOptions.map(f => `<option value="${f.value}" ${fontFamily === f.value ? 'selected' : ''}>${f.label}</option>`).join('')}
                </select>
                <div class="pg-font-size-wrap">
                  <input type="number" class="input pg-num-input" id="pg-font-size" value="${fontSize || ''}" min="8" max="200" placeholder="Auto">
                  <span class="pg-fs-hint">px</span>
                </div>
              </div>
            </div>

            <!-- Opacity -->
            <div class="pg-section">
              <label class="label">Opacidad</label>
              <div class="pg-slider-row">
                <input type="range" class="pg-range" id="pg-opacity" min="10" max="100" value="${opacity}">
                <span class="pg-slider-val" id="pg-opacity-val">${opacity}%</span>
              </div>
            </div>

            <!-- Download SVG -->
            <button class="btn btn--primary" id="pg-download" style="width:100%;">
              <i class="fa-solid fa-download"></i> Descargar SVG
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const previewImg = document.getElementById('pg-preview-img');
  const previewInfo = document.getElementById('pg-preview-info');
  const codeEl = document.getElementById('pg-code');
  const copyBtn = document.getElementById('pg-copy-code');
  const downloadBtn = document.getElementById('pg-download');

  const widthInput = document.getElementById('pg-width');
  const heightInput = document.getElementById('pg-height');
  const swapBtn = document.getElementById('pg-swap');

  const bgInput = document.getElementById('pg-bg');
  const bgHexInput = document.getElementById('pg-bg-hex');
  const textInput = document.getElementById('pg-text');
  const textHexInput = document.getElementById('pg-text-hex');

  const customTextInput = document.getElementById('pg-custom-text');
  const showDimsCheck = document.getElementById('pg-show-dims');
  const fontFamilySelect = document.getElementById('pg-font-family');
  const fontSizeInput = document.getElementById('pg-font-size');
  const opacityRange = document.getElementById('pg-opacity');
  const opacityVal = document.getElementById('pg-opacity-val');

  const formatBtns = container.querySelectorAll('.pg-format-btn');

  /* ─── Update Preview + Code ─── */
  function update() {
    /* SVG as data URL for preview image */
    const svg = generateSVG();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    previewImg.src = url;

    /* Info text */
    const actualFS = fontSize > 0 ? `${fontSize}px` : 'auto';
    previewInfo.textContent = `${width} × ${height}  ·  ${getEffectiveFontSize()}px  ·  ${opacity}%`;

    /* Code output */
    codeEl.textContent = generateCode();

    saveState();
  }

  /* ─── Size Events ─── */
  widthInput.addEventListener('input', () => {
    width = Math.max(1, Math.min(4096, parseInt(widthInput.value) || 1));
    update();
  });
  heightInput.addEventListener('input', () => {
    height = Math.max(1, Math.min(4096, parseInt(heightInput.value) || 1));
    update();
  });

  swapBtn.addEventListener('click', () => {
    [width, height] = [height, width];
    widthInput.value = width;
    heightInput.value = height;
    update();
  });

  /* Size presets */
  container.querySelectorAll('#pg-size-presets .pg-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      width = parseInt(btn.dataset.w);
      height = parseInt(btn.dataset.h);
      widthInput.value = width;
      heightInput.value = height;
      update();
    });
  });

  /* ─── Color Events ─── */
  bgInput.addEventListener('input', () => {
    bgColor = bgInput.value;
    bgHexInput.value = bgColor;
    update();
  });
  bgHexInput.addEventListener('input', () => {
    const v = bgHexInput.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      bgColor = v;
      bgInput.value = bgColor;
      update();
    }
  });
  textInput.addEventListener('input', () => {
    textColor = textInput.value;
    textHexInput.value = textColor;
    update();
  });
  textHexInput.addEventListener('input', () => {
    const v = textHexInput.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      textColor = v;
      textInput.value = textColor;
      update();
    }
  });

  /* Color presets */
  container.querySelectorAll('#pg-color-presets .pg-color-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      bgColor = btn.dataset.bg;
      textColor = btn.dataset.text;
      bgInput.value = bgColor;
      bgHexInput.value = bgColor;
      textInput.value = textColor;
      textHexInput.value = textColor;
      update();
    });
  });

  /* ─── Text Events ─── */
  customTextInput.addEventListener('input', () => {
    customText = customTextInput.value;
    update();
  });
  showDimsCheck.addEventListener('change', () => {
    showDimensions = showDimsCheck.checked;
    update();
  });

  /* ─── Font Events ─── */
  fontFamilySelect.addEventListener('change', () => {
    fontFamily = fontFamilySelect.value;
    update();
  });
  fontSizeInput.addEventListener('input', () => {
    const v = parseInt(fontSizeInput.value);
    fontSize = (v && v >= 8 && v <= 200) ? v : 0;
    update();
  });

  /* ─── Opacity ─── */
  opacityRange.addEventListener('input', () => {
    opacity = parseInt(opacityRange.value);
    opacityVal.textContent = opacity + '%';
    update();
  });

  /* ─── Format ─── */
  formatBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      format = btn.dataset.fmt;
      formatBtns.forEach(b => b.classList.toggle('pg-format-btn--active', b === btn));
      update();
    });
  });

  /* ─── Copy Code ─── */
  copyBtn.addEventListener('click', () => {
    MiniDevTools.copyToClipboard(codeEl.textContent, 'Codigo copiado!');
  });

  /* ─── Download SVG ─── */
  downloadBtn.addEventListener('click', () => {
    const svg = generateSVG();
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `placeholder-${width}x${height}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    MiniDevTools.showToast('SVG descargado!', 'success');
  });

  /* ─── Persistence ─── */
  function saveState() {
    ToolStorage.setField('placeholder-generator', 'state', {
      width, height, bgColor, textColor, customText,
      showDimensions, opacity, fontFamily, fontSize, format
    });
  }

  /* ─── Init ─── */
  update();
}

/* Registro global */
window['render_placeholder-generator'] = render_placeholder_generator;

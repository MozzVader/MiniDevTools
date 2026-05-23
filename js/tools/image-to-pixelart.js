/* ═══════════════════════════════════════════════════════════════
   Image to Pixel Art — Convert images to pixel art
   Features:
   - Upload, drag & drop, or paste image
   - Pixel size slider (1-128)
   - Brightness, Contrast, Saturation sliders
   - Color levels quantization (2-32 levels per channel)
   - Color palettes (PICO-8, Game Boy, C64, 1-Bit, CGA)
   - Real-time preview with pixelated rendering
   - Grid overlay (download only)
   - Download Small (actual pixels) / Large (scaled to original)
   - Persistence with ToolStorage
   ═══════════════════════════════════════════════════════════════ */

window['render_image-to-pixelart'] = function(container, toolMeta) {

  /* ─── Palettes ─── */
  const PALETTES = {
    none:   { name: 'Original',  colors: null },
    pico8:  { name: 'PICO-8',   colors: [[0,0,0],[29,43,83],[126,37,83],[0,135,81],[171,82,54],[95,87,79],[194,195,199],[255,241,232],[255,0,77],[255,163,0],[255,236,39],[0,228,54],[41,173,255],[131,118,156],[255,119,168],[255,204,170]] },
    gameboy:{ name: 'Game Boy',  colors: [[15,56,15],[48,98,48],[139,172,15],[155,188,15]] },
    cga:    { name: 'CGA',       colors: [[0,0,0],[0,170,170],[170,0,170],[170,170,170]] },
    c64:    { name: 'C64',       colors: [[0,0,0],[255,255,255],[136,0,0],[170,255,238],[204,68,204],[0,204,85],[0,0,170],[238,238,119],[221,136,85],[102,68,0],[255,119,119],[51,51,51],[119,119,119],[170,255,102],[0,136,255],[187,187,187]] },
    mono:   { name: '1-Bit',     colors: [[0,0,0],[255,255,255]] },
  };

  /* ─── State ─── */
  const saved = ToolStorage.load('image-to-pixelart');
  const s = saved ? saved.state : null;

  /* Migration: if saved state lacks colorLevels, discard old state */
  if (s && !('colorLevels' in s)) {
    ToolStorage.clear('image-to-pixelart');
  }
  const clean = ('colorLevels' in (s || {})) ? s : null;

  const state = {
    pixelSize:   clean?.pixelSize   ?? 16,
    brightness:  clean?.brightness  ?? 0,
    contrast:    clean?.contrast    ?? 0,
    saturation:  clean?.saturation  ?? 0,
    colorLevels: clean?.colorLevels ?? 8,
    palette:     clean?.palette     ?? 'none',
    showGrid:    clean?.showGrid    ?? false,
  };

  let originalImage = null;
  let debounceTimer = null;
  let pixW = 0, pixH = 0;

  /* Off-screen canvas for processing */
  const procCanvas = document.createElement('canvas');
  const procCtx = procCanvas.getContext('2d', { willReadFrequently: true });

  /* ═══════════════════════════════════════════════════════
     RENDER UI
     ═══════════════════════════════════════════════════════ */

  /* Build palette options with color swatches */
  function buildPaletteSwatches(palette) {
    if (!palette) return '';
    const maxShow = 5;
    const colors = palette.length <= maxShow ? palette : palette.slice(0, maxShow);
    const dots = colors.map(c =>
      `<span class="ipa-pal-dot" style="background:rgb(${c[0]},${c[1]},${c[2]})"></span>`
    ).join('');
    const more = palette.length > maxShow ? `<span class="ipa-pal-more">+${palette.length - maxShow}</span>` : '';
    return `<span class="ipa-pal-swatches">${dots}${more}</span>`;
  }

  const paletteOptions = Object.entries(PALETTES).map(([k, v]) =>
    `<option value="${k}"${state.palette === k ? ' selected' : ''}>${v.name}</option>`
  ).join('');

  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title"><i class="${toolMeta.icon}" style="margin-right:8px;"></i>${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <!-- Upload Area -->
        <div class="ipa-upload" id="ipa-upload">
          <div class="ipa-upload__icon"><i class="fa-solid fa-image"></i></div>
          <p class="ipa-upload__text">Arrastrá una imagen acá o hacé click para seleccionar</p>
          <p class="ipa-upload__hint">También podés pegar desde el portapapeles con Ctrl+V</p>
          <input type="file" id="ipa-file" accept="image/*" style="display:none;">
        </div>

        <!-- Workspace (hidden until image loads) -->
        <div class="ipa-workspace" id="ipa-workspace" style="display:none;">

          <!-- Toolbar -->
          <div class="ipa-toolbar">
            <button class="btn btn--ghost btn--sm" id="ipa-change">
              <i class="fa-solid fa-image"></i> Cambiar imagen
            </button>
            <button class="btn btn--ghost btn--sm" id="ipa-reset">
              <i class="fa-solid fa-rotate-left"></i> Reset ajustes
            </button>
          </div>

          <!-- Controls -->
          <div class="ipa-controls">
            <div class="ipa-control-row">
              <label class="ipa-label" for="ipa-ps">Tamaño pixel</label>
              <input type="range" id="ipa-ps" class="ipa-range" min="1" max="128" value="${state.pixelSize}">
              <span class="ipa-value" id="ipa-ps-val">${state.pixelSize}</span>
            </div>
            <div class="ipa-control-row">
              <label class="ipa-label" for="ipa-br">Brillo</label>
              <input type="range" id="ipa-br" class="ipa-range" min="-100" max="100" value="${state.brightness}">
              <span class="ipa-value" id="ipa-br-val">${state.brightness}</span>
            </div>
            <div class="ipa-control-row">
              <label class="ipa-label" for="ipa-ct">Contraste</label>
              <input type="range" id="ipa-ct" class="ipa-range" min="-100" max="100" value="${state.contrast}">
              <span class="ipa-value" id="ipa-ct-val">${state.contrast}</span>
            </div>
            <div class="ipa-control-row">
              <label class="ipa-label" for="ipa-st">Saturación</label>
              <input type="range" id="ipa-st" class="ipa-range" min="-100" max="100" value="${state.saturation}">
              <span class="ipa-value" id="ipa-st-val">${state.saturation}</span>
            </div>
            <div class="ipa-control-row">
              <label class="ipa-label" for="ipa-levels">Niveles</label>
              <input type="range" id="ipa-levels" class="ipa-range" min="2" max="32" value="${state.colorLevels}">
              <span class="ipa-value" id="ipa-levels-val">${state.colorLevels}</span>
            </div>
            <div class="ipa-control-row">
              <label class="ipa-label" for="ipa-palette">Paleta</label>
              <select class="input ipa-select" id="ipa-palette">${paletteOptions}</select>
              <span class="ipa-pal-preview" id="ipa-pal-preview"></span>
            </div>
            <div class="ipa-control-row">
              <label class="ipa-checkbox">
                <input type="checkbox" id="ipa-grid"${state.showGrid ? ' checked' : ''}>
                Grilla (solo descarga grande)
              </label>
            </div>
          </div>

          <!-- Preview -->
          <div class="ipa-preview-wrap" id="ipa-preview-wrap">
            <canvas id="ipa-preview"></canvas>
          </div>

          <!-- Stats -->
          <div class="ipa-stats" id="ipa-stats"></div>

          <!-- Download -->
          <div class="ipa-actions">
            <button class="btn btn--primary btn--sm" id="ipa-dl-small" disabled>
              <i class="fa-solid fa-download"></i> Descargar pequeño
            </button>
            <button class="btn btn--primary btn--sm" id="ipa-dl-large" disabled>
              <i class="fa-solid fa-download"></i> Descargar grande
            </button>
          </div>

        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const uploadArea = document.getElementById('ipa-upload');
  const workspace = document.getElementById('ipa-workspace');
  const fileInput = document.getElementById('ipa-file');
  const changeBtn = document.getElementById('ipa-change');
  const resetBtn = document.getElementById('ipa-reset');

  const psRange = document.getElementById('ipa-ps');
  const brRange = document.getElementById('ipa-br');
  const ctRange = document.getElementById('ipa-ct');
  const stRange = document.getElementById('ipa-st');
  const levelsRange = document.getElementById('ipa-levels');
  const psVal = document.getElementById('ipa-ps-val');
  const brVal = document.getElementById('ipa-br-val');
  const ctVal = document.getElementById('ipa-ct-val');
  const stVal = document.getElementById('ipa-st-val');
  const levelsVal = document.getElementById('ipa-levels-val');
  const paletteSelect = document.getElementById('ipa-palette');
  const palPreview = document.getElementById('ipa-pal-preview');
  const gridCb = document.getElementById('ipa-grid');

  const previewWrap = document.getElementById('ipa-preview-wrap');
  const previewCanvas = document.getElementById('ipa-preview');
  const previewCtx = previewCanvas.getContext('2d');

  const statsEl = document.getElementById('ipa-stats');
  const dlSmallBtn = document.getElementById('ipa-dl-small');
  const dlLargeBtn = document.getElementById('ipa-dl-large');

  /* ═══════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════ */

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, Math.round(v))); }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return [h, s, l];
  }

  function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  }

  function hslToRgb(h, s, l) {
    if (s === 0) { const v = Math.round(l * 255); return [v, v, v]; }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return [
      Math.round(hue2rgb(p, q, h + 1/3) * 255),
      Math.round(hue2rgb(p, q, h) * 255),
      Math.round(hue2rgb(p, q, h - 1/3) * 255)
    ];
  }

  function findNearest(r, g, b, palette) {
    let minDist = Infinity, nearest = palette[0];
    for (let i = 0; i < palette.length; i++) {
      const c = palette[i];
      const dr = r - c[0], dg = g - c[1], db = b - c[2];
      const dist = dr * dr + dg * dg + db * db;
      if (dist < minDist) { minDist = dist; nearest = c; }
    }
    return nearest;
  }

  /* ═══════════════════════════════════════════════════════
     IMAGE LOADING
     ═══════════════════════════════════════════════════════ */

  function loadImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => loadImageSrc(e.target.result);
    reader.readAsDataURL(file);
  }

  function loadImageSrc(src) {
    const img = new Image();
    img.onload = () => {
      originalImage = img;
      showWorkspace();
      processImage();
    };
    img.onerror = () => {
      MiniDevTools.showToast('Error al cargar la imagen', 'error');
    };
    img.src = src;
  }

  function showWorkspace() {
    uploadArea.style.display = 'none';
    workspace.style.display = '';
    dlSmallBtn.disabled = false;
    dlLargeBtn.disabled = false;
  }

  function showUpload() {
    workspace.style.display = 'none';
    uploadArea.style.display = '';
    originalImage = null;
    dlSmallBtn.disabled = true;
    dlLargeBtn.disabled = true;
    statsEl.innerHTML = '';
  }

  /* ═══════════════════════════════════════════════════════
     PROCESSING PIPELINE
     ═══════════════════════════════════════════════════════ */

  function processImage() {
    if (!originalImage) return;

    const ps = Math.max(1, state.pixelSize);
    const ow = originalImage.naturalWidth;
    const oh = originalImage.naturalHeight;

    pixW = Math.max(1, Math.ceil(ow / ps));
    pixH = Math.max(1, Math.ceil(oh / ps));

    /* 1. Draw original scaled down to pixel art size (nearest-neighbor = no blending) */
    procCanvas.width = pixW;
    procCanvas.height = pixH;
    procCtx.imageSmoothingEnabled = false;
    procCtx.drawImage(originalImage, 0, 0, pixW, pixH);

    /* 2. Read pixels */
    const imgData = procCtx.getImageData(0, 0, pixW, pixH);
    const d = imgData.data;

    const br = state.brightness * 2.55;
    const ct = state.contrast * 2.55;
    const ctFactor = (259 * (ct + 255)) / (255 * (259 - ct));
    const satDelta = state.saturation / 100;
    const pal = state.palette !== 'none' ? PALETTES[state.palette].colors : null;

    /* 3. Apply adjustments + palette */
    for (let i = 0; i < d.length; i += 4) {
      let r = d[i], g = d[i + 1], b = d[i + 2];

      /* Brightness */
      r += br; g += br; b += br;

      /* Contrast */
      r = ctFactor * (r - 128) + 128;
      g = ctFactor * (g - 128) + 128;
      b = ctFactor * (b - 128) + 128;

      /* Saturation */
      if (satDelta !== 0) {
        const [h2, s2, l2] = rgbToHsl(
          clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)
        );
        const newS = clamp(s2 + satDelta, 0, 1);
        [r, g, b] = hslToRgb(h2, newS, l2);
      }

      r = clamp(r, 0, 255);
      g = clamp(g, 0, 255);
      b = clamp(b, 0, 255);

      /* Palette mapping */
      if (pal) {
        const nc = findNearest(r, g, b, pal);
        r = nc[0]; g = nc[1]; b = nc[2];
      } else {
        /* Color quantization: reduce levels per channel */
        const levels = Math.max(2, state.colorLevels);
        const step = 255 / (levels - 1);
        r = Math.round(Math.round(r / step) * step);
        g = Math.round(Math.round(g / step) * step);
        b = Math.round(Math.round(b / step) * step);
      }

      d[i] = clamp(r, 0, 255);
      d[i + 1] = clamp(g, 0, 255);
      d[i + 2] = clamp(b, 0, 255);
    }

    procCtx.putImageData(imgData, 0, 0);

    /* 4. Update preview */
    updatePreview();

    /* 5. Update stats */
    const palName = PALETTES[state.palette].name;
    statsEl.innerHTML = `
      <span><i class="fa-solid fa-expand"></i> ${ow} x ${oh}</span>
      <span><i class="fa-solid fa-arrow-right"></i></span>
      <span><i class="fa-solid fa-th"></i> ${pixW} x ${pixH}</span>
      <span><i class="fa-solid fa-cube"></i> PS: ${ps}</span>
      ${pal ? `<span><i class="fa-solid fa-palette"></i> ${palName}</span>` : `<span><i class="fa-solid fa-layer-group"></i> ${state.colorLevels} niveles</span>`}
    `;
  }

  function updatePreview() {
    previewCanvas.width = pixW;
    previewCanvas.height = pixH;
    previewCtx.imageSmoothingEnabled = false;
    previewCtx.drawImage(procCanvas, 0, 0);

    /* Scale display size to fit container */
    const maxW = previewWrap.clientWidth - 32;
    const maxH = 450;
    if (maxW <= 0 || maxH <= 0) return;

    const scale = Math.min(maxW / pixW, maxH / pixH);
    previewCanvas.style.width = Math.round(pixW * scale) + 'px';
    previewCanvas.style.height = Math.round(pixH * scale) + 'px';
  }

  function debouncedProcess() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(processImage, 50);
  }

  /* ═══════════════════════════════════════════════════════
     GRID DRAWING
     ═══════════════════════════════════════════════════════ */

  function drawGrid(canvas, cellSize, color) {
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    const w = canvas.width, h = canvas.height;

    for (let x = 0; x <= w; x += cellSize) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += cellSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
      ctx.stroke();
    }
  }

  /* ═══════════════════════════════════════════════════════
     DOWNLOAD
     ═══════════════════════════════════════════════════════ */

  function downloadBlob(canvas, filename) {
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }

  function downloadSmall() {
    if (!originalImage) return;
    /* Actual pixel art dimensions */
    const c = document.createElement('canvas');
    c.width = pixW; c.height = pixH;
    c.getContext('2d').drawImage(procCanvas, 0, 0);
    downloadBlob(c, `pixelart-small-${pixW}x${pixH}.png`);
    MiniDevTools.showToast('Descargado (' + pixW + 'x' + pixH + ')');
  }

  function downloadLarge() {
    if (!originalImage) return;
    /* Scaled to original image dimensions */
    const c = document.createElement('canvas');
    c.width = originalImage.naturalWidth;
    c.height = originalImage.naturalHeight;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(procCanvas, 0, 0, c.width, c.height);

    if (state.showGrid) {
      drawGrid(c, state.pixelSize, 'rgba(128,128,128,0.25)');
    }

    downloadBlob(c, `pixelart-large-${c.width}x${c.height}.png`);
    MiniDevTools.showToast('Descargado (' + c.width + 'x' + c.height + ')');
  }

  /* ═══════════════════════════════════════════════════════
     PERSISTENCE
     ═══════════════════════════════════════════════════════ */

  function saveState() {
    ToolStorage.setField('image-to-pixelart', 'state', { ...state });
  }

  /* ═══════════════════════════════════════════════════════
     EVENTS
     ═══════════════════════════════════════════════════════ */

  /* ─ Upload ─ */
  uploadArea.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => {
    loadImageFile(e.target.files[0]);
    fileInput.value = '';
  });
  changeBtn.addEventListener('click', () => fileInput.click());

  /* ─ Drag & Drop on upload area ─ */
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('ipa-upload--dragover');
  });
  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('ipa-upload--dragover');
  });
  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('ipa-upload--dragover');
    const file = e.dataTransfer.files[0];
    if (file) loadImageFile(file);
  });

  /* ─ Drag & Drop on workspace (change image) ─ */
  workspace.addEventListener('dragover', (e) => e.preventDefault());
  workspace.addEventListener('drop', (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) loadImageFile(file);
  });

  /* ─ Paste from clipboard ─ */
  document.addEventListener('paste', (e) => {
    if (!container.offsetParent) return;
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        loadImageFile(item.getAsFile());
        return;
      }
    }
  });

  /* ─ Sliders ─ */
  psRange.addEventListener('input', () => {
    state.pixelSize = parseInt(psRange.value);
    psVal.textContent = state.pixelSize;
    debouncedProcess();
    saveState();
  });
  brRange.addEventListener('input', () => {
    state.brightness = parseInt(brRange.value);
    brVal.textContent = state.brightness;
    debouncedProcess();
    saveState();
  });
  ctRange.addEventListener('input', () => {
    state.contrast = parseInt(ctRange.value);
    ctVal.textContent = state.contrast;
    debouncedProcess();
    saveState();
  });
  stRange.addEventListener('input', () => {
    state.saturation = parseInt(stRange.value);
    stVal.textContent = state.saturation;
    debouncedProcess();
    saveState();
  });

  /* ─ Color Levels ─ */
  levelsRange.addEventListener('input', () => {
    state.colorLevels = parseInt(levelsRange.value);
    levelsVal.textContent = state.colorLevels;
    debouncedProcess();
    saveState();
  });

  /* ─ Palette ─ */
  function updatePalettePreview() {
    const pal = PALETTES[paletteSelect.value];
    if (pal && pal.colors) {
      palPreview.innerHTML = buildPaletteSwatches(pal.colors);
    } else {
      palPreview.innerHTML = '';
    }
  }
  paletteSelect.addEventListener('change', () => {
    state.palette = paletteSelect.value;
    updatePalettePreview();
    debouncedProcess();
    saveState();
  });
  updatePalettePreview();

  /* ─ Grid ─ */
  gridCb.addEventListener('change', () => {
    state.showGrid = gridCb.checked;
    saveState();
  });

  /* ─ Reset ─ */
  resetBtn.addEventListener('click', () => {
    state.pixelSize = 16; state.brightness = 0; state.contrast = 0;
    state.saturation = 0; state.colorLevels = 8; state.palette = 'none'; state.showGrid = false;

    psRange.value = 16; psVal.textContent = '16';
    brRange.value = 0; brVal.textContent = '0';
    ctRange.value = 0; ctVal.textContent = '0';
    stRange.value = 0; stVal.textContent = '0';
    levelsRange.value = 8; levelsVal.textContent = '8';
    paletteSelect.value = 'none';
    gridCb.checked = false;
    updatePalettePreview();

    debouncedProcess();
    saveState();
  });

  /* ─ Download ─ */
  dlSmallBtn.addEventListener('click', downloadSmall);
  dlLargeBtn.addEventListener('click', downloadLarge);

  /* ─ Resize preview on window resize ─ */
  const onResize = () => { if (originalImage) updatePreview(); };
  window.addEventListener('resize', onResize);

  /* ═══════════════════════════════════════════════════════
     CLEANUP
     ═══════════════════════════════════════════════════════ */
  document.addEventListener('tool-cleanup', () => {
    clearTimeout(debounceTimer);
    window.removeEventListener('resize', onResize);
  });

  /* ─── Init ─── */
};

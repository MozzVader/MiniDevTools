/* ═══════════════════════════════════════════════════════════════
   Image Color Picker — Extraer colores de una imagen
   Features:
   - Drag & drop / click / paste / URL para cargar imágenes
   - Lupa circular con zoom al hacer hover sobre la imagen
   - Click para seleccionar color (muestra HEX/RGB/HSL)
   - Cuadrados de comparación: color seleccionado + hover
   - Extracción automática de paleta (3-15 colores, ajustable)
   - EyeDropper API (Chrome/Edge) para pick from screen
   - Historial de colores seleccionados
   - Copiar colores individuales o paleta completa
   Usa ToolStorage para persistir estado.
   ═══════════════════════════════════════════════════════════════ */

function render_image_color_picker(container, toolMeta) {

  /* ─── Constants ─── */
  const LENS_SIZE = 120;
  const LENS_ZOOM = 10;
  const MAX_PALETTE = 15;
  const MIN_PALETTE = 3;
  const MAX_HISTORY = 24;

  /* ─── State ─── */
  const saved = ToolStorage.load('image-color-picker');
  const s = saved ? saved.state : null;

  let pickedColor = null;    // { hex, r, g, b, h, s, l } or null
  let hoverColor = null;     // same
  let palette = [];          // array of hex strings
  let paletteCount = s ? s.paletteCount : 7;
  let history = s ? (s.history || []) : [];
  let hasImage = false;
  let imgNatW = 0, imgNatH = 0;

  /* ─── Offscreen canvas for pixel reading ─── */
  const offCanvas = document.createElement('canvas');
  const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });

  /* ─── Hidden file input ─── */
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  container.appendChild(fileInput);

  /* ═══════════════════════════════════════════════════════
     COLOR HELPERS
     ═══════════════════════════════════════════════════════ */

  function hexToRGB(hex) {
    return {
      r: parseInt(hex.slice(1, 3), 16),
      g: parseInt(hex.slice(3, 5), 16),
      b: parseInt(hex.slice(5, 7), 16)
    };
  }

  function rgbToHex(r, g, b) {
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
  }

  function rgbToHSL(r, g, b) {
    r /= 255; g /= 255; b /= 255;
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

  function isLight(hex) {
    const { r, g, b } = hexToRGB(hex);
    return (r * 0.299 + g * 0.587 + b * 0.114) > 150;
  }

  function colorInfoFromPixel(r, g, b) {
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHSL(r, g, b);
    return { hex, r, g, b, ...hsl };
  }

  /* ═══════════════════════════════════════════════════════
     COLOR EXTRACTION (quantization + frequency)
     ═══════════════════════════════════════════════════════ */

  function extractPalette(count) {
    if (!offCanvas.width || !offCanvas.height) return [];
    const data = offCtx.getImageData(0, 0, offCanvas.width, offCanvas.height).data;
    const totalPixels = offCanvas.width * offCanvas.height;
    const sampleStep = Math.max(1, Math.floor(totalPixels / 40000));

    /* Build frequency map with quantized colors */
    const colorMap = new Map();
    for (let i = 0; i < data.length; i += 4 * sampleStep) {
      if (data[i + 3] < 128) continue; // skip transparent
      const r = Math.round(data[i] / 24) * 24;
      const g = Math.round(data[i + 1] / 24) * 24;
      const b = Math.round(data[i + 2] / 24) * 24;
      const key = `${Math.min(255, r)},${Math.min(255, g)},${Math.min(255, b)}`;
      colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }

    /* Sort by frequency */
    const sorted = [...colorMap.entries()]
      .map(([key, count]) => {
        const [r, g, b] = key.split(',').map(Number);
        return { r, g, b, count };
      })
      .sort((a, b) => b.count - a.count);

    /* Greedy selection with minimum distance */
    const selected = [];
    for (const color of sorted) {
      if (selected.length >= count) break;
      const tooClose = selected.some(sel => {
        const dr = sel.r - color.r, dg = sel.g - color.g, db = sel.b - color.b;
        return Math.sqrt(dr * dr + dg * dg + db * db) < 40;
      });
      if (!tooClose) selected.push({ ...color });
    }

    /* Relax distance if not enough */
    if (selected.length < count) {
      for (const color of sorted) {
        if (selected.length >= count) break;
        if (selected.some(s => s.r === color.r && s.g === color.g && s.b === color.b)) continue;
        const tooClose = selected.some(sel => {
          const dr = sel.r - color.r, dg = sel.g - color.g, db = sel.b - color.b;
          return Math.sqrt(dr * dr + dg * dg + db * db) < 15;
        });
        if (!tooClose) selected.push({ ...color });
      }
    }

    /* Sort by hue for nice display */
    selected.sort((a, b) => {
      const hA = rgbToHSL(a.r, a.g, a.b).h;
      const hB = rgbToHSL(b.r, b.g, b.b).h;
      return hA - hB;
    });

    return selected.map(c => rgbToHex(c.r, c.g, c.b));
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

        <div class="icp-layout">
          <!-- LEFT: Image Area -->
          <div class="icp-left">
            <div class="icp-image-area" id="icp-image-area">

              <!-- Drop zone -->
              <div class="icp-dropzone" id="icp-dropzone">
                <div class="icp-dropzone__icon">
                  <i class="fa-solid fa-cloud-arrow-up"></i>
                </div>
                <p class="icp-dropzone__text">Arrastrá una imagen aquí</p>
                <span class="icp-dropzone__sub">o hacé click para seleccionar</span>
                <span class="icp-dropzone__hint"><i class="fa-regular fa-clipboard"></i> Ctrl+V para pegar</span>
              </div>

              <!-- Image wrapper (hidden until image loads) -->
              <div class="icp-image-wrap" id="icp-image-wrap" style="display:none;">
                <img id="icp-image" crossorigin="anonymous" alt="Color picker image">

                <!-- Zoom lens -->
                <div class="icp-lens" id="icp-lens">
                  <canvas id="icp-lens-canvas"></canvas>
                </div>

                <!-- Color comparison squares (top-right) -->
                <div class="icp-squares" id="icp-squares" style="display:none;">
                  <div class="icp-sq icp-sq--picked" id="icp-sq-picked" data-tooltip="Seleccionado"></div>
                  <div class="icp-sq icp-sq--hover" id="icp-sq-hover" data-tooltip="Hover"></div>
                </div>

                <!-- Clear button -->
                <button class="icp-clear-img" id="icp-clear-img" data-tooltip="Limpiar">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            <!-- Extracted palette -->
            <div class="icp-palette-section" id="icp-palette-section" style="display:none;">
              <div class="icp-palette-header">
                <label class="icp-palette-label">Paleta extraída</label>
                <div class="icp-palette-controls">
                  <button class="icp-palette-btn" id="icp-palette-dec" ${paletteCount <= MIN_PALETTE ? 'disabled' : ''}>
                    <i class="fa-solid fa-minus"></i>
                  </button>
                  <span class="icp-palette-count" id="icp-palette-count">${paletteCount}</span>
                  <button class="icp-palette-btn" id="icp-palette-inc" ${paletteCount >= MAX_PALETTE ? 'disabled' : ''}>
                    <i class="fa-solid fa-plus"></i>
                  </button>
                </div>
              </div>
              <div class="icp-palette" id="icp-palette"></div>
              <button class="btn btn--secondary" id="icp-copy-palette" style="margin-top:10px; width:100%;">
                <i class="fa-regular fa-copy"></i> Copiar paleta
              </button>
            </div>
          </div>

          <!-- RIGHT: Info Panel -->
          <div class="icp-right">

            <!-- Color info -->
            <div class="icp-info" id="icp-info">
              <div class="icp-info-placeholder" id="icp-info-placeholder">
                <i class="fa-solid fa-eye-dropper"></i>
                <p>Subí una imagen y hacé click para seleccionar un color</p>
              </div>
              <div id="icp-info-content" style="display:none;">
                <div class="icp-info-swatch" id="icp-info-swatch"></div>
                <div class="icp-info-rows">
                  <div class="icp-info-row">
                    <span class="icp-info-label">HEX</span>
                    <code class="icp-info-value" id="icp-hex"></code>
                    <button class="icp-info-copy" data-copy="hex"><i class="fa-regular fa-copy"></i></button>
                  </div>
                  <div class="icp-info-row">
                    <span class="icp-info-label">RGB</span>
                    <code class="icp-info-value" id="icp-rgb"></code>
                    <button class="icp-info-copy" data-copy="rgb"><i class="fa-regular fa-copy"></i></button>
                  </div>
                  <div class="icp-info-row">
                    <span class="icp-info-label">HSL</span>
                    <code class="icp-info-value" id="icp-hsl"></code>
                    <button class="icp-info-copy" data-copy="hsl"><i class="fa-regular fa-copy"></i></button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Tools -->
            <div class="icp-tools">
              <button class="btn btn--secondary icp-tool-btn" id="icp-eyedropper" style="width:100%;">
                <i class="fa-solid fa-eye-dropper"></i> Pick from screen
              </button>
              <div class="icp-url-row">
                <input type="text" class="input" id="icp-url" placeholder="https://... imagen.png" spellcheck="false">
                <button class="btn btn--secondary" id="icp-url-load"><i class="fa-solid fa-arrow-right"></i></button>
              </div>
              <div class="icp-paste-hint">
                <i class="fa-regular fa-clipboard"></i> Ctrl+V para pegar imagen
              </div>
            </div>

            <!-- History -->
            <div class="icp-history-section" id="icp-history-section" style="display:none;">
              <label class="icp-history-label">Historial</label>
              <div class="icp-history" id="icp-history"></div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const imageArea = document.getElementById('icp-image-area');
  const dropzone = document.getElementById('icp-dropzone');
  const imageWrap = document.getElementById('icp-image-wrap');
  const img = document.getElementById('icp-image');
  const lens = document.getElementById('icp-lens');
  const lensCanvas = document.getElementById('icp-lens-canvas');
  const lensCtx = lensCanvas.getContext('2d');
  const sqPicked = document.getElementById('icp-sq-picked');
  const sqHover = document.getElementById('icp-sq-hover');
  const squaresWrap = document.getElementById('icp-squares');
  const clearImgBtn = document.getElementById('icp-clear-img');
  const paletteSection = document.getElementById('icp-palette-section');
  const paletteWrap = document.getElementById('icp-palette');
  const paletteDecBtn = document.getElementById('icp-palette-dec');
  const paletteIncBtn = document.getElementById('icp-palette-inc');
  const paletteCountEl = document.getElementById('icp-palette-count');
  const copyPaletteBtn = document.getElementById('icp-copy-palette');
  const infoPlaceholder = document.getElementById('icp-info-placeholder');
  const infoContent = document.getElementById('icp-info-content');
  const infoSwatch = document.getElementById('icp-info-swatch');
  const hexEl = document.getElementById('icp-hex');
  const rgbEl = document.getElementById('icp-rgb');
  const hslEl = document.getElementById('icp-hsl');
  const eyedropperBtn = document.getElementById('icp-eyedropper');
  const urlInput = document.getElementById('icp-url');
  const urlLoadBtn = document.getElementById('icp-url-load');
  const historySection = document.getElementById('icp-history-section');
  const historyWrap = document.getElementById('icp-history');

  /* ─── HiDPI lens canvas ─── */
  const dpr = window.devicePixelRatio || 1;
  lensCanvas.width = LENS_SIZE * dpr;
  lensCanvas.height = LENS_SIZE * dpr;
  lensCanvas.style.width = LENS_SIZE + 'px';
  lensCanvas.style.height = LENS_SIZE + 'px';
  lensCtx.scale(dpr, dpr);

  /* ─── EyeDropper support ─── */
  /* Always visible — handle unsupported browsers gracefully */
  eyedropperBtn.style.display = '';

  /* ═══════════════════════════════════════════════════════
     IMAGE LOADING
     ═══════════════════════════════════════════════════════ */

  function loadImageSrc(src, crossOrigin) {
    img.onload = () => {
      imgNatW = img.naturalWidth;
      imgNatH = img.naturalHeight;

      /* Draw to offscreen canvas (cap at 2000px for perf) */
      const maxDim = 2000;
      let w = imgNatW, h = imgNatH;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      offCanvas.width = w;
      offCanvas.height = h;
      offCtx.drawImage(img, 0, 0, w, h);

      /* Show image, hide dropzone */
      dropzone.style.display = 'none';
      imageWrap.style.display = '';
      hasImage = true;

      /* Extract palette */
      refreshPalette();

      /* Reset picked/hover */
      pickedColor = null;
      hoverColor = null;
      squaresWrap.style.display = 'none';
      infoPlaceholder.style.display = '';
      infoContent.style.display = 'none';

      saveState();
    };

    img.onerror = () => {
      MiniDevTools.showToast('No se pudo cargar la imagen (posible error CORS)', 'error');
    };

    if (crossOrigin) img.crossOrigin = 'anonymous';
    else img.removeAttribute('crossorigin');
    img.src = src;
  }

  function loadImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      MiniDevTools.showToast('Por favor seleccioná una imagen válida', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => loadImageSrc(e.target.result, false);
    reader.readAsDataURL(file);
  }

  function clearImage() {
    img.src = '';
    offCanvas.width = 0;
    offCanvas.height = 0;
    imageWrap.style.display = 'none';
    dropzone.style.display = '';
    paletteSection.style.display = 'none';
    hasImage = false;
    pickedColor = null;
    hoverColor = null;
    squaresWrap.style.display = 'none';
    infoPlaceholder.style.display = '';
    infoContent.style.display = 'none';
    palette = [];
    saveState();
  }

  /* ═══════════════════════════════════════════════════════
     ZOOM LENS
     ═══════════════════════════════════════════════════════ */

  function drawLens(canvasX, canvasY) {
    lensCtx.clearRect(0, 0, LENS_SIZE, LENS_SIZE);

    const srcSize = LENS_SIZE / LENS_ZOOM;
    const srcX = canvasX - srcSize / 2;
    const srcY = canvasY - srcSize / 2;

    lensCtx.imageSmoothingEnabled = false;
    lensCtx.drawImage(
      offCanvas,
      srcX, srcY, srcSize, srcSize,
      0, 0, LENS_SIZE, LENS_SIZE
    );

    /* Crosshair */
    const half = LENS_SIZE / 2;
    lensCtx.strokeStyle = 'rgba(255,255,255,0.7)';
    lensCtx.lineWidth = 1;
    lensCtx.beginPath();
    lensCtx.moveTo(half, 0);
    lensCtx.lineTo(half, LENS_SIZE);
    lensCtx.moveTo(0, half);
    lensCtx.lineTo(LENS_SIZE, half);
    lensCtx.stroke();

    /* Center dot */
    lensCtx.fillStyle = 'rgba(255,255,255,0.9)';
    lensCtx.beginPath();
    lensCtx.arc(half, half, 2.5, 0, Math.PI * 2);
    lensCtx.fill();

    /* Outer ring shadow for contrast */
    lensCtx.strokeStyle = 'rgba(0,0,0,0.3)';
    lensCtx.lineWidth = 2;
    lensCtx.beginPath();
    lensCtx.arc(half, half, LENS_SIZE / 2 - 2, 0, Math.PI * 2);
    lensCtx.stroke();
  }

  /* ─── Helper: get actual rendered size within object-fit:contain ─── */
  function getRenderedSize() {
    const natW = img.naturalWidth || 1;
    const natH = img.naturalHeight || 1;
    const elW = img.clientWidth;
    const elH = img.clientHeight;
    const imgRatio = natW / natH;
    const elRatio = elW / elH;
    let rW, rH, offX, offY;
    if (imgRatio > elRatio) {
      rW = elW; rH = elW / imgRatio;
      offX = 0; offY = (elH - rH) / 2;
    } else {
      rH = elH; rW = elH * imgRatio;
      offX = (elW - rW) / 2; offY = 0;
    }
    return { renderedW: rW, renderedH: rH, offsetX: offX, offsetY: offY };
  }

  /* ─── Mouse events on image ─── */
  let isOverImage = false;

  img.addEventListener('mouseenter', () => {
    if (!hasImage) return;
    isOverImage = true;
    squaresWrap.style.display = '';
  });

  img.addEventListener('mouseleave', () => {
    isOverImage = false;
    lens.style.display = 'none';
    hoverColor = null;
    if (sqHover.style.background) sqHover.style.background = '';
    img.style.cursor = '';
  });

  img.addEventListener('mousemove', (e) => {
    if (!hasImage) return;

    const rect = img.getBoundingClientRect();
    const { renderedW, renderedH, offsetX: imgOffX, offsetY: imgOffY } = getRenderedSize();

    /* Mouse position relative to the element */
    const elX = e.clientX - rect.left;
    const elY = e.clientY - rect.top;

    /* Position relative to the actual rendered image (inside object-fit:contain) */
    const relX = elX - imgOffX;
    const relY = elY - imgOffY;

    /* If outside the rendered image area, hide lens */
    if (relX < 0 || relX > renderedW || relY < 0 || relY > renderedH) {
      lens.style.display = 'none';
      img.style.cursor = '';
      return;
    }

    /* Map to canvas coordinates */
    const scaleX = offCanvas.width / renderedW;
    const scaleY = offCanvas.height / renderedH;
    const cx = Math.round(relX * scaleX);
    const cy = Math.round(relY * scaleY);

    /* Clamp to valid canvas range */
    const px = Math.max(0, Math.min(offCanvas.width - 1, cx));
    const py = Math.max(0, Math.min(offCanvas.height - 1, cy));

    /* Read pixel */
    const pixel = offCtx.getImageData(px, py, 1, 1).data;
    hoverColor = colorInfoFromPixel(pixel[0], pixel[1], pixel[2]);

    /* Update hover square */
    sqHover.style.background = hoverColor.hex;
    sqHover.style.borderColor = isLight(hoverColor.hex) ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)';

    /* Update lens border to show hover color */
    lens.style.borderColor = hoverColor.hex;

    /* Position lens — follow mouse, prefer above, flip below if near top */
    const gap = 15;
    let lensLeft = elX - LENS_SIZE / 2;
    let lensTop = elY - LENS_SIZE - gap;

    /* Flip below cursor if near top */
    if (lensTop < 0) {
      lensTop = elY + gap;
    }

    /* Allow horizontal overflow — don't clamp tightly */
    if (lensLeft < 0) lensLeft = 4;
    if (lensLeft + LENS_SIZE > rect.width) lensLeft = rect.width - LENS_SIZE - 4;

    lens.style.display = 'block';
    lens.style.left = lensLeft + 'px';
    lens.style.top = lensTop + 'px';

    /* Draw lens canvas */
    drawLens(px, py);

    /* Hide cursor */
    img.style.cursor = 'none';
  });

  /* ─── Click to pick ─── */
  img.addEventListener('click', () => {
    if (!hoverColor) return;
    pickedColor = { ...hoverColor };

    /* Update picked square */
    sqPicked.style.background = pickedColor.hex;
    sqPicked.style.borderColor = isLight(pickedColor.hex) ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)';
    squaresWrap.style.display = '';

    /* Update info panel */
    infoPlaceholder.style.display = 'none';
    infoContent.style.display = '';
    infoSwatch.style.background = pickedColor.hex;
    hexEl.textContent = pickedColor.hex.toUpperCase();
    rgbEl.textContent = `${pickedColor.r}, ${pickedColor.g}, ${pickedColor.b}`;
    hslEl.textContent = `${pickedColor.h}°, ${pickedColor.s}%, ${pickedColor.l}%`;

    /* Add to history */
    addToHistory(pickedColor.hex);

    saveState();
  });

  /* ─── Clear image button ─── */
  clearImgBtn.addEventListener('click', clearImage);

  /* ═══════════════════════════════════════════════════════
     DRAG & DROP
     ═══════════════════════════════════════════════════════ */

  let dragCounter = 0;

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  imageArea.addEventListener('dragenter', (e) => {
    preventDefaults(e);
    dragCounter++;
    imageArea.classList.add('icp-dragover');
  });

  imageArea.addEventListener('dragleave', (e) => {
    preventDefaults(e);
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      imageArea.classList.remove('icp-dragover');
    }
  });

  imageArea.addEventListener('dragover', preventDefaults);

  imageArea.addEventListener('drop', (e) => {
    preventDefaults(e);
    dragCounter = 0;
    imageArea.classList.remove('icp-dragover');
    const file = e.dataTransfer.files[0];
    if (file) loadImageFile(file);
  });

  /* Click on dropzone to open file picker */
  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) loadImageFile(fileInput.files[0]);
    fileInput.value = '';
  });

  /* ═══════════════════════════════════════════════════════
     CLIPBOARD PASTE
     ═══════════════════════════════════════════════════════ */

  document.addEventListener('paste', (e) => {
    if (!container.offsetParent) return; // tool not visible
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

  /* ═══════════════════════════════════════════════════════
     EYEDROPPER API
     ═══════════════════════════════════════════════════════ */

  eyedropperBtn.addEventListener('click', async () => {
    if (!('EyeDropper' in window)) {
      MiniDevTools.showToast('EyeDropper solo disponible en Chrome y Edge', 'error');
      return;
    }
    try {
      const eyeDropper = new EyeDropper();
      const result = await eyeDropper.open();
      const hex = result.sRGBHex;
      if (hex && /^#[0-9a-fA-F]{6}$/.test(hex)) {
        const { r, g, b } = hexToRGB(hex);
        const hsl = rgbToHSL(r, g, b);
        pickedColor = { hex, r, g, b, ...hsl };

        infoPlaceholder.style.display = 'none';
        infoContent.style.display = '';
        infoSwatch.style.background = hex;
        hexEl.textContent = hex.toUpperCase();
        rgbEl.textContent = `${r}, ${g}, ${b}`;
        hslEl.textContent = `${hsl.h}°, ${hsl.s}%, ${hsl.l}%`;

        addToHistory(hex);
        saveState();
      }
    } catch (err) {
      /* User cancelled the eyedropper — do nothing */
    }
  });

  /* ═══════════════════════════════════════════════════════
     IMAGE URL
     ═══════════════════════════════════════════════════════ */

  function loadFromUrl() {
    const url = urlInput.value.trim();
    if (!url) return;
    if (!/^https?:\/\/.+/i.test(url)) {
      MiniDevTools.showToast('Ingresá una URL válida (http:// o https://)', 'error');
      return;
    }
    loadImageSrc(url, true);
  }

  urlLoadBtn.addEventListener('click', loadFromUrl);
  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loadFromUrl();
  });

  /* ═══════════════════════════════════════════════════════
     PALETTE DISPLAY
     ═══════════════════════════════════════════════════════ */

  function refreshPalette() {
    palette = extractPalette(paletteCount);
    paletteSection.style.display = '';
    renderPaletteUI();
    saveState();
  }

  function renderPaletteUI() {
    paletteWrap.innerHTML = palette.map((hex, i) => {
      const light = isLight(hex);
      return `
        <div class="icp-pal-swatch ${light ? 'icp-pal-swatch--light' : ''}" data-i="${i}" style="background:${hex};">
          <span class="icp-pal-hex">${hex.toUpperCase()}</span>
        </div>`;
    }).join('');

    paletteWrap.querySelectorAll('.icp-pal-swatch').forEach(el => {
      el.addEventListener('click', () => {
        const hex = palette[parseInt(el.dataset.i)];
        const { r, g, b } = hexToRGB(hex);
        const hsl = rgbToHSL(r, g, b);
        pickedColor = { hex, r, g, b, ...hsl };

        sqPicked.style.background = hex;
        sqPicked.style.borderColor = isLight(hex) ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)';
        squaresWrap.style.display = '';

        infoPlaceholder.style.display = 'none';
        infoContent.style.display = '';
        infoSwatch.style.background = hex;
        hexEl.textContent = hex.toUpperCase();
        rgbEl.textContent = `${r}, ${g}, ${b}`;
        hslEl.textContent = `${hsl.h}°, ${hsl.s}%, ${hsl.l}%`;

        addToHistory(hex);
        saveState();
      });
    });
  }

  /* Palette +/- */
  paletteDecBtn.addEventListener('click', () => {
    if (paletteCount <= MIN_PALETTE) return;
    paletteCount--;
    paletteCountEl.textContent = paletteCount;
    paletteDecBtn.disabled = paletteCount <= MIN_PALETTE;
    paletteIncBtn.disabled = paletteCount >= MAX_PALETTE;
    refreshPalette();
  });

  paletteIncBtn.addEventListener('click', () => {
    if (paletteCount >= MAX_PALETTE) return;
    paletteCount++;
    paletteCountEl.textContent = paletteCount;
    paletteDecBtn.disabled = paletteCount <= MIN_PALETTE;
    paletteIncBtn.disabled = paletteCount >= MAX_PALETTE;
    refreshPalette();
  });

  /* Copy palette */
  copyPaletteBtn.addEventListener('click', () => {
    const names = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
      'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen'];
    const code = ':root {\n' +
      palette.slice(0, paletteCount).map((c, i) => `  --color-${names[i] || i}: ${c};`).join('\n') +
      '\n}';
    MiniDevTools.copyToClipboard(code, 'Paleta copiada!');
  });

  /* ═══════════════════════════════════════════════════════
     COPY BUTTONS (HEX/RGB/HSL)
     ═══════════════════════════════════════════════════════ */

  container.querySelectorAll('.icp-info-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.copy;
      let text = '';
      if (type === 'hex') text = pickedColor.hex.toUpperCase();
      else if (type === 'rgb') text = `rgb(${pickedColor.r}, ${pickedColor.g}, ${pickedColor.b})`;
      else if (type === 'hsl') text = `hsl(${pickedColor.h}, ${pickedColor.s}%, ${pickedColor.l}%)`;
      MiniDevTools.copyToClipboard(text, 'Color copiado!');
    });
  });

  /* ═══════════════════════════════════════════════════════
     HISTORY
     ═══════════════════════════════════════════════════════ */

  function addToHistory(hex) {
    /* Remove duplicates */
    history = history.filter(c => c !== hex);
    history.unshift(hex);
    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    renderHistory();
    saveState();
  }

  function renderHistory() {
    if (history.length === 0) {
      historySection.style.display = 'none';
      return;
    }
    historySection.style.display = '';
    historyWrap.innerHTML = history.map(hex => `
      <div class="icp-hist-swatch" style="background:${hex};" data-tooltip="${hex.toUpperCase()}" data-tooltip-bottom></div>
    `).join('');

    historyWrap.querySelectorAll('.icp-hist-swatch').forEach(el => {
      el.addEventListener('click', () => {
        const hex = el.style.background;
        const clean = hex.startsWith('rgb') ? rgbToHex(...hex.match(/[\d.]+/g).slice(0, 3).map(Number)) : hex;
        MiniDevTools.copyToClipboard(clean.toUpperCase(), 'Color copiado!');
      });
    });
  }

  /* ═══════════════════════════════════════════════════════
     PERSISTENCE
     ═══════════════════════════════════════════════════════ */

  function saveState() {
    ToolStorage.setField('image-color-picker', 'state', {
      paletteCount,
      history
    });
  }

  /* ═══════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════ */
  renderHistory();
}

/* Registro global */
window['render_image-color-picker'] = render_image_color_picker;

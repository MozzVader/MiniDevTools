/* ═══════════════════════════════════════════════════════════════
   Image Resizer — Redimensionar imágenes con opciones de calidad y formato
   Features:
   - Drag & drop / click / paste para cargar imágenes
   - Redimensionar por dimensiones (ancho x alto)
   - Redimensionar por porcentaje (escala)
   - Lock de aspect ratio (cadena icono)
   - Presets rápidos (50%, 75%, 100%, 150%, 200%)
   - Formato de salida: PNG, JPEG, WebP
   - Calidad ajustable (JPEG/WebP)
   - Preview antes/después con dimensiones
   - Info de tamaño original vs nuevo + peso estimado
   - Descargar imagen redimensionada
   - Persistencia de preferencias con ToolStorage
   ═══════════════════════════════════════════════════════════════ */

window['render_image-resizer'] = function(container, toolMeta) {

  /* ─── Constants ─── */
  const MAX_DIM = 8000;

  const FORMATS = [
    { label: 'PNG', value: 'image/png', ext: 'png' },
    { label: 'JPEG', value: 'image/jpeg', ext: 'jpeg' },
    { label: 'WebP', value: 'image/webp', ext: 'webp' },
  ];

  const PRESETS = [
    { label: '25%', value: 25 },
    { label: '50%', value: 50 },
    { label: '75%', value: 75 },
    { label: '100%', value: 100 },
    { label: '150%', value: 150 },
    { label: '200%', value: 200 },
  ];

  /* ─── State ─── */
  const saved = ToolStorage.load('image-resizer');
  const s = saved ? saved.state : null;

  let outputFormat = s ? (s.outputFormat ?? 'image/png') : 'image/png';
  let quality = s ? (s.quality ?? 90) : 90;
  let lockAspect = s ? (s.lockAspect ?? true) : true;
  let resizeMode = s ? (s.resizeMode ?? 'dimensions') : 'dimensions'; // 'dimensions' | 'percentage'
  let originalFileName = 'image';

  let currentImage = null;
  let imgNatW = 0, imgNatH = 0;
  let hasImage = false;
  let originalFileSize = 0;

  /* ─── Hidden file input ─── */
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  container.appendChild(fileInput);

  /* ═══════════════════════════════════════════════════════
     RENDER UI
     ═══════════════════════════════════════════════════════ */

  const formatBtnsHTML = FORMATS.map(f =>
    `<button class="ir-format-btn ${outputFormat === f.value ? 'active' : ''}" data-format="${f.value}">${f.label}</button>`
  ).join('');

  const presetBtnsHTML = PRESETS.map(p =>
    `<button class="ir-preset-btn" data-pct="${p.value}">${p.label}</button>`
  ).join('');

  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title"><i class="${toolMeta.icon}" style="margin-right:8px;"></i>${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <div class="ir-layout">
          <!-- LEFT: Image Area -->
          <div class="ir-left">
            <div class="ir-image-area" id="ir-image-area">

              <!-- Drop zone -->
              <div class="ir-dropzone" id="ir-dropzone">
                <div class="ir-dropzone__icon">
                  <i class="fa-solid fa-cloud-arrow-up"></i>
                </div>
                <p class="ir-dropzone__text">Arrastrá una imagen aquí</p>
                <span class="ir-dropzone__sub">o hacé click para seleccionar</span>
                <span class="ir-dropzone__hint"><i class="fa-regular fa-clipboard"></i> Ctrl+V para pegar</span>
              </div>

              <!-- Image preview (hidden until loaded) -->
              <div id="ir-preview-wrap" style="display:none;">
                <div class="ir-img-info" id="ir-img-info">
                  <span id="ir-img-name" class="ir-img-info__name"></span>
                  <span class="ir-img-info__dims" id="ir-img-dims"></span>
                  <span class="ir-img-info__size" id="ir-img-size"></span>
                </div>
                <div class="ir-preview-box" id="ir-preview-box">
                  <div class="ir-preview-label">Original</div>
                  <img id="ir-img" alt="Preview">
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT: Controls Panel -->
          <div class="ir-right">

            <!-- Resize Mode -->
            <div class="ir-section">
              <div class="ir-section__title">Modo de redimensión</div>
              <div class="ir-mode-toggle" id="ir-mode-toggle">
                <button class="ir-mode-btn ${resizeMode === 'dimensions' ? 'active' : ''}" data-mode="dimensions">
                  <i class="fa-solid fa-ruler-combined"></i> Dimensiones
                </button>
                <button class="ir-mode-btn ${resizeMode === 'percentage' ? 'active' : ''}" data-mode="percentage">
                  <i class="fa-solid fa-percent"></i> Porcentaje
                </button>
              </div>
            </div>

            <!-- Dimensions -->
            <div class="ir-section" id="ir-dims-section">
              <div class="ir-section__title">Dimensiones</div>
              <div class="ir-dims-row">
                <div class="ir-dim-group">
                  <label for="ir-width">Ancho</label>
                  <input type="number" class="ir-dim-input" id="ir-width" min="1" max="${MAX_DIM}" placeholder="px">
                </div>
                <button class="ir-lock-btn ${lockAspect ? 'active' : ''}" id="ir-lock" title="Bloquear proporción">
                  <i class="fa-solid fa-${lockAspect ? 'link' : 'link-slash'}"></i>
                </button>
                <div class="ir-dim-group">
                  <label for="ir-height">Alto</label>
                  <input type="number" class="ir-dim-input" id="ir-height" min="1" max="${MAX_DIM}" placeholder="px">
                </div>
              </div>
            </div>

            <!-- Percentage -->
            <div class="ir-section" id="ir-pct-section" style="display:none;">
              <div class="ir-section__title">Escala</div>
              <div class="ir-pct-presets" id="ir-pct-presets">
                ${presetBtnsHTML}
              </div>
              <div class="ir-pct-row">
                <input type="range" class="ir-pct-slider" id="ir-pct-slider" min="1" max="400" value="100">
                <span class="ir-pct-val" id="ir-pct-val">100%</span>
              </div>
            </div>

            <!-- Format & Quality -->
            <div class="ir-section">
              <div class="ir-section__title">Formato de salida</div>
              <div class="ir-format-toggle" id="ir-format-toggle">
                ${formatBtnsHTML}
              </div>
              <div class="ir-quality-row" id="ir-quality-row" style="display:${outputFormat === 'image/png' ? 'none' : 'flex'};">
                <label>Calidad</label>
                <input type="range" class="ir-quality-slider" id="ir-quality" min="10" max="100" value="${quality}">
                <span class="ir-quality-val" id="ir-quality-val">${quality}</span>
              </div>
            </div>

            <!-- Output Info -->
            <div class="ir-section ir-output-info" id="ir-output-info" style="display:none;">
              <div class="ir-section__title">Resultado</div>
              <div class="ir-output-grid">
                <div class="ir-output-item">
                  <span class="ir-output-label">Dimensiones</span>
                  <span class="ir-output-value" id="ir-out-dims">—</span>
                </div>
                <div class="ir-output-item">
                  <span class="ir-output-label">Tamaño est.</span>
                  <span class="ir-output-value" id="ir-out-size">—</span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="ir-actions">
              <button class="btn btn--primary" id="ir-download" ${!hasImage ? 'disabled' : ''}>
                <i class="fa-solid fa-download"></i> Descargar
              </button>
              <div class="ir-actions-row">
                <button class="btn btn--secondary btn--sm" id="ir-copy-clipboard" ${!hasImage ? 'disabled' : ''}>
                  <i class="fa-regular fa-clipboard"></i> Copiar
                </button>
                <button class="btn btn--ghost btn--sm" id="ir-change-img">
                  <i class="fa-solid fa-image"></i> Cambiar
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const imageArea = document.getElementById('ir-image-area');
  const dropzone = document.getElementById('ir-dropzone');
  const previewWrap = document.getElementById('ir-preview-wrap');
  const imgEl = document.getElementById('ir-img');
  const imgName = document.getElementById('ir-img-name');
  const imgDims = document.getElementById('ir-img-dims');
  const imgSize = document.getElementById('ir-img-size');
  const widthInput = document.getElementById('ir-width');
  const heightInput = document.getElementById('ir-height');
  const lockBtn = document.getElementById('ir-lock');
  const modeToggle = document.getElementById('ir-mode-toggle');
  const dimsSection = document.getElementById('ir-dims-section');
  const pctSection = document.getElementById('ir-pct-section');
  const pctPresets = document.getElementById('ir-pct-presets');
  const pctSlider = document.getElementById('ir-pct-slider');
  const pctVal = document.getElementById('ir-pct-val');
  const formatToggle = document.getElementById('ir-format-toggle');
  const qualityRow = document.getElementById('ir-quality-row');
  const qualitySlider = document.getElementById('ir-quality');
  const qualityVal = document.getElementById('ir-quality-val');
  const outputInfo = document.getElementById('ir-output-info');
  const outDims = document.getElementById('ir-out-dims');
  const outSize = document.getElementById('ir-out-size');
  const downloadBtn = document.getElementById('ir-download');
  const copyBtn = document.getElementById('ir-copy-clipboard');
  const changeImgBtn = document.getElementById('ir-change-img');

  /* ═══════════════════════════════════════════════════════
     RESIZE MODE TOGGLE
     ═══════════════════════════════════════════════════════ */

  function updateModeUI() {
    modeToggle.querySelectorAll('.ir-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === resizeMode);
    });
    dimsSection.style.display = resizeMode === 'dimensions' ? '' : 'none';
    pctSection.style.display = resizeMode === 'percentage' ? '' : 'none';
    updateOutputInfo();
  }

  modeToggle.querySelectorAll('.ir-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      resizeMode = btn.dataset.mode;
      updateModeUI();
      saveState();
    });
  });

  /* ═══════════════════════════════════════════════════════
     ASPECT RATIO LOCK
     ═══════════════════════════════════════════════════════ */

  lockBtn.addEventListener('click', () => {
    lockAspect = !lockAspect;
    lockBtn.classList.toggle('active', lockAspect);
    lockBtn.querySelector('i').className = `fa-solid fa-${lockAspect ? 'link' : 'link-slash'}`;
    saveState();
  });

  /* ═══════════════════════════════════════════════════════
     DIMENSION INPUTS
     ═══════════════════════════════════════════════════════ */

  let updatingDims = false;

  widthInput.addEventListener('input', () => {
    if (updatingDims || !hasImage) return;
    if (lockAspect && imgNatW > 0) {
      updatingDims = true;
      const w = parseInt(widthInput.value) || 0;
      const h = Math.round((w / imgNatW) * imgNatH);
      heightInput.value = h > 0 ? h : '';
      updatingDims = false;
    }
    updateOutputInfo();
  });

  heightInput.addEventListener('input', () => {
    if (updatingDims || !hasImage) return;
    if (lockAspect && imgNatH > 0) {
      updatingDims = true;
      const h = parseInt(heightInput.value) || 0;
      const w = Math.round((h / imgNatH) * imgNatW);
      widthInput.value = w > 0 ? w : '';
      updatingDims = false;
    }
    updateOutputInfo();
  });

  /* ═══════════════════════════════════════════════════════
     PERCENTAGE SLIDER & PRESETS
     ═══════════════════════════════════════════════════════ */

  function applyPreset(pct) {
    pctSlider.value = pct;
    pctVal.textContent = pct + '%';
    if (hasImage) {
      const w = Math.round(imgNatW * pct / 100);
      const h = Math.round(imgNatH * pct / 100);
      widthInput.value = w;
      heightInput.value = h;
    }
    updateOutputInfo();
  }

  pctSlider.addEventListener('input', () => {
    const pct = parseInt(pctSlider.value);
    pctVal.textContent = pct + '%';
    if (hasImage) {
      const w = Math.round(imgNatW * pct / 100);
      const h = Math.round(imgNatH * pct / 100);
      widthInput.value = w;
      heightInput.value = h;
    }
    updateOutputInfo();
  });

  pctPresets.querySelectorAll('.ir-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      applyPreset(parseInt(btn.dataset.pct));
    });
  });

  /* ═══════════════════════════════════════════════════════
     FORMAT & QUALITY
     ═══════════════════════════════════════════════════════ */

  formatToggle.querySelectorAll('.ir-format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      outputFormat = btn.dataset.format;
      formatToggle.querySelectorAll('.ir-format-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      qualityRow.style.display = outputFormat === 'image/png' ? 'none' : 'flex';
      updateOutputInfo();
      saveState();
    });
  });

  qualitySlider.addEventListener('input', () => {
    quality = parseInt(qualitySlider.value);
    qualityVal.textContent = quality;
    updateOutputInfo();
    saveState();
  });

  /* ═══════════════════════════════════════════════════════
     OUTPUT INFO
     ═══════════════════════════════════════════════════════ */

  function getTargetDims() {
    if (resizeMode === 'percentage') {
      const pct = parseInt(pctSlider.value) || 100;
      return {
        w: Math.max(1, Math.round(imgNatW * pct / 100)),
        h: Math.max(1, Math.round(imgNatH * pct / 100))
      };
    }
    return {
      w: Math.max(1, parseInt(widthInput.value) || imgNatW),
      h: Math.max(1, parseInt(heightInput.value) || imgNatH)
    };
  }

  function estimateFileSize(w, h) {
    /* Rough estimate based on pixels and format/quality */
    const pixels = w * h;
    const q = outputFormat === 'image/png' ? 1 : quality / 100;
    const formatFactor = outputFormat === 'image/png' ? 2.5 : outputFormat === 'image/webp' ? 0.6 : 0.8;
    const bytes = pixels * formatFactor * q * 0.15;
    return Math.max(1024, Math.round(bytes));
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function updateOutputInfo() {
    if (!hasImage) {
      outputInfo.style.display = 'none';
      return;
    }
    outputInfo.style.display = '';
    const dims = getTargetDims();
    outDims.textContent = `${dims.w} × ${dims.h}`;
    const est = estimateFileSize(dims.w, dims.h);
    outSize.textContent = `~${formatBytes(est)}`;

    /* Enable/disable buttons based on valid input */
    const valid = dims.w > 0 && dims.h > 0 && (dims.w !== imgNatW || dims.h !== imgNatH);
    downloadBtn.disabled = !valid;
    copyBtn.disabled = !valid;
    /* Also enable if same dims but different format */
    if (!valid && hasImage) {
      const origType = currentImage.src.startsWith('data:') ? currentImage.src.split(':')[1].split(';')[0] : '';
      if (origType && origType !== outputFormat) {
        downloadBtn.disabled = false;
        copyBtn.disabled = false;
      }
    }
  }

  /* ═══════════════════════════════════════════════════════
     IMAGE LOADING
     ═══════════════════════════════════════════════════════ */

  function loadImageSrc(src, fileName, fileSize) {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      imgNatW = img.naturalWidth;
      imgNatH = img.naturalHeight;
      originalFileSize = fileSize || 0;
      originalFileName = fileName || 'image';

      /* Show preview */
      imgEl.src = src;
      dropzone.style.display = 'none';
      previewWrap.style.display = '';

      /* Info bar */
      imgName.textContent = originalFileName;
      imgDims.textContent = `${imgNatW} × ${imgNatH}`;
      imgSize.textContent = originalFileSize > 0 ? formatBytes(originalFileSize) : '';

      /* Fill dimension inputs with original */
      widthInput.value = imgNatW;
      heightInput.value = imgNatH;

      /* Reset percentage slider */
      pctSlider.value = 100;
      pctVal.textContent = '100%';

      hasImage = true;
      updateOutputInfo();
    };

    img.onerror = () => {
      MiniDevTools.showToast('No se pudo cargar la imagen', 'error');
    };

    img.src = src;
  }

  function loadImageFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      MiniDevTools.showToast('Por favor seleccioná una imagen válida', 'error');
      return;
    }
    const name = file.name.replace(/\.[^.]+$/, '');
    const reader = new FileReader();
    reader.onload = (e) => loadImageSrc(e.target.result, name, file.size);
    reader.readAsDataURL(file);
  }

  function resetToUpload() {
    currentImage = null;
    hasImage = false;
    imgNatW = 0;
    imgNatH = 0;
    originalFileSize = 0;
    imgEl.src = '';
    widthInput.value = '';
    heightInput.value = '';
    previewWrap.style.display = 'none';
    dropzone.style.display = '';
    outputInfo.style.display = 'none';
    downloadBtn.disabled = true;
    copyBtn.disabled = true;
  }

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
    imageArea.classList.add('ir-dragover');
  });

  imageArea.addEventListener('dragleave', (e) => {
    preventDefaults(e);
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      imageArea.classList.remove('ir-dragover');
    }
  });

  imageArea.addEventListener('dragover', preventDefaults);

  imageArea.addEventListener('drop', (e) => {
    preventDefaults(e);
    dragCounter = 0;
    imageArea.classList.remove('ir-dragover');
    const file = e.dataTransfer.files[0];
    if (file) loadImageFile(file);
  });

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) loadImageFile(fileInput.files[0]);
    fileInput.value = '';
  });

  /* ═══════════════════════════════════════════════════════
     CLIPBOARD PASTE
     ═══════════════════════════════════════════════════════ */

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

  /* ═══════════════════════════════════════════════════════
     RESIZE & EXPORT
     ═══════════════════════════════════════════════════════ */

  function resizeImage() {
    if (!hasImage) return null;
    const dims = getTargetDims();
    const w = dims.w;
    const h = dims.h;

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    /* For JPEG, fill white background */
    if (outputFormat === 'image/jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.drawImage(currentImage, 0, 0, w, h);
    return canvas;
  }

  function getFormatInfo() {
    const fmt = FORMATS.find(f => f.value === outputFormat) || FORMATS[0];
    return fmt;
  }

  function getQualityParam() {
    return outputFormat === 'image/png' ? undefined : quality / 100;
  }

  /* Download */
  downloadBtn.addEventListener('click', () => {
    const canvas = resizeImage();
    if (!canvas) return;

    const fmt = getFormatInfo();
    const dims = getTargetDims();

    canvas.toBlob((blob) => {
      if (!blob) {
        MiniDevTools.showToast('Error al generar la imagen', 'error');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${originalFileName}-${dims.w}x${dims.h}.${fmt.ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      MiniDevTools.showToast('Imagen descargada', 'success');
    }, outputFormat, getQualityParam());
  });

  /* Copy to clipboard */
  copyBtn.addEventListener('click', async () => {
    const canvas = resizeImage();
    if (!canvas) return;

    try {
      const blob = await new Promise(resolve => {
        canvas.toBlob(resolve, outputFormat, getQualityParam());
      });
      if (!blob) throw new Error('No blob');

      /* PNG required for clipboard */
      let pngBlob = blob;
      if (outputFormat !== 'image/png') {
        pngBlob = await new Promise(resolve => {
          canvas.toBlob(resolve, 'image/png');
        });
      }

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': pngBlob })
      ]);
      MiniDevTools.showToast('Imagen copiada al portapapeles', 'success');
    } catch (err) {
      MiniDevTools.showToast('No se pudo copiar al portapapeles', 'error');
    }
  });

  /* Change image */
  changeImgBtn.addEventListener('click', () => {
    resetToUpload();
  });

  /* ═══════════════════════════════════════════════════════
     WINDOW RESIZE
     ═══════════════════════════════════════════════════════ */

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      /* Nothing special needed — CSS handles responsive */
    }, 100);
  });

  /* ═══════════════════════════════════════════════════════
     ROUTE CHANGE CLEANUP
     ═══════════════════════════════════════════════════════ */

  function cleanup() {
    currentImage = null;
    hasImage = false;
  }

  const onHashChange = () => {
    if (!container.offsetParent) cleanup();
  };
  window.addEventListener('hashchange', onHashChange);

  /* ═══════════════════════════════════════════════════════
     PERSISTENCE
     ═══════════════════════════════════════════════════════ */

  function saveState() {
    ToolStorage.setField('image-resizer', 'state', {
      outputFormat,
      quality,
      lockAspect,
      resizeMode
    });
  }
}



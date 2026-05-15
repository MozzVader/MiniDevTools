/* ═══════════════════════════════════════════════════════════════
   Image Cropper — Recortar imágenes a proporciones específicas
   Features:
   - Drag & drop / click / paste para cargar imágenes
   - Crop interactivo con 8 handles (4 esquinas + 4 bordes)
   - Overlay oscuro con box-shadow trick
   - Grid de tercios (rule of thirds)
   - Aspect ratio lock (libre, 1:1, 16:9, 9:16, 4:3, 3:2, 3:4, 2:3)
   - Formas de recorte: rectángulo, bordes redondeados, círculo
   - Slider de radio de esquinas redondeadas
   - Vista previa en tiempo real (canvas) con forma aplicada
   - Exportar como PNG o JPEG con calidad ajustable
   - Clipping mask en exportación (transparencia en esquinas/círculo)
   - Seleccionar todo / Resetear / Cambiar imagen
   - Coordenadas en pixels originales de la imagen
   - Persistencia de preferencias con ToolStorage
   ═══════════════════════════════════════════════════════════════ */

function render_image_cropper(container, toolMeta) {

  /* ─── Constants ─── */
  const MIN_CROP = 20; // minimum crop size in image pixels
  const MAX_IMG_DIM = 4000; // cap for offscreen canvas
  const HANDLE_NAMES = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];

  /* Aspect ratio presets: 0 = free */
  const RATIOS = [
    { label: 'Libre', value: 0 },
    { label: '1:1', value: 1 },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
    { label: '4:3', value: 4 / 3 },
    { label: '3:2', value: 3 / 2 },
    { label: '3:4', value: 3 / 4 },
    { label: '2:3', value: 2 / 3 },
  ];

  /* ─── State ─── */
  const saved = ToolStorage.load('image-cropper');
  const s = saved ? saved.state : null;

  let aspectRatio = s ? (s.aspectRatio ?? 0) : 0;
  let format = s ? (s.format ?? 'png') : 'png';
  let jpegQuality = s ? (s.jpegQuality ?? 90) : 90;
  let shape = s ? (s.shape ?? 'rect') : 'rect'; // 'rect' | 'rounded' | 'circle'
  let borderRadius = s ? (s.borderRadius ?? 16) : 16; // 0-50 (%)

  let currentImage = null; // Image element for offscreen rendering
  let imgNatW = 0, imgNatH = 0;
  let hasImage = false;

  /* Crop in image coordinates (original pixels) */
  let crop = null; // { x, y, w, h } or null

  /* Interaction state */
  let interaction = null;
  // interaction = { type: 'create'|'move'|'resize', handle, startImgX, startImgY, startCrop, anchorX, anchorY }

  /* Display scale */
  let displayScale = 1;
  let imgDisplayW = 0, imgDisplayH = 0;

  /* Preview RAF handle */
  let previewRAF = null;

  /* ─── Hidden file input ─── */
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  container.appendChild(fileInput);

  /* ─── Offscreen canvas ─── */
  const offCanvas = document.createElement('canvas');
  const offCtx = offCanvas.getContext('2d');

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

        <div class="ic-layout">
          <!-- LEFT: Image Area -->
          <div class="ic-left">
            <div class="ic-image-area" id="ic-image-area">

              <!-- Drop zone -->
              <div class="ic-dropzone" id="ic-dropzone">
                <div class="ic-dropzone__icon">
                  <i class="fa-solid fa-cloud-arrow-up"></i>
                </div>
                <p class="ic-dropzone__text">Arrastrá una imagen aquí</p>
                <span class="ic-dropzone__sub">o hacé click para seleccionar</span>
                <span class="ic-dropzone__hint"><i class="fa-regular fa-clipboard"></i> Ctrl+V para pegar</span>
              </div>

              <!-- Image container (hidden until loaded) -->
              <div id="ic-wrap" style="display:none;">
                <div class="ic-img-info" id="ic-img-info">
                  <span>Original:</span>
                  <span class="ic-img-info__dims" id="ic-img-dims"></span>
                </div>
                <div class="ic-container" id="ic-container">
                  <img id="ic-img" alt="Crop image">
                  <!-- Crop box overlay -->
                  <div class="ic-box" id="ic-box" style="box-shadow: 0 0 0 9999px rgba(0,0,0,0.55);">
                    <!-- Rule of thirds grid -->
                    <div class="ic-grid">
                      <div class="ic-grid__line ic-grid__line--v1"></div>
                      <div class="ic-grid__line ic-grid__line--v2"></div>
                      <div class="ic-grid__line ic-grid__line--h1"></div>
                      <div class="ic-grid__line ic-grid__line--h2"></div>
                    </div>
                    <!-- Dimension label -->
                    <div class="ic-dims" id="ic-dims-label"></div>
                    <!-- 8 handles -->
                    <div class="ic-handle ic-handle--nw" data-handle="nw"></div>
                    <div class="ic-handle ic-handle--n" data-handle="n"></div>
                    <div class="ic-handle ic-handle--ne" data-handle="ne"></div>
                    <div class="ic-handle ic-handle--w" data-handle="w"></div>
                    <div class="ic-handle ic-handle--e" data-handle="e"></div>
                    <div class="ic-handle ic-handle--sw" data-handle="sw"></div>
                    <div class="ic-handle ic-handle--s" data-handle="s"></div>
                    <div class="ic-handle ic-handle--se" data-handle="se"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT: Controls Panel -->
          <div class="ic-right">

            <!-- Shape -->
            <div class="ic-section">
              <div class="ic-section__title">Forma</div>
              <div class="ic-shapes" id="ic-shapes">
                <button class="ic-shape-chip active" data-shape="rect">
                  <i class="fa-regular fa-square"></i> Rectángulo
                </button>
                <button class="ic-shape-chip" data-shape="rounded">
                  <i class="fa-solid fa-square"></i> Redondeado
                </button>
                <button class="ic-shape-chip" data-shape="circle">
                  <i class="fa-regular fa-circle"></i> Círculo
                </button>
              </div>
              <div class="ic-radius-row" id="ic-radius-row" style="display:none;">
                <label>Radio</label>
                <input type="range" class="ic-radius-slider" id="ic-radius" min="0" max="50" value="${borderRadius}">
                <span class="ic-radius-val" id="ic-radius-val">${borderRadius}%</span>
              </div>
              <div class="ic-shape-note" id="ic-shape-note" style="display:none;">
                <i class="fa-solid fa-info-circle"></i> El círculo fuerza proporción 1:1
              </div>
            </div>

            <!-- Aspect Ratio -->
            <div class="ic-section" id="ic-ratio-section">
              <div class="ic-section__title">Proporción</div>
              <div class="ic-ratios" id="ic-ratios"></div>
            </div>

            <!-- Preview -->
            <div class="ic-section">
              <div class="ic-section__title">Vista previa</div>
              <div class="ic-preview-wrap" id="ic-preview-wrap">
                <span class="ic-preview-empty" id="ic-preview-empty">Sin selección</span>
                <canvas class="ic-preview-canvas" id="ic-preview-canvas" style="display:none;"></canvas>
              </div>
            </div>

            <!-- Export -->
            <div class="ic-section">
              <div class="ic-section__title">Exportar</div>
              <div class="ic-format-toggle" id="ic-format-toggle">
                <button class="ic-format-btn ${format === 'png' ? 'active' : ''}" data-format="png">PNG</button>
                <button class="ic-format-btn ${format === 'jpeg' ? 'active' : ''}" data-format="jpeg">JPEG</button>
              </div>
              <div class="ic-quality-row" id="ic-quality-row" style="display:${format === 'jpeg' ? 'flex' : 'none'};">
                <label>Calidad</label>
                <input type="range" class="ic-quality-slider" id="ic-quality" min="10" max="100" value="${jpegQuality}">
                <span class="ic-quality-val" id="ic-quality-val">${jpegQuality}</span>
              </div>
              <button class="btn btn--primary" id="ic-download" style="margin-top:12px; width:100%;">
                <i class="fa-solid fa-download"></i> Descargar recorte
              </button>
            </div>

            <!-- Actions -->
            <div class="ic-actions">
              <div class="ic-actions-row">
                <button class="btn btn--secondary btn--sm" id="ic-select-all">
                  <i class="fa-solid fa-expand"></i> Seleccionar todo
                </button>
                <button class="btn btn--ghost btn--sm" id="ic-reset-crop">
                  <i class="fa-solid fa-rotate-left"></i> Resetear
                </button>
              </div>
              <button class="btn btn--ghost btn--sm" id="ic-change-img">
                <i class="fa-solid fa-image"></i> Cambiar imagen
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const imageArea = document.getElementById('ic-image-area');
  const dropzone = document.getElementById('ic-dropzone');
  const wrap = document.getElementById('ic-wrap');
  const imgEl = document.getElementById('ic-img');
  const imgInfo = document.getElementById('ic-img-info');
  const imgDimsEl = document.getElementById('ic-img-dims');
  const containerEl = document.getElementById('ic-container');
  const cropBox = document.getElementById('ic-box');
  const dimsLabel = document.getElementById('ic-dims-label');
  const shapesWrap = document.getElementById('ic-shapes');
  const radiusRow = document.getElementById('ic-radius-row');
  const radiusSlider = document.getElementById('ic-radius');
  const radiusVal = document.getElementById('ic-radius-val');
  const shapeNote = document.getElementById('ic-shape-note');
  const ratioSection = document.getElementById('ic-ratio-section');
  const ratiosWrap = document.getElementById('ic-ratios');
  const previewWrap = document.getElementById('ic-preview-wrap');
  const previewEmpty = document.getElementById('ic-preview-empty');
  const previewCanvas = document.getElementById('ic-preview-canvas');
  const previewCtx = previewCanvas.getContext('2d');
  const formatToggle = document.getElementById('ic-format-toggle');
  const qualityRow = document.getElementById('ic-quality-row');
  const qualitySlider = document.getElementById('ic-quality');
  const qualityVal = document.getElementById('ic-quality-val');
  const downloadBtn = document.getElementById('ic-download');
  const selectAllBtn = document.getElementById('ic-select-all');
  const resetBtn = document.getElementById('ic-reset-crop');
  const changeImgBtn = document.getElementById('ic-change-img');

  /* ═══════════════════════════════════════════════════════
     SHAPE UI
     ═══════════════════════════════════════════════════════ */

  function renderShapes() {
    shapesWrap.querySelectorAll('.ic-shape-chip').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.shape === shape);
    });
    radiusRow.style.display = shape === 'rounded' ? 'flex' : 'none';
    shapeNote.style.display = shape === 'circle' ? 'flex' : 'none';

    /* When circle is selected, force 1:1 ratio and dim the ratio section */
    if (shape === 'circle') {
      if (aspectRatio !== 1) {
        aspectRatio = 1;
        renderRatios();
        applyAspectRatioChange();
      }
      ratioSection.style.opacity = '0.5';
      ratioSection.style.pointerEvents = 'none';
    } else {
      ratioSection.style.opacity = '1';
      ratioSection.style.pointerEvents = 'auto';
    }

    updateCropBoxShape();
    schedulePreview();
  }

  shapesWrap.querySelectorAll('.ic-shape-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      shape = btn.dataset.shape;
      renderShapes();
      saveState();
    });
  });

  radiusSlider.addEventListener('input', () => {
    borderRadius = parseInt(radiusSlider.value);
    radiusVal.textContent = borderRadius + '%';
    updateCropBoxShape();
    schedulePreview();
    saveState();
  });

  function updateCropBoxShape() {
    cropBox.style.borderRadius = '';
    if (shape === 'circle') {
      cropBox.style.borderRadius = '50%';
    } else if (shape === 'rounded') {
      cropBox.style.borderRadius = borderRadius + '%';
    }
    /* Also update preview canvas visual shape */
    previewCanvas.style.borderRadius = '';
    if (shape === 'circle') {
      previewCanvas.style.borderRadius = '50%';
    } else if (shape === 'rounded') {
      previewCanvas.style.borderRadius = borderRadius + '%';
    }
  }

  renderShapes();

  /* ═══════════════════════════════════════════════════════
     ASPECT RATIO UI
     ═══════════════════════════════════════════════════════ */

  function renderRatios() {
    ratiosWrap.innerHTML = RATIOS.map(r =>
      `<button class="ic-ratio-chip ${r.value === aspectRatio ? 'active' : ''}" data-ratio="${r.value}">${r.label}</button>`
    ).join('');

    ratiosWrap.querySelectorAll('.ic-ratio-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = parseFloat(btn.dataset.ratio);
        aspectRatio = val;
        renderRatios();
        applyAspectRatioChange();
        saveState();
      });
    });
  }

  function applyAspectRatioChange() {
    /* If crop exists and aspect ratio is locked, resize crop from center */
    if (!crop || aspectRatio <= 0) return;
    const cx = crop.x + crop.w / 2;
    const cy = crop.y + crop.h / 2;
    let newW, newH;
    if (crop.w / crop.h > aspectRatio) {
      newH = crop.h;
      newW = newH * aspectRatio;
    } else {
      newW = crop.w;
      newH = newW / aspectRatio;
    }
    /* Clamp to image bounds */
    if (cx - newW / 2 < 0) newW = cx * 2;
    if (cy - newH / 2 < 0) newH = cy * 2;
    if (cx + newW / 2 > imgNatW) newW = (imgNatW - cx) * 2;
    if (cy + newH / 2 > imgNatH) newH = (imgNatH - cy) * 2;
    /* Re-enforce aspect ratio after clamping */
    if (newW / newH > aspectRatio) {
      newW = newH * aspectRatio;
    } else {
      newH = newW / aspectRatio;
    }
    crop.x = cx - newW / 2;
    crop.y = cy - newH / 2;
    crop.w = newW;
    crop.h = newH;
    crop.x = Math.max(0, crop.x);
    crop.y = Math.max(0, crop.y);
    crop.w = Math.min(crop.w, imgNatW - crop.x);
    crop.h = Math.min(crop.h, imgNatH - crop.y);
    updateCropUI();
    schedulePreview();
  }

  renderRatios();

  /* ═══════════════════════════════════════════════════════
     FORMAT / QUALITY
     ═══════════════════════════════════════════════════════ */

  formatToggle.querySelectorAll('.ic-format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      format = btn.dataset.format;
      formatToggle.querySelectorAll('.ic-format-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      qualityRow.style.display = format === 'jpeg' ? 'flex' : 'none';
      saveState();
    });
  });

  qualitySlider.addEventListener('input', () => {
    jpegQuality = parseInt(qualitySlider.value);
    qualityVal.textContent = jpegQuality;
    saveState();
  });

  /* ═══════════════════════════════════════════════════════
     IMAGE LOADING
     ═══════════════════════════════════════════════════════ */

  function fitImage() {
    const wrapW = containerEl.clientWidth || 600;
    const maxH = 520;
    const natW = currentImage.naturalWidth || 1;
    const natH = currentImage.naturalHeight || 1;
    const imgRatio = natW / natH;
    let elW, elH;
    if (natW / wrapW > natH / maxH) {
      elW = wrapW;
      elH = wrapW / imgRatio;
    } else {
      elH = maxH;
      elW = maxH * imgRatio;
    }
    imgDisplayW = Math.round(elW);
    imgDisplayH = Math.round(elH);
    imgEl.style.width = imgDisplayW + 'px';
    imgEl.style.height = imgDisplayH + 'px';
    displayScale = imgDisplayW / natW;
  }

  function loadImageSrc(src, crossOrigin) {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = 'anonymous';

    img.onload = () => {
      currentImage = img;
      imgNatW = img.naturalWidth;
      imgNatH = img.naturalHeight;

      /* Draw to offscreen canvas (cap for perf) */
      let w = imgNatW, h = imgNatH;
      if (w > MAX_IMG_DIM || h > MAX_IMG_DIM) {
        const s = MAX_IMG_DIM / Math.max(w, h);
        w = Math.round(w * s);
        h = Math.round(h * s);
      }
      offCanvas.width = imgNatW;
      offCanvas.height = imgNatH;
      offCtx.drawImage(img, 0, 0, imgNatW, imgNatH);

      /* Show image UI */
      imgEl.src = src;
      dropzone.style.display = 'none';
      wrap.style.display = '';
      imgDimsEl.textContent = `${imgNatW} × ${imgNatH}`;
      fitImage();

      hasImage = true;
      crop = null;
      updateCropUI();
      clearPreview();
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
    const reader = new FileReader();
    reader.onload = (e) => loadImageSrc(e.target.result, false);
    reader.readAsDataURL(file);
  }

  function resetToUpload() {
    currentImage = null;
    hasImage = false;
    crop = null;
    imgEl.src = '';
    wrap.style.display = 'none';
    dropzone.style.display = '';
    offCanvas.width = 0;
    offCanvas.height = 0;
    clearPreview();
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
    imageArea.classList.add('ic-dragover');
  });

  imageArea.addEventListener('dragleave', (e) => {
    preventDefaults(e);
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      imageArea.classList.remove('ic-dragover');
    }
  });

  imageArea.addEventListener('dragover', preventDefaults);

  imageArea.addEventListener('drop', (e) => {
    preventDefaults(e);
    dragCounter = 0;
    imageArea.classList.remove('ic-dragover');
    const file = e.dataTransfer.files[0];
    if (file) loadImageFile(file);
  });

  /* Click on dropzone */
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
     COORDINATE HELPERS
     ═══════════════════════════════════════════════════════ */

  /* Convert display (screen) coordinates to image (original pixel) coordinates */
  function displayToImage(dx, dy) {
    return {
      x: dx / displayScale,
      y: dy / displayScale
    };
  }

  /* Convert image coordinates to display coordinates */
  function imageToDisplay(ix, iy) {
    return {
      x: ix * displayScale,
      y: iy * displayScale
    };
  }

  /* Get pointer position relative to the displayed image area */
  function getPointerImageCoords(e) {
    const rect = containerEl.getBoundingClientRect();
    const dx = e.clientX - rect.left;
    const dy = e.clientY - rect.top;
    return displayToImage(dx, dy);
  }

  /* ═══════════════════════════════════════════════════════
     CROP UI UPDATE
     ═══════════════════════════════════════════════════════ */

  function updateCropUI() {
    if (!crop || crop.w < MIN_CROP || crop.h < MIN_CROP) {
      cropBox.classList.remove('active');
      crop = null;
      dimsLabel.textContent = '';
      clearPreview();
      return;
    }

    cropBox.classList.add('active');

    const dp = imageToDisplay(crop.x, crop.y);
    const ds = imageToDisplay(crop.w, crop.h);

    cropBox.style.left = dp.x + 'px';
    cropBox.style.top = dp.y + 'px';
    cropBox.style.width = ds.x + 'px';
    cropBox.style.height = ds.y + 'px';

    /* Update dimensions label */
    dimsLabel.textContent = `${Math.round(crop.w)} × ${Math.round(crop.h)}`;
  }

  /* ═══════════════════════════════════════════════════════
     CROP INTERACTION (pointer events)
     ═══════════════════════════════════════════════════════ */

  containerEl.addEventListener('pointerdown', (e) => {
    if (!hasImage) return;

    const target = e.target;
    const handleEl = target.closest('.ic-handle');

    const imgCoords = getPointerImageCoords(e);
    const imgX = imgCoords.x;
    const imgY = imgCoords.y;

    if (handleEl) {
      /* ─── Resize interaction ─── */
      const handle = handleEl.dataset.handle;
      const anchor = getAnchorForHandle(handle);
      interaction = {
        type: 'resize',
        handle: handle,
        startImgX: imgX,
        startImgY: imgY,
        startCrop: { ...crop },
        anchorX: anchor.x,
        anchorY: anchor.y
      };
    } else if (crop && isInsideCrop(imgX, imgY)) {
      /* ─── Move interaction ─── */
      interaction = {
        type: 'move',
        startImgX: imgX,
        startImgY: imgY,
        startCrop: { ...crop }
      };
    } else {
      /* ─── Create new crop ─── */
      interaction = {
        type: 'create',
        startImgX: Math.max(0, Math.min(imgNatW, imgX)),
        startImgY: Math.max(0, Math.min(imgNatH, imgY)),
        startCrop: null
      };
    }

    containerEl.setPointerCapture(e.pointerId);
    e.preventDefault();
  });

  document.addEventListener('pointermove', (e) => {
    if (!interaction) return;

    const imgCoords = getPointerImageCoords(e);
    let imgX = imgCoords.x;
    let imgY = imgCoords.y;

    if (interaction.type === 'create') {
      handleCreateMove(imgX, imgY);
    } else if (interaction.type === 'move') {
      handleMove(imgX, imgY);
    } else if (interaction.type === 'resize') {
      handleResize(imgX, imgY);
    }

    updateCropUI();
    schedulePreview();
  });

  document.addEventListener('pointerup', (e) => {
    if (!interaction) return;

    /* Finalize crop — check minimum size */
    if (crop && (crop.w < MIN_CROP || crop.h < MIN_CROP)) {
      crop = null;
    }

    interaction = null;
    updateCropUI();
    schedulePreview();
  });

  /* ─── Create: drag from start point to current ─── */
  function handleCreateMove(imgX, imgY) {
    const sx = interaction.startImgX;
    const sy = interaction.startImgY;

    let x = Math.min(sx, imgX);
    let y = Math.min(sy, imgY);
    let w = Math.abs(imgX - sx);
    let h = Math.abs(imgY - sy);

    /* Apply aspect ratio */
    if (aspectRatio > 0) {
      const newH = w / aspectRatio;
      /* Determine sign to maintain drag direction */
      const signH = imgY >= sy ? 1 : -1;
      const signW = imgX >= sx ? 1 : -1;
      h = newH * signH;
      if (signH < 0) {
        y = sy + h;
      }
      w = h * aspectRatio * signW;
      if (signW < 0) {
        x = sx + w;
      }
    }

    /* Clamp */
    x = Math.max(0, x);
    y = Math.max(0, y);
    if (x + w > imgNatW) w = imgNatW - x;
    if (y + h > imgNatH) h = imgNatH - y;

    crop = { x, y, w: Math.max(1, w), h: Math.max(1, h) };
  }

  /* ─── Move: shift crop by delta ─── */
  function handleMove(imgX, imgY) {
    const dx = imgX - interaction.startImgX;
    const dy = imgY - interaction.startImgY;
    const sc = interaction.startCrop;

    let x = sc.x + dx;
    let y = sc.y + dy;

    /* Clamp */
    x = Math.max(0, Math.min(x, imgNatW - sc.w));
    y = Math.max(0, Math.min(y, imgNatH - sc.h));

    crop = { x, y, w: sc.w, h: sc.h };
  }

  /* ─── Resize: from handle with anchor ─── */
  function handleResize(imgX, imgY) {
    const handle = interaction.handle;
    const ax = interaction.anchorX;
    const ay = interaction.anchorY;

    let newW, newH, newX, newY;

    /* Calculate new dimensions based on handle direction */
    const hMove = isHorizontalHandle(handle);
    const vMove = isVerticalHandle(handle);
    const corners = isCornerHandle(handle);

    if (aspectRatio > 0) {
      /* With locked aspect ratio, drive from the primary axis */
      if (corners || hMove) {
        /* Drive from width */
        newW = Math.abs(imgX - ax);
        newH = newW / aspectRatio;
        if (isLeftHandle(handle)) {
          newX = ax - newW;
          newY = ay - newH;
        } else {
          newX = ax;
          newY = ay;
        }
      } else {
        /* Drive from height (for n, s edge handles) */
        newH = Math.abs(imgY - ay);
        newW = newH * aspectRatio;
        if (isTopHandle(handle)) {
          newY = ay - newH;
          newX = ax - newW;
        } else {
          newY = ay;
          newX = ax;
        }
      }
    } else {
      /* Free aspect ratio */
      if (isLeftHandle(handle)) {
        newW = ax - imgX;
        newX = imgX;
      } else {
        newW = imgX - ax;
        newX = ax;
      }

      if (isTopHandle(handle)) {
        newH = ay - imgY;
        newY = imgY;
      } else {
        newH = imgY - ay;
        newY = ay;
      }
    }

    /* Prevent negative dimensions (flip) */
    if (newW < 0) { newW = -newW; newX = ax - newW; }
    if (newH < 0) { newH = -newH; newY = ay - newH; }

    /* Clamp to image bounds */
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);

    if (newX + newW > imgNatW) newW = imgNatW - newX;
    if (newY + newH > imgNatH) newH = imgNatH - newY;

    /* If aspect ratio is locked, re-enforce after clamping */
    if (aspectRatio > 0) {
      if (newW / newH > aspectRatio) {
        newW = newH * aspectRatio;
      } else {
        newH = newW / aspectRatio;
      }
      /* Re-clamp position if needed */
      if (isLeftHandle(handle)) newX = ax - newW;
      else newX = ax;
      if (isTopHandle(handle)) newY = ay - newH;
      else newY = ay;
      newX = Math.max(0, newX);
      newY = Math.max(0, newY);
      if (newX + newW > imgNatW) newW = imgNatW - newX;
      if (newY + newH > imgNatH) newH = imgNatH - newY;
      /* Final aspect ratio enforcement */
      if (newW / newH > aspectRatio) {
        newW = newH * aspectRatio;
      } else {
        newH = newW / aspectRatio;
      }
    }

    crop = {
      x: Math.max(0, newX),
      y: Math.max(0, newY),
      w: Math.max(1, newW),
      h: Math.max(1, newH)
    };
  }

  /* ─── Handle helpers ─── */
  function isLeftHandle(h) { return h === 'nw' || h === 'w' || h === 'sw'; }
  function isTopHandle(h) { return h === 'nw' || h === 'n' || h === 'ne'; }
  function isRightHandle(h) { return h === 'ne' || h === 'e' || h === 'se'; }
  function isBottomHandle(h) { return h === 'sw' || h === 's' || h === 'se'; }
  function isCornerHandle(h) { return h === 'nw' || h === 'ne' || h === 'sw' || h === 'se'; }
  function isHorizontalHandle(h) { return h === 'n' || h === 's'; }
  function isVerticalHandle(h) { return h === 'w' || h === 'e'; }

  function getAnchorForHandle(handle) {
    /* Anchor is the opposite corner/edge */
    switch (handle) {
      case 'nw': return { x: crop.x + crop.w, y: crop.y + crop.h };  // anchor at SE
      case 'ne': return { x: crop.x,         y: crop.y + crop.h };  // anchor at SW
      case 'sw': return { x: crop.x + crop.w, y: crop.y };          // anchor at NE
      case 'se': return { x: crop.x,         y: crop.y };            // anchor at NW
      case 'n':  return { x: crop.x + crop.w / 2, y: crop.y + crop.h }; // anchor at S center
      case 's':  return { x: crop.x + crop.w / 2, y: crop.y };          // anchor at N center
      case 'w':  return { x: crop.x + crop.w, y: crop.y + crop.h / 2 }; // anchor at E center
      case 'e':  return { x: crop.x,         y: crop.y + crop.h / 2 };   // anchor at W center
      default:   return { x: crop.x, y: crop.y };
    }
  }

  function isInsideCrop(imgX, imgY) {
    if (!crop) return false;
    return imgX >= crop.x && imgX <= crop.x + crop.w &&
           imgY >= crop.y && imgY <= crop.y + crop.h;
  }

  /* ═══════════════════════════════════════════════════════
     PREVIEW
     ═══════════════════════════════════════════════════════ */

  function schedulePreview() {
    if (previewRAF) cancelAnimationFrame(previewRAF);
    previewRAF = requestAnimationFrame(updatePreview);
  }

  function updatePreview() {
    previewRAF = null;
    if (!crop || !currentImage || crop.w < MIN_CROP || crop.h < MIN_CROP) {
      clearPreview();
      return;
    }

    previewEmpty.style.display = 'none';
    previewCanvas.style.display = '';

    /* Calculate preview size (max ~220px wide) */
    const maxW = 220;
    const maxH = 180;
    const ratio = crop.w / crop.h;
    let pw, ph;
    if (ratio > maxW / maxH) {
      pw = maxW;
      ph = maxW / ratio;
    } else {
      ph = maxH;
      pw = maxH * ratio;
    }

    pw = Math.round(pw);
    ph = Math.round(ph);

    previewCanvas.width = pw;
    previewCanvas.height = ph;
    previewCanvas.style.width = pw + 'px';
    previewCanvas.style.height = ph + 'px';

    previewCtx.clearRect(0, 0, pw, ph);
    previewCtx.save();
    applyClipPath(previewCtx, pw, ph);
    previewCtx.drawImage(
      offCanvas,
      crop.x, crop.y, crop.w, crop.h,
      0, 0, pw, ph
    );
    previewCtx.restore();
  }

  /* ─── Clip path helper (used by preview and export) ─── */
  function applyClipPath(ctx, w, h) {
    if (shape === 'circle') {
      const r = Math.min(w, h) / 2;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, Math.max(1, r), 0, Math.PI * 2);
      ctx.clip();
    } else if (shape === 'rounded' && borderRadius > 0) {
      const r = (borderRadius / 100) * Math.min(w, h) / 2;
      drawRoundedRect(ctx, 0, 0, w, h, Math.max(0, r));
      ctx.clip();
    }
    /* rect shape = no clip */
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function clearPreview() {
    previewEmpty.style.display = '';
    previewCanvas.style.display = 'none';
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  }

  /* ═══════════════════════════════════════════════════════
     ACTION BUTTONS
     ═══════════════════════════════════════════════════════ */

  /* Seleccionar todo */
  selectAllBtn.addEventListener('click', () => {
    if (!hasImage) return;
    let w = imgNatW, h = imgNatH;
    if (aspectRatio > 0) {
      if (w / h > aspectRatio) {
        w = h * aspectRatio;
      } else {
        h = w / aspectRatio;
      }
    }
    crop = {
      x: Math.round((imgNatW - w) / 2),
      y: Math.round((imgNatH - h) / 2),
      w: Math.round(w),
      h: Math.round(h)
    };
    updateCropUI();
    schedulePreview();
  });

  /* Resetear */
  resetBtn.addEventListener('click', () => {
    crop = null;
    updateCropUI();
    clearPreview();
  });

  /* Cambiar imagen */
  changeImgBtn.addEventListener('click', () => {
    resetToUpload();
  });

  /* ═══════════════════════════════════════════════════════
     DOWNLOAD / EXPORT
     ═══════════════════════════════════════════════════════ */

  downloadBtn.addEventListener('click', () => {
    if (!crop || !currentImage || crop.w < MIN_CROP || crop.h < MIN_CROP) {
      MiniDevTools.showToast('Seleccioná un área para recortar', 'error');
      return;
    }

    const w = Math.round(crop.w);
    const h = Math.round(crop.h);

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = w;
    exportCanvas.height = h;
    const ctx = exportCanvas.getContext('2d');

    /* For shapes with transparency, PNG is recommended */
    const needsTransparency = shape !== 'rect';
    const useFormat = (needsTransparency && format === 'jpeg') ? 'png' : format;

    /* For JPEG, fill white background (no transparency) */
    if (useFormat === 'jpeg') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    }

    ctx.save();
    applyClipPath(ctx, w, h);
    ctx.drawImage(offCanvas, crop.x, crop.y, w, h, 0, 0, w, h);
    ctx.restore();

    const mimeType = useFormat === 'jpeg' ? 'image/jpeg' : 'image/png';
    const quality = useFormat === 'jpeg' ? jpegQuality / 100 : undefined;
    const ext = useFormat === 'jpeg' ? 'jpeg' : 'png';

    /* Show toast if format was auto-switched */
    if (needsTransparency && format === 'jpeg') {
      MiniDevTools.showToast('PNG usado automáticamente (las formas necesitan transparencia)', 'info');
    }

    exportCanvas.toBlob((blob) => {
      if (!blob) {
        MiniDevTools.showToast('Error al generar la imagen', 'error');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cropped-${w}x${h}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      MiniDevTools.showToast('Imagen descargada', 'success');
    }, mimeType, quality);
  });

  /* ═══════════════════════════════════════════════════════
     WINDOW RESIZE
     ═══════════════════════════════════════════════════════ */

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!hasImage) return;
      fitImage();
      updateCropUI();
      schedulePreview();
    }, 100);
  });

  /* ═══════════════════════════════════════════════════════
     ROUTE CHANGE CLEANUP
     ═══════════════════════════════════════════════════════ */

  function cleanup() {
    currentImage = null;
    hasImage = false;
    crop = null;
    interaction = null;
    if (previewRAF) cancelAnimationFrame(previewRAF);
    offCanvas.width = 0;
    offCanvas.height = 0;
  }

  /* Listen for route changes (hash-based SPA) */
  const onHashChange = () => {
    if (!container.offsetParent) {
      cleanup();
    }
  };
  window.addEventListener('hashchange', onHashChange);

  /* ═══════════════════════════════════════════════════════
     PERSISTENCE
     ═══════════════════════════════════════════════════════ */

  function saveState() {
    ToolStorage.setField('image-cropper', 'state', {
      aspectRatio,
      format,
      jpegQuality,
      shape,
      borderRadius
    });
  }
}

/* Registro global */
window['render_image-cropper'] = render_image_cropper;

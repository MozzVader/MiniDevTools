/* ═══════════════════════════════════════════════════════════════
   Favicon Generator — Generar favicons en todos los tamaños
   Features:
   - Drag & drop / click / paste para cargar imagen base
   - Preview en tiempo real en todos los tamaños estándar
   - Tamaños: 16, 32, 48, 64, 128, 256 + favicon.ico (multi-size)
   - Opción de bordes redondeados en el preview
   - Generar favicon.ico (contiene 16x16 + 32x32 + 48x48)
   - Descargar individual o paquete ZIP con todos los tamaños
   - Preview con fondo de tablero de ajedrez (transparencia)
   - Info de la imagen original
   - Persistencia de preferencias con ToolStorage
   ═══════════════════════════════════════════════════════════════ */

window['render_favicon-generator'] = function(container, toolMeta) {

  /* ─── Constants ─── */
  const SIZES = [
    { label: '16×16', size: 16, use: 'Tab (favicon clásico)' },
    { label: '32×32', size: 32, use: 'Tab (retina)' },
    { label: '48×48', size: 48, use: 'Windows site icon' },
    { label: '64×64', size: 64, use: 'High-res shortcut' },
    { label: '128×128', size: 128, use: 'Chrome Web Store' },
    { label: '256×256', size: 256, use: 'App icon / PWA' },
  ];

  const ICO_SIZES = [16, 32, 48];

  /* ─── State ─── */
  let currentImage = null;
  let imgNatW = 0, imgNatH = 0;
  let hasImage = false;
  let generated = false;

  /* ─── Hidden file input ─── */
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  container.appendChild(fileInput);

  /* ═══════════════════════════════════════════════════════
     RENDER UI
     ═══════════════════════════════════════════════════════ */

  const sizeCardsHTML = SIZES.map(s => `
    <div class="fg-size-card" data-size="${s.size}">
      <div class="fg-size-card__preview fg-checkerboard" id="fg-preview-${s.size}">
        <span class="fg-size-card__empty">—</span>
      </div>
      <div class="fg-size-card__info">
        <span class="fg-size-card__label">${s.label}</span>
        <span class="fg-size-card__use">${s.use}</span>
      </div>
      <button class="fg-size-card__dl btn btn--ghost btn--sm" data-size="${s.size}" style="display:none;">
        <i class="fa-solid fa-download"></i>
      </button>
    </div>
  `).join('');

  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title"><i class="${toolMeta.icon}" style="margin-right:8px;"></i>${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <!-- TOP: Upload Area (full width) -->
        <div class="fg-image-area" id="fg-image-area">

          <!-- Drop zone -->
          <div class="fg-dropzone" id="fg-dropzone">
            <span class="fg-dropzone__icon">🖼️</span>
            <p>Arrastrá una imagen aquí o hacé clic para seleccionarla</p>
            <span class="fg-dropzone__sub">Se recomienda cuadrada (mín. 256×256) · Ctrl+V para pegar</span>
          </div>

          <!-- Image loaded view -->
          <div id="fg-loaded-wrap" style="display:none;">
            <div class="fg-img-info" id="fg-img-info">
              <span id="fg-img-name" class="fg-img-info__name"></span>
              <span class="fg-img-info__dims" id="fg-img-dims"></span>
            </div>
            <div class="fg-original-preview fg-checkerboard">
              <img id="fg-img" alt="Original">
            </div>
            <button class="btn btn--ghost btn--sm fg-change-btn" id="fg-change-img">
              <i class="fa-solid fa-image"></i> Cambiar imagen
            </button>
          </div>
        </div>

        <!-- Download Bar (full-width) -->
        <div class="fg-download-bar">
          <div class="fg-download-bar__info">
            <span class="fg-download-bar__title">favicon.ico</span>
            <span class="fg-download-bar__detail">16×16 · 32×32 · 48×48</span>
          </div>
          <div class="fg-download-bar__actions">
            <button class="btn btn--primary btn--sm" id="fg-dl-ico" style="display:none;">
              <i class="fa-solid fa-download"></i> .ico
            </button>
            <button class="btn btn--secondary btn--sm" id="fg-dl-all" style="display:none;">
              <i class="fa-solid fa-file-zipper"></i> Descargar todos
            </button>
          </div>
        </div>

        <!-- Size Previews Grid (3×2, full-width) -->
        <div class="fg-sizes-section">
          <div class="fg-sizes-section__header">
            <span class="fg-section__title">PNG por tamaño</span>
          </div>
          <div class="fg-sizes-grid" id="fg-sizes-grid">
            ${sizeCardsHTML}
          </div>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const imageArea = document.getElementById('fg-image-area');
  const dropzone = document.getElementById('fg-dropzone');
  const loadedWrap = document.getElementById('fg-loaded-wrap');
  const imgEl = document.getElementById('fg-img');
  const imgName = document.getElementById('fg-img-name');
  const imgDims = document.getElementById('fg-img-dims');
  const dlIcoBtn = document.getElementById('fg-dl-ico');
  const dlAllBtn = document.getElementById('fg-dl-all');
  const changeImgBtn = document.getElementById('fg-change-img');
  const sizesGrid = document.getElementById('fg-sizes-grid');

  /* ═══════════════════════════════════════════════════════
     IMAGE HELPERS
     ═══════════════════════════════════════════════════════ */

  function renderToSize(size) {
    if (!currentImage) return null;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, size, size);

    /* Center-crop to square */
    const srcSize = Math.min(imgNatW, imgNatH);
    const sx = (imgNatW - srcSize) / 2;
    const sy = (imgNatH - srcSize) / 2;

    ctx.drawImage(currentImage, sx, sy, srcSize, srcSize, 0, 0, size, size);
    return canvas;
  }

  function updatePreviews() {
    if (!hasImage) return;

    SIZES.forEach(({ size }) => {
      const wrap = document.getElementById(`fg-preview-${size}`);
      const dlBtn = wrap.parentElement.querySelector('.fg-size-card__dl');
      const canvas = renderToSize(size);

      /* Clear previous content (except empty span) */
      const empty = wrap.querySelector('.fg-size-card__empty');
      const existingImg = wrap.querySelector('img');
      if (existingImg) existingImg.remove();

      if (canvas) {
        const img = document.createElement('img');
        img.src = canvas.toDataURL('image/png');
        img.alt = `${size}x${size}`;
        /* Uniform display size to prevent stretching */
        img.style.width = '56px';
        img.style.height = '56px';
        img.style.objectFit = 'contain';
        img.style.imageRendering = size <= 32 ? 'pixelated' : 'auto';
        wrap.appendChild(img);
        if (empty) empty.style.display = 'none';
        dlBtn.style.display = '';
      }
    });

    dlIcoBtn.style.display = '';
    dlAllBtn.style.display = '';
    generated = true;
  }

  /* ═══════════════════════════════════════════════════════
     ICO GENERATION (BMP-based favicon.ico)
     ═══════════════════════════════════════════════════════ */

  function generateICO() {
    /* Build a multi-resolution ICO file */
    const images = ICO_SIZES.map(size => {
      const canvas = renderToSize(size);
      return { size, canvas };
    });

    /* Calculate total size */
    const headerSize = 6;
    const dirEntrySize = 16;
    const numImages = images.length;
    const dirSize = dirEntrySize * numImages;

    /* Calculate BMP data size for each image */
    const imageData = images.map(({ size, canvas }) => {
      const ctx = canvas.getContext('2d');
      const pixelData = ctx.getImageData(0, 0, size, size);
      /* BMP row size: padded to 4 bytes */
      const rowSize = Math.ceil((size * 4) / 4) * 4;
      const bmpHeaderSize = 40;
      const maskRowSize = Math.ceil(size / 8 / 4) * 4;
      const maskSize = maskRowSize * size;
      const data = pixelData.data; // RGBA
      return { size, data, rowSize, bmpHeaderSize, maskRowSize, maskSize };
    });

    const totalDataSize = imageData.reduce((sum, img) => {
      return sum + img.bmpHeaderSize + (img.rowSize * img.size) + img.maskSize;
    }, 0);

    const totalSize = headerSize + dirSize + totalDataSize;
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    let offset = 0;

    /* ICO Header */
    view.setUint16(0, 0, true); // Reserved
    view.setUint16(2, 1, true); // Type: 1 = ICO
    view.setUint16(4, numImages, true); // Number of images
    offset = 6;

    /* Calculate data offsets */
    const dataOffsets = [];
    let dataOffset = headerSize + dirSize;
    imageData.forEach(img => {
      dataOffsets.push(dataOffset);
      dataOffset += img.bmpHeaderSize + (img.rowSize * img.size) + img.maskSize;
    });

    /* Directory entries */
    images.forEach(({ size }, i) => {
      const img = imageData[i];
      view.setUint8(offset, size >= 256 ? 0 : size); // Width (0 = 256)
      view.setUint8(offset + 1, size >= 256 ? 0 : size); // Height
      view.setUint8(offset + 2, 0); // Color palette
      view.setUint8(offset + 3, 0); // Reserved
      view.setUint16(offset + 4, 1, true); // Color planes
      view.setUint16(offset + 6, 32, true); // Bits per pixel
      view.setUint32(offset + 8, img.bmpHeaderSize + (img.rowSize * img.size) + img.maskSize, true); // Data size
      view.setUint32(offset + 12, dataOffsets[i], true); // Data offset
      offset += dirEntrySize;
    });

    /* Image data (BMP + pixel data + AND mask) */
    images.forEach(({ size }, i) => {
      const img = imageData[i];
      const { data: rgba, rowSize, bmpHeaderSize, maskRowSize, maskSize } = img;

      /* DIB header (BITMAPINFOHEADER) */
      view.setUint32(offset, bmpHeaderSize, true);
      view.setInt32(offset + 4, size, true); // Width
      view.setInt32(offset + 8, size * 2, true); // Height (doubled for ICO)
      view.setUint16(offset + 12, 1, true); // Planes
      view.setUint16(offset + 14, 32, true); // BPP
      view.setUint32(offset + 16, 0, true); // Compression
      view.setUint32(offset + 20, 0, true); // Image size
      view.setInt32(offset + 24, 0, true); // X ppm
      view.setInt32(offset + 28, 0, true); // Y ppm
      view.setUint32(offset + 32, 0, true); // Colors
      view.setUint32(offset + 36, 0, true); // Important colors
      offset += bmpHeaderSize;

      /* Pixel data (BGRA, bottom-up) */
      for (let y = size - 1; y >= 0; y--) {
        for (let x = 0; x < size; x++) {
          const srcIdx = (y * size + x) * 4;
          const b = rgba[srcIdx];
          const g = rgba[srcIdx + 1];
          const r = rgba[srcIdx + 2];
          const a = rgba[srcIdx + 3];
          view.setUint8(offset, b);
          view.setUint8(offset + 1, g);
          view.setUint8(offset + 2, r);
          view.setUint8(offset + 3, a);
          offset += 4;
        }
        /* Pad to 4-byte boundary */
        const pad = rowSize - (size * 4);
        for (let p = 0; p < pad; p++) {
          view.setUint8(offset, 0);
          offset++;
        }
      }

      /* AND mask (all opaque = all zeros) */
      offset += maskSize;
    });

    return new Blob([buffer], { type: 'image/x-icon' });
  }

  /* ═══════════════════════════════════════════════════════
     IMAGE LOADING
     ═══════════════════════════════════════════════════════ */

  function loadImageSrc(src, fileName) {
    const img = new Image();
    img.onload = () => {
      currentImage = img;
      imgNatW = img.naturalWidth;
      imgNatH = img.naturalHeight;

      imgEl.src = src;
      dropzone.style.display = 'none';
      loadedWrap.style.display = '';

      if (fileName) {
        imgName.textContent = fileName;
      } else {
        imgName.textContent = 'clipboard-image';
      }
      imgDims.textContent = `${imgNatW} × ${imgNatH}`;

      hasImage = true;
      generated = false;
      updatePreviews();
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
    const name = file.name;
    const reader = new FileReader();
    reader.onload = (e) => loadImageSrc(e.target.result, name);
    reader.readAsDataURL(file);
  }

  function resetToUpload() {
    currentImage = null;
    hasImage = false;
    generated = false;
    imgEl.src = '';
    loadedWrap.style.display = 'none';
    dropzone.style.display = '';
    dlIcoBtn.style.display = 'none';
    dlAllBtn.style.display = 'none';

    /* Clear previews */
    SIZES.forEach(({ size }) => {
      const wrap = document.getElementById(`fg-preview-${size}`);
      const dlBtn = wrap.parentElement.querySelector('.fg-size-card__dl');
      const existingImg = wrap.querySelector('img');
      if (existingImg) existingImg.remove();
      const empty = wrap.querySelector('.fg-size-card__empty');
      if (empty) empty.style.display = '';
      dlBtn.style.display = 'none';
    });
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
    imageArea.classList.add('fg-dragover');
  });

  imageArea.addEventListener('dragleave', (e) => {
    preventDefaults(e);
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      imageArea.classList.remove('fg-dragover');
    }
  });

  imageArea.addEventListener('dragover', preventDefaults);

  imageArea.addEventListener('drop', (e) => {
    preventDefaults(e);
    dragCounter = 0;
    imageArea.classList.remove('fg-dragover');
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
        loadImageSrc(URL.createObjectURL(item.getAsFile()), 'clipboard-image');
        return;
      }
    }
  });

  /* ═══════════════════════════════════════════════════════
     DOWNLOAD ACTIONS
     ═══════════════════════════════════════════════════════ */

  /* Download individual PNG */
  sizesGrid.addEventListener('click', (e) => {
    const dlBtn = e.target.closest('.fg-size-card__dl');
    if (!dlBtn || !hasImage) return;
    const size = parseInt(dlBtn.dataset.size);
    const canvas = renderToSize(size);
    if (!canvas) return;

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `favicon-${size}x${size}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      MiniDevTools.showToast(`Favicon ${size}×${size} descargado`, 'success');
    }, 'image/png');
  });

  /* Download ICO */
  dlIcoBtn.addEventListener('click', () => {
    if (!hasImage) return;
    try {
      const icoBlob = generateICO();
      const url = URL.createObjectURL(icoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'favicon.ico';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      MiniDevTools.showToast('favicon.ico descargado', 'success');
    } catch (err) {
      MiniDevTools.showToast('Error al generar el .ico', 'error');
    }
  });

  /* Download all as individual PNGs */
  dlAllBtn.addEventListener('click', async () => {
    if (!hasImage) return;

    for (const { size } of SIZES) {
      const canvas = renderToSize(size);
      if (!canvas) continue;

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `favicon-${size}x${size}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      /* Small delay between downloads to avoid browser blocking */
      await new Promise(r => setTimeout(r, 200));
    }

    /* Also download ICO */
    try {
      const icoBlob = generateICO();
      const url = URL.createObjectURL(icoBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'favicon.ico';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) { /* ignore */ }

    MiniDevTools.showToast('Todos los favicons descargados', 'success');
  });

  /* Change image */
  changeImgBtn.addEventListener('click', () => {
    resetToUpload();
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
};

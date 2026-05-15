/* ═══════════════════════════════════════════════════════════════
   Image to Base64 — Convertir imágenes a base64 para CSS/HTML
   Features:
   - Drag & drop / click / paste para cargar imágenes
   - Preview de la imagen original
   - Info del archivo (nombre, tipo, dimensiones, tamaño original)
   - Output base64 completo con data URI
   - Formatos de output: Data URI, Raw base64, CSS background, HTML <img>
   - Botón copiar al portapapeles
   - Comparación de tamaño: original vs base64
   - Limitar tamaño máximo de imagen para evitar crashes
   - Persistencia de preferencias con ToolStorage
   ═══════════════════════════════════════════════════════════════ */

window['render_image-to-base64'] = function(container, toolMeta) {

  /* ─── Constants ─── */
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
  const MAX_CANVAS_DIM = 4096;

  const OUTPUT_FORMATS = [
    { label: 'Data URI', value: 'datauri', icon: 'fa-solid fa-link' },
    { label: 'Raw Base64', value: 'raw', icon: 'fa-solid fa-barcode' },
    { label: 'CSS', value: 'css', icon: 'fa-brands fa-css3-alt' },
    { label: 'HTML', value: 'html', icon: 'fa-brands fa-html5' },
  ];

  /* ─── State ─── */
  const saved = ToolStorage.load('image-to-base64');
  const s = saved ? saved.state : null;

  let outputFormat = s ? (s.outputFormat ?? 'datauri') : 'datauri';
  let base64String = '';
  let dataURI = '';
  let imageInfo = null;

  /* ─── Hidden file input ─── */
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  container.appendChild(fileInput);

  /* ═══════════════════════════════════════════════════════
     RENDER UI
     ═══════════════════════════════════════════════════════ */

  const formatBtnsHTML = OUTPUT_FORMATS.map(f =>
    `<button class="ib-format-btn ${outputFormat === f.value ? 'active' : ''}" data-format="${f.value}">
      <i class="${f.icon}"></i> ${f.label}
    </button>`
  ).join('');

  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title"><i class="${toolMeta.icon}" style="margin-right:8px;"></i>${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <div class="ib-layout">
          <!-- LEFT: Image Area -->
          <div class="ib-left">
            <div class="ib-image-area" id="ib-image-area">

              <!-- Drop zone -->
              <div class="ib-dropzone" id="ib-dropzone">
                <div class="ib-dropzone__icon">
                  <i class="fa-solid fa-cloud-arrow-up"></i>
                </div>
                <p class="ib-dropzone__text">Arrastrá una imagen aquí</p>
                <span class="ib-dropzone__sub">o hacé click para seleccionar</span>
                <span class="ib-dropzone__hint"><i class="fa-regular fa-clipboard"></i> Ctrl+V para pegar</span>
                <span class="ib-dropzone__hint"><i class="fa-solid fa-info-circle"></i> Máximo 20 MB</span>
              </div>

              <!-- Preview (hidden until loaded) -->
              <div id="ib-preview-wrap" style="display:none;">
                <div class="ib-img-info" id="ib-img-info">
                  <span id="ib-img-name" class="ib-img-info__name"></span>
                  <span class="ib-img-info__dims" id="ib-img-dims"></span>
                  <span class="ib-img-info__size" id="ib-img-size"></span>
                </div>
                <div class="ib-preview-box">
                  <img id="ib-img" alt="Preview">
                </div>
                <!-- Size comparison -->
                <div class="ib-comparison" id="ib-comparison">
                  <div class="ib-comparison__item">
                    <span class="ib-comparison__label">Original</span>
                    <span class="ib-comparison__value" id="ib-orig-size">—</span>
                  </div>
                  <div class="ib-comparison__arrow"><i class="fa-solid fa-arrow-right"></i></div>
                  <div class="ib-comparison__item">
                    <span class="ib-comparison__label">Base64</span>
                    <span class="ib-comparison__value" id="ib-b64-size">—</span>
                  </div>
                  <div class="ib-comparison__item ib-comparison__ratio" id="ib-ratio-wrap">
                    <span class="ib-comparison__label">Ratio</span>
                    <span class="ib-comparison__value" id="ib-ratio">—</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- RIGHT: Output Panel -->
          <div class="ib-right">

            <!-- Output Format -->
            <div class="ib-section">
              <div class="ib-section__title">Formato de salida</div>
              <div class="ib-format-grid" id="ib-format-grid">
                ${formatBtnsHTML}
              </div>
            </div>

            <!-- Output Code -->
            <div class="ib-section">
              <div class="ib-section__header">
                <div class="ib-section__title">Resultado</div>
                <button class="btn btn--ghost btn--sm ib-copy-btn" id="ib-copy" style="display:none;">
                  <i class="fa-regular fa-clipboard"></i> Copiar
                </button>
              </div>
              <div class="ib-output-wrap" id="ib-output-wrap">
                <span class="ib-output-empty" id="ib-output-empty">Cargá una imagen para ver el código</span>
                <pre class="ib-output-code" id="ib-output-code" style="display:none;"></pre>
              </div>
              <div class="ib-chars-info" id="ib-chars-info" style="display:none;">
                <span id="ib-char-count"></span> caracteres
              </div>
            </div>

            <!-- Actions -->
            <div class="ib-actions">
              <button class="btn btn--ghost btn--sm" id="ib-change-img">
                <i class="fa-solid fa-image"></i> Cambiar imagen
              </button>
              <button class="btn btn--ghost btn--sm" id="ib-download-txt" style="display:none;">
                <i class="fa-solid fa-download"></i> Descargar .txt
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const imageArea = document.getElementById('ib-image-area');
  const dropzone = document.getElementById('ib-dropzone');
  const previewWrap = document.getElementById('ib-preview-wrap');
  const imgEl = document.getElementById('ib-img');
  const imgName = document.getElementById('ib-img-name');
  const imgDims = document.getElementById('ib-img-dims');
  const imgSize = document.getElementById('ib-img-size');
  const origSizeEl = document.getElementById('ib-orig-size');
  const b64SizeEl = document.getElementById('ib-b64-size');
  const ratioEl = document.getElementById('ib-ratio');
  const ratioWrap = document.getElementById('ib-ratio-wrap');
  const formatGrid = document.getElementById('ib-format-grid');
  const outputWrap = document.getElementById('ib-output-wrap');
  const outputEmpty = document.getElementById('ib-output-empty');
  const outputCode = document.getElementById('ib-output-code');
  const copyBtn = document.getElementById('ib-copy');
  const charsInfo = document.getElementById('ib-chars-info');
  const charCount = document.getElementById('ib-char-count');
  const changeImgBtn = document.getElementById('ib-change-img');
  const downloadTxtBtn = document.getElementById('ib-download-txt');

  /* ═══════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════ */

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function truncate(str, max) {
    if (str.length <= max) return str;
    return str.substring(0, max) + '...';
  }

  /* ═══════════════════════════════════════════════════════
     OUTPUT FORMATTING
     ═══════════════════════════════════════════════════════ */

  function getOutputString() {
    if (!dataURI) return '';
    switch (outputFormat) {
      case 'datauri':
        return dataURI;
      case 'raw':
        return base64String;
      case 'css':
        return `background-image: url("${dataURI}");`;
      case 'html':
        return `<img src="${dataURI}" alt="image" />`;
      default:
        return dataURI;
    }
  }

  function updateOutput() {
    if (!base64String) return;

    const output = getOutputString();
    outputCode.textContent = output;
    outputCode.style.display = '';
    outputEmpty.style.display = 'none';
    copyBtn.style.display = '';
    downloadTxtBtn.style.display = '';
    charsInfo.style.display = '';

    charCount.textContent = output.length.toLocaleString('es-AR');
  }

  function updateSizeComparison() {
    if (!imageInfo) return;

    origSizeEl.textContent = formatBytes(imageInfo.fileSize);
    const b64Bytes = dataURI.length;
    b64SizeEl.textContent = formatBytes(b64Bytes);

    const ratio = b64Bytes / imageInfo.fileSize;
    const pct = Math.round(ratio * 100);
    ratioEl.textContent = `+${pct - 100}%`;
    ratioEl.style.color = pct > 100 ? 'var(--color-error, #e74c3c)' : 'var(--color-success, #2ecc71)';
  }

  /* ═══════════════════════════════════════════════════════
     FORMAT TOGGLE
     ═══════════════════════════════════════════════════════ */

  formatGrid.querySelectorAll('.ib-format-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      outputFormat = btn.dataset.format;
      formatGrid.querySelectorAll('.ib-format-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateOutput();
      saveState();
    });
  });

  /* ═══════════════════════════════════════════════════════
     IMAGE LOADING
     ═══════════════════════════════════════════════════════ */

  function processFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      MiniDevTools.showToast('Por favor seleccioná una imagen válida', 'error');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      MiniDevTools.showToast('La imagen es muy grande (máximo 20 MB)', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      dataURI = e.target.result;
      base64String = dataURI.split(',')[1] || '';

      /* Show preview */
      imgEl.src = dataURI;
      dropzone.style.display = 'none';
      previewWrap.style.display = '';

      /* Extract image info */
      const img = new Image();
      img.onload = () => {
        const name = file.name;
        const ext = name.split('.').pop().toUpperCase();
        imgName.textContent = name;
        imgDims.textContent = `${img.naturalWidth} × ${img.naturalHeight} · ${ext}`;
        imgSize.textContent = formatBytes(file.size);

        imageInfo = {
          name: name,
          width: img.naturalWidth,
          height: img.naturalHeight,
          type: file.type,
          fileSize: file.size
        };

        updateSizeComparison();
        updateOutput();
      };
      img.src = dataURI;
    };
    reader.readAsDataURL(file);
  }

  function processClipboardBlob(blob) {
    if (!blob) return;
    /* Create a fake file-like object */
    const fakeFile = new File([blob], 'clipboard-image.png', { type: blob.type });
    processFile(fakeFile);
  }

  function resetToUpload() {
    base64String = '';
    dataURI = '';
    imageInfo = null;
    imgEl.src = '';
    previewWrap.style.display = 'none';
    dropzone.style.display = '';
    outputCode.style.display = 'none';
    outputCode.textContent = '';
    outputEmpty.style.display = '';
    copyBtn.style.display = 'none';
    downloadTxtBtn.style.display = 'none';
    charsInfo.style.display = 'none';
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
    imageArea.classList.add('ib-dragover');
  });

  imageArea.addEventListener('dragleave', (e) => {
    preventDefaults(e);
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      imageArea.classList.remove('ib-dragover');
    }
  });

  imageArea.addEventListener('dragover', preventDefaults);

  imageArea.addEventListener('drop', (e) => {
    preventDefaults(e);
    dragCounter = 0;
    imageArea.classList.remove('ib-dragover');
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  });

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) processFile(fileInput.files[0]);
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
        processClipboardBlob(item.getAsFile());
        return;
      }
    }
  });

  /* ═══════════════════════════════════════════════════════
     ACTION BUTTONS
     ═══════════════════════════════════════════════════════ */

  /* Copy */
  copyBtn.addEventListener('click', () => {
    const text = getOutputString();
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      MiniDevTools.showToast('Copiado al portapapeles', 'success');
    }).catch(() => {
      /* Fallback */
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      MiniDevTools.showToast('Copiado al portapapeles', 'success');
    });
  });

  /* Change image */
  changeImgBtn.addEventListener('click', () => {
    resetToUpload();
  });

  /* Download as .txt */
  downloadTxtBtn.addEventListener('click', () => {
    const text = getOutputString();
    if (!text) return;
    const ext = outputFormat === 'css' ? 'css' : outputFormat === 'html' ? 'html' : 'txt';
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `base64-${imageInfo ? imageInfo.name || 'image' : 'image'}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    MiniDevTools.showToast('Archivo descargado', 'success');
  });

  /* ═══════════════════════════════════════════════════════
     ROUTE CHANGE CLEANUP
     ═══════════════════════════════════════════════════════ */

  function cleanup() {
    base64String = '';
    dataURI = '';
    imageInfo = null;
  }

  const onHashChange = () => {
    if (!container.offsetParent) cleanup();
  };
  window.addEventListener('hashchange', onHashChange);

  /* ═══════════════════════════════════════════════════════
     PERSISTENCE
     ═══════════════════════════════════════════════════════ */

  function saveState() {
    ToolStorage.setField('image-to-base64', 'state', { outputFormat });
  }
};

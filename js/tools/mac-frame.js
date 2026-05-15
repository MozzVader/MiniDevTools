/* ═══════════════════════════════════════════════════════════════
   Tool: Marco macOS
   Agrega un marco estilo ventana macOS a cualquier imagen.
   Soporta drag & drop, título personalizado y descarga PNG.
   ═══════════════════════════════════════════════════════════════ */

function render_mac_frame(container, toolMeta) {
  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title"><i class="${toolMeta.icon}" style="margin-right:8px;"></i>${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <!-- Config panel -->
        <div class="mac-frame__config" id="macConfig">
          <div class="form-group">
            <label class="label" for="macTitleInput">Titulo de la ventana</label>
            <input type="text" id="macTitleInput" class="input" placeholder="ej: Mi Portfolio Web" maxlength="60">
          </div>
          <div class="mac-frame__drop-zone" id="macDropZone">
            <span class="mac-frame__drop-zone-icon">🖼️</span>
            <p>Arrastra tu captura aqui o hace clic para seleccionarla</p>
          </div>
          <input type="file" id="macFileInput" accept="image/*" style="display:none">
        </div>

        <!-- Preview panel -->
        <div class="mac-frame__preview" id="macPreview">
          <div class="mac-frame__window">
            <div class="mac-frame__topbar">
              <div class="mac-frame__traffic-lights">
                <div class="mac-frame__light mac-frame__light--red"></div>
                <div class="mac-frame__light mac-frame__light--yellow"></div>
                <div class="mac-frame__light mac-frame__light--green"></div>
              </div>
              <span class="mac-frame__title" id="macPreviewTitle">Untitled</span>
            </div>
            <div class="mac-frame__body">
              <img id="macPreviewImg" src="" alt="Preview">
            </div>
          </div>
          <div class="mac-frame__actions">
            <button class="btn btn--primary" id="macDownloadBtn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Descargar PNG
            </button>
            <span class="mac-frame__img-info" id="macImgInfo"></span>
            <button class="btn btn--ghost" id="macBackBtn">← Cambiar imagen</button>
          </div>
        </div>

      </div>
    </div>

    <!-- Hidden canvas for export -->
    <canvas id="macCanvas" style="display:none"></canvas>
  `;

  // References
  const config = document.getElementById('macConfig');
  const preview = document.getElementById('macPreview');
  const dropZone = document.getElementById('macDropZone');
  const fileInput = document.getElementById('macFileInput');
  const titleInput = document.getElementById('macTitleInput');
  const previewImg = document.getElementById('macPreviewImg');
  const previewTitle = document.getElementById('macPreviewTitle');
  const downloadBtn = document.getElementById('macDownloadBtn');
  const backBtn = document.getElementById('macBackBtn');
  const canvas = document.getElementById('macCanvas');
  const imgInfo = document.getElementById('macImgInfo');

  let currentImage = null;

  // --- Title input: live update preview ---
  titleInput.addEventListener('input', (e) => {
    previewTitle.textContent = e.target.value || 'Untitled';
  });

  // --- File selection ---
  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) processFile(file);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files[0]) processFile(e.target.files[0]);
  });

  // --- Back button ---
  backBtn.addEventListener('click', resetToConfig);

  // --- Download ---
  downloadBtn.addEventListener('click', () => {
    if (!currentImage) return;

    const ctx = canvas.getContext('2d');
    const topbarH = 38;
    const imgW = currentImage.naturalWidth;
    const imgH = currentImage.naturalHeight;
    const radius = 10;

    canvas.width = imgW;
    canvas.height = imgH + topbarH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Rounded clip
    drawRoundedRect(ctx, 0, 0, canvas.width, canvas.height, radius);
    ctx.clip();

    // Body background
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Topbar
    ctx.fillStyle = '#2c2c2e';
    ctx.fillRect(0, 0, canvas.width, topbarH);

    // Bottom border line of topbar
    ctx.fillStyle = '#393939';
    ctx.fillRect(0, topbarH - 1, canvas.width, 1);

    // Traffic lights
    const lightsY = topbarH / 2;
    const lightsX = 20;
    const lightR = 6;
    const spacing = 18;

    drawCircle(ctx, lightsX, lightsY, lightR, '#ff5f57');
    drawCircle(ctx, lightsX + spacing, lightsY, lightR, '#febc2e');
    drawCircle(ctx, lightsX + spacing * 2, lightsY, lightR, '#28c840');

    // Title text
    const title = titleInput.value || 'Untitled';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, canvas.width / 2, topbarH / 2);

    // Image
    ctx.drawImage(currentImage, 0, topbarH, imgW, imgH);

    ctx.restore();

    // Trigger download
    const link = document.createElement('a');
    link.download = 'mac-frame-' + (title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'capture') + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();

    window.MiniDevTools.showToast('Imagen descargada');
  });

  // --- Cleanup on route change ---
  document.addEventListener('tool-cleanup', () => {
    currentImage = null;
  });

  // --- Helpers ---
  function processFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        currentImage = img;
        previewImg.src = e.target.result;
        previewTitle.textContent = titleInput.value || 'Untitled';

        // Show image info
        const sizeKB = Math.round(file.size / 1024);
        const sizeStr = sizeKB > 1024 ? (sizeKB / 1024).toFixed(1) + ' MB' : sizeKB + ' KB';
        imgInfo.textContent = `${img.naturalWidth} x ${img.naturalHeight} — ${sizeStr}`;

        config.classList.add('hidden');
        preview.classList.add('visible');
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  function resetToConfig() {
    currentImage = null;
    previewImg.src = '';
    fileInput.value = '';
    imgInfo.textContent = '';
    config.classList.remove('hidden');
    preview.classList.remove('visible');
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function drawCircle(ctx, x, y, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

// Registro global para carga clasica (fallback)
// El toolId es 'mac-frame' (con guion), se accede via bracket notation
window['render_mac-frame'] = render_mac_frame;

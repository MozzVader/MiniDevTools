/* ═══════════════════════════════════════════════════════════════
   QR Generator — Generador de QR con logo en el centro
   Features:
   - Text/URL input to generate QR
   - Foreground & background color pickers
   - Error correction level (L/M/Q/H)
   - Size selector
   - Logo/Icon overlay (paste, file, or URL)
   - Download as PNG/SVG
   - Persistence with ToolStorage
   ═══════════════════════════════════════════════════════════════ */

window['render_qr-generator'] = function(container, toolMeta) {

  /* ─── Load QR library from CDN ─── */
  function loadQRLib() {
    return new Promise((resolve, reject) => {
      if (window.qrcode) { resolve(); return; }
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('No se pudo cargar qrcode-generator'));
      document.head.appendChild(s);
    });
  }

  /* ─── State ─── */
  const saved = ToolStorage.load('qr-generator');
  const s = saved ? saved.state : null;

  const state = {
    text: s ? s.text : '',
    ecLevel: s ? s.ecLevel : 'M',
    size: s ? s.size : 300,
    fgColor: s ? s.fgColor : '#000000',
    bgColor: s ? s.bgColor : '#ffffff',
    logoDataUrl: s ? s.logoDataUrl : null,
    logoName: s ? s.logoName : '',
  };

  let logoImage = null;
  let qrGenerated = false;

  /* ─── Render UI ─── */
  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title"><i class="${toolMeta.icon}" style="margin-right:8px;"></i>${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <div class="qr-layout">

          <!-- ═══ Left: Input & Options ═══ -->
          <div class="qr-input-col">

            <div class="qr-input-group">
              <label class="qr-label">Texto o URL</label>
              <textarea class="qr-textarea" id="qr-text" placeholder="https://ejemplo.com">${state.text}</textarea>
            </div>

            <div class="qr-options">
              <div class="qr-option">
                <label>Corrección de error</label>
                <select id="qr-ec">
                  <option value="L"${state.ecLevel === 'L' ? ' selected' : ''}>L (7%)</option>
                  <option value="M"${state.ecLevel === 'M' ? ' selected' : ''}>M (15%)</option>
                  <option value="Q"${state.ecLevel === 'Q' ? ' selected' : ''}>Q (25%)</option>
                  <option value="H"${state.ecLevel === 'H' ? ' selected' : ''}>H (30%)</option>
                </select>
              </div>
              <div class="qr-option">
                <label>Tamaño (px)</label>
                <select id="qr-size">
                  <option value="200"${state.size === 200 ? ' selected' : ''}>200px</option>
                  <option value="300"${state.size === 300 ? ' selected' : ''}>300px</option>
                  <option value="400"${state.size === 400 ? ' selected' : ''}>400px</option>
                  <option value="500"${state.size === 500 ? ' selected' : ''}>500px</option>
                  <option value="600"${state.size === 600 ? ' selected' : ''}>600px</option>
                </select>
              </div>
              <div class="qr-option">
                <label>Color QR</label>
                <div class="qr-color-row">
                  <input type="color" class="qr-color-swatch" id="qr-fg-swatch" value="${state.fgColor}">
                  <input type="text" class="qr-color-hex" id="qr-fg-hex" value="${state.fgColor}" maxlength="7">
                </div>
              </div>
              <div class="qr-option">
                <label>Fondo</label>
                <div class="qr-color-row">
                  <input type="color" class="qr-color-swatch" id="qr-bg-swatch" value="${state.bgColor}">
                  <input type="text" class="qr-color-hex" id="qr-bg-hex" value="${state.bgColor}" maxlength="7">
                </div>
              </div>
            </div>

            <!-- Logo Section -->
            <div class="qr-logo-section">
              <div class="qr-logo-section__title">
                <i class="fa-solid fa-image"></i>
                Logo / Icono (opcional)
              </div>
              <div class="qr-logo-methods">
                <button class="qr-logo-method-btn" id="qr-logo-paste">
                  <i class="fa-solid fa-paste"></i> Pegar (Ctrl+V)
                </button>
                <button class="qr-logo-method-btn" id="qr-logo-file">
                  <i class="fa-solid fa-upload"></i> Archivo
                </button>
                <button class="qr-logo-method-btn" id="qr-logo-url-btn">
                  <i class="fa-solid fa-link"></i> URL
                </button>
              </div>
              <input type="text" class="qr-logo-url-input" id="qr-logo-url" placeholder="https://ejemplo.com/icono.png">
              <div class="qr-logo-preview">
                <img class="qr-logo-thumb${state.logoDataUrl ? ' qr-logo-thumb--visible' : ''}" id="qr-logo-thumb" src="${state.logoDataUrl || ''}" alt="logo">
                <div class="qr-logo-info" id="qr-logo-info" style="${state.logoDataUrl ? '' : 'display:none;'}">
                  <div class="qr-logo-name" id="qr-logo-name">${state.logoName}</div>
                  <button class="qr-logo-remove" id="qr-logo-remove"><i class="fa-solid fa-trash-can"></i> Quitar logo</button>
                </div>
                <div class="qr-logo-hint" id="qr-logo-hint" style="${state.logoDataUrl ? 'display:none;' : ''}">
                  Se recomienda usar corrección de error <b>Q</b> o <b>H</b> cuando se agrega un logo.
                </div>
              </div>
              <input type="file" id="qr-logo-file-input" accept="image/*" style="display:none;">
            </div>

            <button class="qr-generate-btn" id="qr-generate">
              <i class="fa-solid fa-qrcode"></i> Generar QR
            </button>
          </div>

          <!-- ═══ Right: Preview & Download ═══ -->
          <div class="qr-preview-col">
            <div class="qr-canvas-wrap" id="qr-canvas-wrap">
              <div class="qr-placeholder" id="qr-placeholder">
                <i class="fa-solid fa-qrcode"></i>
                <span>Escribí texto y generá tu QR</span>
              </div>
              <canvas id="qr-canvas" style="display:none;"></canvas>
            </div>

            <div class="qr-download-row">
              <button class="qr-download-btn" id="qr-dl-png" disabled>
                <i class="fa-solid fa-download"></i> PNG
              </button>
              <button class="qr-download-btn" id="qr-dl-svg" disabled>
                <i class="fa-solid fa-download"></i> SVG
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Paste overlay -->
    <div class="qr-paste-overlay" id="qr-paste-overlay">
      <div class="qr-paste-box">
        <i class="fa-solid fa-paste"></i>
        <span>Pegá la imagen con Ctrl+V</span>
      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const textArea = document.getElementById('qr-text');
  const ecSelect = document.getElementById('qr-ec');
  const sizeSelect = document.getElementById('qr-size');
  const fgSwatch = document.getElementById('qr-fg-swatch');
  const fgHex = document.getElementById('qr-fg-hex');
  const bgSwatch = document.getElementById('qr-bg-swatch');
  const bgHex = document.getElementById('qr-bg-hex');
  const canvas = document.getElementById('qr-canvas');
  const ctx = canvas.getContext('2d');
  const canvasWrap = document.getElementById('qr-canvas-wrap');
  const placeholder = document.getElementById('qr-placeholder');
  const dlPng = document.getElementById('qr-dl-png');
  const dlSvg = document.getElementById('qr-dl-svg');
  const logoThumb = document.getElementById('qr-logo-thumb');
  const logoInfo = document.getElementById('qr-logo-info');
  const logoNameEl = document.getElementById('qr-logo-name');
  const logoHint = document.getElementById('qr-logo-hint');
  const logoUrlInput = document.getElementById('qr-logo-url');
  const logoFileInput = document.getElementById('qr-logo-file-input');
  const pasteOverlay = document.getElementById('qr-paste-overlay');

  /* ═══════════════════════════════════════════════════════
     COLOR SYNC
     ═══════════════════════════════════════════════════════ */

  fgSwatch.addEventListener('input', () => { state.fgColor = fgSwatch.value; fgHex.value = fgSwatch.value; });
  fgHex.addEventListener('input', () => {
    if (/^#[0-9a-fA-F]{6}$/.test(fgHex.value)) { state.fgColor = fgHex.value; fgSwatch.value = fgHex.value; }
  });
  bgSwatch.addEventListener('input', () => { state.bgColor = bgSwatch.value; bgHex.value = bgSwatch.value; });
  bgHex.addEventListener('input', () => {
    if (/^#[0-9a-fA-F]{6}$/.test(bgHex.value)) { state.bgColor = bgHex.value; bgSwatch.value = bgHex.value; }
  });

  /* ═══════════════════════════════════════════════════════
     LOGO HANDLING
     ═══════════════════════════════════════════════════════ */

  function setLogo(dataUrl, name) {
    state.logoDataUrl = dataUrl;
    state.logoName = name;
    logoImage = new Image();
    logoImage.onload = () => {
      logoThumb.src = dataUrl;
      logoThumb.classList.add('qr-logo-thumb--visible');
      logoInfo.style.display = '';
      logoNameEl.textContent = name;
      logoHint.style.display = 'none';
      if (qrGenerated) generateQR();
      saveState();
    };
    logoImage.onerror = () => {
      removeLogo();
    };
    logoImage.src = dataUrl;
  }

  function removeLogo() {
    state.logoDataUrl = null;
    state.logoName = '';
    logoImage = null;
    logoThumb.classList.remove('qr-logo-thumb--visible');
    logoThumb.src = '';
    logoInfo.style.display = 'none';
    logoHint.style.display = '';
    logoUrlInput.value = '';
    if (qrGenerated) generateQR();
    saveState();
  }

  document.getElementById('qr-logo-remove').addEventListener('click', removeLogo);

  /* Paste from clipboard */
  document.getElementById('qr-logo-paste').addEventListener('click', () => {
    pasteOverlay.classList.add('qr-paste-overlay--visible');
    setTimeout(() => {
      navigator.clipboard.read().then(items => {
        pasteOverlay.classList.remove('qr-paste-overlay--visible');
        for (const item of items) {
          const imageType = item.types.find(t => t.startsWith('image/'));
          if (imageType) {
            item.getType(imageType).then(blob => {
              const reader = new FileReader();
              reader.onload = () => setLogo(reader.result, 'imagen-pegada.png');
              reader.readAsDataURL(blob);
            });
            return;
          }
        }
        MiniDevTools.showToast('No se encontró imagen en el portapapeles', 'error');
      }).catch(() => {
        pasteOverlay.classList.remove('qr-paste-overlay--visible');
        MiniDevTools.showToast('No se pudo acceder al portapapeles. Usá Ctrl+V directamente.', 'error');
      });
    }, 100);
  });

  /* Global Ctrl+V when paste overlay is showing */
  document.addEventListener('paste', (e) => {
    if (!pasteOverlay.classList.contains('qr-paste-overlay--visible')) return;
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        e.preventDefault();
        pasteOverlay.classList.remove('qr-paste-overlay--visible');
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = () => setLogo(reader.result, 'imagen-pegada.png');
        reader.readAsDataURL(blob);
        return;
      }
    }
  });

  /* Click outside paste overlay to close */
  pasteOverlay.addEventListener('click', (e) => {
    if (e.target === pasteOverlay) pasteOverlay.classList.remove('qr-paste-overlay--visible');
  });

  /* File upload */
  document.getElementById('qr-logo-file').addEventListener('click', () => logoFileInput.click());
  logoFileInput.addEventListener('change', () => {
    const file = logoFileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogo(reader.result, file.name);
    reader.readAsDataURL(file);
    logoFileInput.value = '';
  });

  /* URL */
  document.getElementById('qr-logo-url-btn').addEventListener('click', () => {
    const isVis = logoUrlInput.classList.toggle('qr-logo-url-input--visible');
    if (isVis) logoUrlInput.focus();
  });

  logoUrlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && logoUrlInput.value.trim()) {
      const url = logoUrlInput.value.trim();
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        /* Draw to temp canvas to get dataURL (CORS workaround) */
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = img.naturalWidth;
        tmpCanvas.height = img.naturalHeight;
        const tmpCtx = tmpCanvas.getContext('2d');
        tmpCtx.drawImage(img, 0, 0);
        try {
          const dataUrl = tmpCanvas.toDataURL('image/png');
          const fileName = url.split('/').pop().split('?')[0] || 'icon.png';
          setLogo(dataUrl, fileName);
        } catch (err) {
          /* If CORS blocks toDataURL, load as blob */
          fetch(url)
            .then(r => r.blob())
            .then(blob => {
              const reader = new FileReader();
              reader.onload = () => setLogo(reader.result, url.split('/').pop().split('?')[0] || 'icon.png');
              reader.readAsDataURL(blob);
            })
            .catch(() => {
              MiniDevTools.showToast('No se pudo cargar la imagen desde esa URL', 'error');
            });
        }
      };
      img.onerror = () => {
        MiniDevTools.showToast('No se pudo cargar la imagen desde esa URL', 'error');
      };
      img.src = url;
    }
  });

  /* ═══════════════════════════════════════════════════════
     QR GENERATION
     ═══════════════════════════════════════════════════════ */

  function generateQR() {
    const text = textArea.value.trim();
    if (!text) {
      MiniDevTools.showToast('Escribí texto o una URL para generar el QR', 'error');
      return;
    }

    state.text = text;
    state.ecLevel = ecSelect.value;
    state.size = parseInt(sizeSelect.value);

    try {
      const typeNumber = 0; /* auto-detect */
      const qr = qrcode(typeNumber, state.ecLevel);
      qr.addData(text);
      qr.make();

      const moduleCount = qr.getModuleCount();
      const size = state.size;
      const margin = 4; /* quiet zone modules */
      const totalModules = moduleCount + margin * 2;
      const cellSize = size / totalModules;

      canvas.width = size;
      canvas.height = size;

      /* Background */
      ctx.fillStyle = state.bgColor;
      ctx.fillRect(0, 0, size, size);

      /* QR modules */
      ctx.fillStyle = state.fgColor;
      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (qr.isDark(row, col)) {
            const x = (col + margin) * cellSize;
            const y = (row + margin) * cellSize;
            /* Slightly rounded modules for modern look */
            const r = Math.max(0.5, cellSize * 0.1);
            const s = cellSize - 0.5; /* tiny gap for clarity */
            roundedRect(ctx, x + 0.25, y + 0.25, s, s, r);
          }
        }
      }

      /* Logo overlay */
      if (logoImage && logoImage.complete && logoImage.naturalWidth > 0) {
        const logoMaxSize = Math.floor(size * 0.22);
        const logoPad = Math.floor(logoMaxSize * 0.15);
        const totalLogoSize = logoMaxSize + logoPad * 2;
        const logoX = (size - totalLogoSize) / 2;
        const logoY = (size - totalLogoSize) / 2;

        /* White background with padding */
        ctx.fillStyle = state.bgColor;
        roundedRectFill(ctx, logoX, logoY, totalLogoSize, totalLogoSize, Math.floor(logoMaxSize * 0.15));

        /* Border around logo area */
        ctx.strokeStyle = state.fgColor;
        ctx.lineWidth = Math.max(1, size * 0.005);
        roundedRectStroke(ctx, logoX + 1, logoY + 1, totalLogoSize - 2, totalLogoSize - 2, Math.floor(logoMaxSize * 0.15));

        /* Draw logo centered */
        const ix = logoX + logoPad;
        const iy = logoY + logoPad;
        ctx.drawImage(logoImage, ix, iy, logoMaxSize, logoMaxSize);
      }

      /* Show canvas, hide placeholder */
      canvas.style.display = 'block';
      placeholder.style.display = 'none';
      dlPng.disabled = false;
      dlSvg.disabled = false;
      qrGenerated = true;
      saveState();

    } catch (err) {
      console.error('QR generation error:', err);
      MiniDevTools.showToast('Error al generar el QR. Intentá con menos texto o mayor corrección de error.', 'error');
    }
  }

  /* Rounded rect helper */
  function roundedRect(ctx, x, y, w, h, r) {
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
    ctx.fill();
  }

  function roundedRectFill(ctx, x, y, w, h, r) {
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
    ctx.fill();
  }

  function roundedRectStroke(ctx, x, y, w, h, r) {
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
    ctx.stroke();
  }

  /* ═══════════════════════════════════════════════════════
     DOWNLOAD
     ═══════════════════════════════════════════════════════ */

  dlPng.addEventListener('click', () => {
    if (!qrGenerated) return;
    const link = document.createElement('a');
    link.download = 'qr-code.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    MiniDevTools.showToast('QR descargado como PNG');
  });

  dlSvg.addEventListener('click', () => {
    if (!qrGenerated) return;
    /* Re-generate QR data for SVG */
    const text = state.text;
    const qr = qrcode(0, state.ecLevel);
    qr.addData(text);
    qr.make();
    const moduleCount = qr.getModuleCount();

    const size = state.size;
    const margin = 4;
    const totalModules = moduleCount + margin * 2;
    const cellSize = size / totalModules;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;
    svg += `<rect width="${size}" height="${size}" fill="${state.bgColor}"/>`;

    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) {
          const x = (col + margin) * cellSize;
          const y = (row + margin) * cellSize;
          const s = cellSize - 0.5;
          svg += `<rect x="${x + 0.25}" y="${y + 0.25}" width="${s}" height="${s}" rx="${Math.max(0.5, cellSize * 0.1)}" fill="${state.fgColor}"/>`;
        }
      }
    }

    if (logoImage && logoImage.complete && logoImage.naturalWidth > 0) {
      const logoMaxSize = Math.floor(size * 0.22);
      const logoPad = Math.floor(logoMaxSize * 0.15);
      const totalLogoSize = logoMaxSize + logoPad * 2;
      const logoX = (size - totalLogoSize) / 2;
      const logoY = (size - totalLogoSize) / 2;
      const r = Math.floor(logoMaxSize * 0.15);
      svg += `<rect x="${logoX}" y="${logoY}" width="${totalLogoSize}" height="${totalLogoSize}" rx="${r}" fill="${state.bgColor}"/>`;
      svg += `<rect x="${logoX + 1}" y="${logoY + 1}" width="${totalLogoSize - 2}" height="${totalLogoSize - 2}" rx="${r}" fill="none" stroke="${state.fgColor}" stroke-width="${Math.max(1, size * 0.005)}"/>`;
      /* Embed logo as base64 */
      if (state.logoDataUrl) {
        svg += `<image x="${logoX + logoPad}" y="${logoY + logoPad}" width="${logoMaxSize}" height="${logoMaxSize}" href="${state.logoDataUrl}" preserveAspectRatio="xMidYMid meet"/>`;
      }
    }

    svg += '</svg>';

    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const link = document.createElement('a');
    link.download = 'qr-code.svg';
    link.href = URL.createObjectURL(blob);
    link.click();
    URL.revokeObjectURL(link.href);
    MiniDevTools.showToast('QR descargado como SVG');
  });

  /* ═══════════════════════════════════════════════════════
     EVENTS
     ═══════════════════════════════════════════════════════ */

  document.getElementById('qr-generate').addEventListener('click', generateQR);

  /* Auto-generate on Enter in textarea */
  textArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      generateQR();
    }
  });

  /* Auto-regenerate on option change if already generated */
  [ecSelect, sizeSelect].forEach(el => {
    el.addEventListener('change', () => { if (qrGenerated) generateQR(); });
  });
  [fgSwatch, bgSwatch].forEach(el => {
    el.addEventListener('input', () => { if (qrGenerated) generateQR(); });
  });

  /* ═══════════════════════════════════════════════════════
     PERSISTENCE
     ═══════════════════════════════════════════════════════ */

  function saveState() {
    ToolStorage.setField('qr-generator', 'state', { ...state });
  }

  /* ═══════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════ */

  /* Load QR library, then restore logo if any, and auto-generate if text exists */
  loadQRLib().then(() => {
    /* Restore logo image from saved dataURL */
    if (state.logoDataUrl) {
      logoImage = new Image();
      logoImage.onload = () => {
        /* Logo restored, auto-generate if text exists */
        if (state.text.trim()) generateQR();
      };
      logoImage.onerror = () => {
        /* Saved image might be stale, just clear it */
        state.logoDataUrl = null;
        state.logoName = '';
      };
      logoImage.src = state.logoDataUrl;
    } else if (state.text.trim()) {
      generateQR();
    }
  }).catch(() => {
    MiniDevTools.showToast('Error cargando la librería QR. Recargá la página.', 'error');
  });
};

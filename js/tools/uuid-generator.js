/* ═══════════════════════════════════════════════════════════════
   UUID Generator — Generador de UUIDs v4
   Usa ToolStorage para persistir preferencias y
   MiniDevTools.copyToClipboard como estandar de copiado.
   ═══════════════════════════════════════════════════════════════ */

function render_uuid_generator(container, toolMeta) {

  // Leer estado guardado via ToolStorage
  let uuidCount = ToolStorage.getField('uuid-generator', 'count', 1);
  let uppercase = ToolStorage.getField('uuid-generator', 'uppercase', false);
  let noDashes = ToolStorage.getField('uuid-generator', 'noDashes', false);
  let generatedUUIDs = [];

  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title">${toolMeta.icon} ${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <div class="grid-2" style="align-items: end;">
          <div class="form-group" style="margin-bottom:0; display:flex; flex-direction:column; justify-content:flex-end;">
            <label class="label">Cantidad</label>
            <input type="number" class="input" id="uuid-count" min="1" max="100" value="${uuidCount}">
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:flex-end;">
            <label class="btn btn--secondary" style="cursor:pointer;">
              <input type="checkbox" id="uuid-uppercase" ${uppercase ? 'checked' : ''} style="margin-right:4px;">
              Uppercase
            </label>
            <label class="btn btn--secondary" style="cursor:pointer;">
              <input type="checkbox" id="uuid-no-dashes" ${noDashes ? 'checked' : ''} style="margin-right:4px;">
              Sin guiones
            </label>
          </div>
        </div>

        <div style="margin-top:16px; display:flex; gap:8px;">
          <button class="btn btn--primary" id="uuid-generate">Generar</button>
          <button class="btn btn--secondary" id="uuid-copy-all" disabled>Copiar todo</button>
        </div>

        <div id="uuid-output" style="margin-top:20px;"></div>
      </div>
    </div>
  `;

  // Elements
  const countInput = document.getElementById('uuid-count');
  const uppercaseCheck = document.getElementById('uuid-uppercase');
  const noDashesCheck = document.getElementById('uuid-no-dashes');
  const generateBtn = document.getElementById('uuid-generate');
  const copyAllBtn = document.getElementById('uuid-copy-all');
  const output = document.getElementById('uuid-output');

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function formatUUID(uuid) {
    if (noDashesCheck.checked) uuid = uuid.replace(/-/g, '');
    if (uppercaseCheck.checked) uuid = uuid.toUpperCase();
    return uuid;
  }

  function saveState() {
    ToolStorage.save('uuid-generator', {
      count: parseInt(countInput.value) || 1,
      uppercase: uppercaseCheck.checked,
      noDashes: noDashesCheck.checked
    });
  }

  function render() {
    generatedUUIDs = [];
    const count = Math.min(Math.max(parseInt(countInput.value) || 1, 1), 100);

    for (let i = 0; i < count; i++) {
      generatedUUIDs.push(generateUUID());
    }

    let html = '<div style="display:flex; flex-direction:column; gap:8px;">';

    generatedUUIDs.forEach((uuid, i) => {
      const formatted = formatUUID(uuid);
      const escaped = formatted.replace(/'/g, "\\'");
      html += `
        <div class="code-output" style="padding:10px 40px 10px 14px; font-size:14px; position:relative; word-break:break-all;">
          <span style="color:var(--text-muted); font-size:11px; margin-right:8px;">#${i + 1}</span>${formatted}
          <button class="btn btn--ghost btn--icon btn--sm copy-single-btn" data-uuid="${escaped}" style="position:absolute; top:6px; right:6px;" title="Copiar">📋</button>
        </div>
      `;
    });

    html += '</div>';
    output.innerHTML = html;
    copyAllBtn.disabled = false;

    saveState();
  }

  // Delegacion de eventos para botones de copiar individual
  output.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy-single-btn');
    if (btn) {
      MiniDevTools.copyToClipboard(btn.dataset.uuid);
    }
  });

  generateBtn.addEventListener('click', render);
  countInput.addEventListener('change', saveState);
  uppercaseCheck.addEventListener('change', () => { saveState(); if (generatedUUIDs.length) render(); });
  noDashesCheck.addEventListener('change', () => { saveState(); if (generatedUUIDs.length) render(); });

  copyAllBtn.addEventListener('click', () => {
    const text = generatedUUIDs.map(formatUUID).join('\n');
    MiniDevTools.copyToClipboard(text, generatedUUIDs.length + ' UUIDs copiados!');
  });

  // Auto-generate on load
  render();
}

// Registrar como funcion global (fallback para carga clasica)
// El toolId es 'uuid-generator' (con guion), se accede via bracket notation
window['render_uuid-generator'] = render_uuid_generator;

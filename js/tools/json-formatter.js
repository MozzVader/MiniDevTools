/* ═══════════════════════════════════════════════════════════════
   JSON Formatter — Formatear, validar y visualizar JSON
   ═══════════════════════════════════════════════════════════════ */

function render_json_formatter(container, toolMeta) {

  // Leer estado guardado
  const savedInput = localStorage.getItem('minidevtools-json-input') || '';
  let indentSize = parseInt(localStorage.getItem('minidevtools-json-indent') || '2');

  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title">${toolMeta.icon} ${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <div class="form-group">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label class="label" style="margin-bottom:0;">JSON de entrada</label>
            <div style="display:flex; gap:6px;">
              <button class="btn btn--ghost btn--sm" id="json-sample" title="Cargar ejemplo">Ejemplo</button>
              <button class="btn btn--ghost btn--sm" id="json-clear" title="Limpiar">Limpiar</button>
            </div>
          </div>
          <textarea class="input" id="json-input" rows="8" placeholder='{"key": "value"}' spellcheck="false">${escapeHtml(savedInput)}</textarea>
        </div>

        <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center; margin-bottom:16px;">
          <button class="btn btn--primary" id="json-format">Formatear</button>
          <button class="btn btn--secondary" id="json-minify">Minificar</button>
          <button class="btn btn--secondary" id="json-copy" disabled>Copiar resultado</button>

          <div style="margin-left:auto; display:flex; align-items:center; gap:8px;">
            <label class="label" style="margin-bottom:0;">Indent:</label>
            <select class="input" id="json-indent" style="width:auto; padding:6px 10px;">
              <option value="2" ${indentSize === 2 ? 'selected' : ''}>2 espacios</option>
              <option value="4" ${indentSize === 4 ? 'selected' : ''}>4 espacios</option>
              <option value="tab" ${indentSize === 'tab' ? 'selected' : ''}>Tab</option>
            </select>
          </div>
        </div>

        <div id="json-status" style="margin-bottom:12px; font-size:13px; min-height:20px;"></div>

        <div id="json-output-container">
          <label class="label">Resultado</label>
          <div class="code-output" id="json-output" style="min-height:120px; max-height:500px; overflow-y:auto;"></div>
        </div>
      </div>
    </div>
  `;

  // Elements
  const input = document.getElementById('json-input');
  const output = document.getElementById('json-output');
  const status = document.getElementById('json-status');
  const formatBtn = document.getElementById('json-format');
  const minifyBtn = document.getElementById('json-minify');
  const copyBtn = document.getElementById('json-copy');
  const sampleBtn = document.getElementById('json-sample');
  const clearBtn = document.getElementById('json-clear');
  const indentSelect = document.getElementById('json-indent');

  let lastFormatted = '';

  function getIndent() {
    const val = indentSelect.value;
    return val === 'tab' ? '\t' : parseInt(val);
  }

  function setStatus(message, type) {
    if (!message) {
      status.innerHTML = '';
      return;
    }
    const colors = {
      error: 'var(--color-error, #ef4444)',
      success: 'var(--color-success, #22c55e)',
      info: 'var(--accent)'
    };
    status.innerHTML = `<span style="color:${colors[type] || colors.info}; font-weight:500;">${message}</span>`;
  }

  function formatJSON(minify) {
    const raw = input.value.trim();
    if (!raw) {
      setStatus('Pega un JSON para comenzar', 'info');
      output.textContent = '';
      copyBtn.disabled = true;
      return;
    }

    try {
      const parsed = JSON.parse(raw);

      if (minify) {
        lastFormatted = JSON.stringify(parsed);
      } else {
        lastFormatted = JSON.stringify(parsed, null, getIndent());
      }

      // Syntax highlighting
      output.innerHTML = syntaxHighlight(lastFormatted);
      copyBtn.disabled = false;

      // Stats
      const keys = Object.keys(parsed).length;
      const type = Array.isArray(parsed) ? 'Array' : 'Object';
      const length = Array.isArray(parsed) ? parsed.length : keys;
      setStatus(`${type} válido · ${length} ${Array.isArray(parsed) ? 'elementos' : 'propiedades'}`, 'success');

      // Guardar en localStorage
      localStorage.setItem('minidevtools-json-input', raw);

    } catch (e) {
      output.textContent = '';
      setStatus(`Error: ${e.message}`, 'error');
      copyBtn.disabled = true;
      lastFormatted = '';
    }
  }

  function syntaxHighlight(json) {
    json = escapeHtml(json);
    return json.replace(
      /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            cls = 'json-key';
          } else {
            cls = 'json-string';
          }
        } else if (/true|false/.test(match)) {
          cls = 'json-boolean';
        } else if (/null/.test(match)) {
          cls = 'json-null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
      }
    );
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function loadSample() {
    const sample = {
      "nombre": "MiniDevTools",
      "version": "1.0.0",
      "descripcion": "Compendio de mini-herramientas para developers",
      "herramientas": [
        { "id": "uuid-generator", "nombre": "UUID Generator", "lista": true },
        { "id": "json-formatter", "nombre": "JSON Formatter", "lista": true },
        { "id": "shadow-generator", "nombre": "Shadow Generator", "lista": false }
      ],
      "meta": {
        "autor": "MozzVader",
        "stack": ["HTML", "CSS", "JavaScript"],
        "offline": true
      },
      "config": {
        "tema": "auto",
        "persistencia": "localStorage"
      }
    };
    input.value = JSON.stringify(sample);
    formatJSON(false);
  }

  // Event listeners
  formatBtn.addEventListener('click', () => formatJSON(false));
  minifyBtn.addEventListener('click', () => formatJSON(true));
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(lastFormatted).then(() => {
      MiniDevTools.showToast('JSON copiado al clipboard!');
    });
  });
  sampleBtn.addEventListener('click', loadSample);
  clearBtn.addEventListener('click', () => {
    input.value = '';
    output.textContent = '';
    status.innerHTML = '';
    copyBtn.disabled = true;
    lastFormatted = '';
    localStorage.removeItem('minidevtools-json-input');
  });
  indentSelect.addEventListener('change', () => {
    indentSize = indentSelect.value === 'tab' ? 'tab' : parseInt(indentSelect.value);
    localStorage.setItem('minidevtools-json-indent', String(indentSize));
  });

  // Auto-format si hay contenido guardado
  if (savedInput) {
    formatJSON(false);
  }
}

// Registro global para carga clasica (fallback)
// El toolId es 'json-formatter' (con guion), se accede via bracket notation
window['render_json-formatter'] = render_json_formatter;

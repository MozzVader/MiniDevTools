/* ═══════════════════════════════════════════════════════════════
   Keyboard Event Viewer
   Features:
   - Captura teclas y muestra event.key, event.code, event.keyCode
   - Detecta teclas modificadoras (Ctrl, Shift, Alt, Meta)
   - Muestra location, repeat, type (keydown/keyup)
   - Historial de teclas presionadas
   - Visual de tecla grande presionada
   - Copiar propiedades del evento
   - Limpieza de historial
   ═══════════════════════════════════════════════════════════════ */

window['render_keyboard-viewer'] = function(container, toolMeta) {

  /* ─── State ─── */
  const state = {
    history: [],
    maxHistory: 10,
    listening: false,
    showKeyCode: true,
  };

  /* ─── Key name mapping ─── */
  const codeToName = {
    'Space': 'Espacio',
    'Enter': 'Enter',
    'Backspace': 'Backspace',
    'Tab': 'Tab',
    'Escape': 'Escape',
    'ArrowUp': '↑ Arriba',
    'ArrowDown': '↓ Abajo',
    'ArrowLeft': '← Izquierda',
    'ArrowRight': '→ Derecha',
    'Delete': 'Delete',
    'Insert': 'Insert',
    'Home': 'Home',
    'End': 'End',
    'PageUp': 'Page Up',
    'PageDown': 'Page Down',
    'CapsLock': 'Caps Lock',
    'NumLock': 'Num Lock',
    'ScrollLock': 'Scroll Lock',
    'Pause': 'Pause',
    'PrintScreen': 'Print Screen',
    'ContextMenu': 'Menu Contextual',
    'ShiftLeft': 'Shift (izq)',
    'ShiftRight': 'Shift (der)',
    'ControlLeft': 'Ctrl (izq)',
    'ControlRight': 'Ctrl (der)',
    'AltLeft': 'Alt (izq)',
    'AltRight': 'AltGr (der)',
    'MetaLeft': 'Meta/Cmd (izq)',
    'MetaRight': 'Meta/Cmd (der)',
  };

  function getFriendlyName(code) {
    return codeToName[code] || null;
  }

  /* ─── Key code descriptions ─── */
  const locationNames = {
    0: 'Standard',
    1: 'Left',
    2: 'Right',
    3: 'Numpad',
  };

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

        <div class="kv-layout">

          <!-- ═══ Click to focus area ═══ -->
          <div class="kv-focus-area" id="kv-focus">
            <div class="kv-focus-overlay" id="kv-focus-overlay">
              <i class="fa-solid fa-keyboard"></i>
              <p>Hacé click acá para empezar a capturar teclas</p>
            </div>

            <!-- ═══ Big Key Display ═══ -->
            <div class="kv-big-key" id="kv-big-key" style="display:none;">
              <div class="kv-big-key__visual" id="kv-big-key-visual"></div>
              <div class="kv-big-key__friendly" id="kv-big-key-friendly"></div>
            </div>

            <!-- ═══ Event Properties ═══ -->
            <div class="kv-props" id="kv-props" style="display:none;">
              <div class="kv-props-grid" id="kv-props-grid"></div>
            </div>

            <!-- ═══ Modifiers ═══ -->
            <div class="kv-modifiers" id="kv-modifiers">
              <span class="kv-mod" id="kv-mod-ctrl">Ctrl</span>
              <span class="kv-mod" id="kv-mod-shift">Shift</span>
              <span class="kv-mod" id="kv-mod-alt">Alt</span>
              <span class="kv-mod" id="kv-mod-meta">Meta</span>
            </div>
          </div>

          <!-- ═══ Toolbar ═══ -->
          <div class="kv-toolbar">
            <button class="btn btn--ghost btn--sm" id="kv-clear">
              <i class="fa-solid fa-eraser"></i> Limpiar historial
            </button>
            <button class="btn btn--ghost btn--sm" id="kv-copy-event" disabled>
              <i class="fa-regular fa-copy"></i> Copiar evento
            </button>
            <div class="kv-toolbar-right">
              <label class="kv-checkbox">
                <input type="checkbox" id="kv-show-keycode" ${state.showKeyCode ? 'checked' : ''}>
                Mostrar keyCode (deprecated)
              </label>
            </div>
          </div>

          <!-- ═══ History ═══ -->
          <div class="kv-history-section">
            <label class="label">Historial</label>
            <div class="kv-history jf-scroll" id="kv-history">
              <div class="kv-history-empty" id="kv-history-empty">
                Presioná teclas para ver el historial
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const focusArea = document.getElementById('kv-focus');
  const focusOverlay = document.getElementById('kv-focus-overlay');
  const bigKeyWrap = document.getElementById('kv-big-key');
  const bigKeyVisual = document.getElementById('kv-big-key-visual');
  const bigKeyFriendly = document.getElementById('kv-big-key-friendly');
  const propsWrap = document.getElementById('kv-props');
  const propsGrid = document.getElementById('kv-props-grid');
  const modCtrl = document.getElementById('kv-mod-ctrl');
  const modShift = document.getElementById('kv-mod-shift');
  const modAlt = document.getElementById('kv-mod-alt');
  const modMeta = document.getElementById('kv-mod-meta');
  const clearBtn = document.getElementById('kv-clear');
  const copyEventBtn = document.getElementById('kv-copy-event');
  const showKeycodeCb = document.getElementById('kv-show-keycode');
  const historyEl = document.getElementById('kv-history');
  const historyEmpty = document.getElementById('kv-history-empty');

  let lastEventData = null;

  /* ═══════════════════════════════════════════════════════
     KEYBOARD CAPTURE
     ═══════════════════════════════════════════════════════ */

  function handleKeyEvent(e) {
    if (!state.listening) return;

    /* Only react to keydown (ignore keyup/keypress for main display) */
    if (e.type === 'keyup') return;

    e.preventDefault();

    const data = {
      key: e.key,
      code: e.code,
      keyCode: e.keyCode,
      which: e.which,
      location: e.location,
      locationName: locationNames[e.location] || 'Desconocido',
      repeat: e.repeat,
      type: e.type,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      metaKey: e.metaKey,
      isComposing: e.isComposing,
    };

    lastEventData = data;
    copyEventBtn.disabled = false;

    updateBigKey(data);
    updateProps(data);
    updateModifiers(data);
    addHistory(data);
  }

  /* ═══════════════════════════════════════════════════════
     BIG KEY DISPLAY
     ═══════════════════════════════════════════════════════ */

  function updateBigKey(data) {
    bigKeyWrap.style.display = '';

    /* Display character */
    let displayKey = data.key;
    if (displayKey === ' ') displayKey = '␣';
    else if (displayKey === 'Enter') displayKey = '↵';
    else if (displayKey === 'Backspace') displayKey = '⌫';
    else if (displayKey === 'Tab') displayKey = '⇥';
    else if (displayKey === 'Escape') displayKey = '⎋';
    else if (displayKey === 'Delete') displayKey = '⌦';
    else if (displayKey === 'ArrowUp') displayKey = '↑';
    else if (displayKey === 'ArrowDown') displayKey = '↓';
    else if (displayKey === 'ArrowLeft') displayKey = '←';
    else if (displayKey === 'ArrowRight') displayKey = '→';
    else if (displayKey === 'CapsLock') displayKey = '⇪';
    else if (displayKey === 'Shift') displayKey = '⇧';
    else if (displayKey === 'Control') displayKey = '⌃';
    else if (displayKey === 'Alt') displayKey = '⌥';
    else if (displayKey === 'Meta') displayKey = '⌘';

    /* Single character keys get a larger display */
    const isSingle = displayKey.length === 1;
    bigKeyVisual.textContent = displayKey;
    bigKeyVisual.className = 'kv-big-key__visual' + (isSingle ? ' kv-big-key__visual--single' : '');

    /* Friendly name */
    const friendly = getFriendlyName(data.code);
    bigKeyFriendly.textContent = friendly ? friendly : '';

    /* Animate */
    bigKeyVisual.classList.remove('kv-big-key__visual--pulse');
    void bigKeyVisual.offsetWidth; /* force reflow */
    bigKeyVisual.classList.add('kv-big-key__visual--pulse');
  }

  /* ═══════════════════════════════════════════════════════
     PROPERTIES TABLE
     ═══════════════════════════════════════════════════════ */

  function updateProps(data) {
    propsWrap.style.display = '';

    const props = [
      { label: 'event.key', value: data.key },
      { label: 'event.code', value: data.code },
    ];

    if (state.showKeyCode) {
      props.push({ label: 'event.keyCode', value: data.keyCode });
      props.push({ label: 'event.which', value: data.which });
    }

    props.push({ label: 'event.location', value: data.locationName + ' (' + data.location + ')' });
    props.push({ label: 'repeat', value: data.repeat ? 'Sí' : 'No' });

    /* Modifiers inline */
    const mods = [];
    if (data.ctrlKey) mods.push('Ctrl');
    if (data.shiftKey) mods.push('Shift');
    if (data.altKey) mods.push('Alt');
    if (data.metaKey) mods.push('Meta');
    if (mods.length) {
      props.push({ label: 'modifiers', value: mods.join(' + ') });
    }

    propsGrid.innerHTML = props.map(p => `
      <div class="kv-prop-row">
        <span class="kv-prop-label">${escapeHtml(p.label)}</span>
        <span class="kv-prop-value" data-copy="${escapeHtml(p.value)}">${escapeHtml(String(p.value))}</span>
      </div>
    `).join('');

    /* Click to copy individual values */
    propsGrid.querySelectorAll('.kv-prop-value').forEach(el => {
      el.title = 'Click para copiar';
      el.addEventListener('click', () => {
        navigator.clipboard.writeText(el.dataset.copy).then(() => {
          MiniDevTools.showToast('Copiado: ' + el.dataset.copy);
        });
      });
    });
  }

  /* ═══════════════════════════════════════════════════════
     MODIFIERS
     ═══════════════════════════════════════════════════════ */

  function updateModifiers(data) {
    modCtrl.classList.toggle('kv-mod--active', data.ctrlKey);
    modShift.classList.toggle('kv-mod--active', data.shiftKey);
    modAlt.classList.toggle('kv-mod--active', data.altKey);
    modMeta.classList.toggle('kv-mod--active', data.metaKey);
  }

  /* ═══════════════════════════════════════════════════════
     HISTORY
     ═══════════════════════════════════════════════════════ */

  function addHistory(data) {
    state.history.unshift(data);
    if (state.history.length > state.maxHistory) {
      state.history.pop();
    }
    renderHistory();
  }

  function renderHistory() {
    if (state.history.length === 0) {
      historyEmpty.style.display = '';
      /* Remove all items except the empty message */
      const items = historyEl.querySelectorAll('.kv-history-item');
      items.forEach(el => el.remove());
      return;
    }

    historyEmpty.style.display = 'none';

    /* Build items */
    let html = '';
    for (const data of state.history) {
      let displayKey = data.key;
      if (displayKey === ' ') displayKey = 'Space';
      else if (displayKey === 'Enter') displayKey = '↵';
      else if (displayKey === 'Backspace') displayKey = '⌫';
      else if (displayKey === 'Tab') displayKey = '⇥';
      else if (displayKey === 'Escape') displayKey = '⎋';

      const mods = [];
      if (data.ctrlKey) mods.push('Ctrl');
      if (data.shiftKey) mods.push('Shift');
      if (data.altKey) mods.push('Alt');
      if (data.metaKey) mods.push('Meta');
      const modStr = mods.length ? mods.join(' + ') + ' + ' : '';

      html += `
        <div class="kv-history-item">
          <span class="kv-history-key">${escapeHtml(modStr + displayKey)}</span>
          <span class="kv-history-detail">key: "${escapeHtml(data.key)}" · code: ${escapeHtml(data.code)}${state.showKeyCode ? ' · keyCode: ' + data.keyCode : ''}</span>
        </div>
      `;
    }

    /* Keep empty message element, replace items */
    const existingItems = historyEl.querySelectorAll('.kv-history-item');
    existingItems.forEach(el => el.remove());

    historyEl.insertAdjacentHTML('afterbegin', html);
  }

  /* ═══════════════════════════════════════════════════════
     FOCUS / BLUR
     ═══════════════════════════════════════════════════════ */

  function startListening() {
    state.listening = true;
    focusOverlay.style.display = 'none';
    focusArea.classList.add('kv-focus-area--active');
  }

  function stopListening() {
    state.listening = false;
    focusOverlay.style.display = '';
    focusArea.classList.remove('kv-focus-area--active');
  }

  focusArea.addEventListener('click', (e) => {
    /* Don't steal clicks on prop values */
    if (e.target.closest('.kv-prop-value')) return;
    focusArea.focus();
  });

  focusArea.setAttribute('tabindex', '0');
  focusArea.addEventListener('focus', startListening);
  focusArea.addEventListener('blur', stopListening);

  /* ═══════════════════════════════════════════════════════
     EVENTS
     ═══════════════════════════════════════════════════════ */

  /* Keyboard */
  focusArea.addEventListener('keydown', handleKeyEvent);
  focusArea.addEventListener('keyup', handleKeyEvent);

  /* Clear */
  clearBtn.addEventListener('click', () => {
    state.history = [];
    renderHistory();
    lastEventData = null;
    copyEventBtn.disabled = true;
    bigKeyWrap.style.display = 'none';
    propsWrap.style.display = 'none';
    updateModifiers({ ctrlKey: false, shiftKey: false, altKey: false, metaKey: false });
  });

  /* Copy event */
  copyEventBtn.addEventListener('click', () => {
    if (!lastEventData) return;
    const d = lastEventData;
    let text = `event.key: "${d.key}"\nevent.code: ${d.code}\nevent.keyCode: ${d.keyCode}\nevent.which: ${d.which}\nevent.location: ${d.locationName} (${d.location})\nrepeat: ${d.repeat}`;
    if (d.ctrlKey) text += '\nctrlKey: true';
    if (d.shiftKey) text += '\nshiftKey: true';
    if (d.altKey) text += '\naltKey: true';
    if (d.metaKey) text += '\nmetaKey: true';
    MiniDevTools.copyToClipboard(text, 'Propiedades del evento copiadas');
  });

  /* Toggle keyCode */
  showKeycodeCb.addEventListener('change', () => {
    state.showKeyCode = showKeycodeCb.checked;
    if (lastEventData) {
      updateProps(lastEventData);
      renderHistory();
    }
  });

  /* ─── Helpers ─── */
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

};

/* ═══════════════════════════════════════════════════════════════
   Timestamp Converter — Convertir entre Unix timestamp y fecha
   Features:
   - Live clock: timestamp actual actualizándose cada segundo
   - Timestamp → Fecha: input numérico → fecha legible + timezone
   - Fecha → Timestamp: date/time picker → unix timestamp (seg y ms)
   - Diferencia: entre dos timestamps → días, horas, minutos, segundos
   - Detección automática: si pega ms (13+ dígitos), sugiere que es milisegundos
   - Botones rápidos: copiar timestamp actual, resetear
   - Persistencia con ToolStorage
   ═══════════════════════════════════════════════════════════════ */

window['render_timestamp-converter'] = function(container, toolMeta) {

  /* ─── State ─── */
  const saved = ToolStorage.load('timestamp-converter');
  const s = saved ? saved.state : null;
  let activeTab = s ? (s.activeTab ?? 'ts-to-date') : 'ts-to-date';
  let tsInput = s ? (s.tsInput ?? '') : '';
  let dateInput = s ? (s.dateInput ?? '') : '';
  let diffA = s ? (s.diffA ?? '') : '';
  let diffB = s ? (s.diffB ?? '') : '';

  /* ─── Live clock interval ─── */
  let liveInterval = null;

  /* ═══════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════ */

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* Detect if a number looks like milliseconds (13+ digits) */
  function isLikelyMs(num) {
    return num > 9999999999999; /* 13+ digits = ms since ~Sep 2001 */
  }

  /* Detect if it could be seconds but might be ms */
  function looksLikeMsHint(num) {
    return num > 9999999999 && num <= 9999999999999; /* 10-13 digits: ambiguous */
  }

  /* Format a timestamp to readable date */
  function formatTs(ts, isMs) {
    const ms = isMs ? ts : ts * 1000;
    const d = new Date(ms);
    if (isNaN(d.getTime())) return null;

    const pad = n => String(n).padStart(2, '0');

    return {
      iso: d.toISOString(),
      local: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
      date: `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`,
      time: `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      offset: formatOffset(d.getTimezoneOffset()),
      relative: relativeTime(d),
      raw: d
    };
  }

  /* Format timezone offset */
  function formatOffset(mins) {
    const sign = mins <= 0 ? '+' : '-';
    const abs = Math.abs(mins);
    const h = Math.floor(abs / 60);
    const m = abs % 60;
    return `UTC${sign}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  /* Relative time string */
  function relativeTime(d) {
    const now = Date.now();
    const diff = now - d.getTime();
    const absDiff = Math.abs(diff);
    const isPast = diff > 0;

    const seconds = Math.floor(absDiff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);

    let text = '';
    if (years > 0) text = `${years} año${years > 1 ? 's' : ''}`;
    else if (months > 0) text = `${months} mes${months > 1 ? 'es' : ''}`;
    else if (days > 0) text = `${days} día${days > 1 ? 's' : ''}`;
    else if (hours > 0) text = `${hours} hora${hours > 1 ? 's' : ''}`;
    else if (minutes > 0) text = `${minutes} minuto${minutes > 1 ? 's' : ''}`;
    else text = `${seconds} segundo${seconds !== 1 ? 's' : ''}`;

    return isPast ? `Hace ${text}` : `En ${text}`;
  }

  /* Format difference between two timestamps */
  function formatDiff(diffMs) {
    const abs = Math.abs(diffMs);
    const sign = diffMs < 0 ? '-' : '';
    const days = Math.floor(abs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((abs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((abs % (1000 * 60)) / 1000);

    return {
      sign,
      days,
      hours,
      minutes,
      seconds,
      totalHours: (abs / (1000 * 60 * 60)).toFixed(1),
      totalMinutes: (abs / (1000 * 60)).toFixed(1),
      totalDays: (abs / (1000 * 60 * 60 * 24)).toFixed(2)
    };
  }

  /* Get current ISO date string for datetime-local input (current minute) */
  function getNowLocal() {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

        <!-- Live Clock -->
        <div class="tc-live">
          <div class="tc-live__label">
            <i class="fa-solid fa-signal" style="margin-right:4px;"></i>Ahora mismo
          </div>
          <div class="tc-live__values">
            <div class="tc-live__item">
              <span class="tc-live__num" id="tc-live-s">${Math.floor(Date.now() / 1000)}</span>
              <span class="tc-live__unit">segundos</span>
            </div>
            <div class="tc-live__item">
              <span class="tc-live__num" id="tc-live-ms">${Date.now()}</span>
              <span class="tc-live__unit">milisegundos</span>
            </div>
          </div>
          <div class="tc-live__date" id="tc-live-date"></div>
          <button class="tc-live-copy btn btn--ghost btn--sm" id="tc-copy-now" title="Copiar timestamp actual">
            <i class="fa-regular fa-copy"></i> Copiar (s)
          </button>
        </div>

        <!-- Tabs -->
        <div class="tc-tabs">
          <button class="tc-tab ${activeTab === 'ts-to-date' ? 'tc-tab--active' : ''}" data-tab="ts-to-date">
            <i class="fa-solid fa-arrow-right"></i>
            <span>Timestamp → Fecha</span>
          </button>
          <button class="tc-tab ${activeTab === 'date-to-ts' ? 'tc-tab--active' : ''}" data-tab="date-to-ts">
            <i class="fa-solid fa-arrow-left"></i>
            <span>Fecha → Timestamp</span>
          </button>
          <button class="tc-tab ${activeTab === 'diff' ? 'tc-tab--active' : ''}" data-tab="diff">
            <i class="fa-solid fa-arrows-left-right"></i>
            <span>Diferencia</span>
          </button>
        </div>

        <!-- Tab: Timestamp → Fecha -->
        <div class="tc-panel" id="tc-panel-ts-to-date" style="${activeTab === 'ts-to-date' ? '' : 'display:none;'}">
          <div class="form-group" style="margin-top:16px;">
            <label class="label">Timestamp</label>
            <input type="text" class="input" id="tc-ts-input" placeholder="Ej: 1700000000 o 1700000000000" value="${escapeHtml(tsInput)}" inputmode="numeric" autocomplete="off">
          </div>
          <div id="ts-hint" class="tc-hint"></div>
          <button class="btn btn--primary" id="tc-ts-convert" style="width:100%; margin-top:12px;">
            <i class="fa-solid fa-clock" style="margin-right:6px;"></i>Convertir a fecha
          </button>
          <div id="tc-ts-result" class="tc-result" style="display:none;"></div>
        </div>

        <!-- Tab: Fecha → Timestamp -->
        <div class="tc-panel" id="tc-panel-date-to-ts" style="${activeTab === 'date-to-ts' ? '' : 'display:none;'}">
          <div class="form-group" style="margin-top:16px;">
            <label class="label">Fecha y hora</label>
            <input type="datetime-local" class="input tc-datetime-input" id="tc-date-input" value="${dateInput || getNowLocal()}">
          </div>
          <button class="btn btn--primary" id="tc-date-convert" style="width:100%; margin-top:12px;">
            <i class="fa-solid fa-clock" style="margin-right:6px;"></i>Convertir a timestamp
          </button>
          <div id="tc-date-result" class="tc-result" style="display:none;"></div>
        </div>

        <!-- Tab: Diferencia -->
        <div class="tc-panel" id="tc-panel-diff" style="${activeTab === 'diff' ? '' : 'display:none;'}">
          <div class="form-group tc-diff-row" style="margin-top:16px;">
            <div style="flex:1;">
              <label class="label">Timestamp A</label>
              <input type="text" class="input" id="tc-diff-a" placeholder="Ej: 1700000000" value="${escapeHtml(diffA)}" inputmode="numeric" autocomplete="off">
            </div>
            <div class="tc-diff-minus">
              <i class="fa-solid fa-minus"></i>
            </div>
            <div style="flex:1;">
              <label class="label">Timestamp B</label>
              <input type="text" class="input" id="tc-diff-b" placeholder="Ej: 1716844800" value="${escapeHtml(diffB)}" inputmode="numeric" autocomplete="off">
            </div>
          </div>
          <button class="btn btn--primary" id="tc-diff-calc" style="width:100%; margin-top:12px;">
            <i class="fa-solid fa-arrows-left-right" style="margin-right:6px;"></i>Calcular diferencia
          </button>
          <div id="tc-diff-result" class="tc-result" style="display:none;"></div>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const liveS = document.getElementById('tc-live-s');
  const liveMs = document.getElementById('tc-live-ms');
  const liveDate = document.getElementById('tc-live-date');
  const tabBtns = container.querySelectorAll('.tc-tab');
  const panels = {
    'ts-to-date': document.getElementById('tc-panel-ts-to-date'),
    'date-to-ts': document.getElementById('tc-panel-date-to-ts'),
    'diff': document.getElementById('tc-panel-diff')
  };

  /* Tab-specific refs */
  const tsInputEl = document.getElementById('tc-ts-input');
  const tsHintEl = document.getElementById('ts-hint');
  const tsResultEl = document.getElementById('tc-ts-result');
  const dateInputEl = document.getElementById('tc-date-input');
  const dateResultEl = document.getElementById('tc-date-result');
  const diffAEl = document.getElementById('tc-diff-a');
  const diffBEl = document.getElementById('tc-diff-b');
  const diffResultEl = document.getElementById('tc-diff-result');

  /* ═══════════════════════════════════════════════════════
     LIVE CLOCK
     ═══════════════════════════════════════════════════════ */

  function updateLiveClock() {
    const now = Date.now();
    liveS.textContent = Math.floor(now / 1000);
    liveMs.textContent = now;

    const d = new Date(now);
    const pad = n => String(n).padStart(2, '0');
    liveDate.textContent = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} — ${formatOffset(d.getTimezoneOffset())}`;
  }

  updateLiveClock();
  liveInterval = setInterval(updateLiveClock, 1000);

  /* Copy current timestamp (seconds) */
  document.getElementById('tc-copy-now').addEventListener('click', () => {
    const ts = Math.floor(Date.now() / 1000);
    navigator.clipboard.writeText(String(ts)).then(() => {
      MiniDevTools.showToast('Timestamp copiado: ' + ts, 'success');
    }).catch(() => {
      MiniDevTools.showToast('No se pudo copiar', 'error');
    });
  });

  /* ═══════════════════════════════════════════════════════
     TAB SWITCHING
     ═══════════════════════════════════════════════════════ */

  function switchTab(tab) {
    activeTab = tab;
    tabBtns.forEach(b => b.classList.toggle('tc-tab--active', b.dataset.tab === tab));
    Object.keys(panels).forEach(key => {
      panels[key].style.display = key === tab ? '' : 'none';
    });
    ToolStorage.setField('timestamp-converter', 'state', { activeTab, tsInput, dateInput, diffA, diffB });
  }

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  /* ═══════════════════════════════════════════════════════
     TIMESTAMP → FECHA
     ═══════════════════════════════════════════════════════ */

  function convertTsToDate() {
    const raw = tsInputEl.value.trim();
    tsInput = raw;

    if (!raw) {
      tsResultEl.style.display = 'none';
      tsHintEl.innerHTML = '';
      return;
    }

    /* Parse number */
    const num = Number(raw);
    if (isNaN(num) || !isFinite(num)) {
      tsResultEl.style.display = 'none';
      tsHintEl.innerHTML = '<span style="color:var(--color-error, #ef4444); font-size:12px;"><i class="fa-solid fa-triangle-exclamation" style="margin-right:4px;"></i>Ingresá un número válido</span>';
      return;
    }

    /* Auto-detect seconds vs milliseconds */
    let isMs = isLikelyMs(num);
    let showMsHint = false;

    /* If 10-13 digits, we guess seconds but show a hint */
    if (looksLikeMsHint(num)) {
      isMs = false; /* treat as seconds by default */
      showMsHint = true;
    }

    const result = formatTs(num, isMs);
    if (!result) {
      tsResultEl.style.display = 'none';
      tsHintEl.innerHTML = '<span style="color:var(--color-error, #ef4444); font-size:12px;"><i class="fa-solid fa-triangle-exclamation" style="margin-right:4px;"></i>Timestamp fuera de rango</span>';
      return;
    }

    tsResultEl.style.display = '';
    tsResultEl.innerHTML = `
      <div class="tc-result__grid">
        <div class="tc-result__item">
          <span class="tc-result__label">Fecha local</span>
          <span class="tc-result__value">${escapeHtml(result.local)}</span>
        </div>
        <div class="tc-result__item">
          <span class="tc-result__label">ISO 8601</span>
          <span class="tc-result__value tc-result__value--mono">${escapeHtml(result.iso)}</span>
        </div>
        <div class="tc-result__item">
          <span class="tc-result__label">Timezone</span>
          <span class="tc-result__value">${escapeHtml(result.timezone)} (${result.offset})</span>
        </div>
        <div class="tc-result__item">
          <span class="tc-result__label">Relativo</span>
          <span class="tc-result__value">${escapeHtml(result.relative)}</span>
        </div>
      </div>
      ${!isMs ? `
      <div class="tc-result__extra">
        <span class="tc-result__label">En milisegundos</span>
        <span class="tc-result__value tc-result__value--mono tc-result__value--copy" id="tc-copy-ms" title="Copiar">${num * 1000}</span>
      </div>` : `
      <div class="tc-result__extra">
        <span class="tc-result__label">En segundos</span>
        <span class="tc-result__value tc-result__value--mono tc-result__value--copy" id="tc-copy-s" title="Copiar">${Math.floor(num / 1000)}</span>
      </div>`}
    `;

    /* Copy buttons inside result */
    const copyBtn = tsResultEl.querySelector('.tc-result__value--copy');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(copyBtn.textContent).then(() => {
          MiniDevTools.showToast('Copiado: ' + copyBtn.textContent, 'success');
        });
      });
      copyBtn.style.cursor = 'pointer';
    }

    /* Hint for ambiguous timestamps */
    if (showMsHint) {
      tsHintEl.innerHTML = '<span style="color:var(--accent); font-size:12px;"><i class="fa-solid fa-lightbulb" style="margin-right:4px;"></i>Interpretado como <strong>segundos</strong>. Si son milisegundos, el resultado sería otra fecha.</span>';
    } else {
      tsHintEl.innerHTML = '';
    }

    ToolStorage.setField('timestamp-converter', 'state', { activeTab, tsInput, dateInput, diffA, diffB });
  }

  /* Auto-detect hint on input */
  tsInputEl.addEventListener('input', () => {
    const raw = tsInputEl.value.trim();
    const num = Number(raw);
    if (raw && !isNaN(num) && isLikelyMs(num)) {
      tsHintEl.innerHTML = '<span style="color:var(--accent); font-size:12px;"><i class="fa-solid fa-lightbulb" style="margin-right:4px;"></i>Detectado como <strong>milisegundos</strong> (13+ dígitos)</span>';
    } else if (raw && !isNaN(num) && looksLikeMsHint(num)) {
      tsHintEl.innerHTML = '<span style="color:var(--text-muted); font-size:12px;"><i class="fa-solid fa-circle-info" style="margin-right:4px;"></i>¿Segundos o milisegundos? Se interpretará como segundos.</span>';
    } else {
      tsHintEl.innerHTML = '';
    }
  });

  document.getElementById('tc-ts-convert').addEventListener('click', convertTsToDate);
  tsInputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); convertTsToDate(); }
  });

  /* ═══════════════════════════════════════════════════════
     FECHA → TIMESTAMP
     ═══════════════════════════════════════════════════════ */

  function convertDateToTs() {
    const val = dateInputEl.value;
    dateInput = val;

    if (!val) {
      dateResultEl.style.display = 'none';
      return;
    }

    const d = new Date(val);
    if (isNaN(d.getTime())) {
      dateResultEl.style.display = '';
      dateResultEl.innerHTML = '<span style="color:var(--color-error, #ef4444); font-size:13px;"><i class="fa-solid fa-triangle-exclamation" style="margin-right:4px;"></i>Fecha inválida</span>';
      return;
    }

    const sec = Math.floor(d.getTime() / 1000);
    const ms = d.getTime();

    dateResultEl.style.display = '';
    dateResultEl.innerHTML = `
      <div class="tc-result__grid">
        <div class="tc-result__item">
          <span class="tc-result__label">Unix (segundos)</span>
          <span class="tc-result__value tc-result__value--mono tc-result__value--copy" id="tc-dt-copy-s" title="Copiar">${sec}</span>
        </div>
        <div class="tc-result__item">
          <span class="tc-result__label">Unix (milisegundos)</span>
          <span class="tc-result__value tc-result__value--mono tc-result__value--copy" id="tc-dt-copy-ms" title="Copiar">${ms}</span>
        </div>
        <div class="tc-result__item">
          <span class="tc-result__label">ISO 8601</span>
          <span class="tc-result__value tc-result__value--mono">${escapeHtml(d.toISOString())}</span>
        </div>
        <div class="tc-result__item">
          <span class="tc-result__label">Relativo</span>
          <span class="tc-result__value">${escapeHtml(relativeTime(d))}</span>
        </div>
      </div>
    `;

    /* Copy buttons */
    dateResultEl.querySelectorAll('.tc-result__value--copy').forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        navigator.clipboard.writeText(el.textContent).then(() => {
          MiniDevTools.showToast('Copiado: ' + el.textContent, 'success');
        });
      });
    });

    ToolStorage.setField('timestamp-converter', 'state', { activeTab, tsInput, dateInput, diffA, diffB });
  }

  document.getElementById('tc-date-convert').addEventListener('click', convertDateToTs);

  /* ═══════════════════════════════════════════════════════
     DIFERENCIA
     ═══════════════════════════════════════════════════════ */

  function calcDiff() {
    diffA = diffAEl.value.trim();
    diffB = diffBEl.value.trim();

    if (!diffA || !diffB) {
      diffResultEl.style.display = 'none';
      return;
    }

    const a = Number(diffA);
    const b = Number(diffB);

    if (isNaN(a) || isNaN(b) || !isFinite(a) || !isFinite(b)) {
      diffResultEl.style.display = '';
      diffResultEl.innerHTML = '<span style="color:var(--color-error, #ef4444); font-size:13px;"><i class="fa-solid fa-triangle-exclamation" style="margin-right:4px;"></i>Ingresá números válidos en ambos campos</span>';
      return;
    }

    /* Detect if seconds or ms for each */
    const aIsMs = isLikelyMs(a) || looksLikeMsHint(a);
    const bIsMs = isLikelyMs(b) || looksLikeMsHint(b);

    /* Normalize to ms */
    const aMs = aIsMs ? a : a * 1000;
    const bMs = bIsMs ? b : b * 1000;

    const diffMs = bMs - aMs;
    const d = formatDiff(diffMs);

    diffResultEl.style.display = '';
    diffResultEl.innerHTML = `
      <div class="tc-diff-banner">
        <span class="tc-diff-banner__sign">${d.sign}</span>
        <span class="tc-diff-banner__main">${d.days}d ${String(d.hours).padStart(2, '0')}h ${String(d.minutes).padStart(2, '0')}m ${String(d.seconds).padStart(2, '0')}s</span>
      </div>
      <div class="tc-result__grid">
        <div class="tc-result__item">
          <span class="tc-result__label">Total horas</span>
          <span class="tc-result__value">${d.totalHours}</span>
        </div>
        <div class="tc-result__item">
          <span class="tc-result__label">Total minutos</span>
          <span class="tc-result__value">${d.totalMinutes}</span>
        </div>
        <div class="tc-result__item">
          <span class="tc-result__label">Total días</span>
          <span class="tc-result__value">${d.totalDays}</span>
        </div>
        <div class="tc-result__item">
          <span class="tc-result__label">Diferencia (ms)</span>
          <span class="tc-result__value tc-result__value--mono">${Math.abs(diffMs).toLocaleString()}</span>
        </div>
      </div>
      <div style="font-size:11px; color:var(--text-muted); margin-top:8px;">
        <i class="fa-solid fa-circle-info" style="margin-right:4px;"></i>A interpretado como ${aIsMs ? 'milisegundos' : 'segundos'}, B como ${bIsMs ? 'milisegundos' : 'segundos'}.
      </div>
    `;

    ToolStorage.setField('timestamp-converter', 'state', { activeTab, tsInput, dateInput, diffA, diffB });
  }

  document.getElementById('tc-diff-calc').addEventListener('click', calcDiff);

  /* Allow Enter on diff inputs */
  diffAEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); calcDiff(); } });
  diffBEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); calcDiff(); } });

  /* ═══════════════════════════════════════════════════════
     CLEANUP
     ═══════════════════════════════════════════════════════ */

  function cleanup() {
    if (liveInterval) clearInterval(liveInterval);
    liveInterval = null;
  }

  const onHashChange = () => {
    if (!container.offsetParent) cleanup();
  };
  window.addEventListener('hashchange', onHashChange);
};

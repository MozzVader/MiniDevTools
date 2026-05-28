/* ═══════════════════════════════════════════════════════════════
   SQL Schema Builder — Supabase / PostgreSQL
   Features:
   - Visual table builder (add/edit/remove tables, columns, constraints)
   - TSV/CSV import from Excel (auto-detect types)
   - Foreign keys with ON DELETE/ON UPDATE
   - Indexes (single + composite)
   - Full Supabase grants (anon, authenticated, service_role)
   - RLS with basic policies
   - Templates (users, products, orders)
   - Copy SQL + Download .sql
   - Persistence with ToolStorage
   ═══════════════════════════════════════════════════════════════ */

window['render_sql-schema-builder'] = function(container, toolMeta) {

  /* ═══════════════════════════════════════════════════════
     CONSTANTS
     ═══════════════════════════════════════════════════════ */

  const PG_TYPES = [
    { value: 'uuid', label: 'UUID' },
    { value: 'text', label: 'TEXT' },
    { value: 'varchar', label: 'VARCHAR(n)' },
    { value: 'integer', label: 'INTEGER' },
    { value: 'bigint', label: 'BIGINT' },
    { value: 'serial', label: 'SERIAL' },
    { value: 'bigserial', label: 'BIGSERIAL' },
    { value: 'boolean', label: 'BOOLEAN' },
    { value: 'numeric', label: 'NUMERIC' },
    { value: 'real', label: 'REAL' },
    { value: 'double precision', label: 'DOUBLE PRECISION' },
    { value: 'timestamp', label: 'TIMESTAMP' },
    { value: 'timestamptz', label: 'TIMESTAMPTZ' },
    { value: 'date', label: 'DATE' },
    { value: 'time', label: 'TIME' },
    { value: 'jsonb', label: 'JSONB' },
    { value: 'json', label: 'JSON' },
    { value: 'bytea', label: 'BYTEA (blob)' },
  ];

  const FK_ACTIONS = ['CASCADE', 'SET NULL', 'SET DEFAULT', 'RESTRICT', 'NO ACTION'];
  const DEFAULT_PRESETS = [
    { value: '', label: '(ninguno)' },
    { value: 'gen_random_uuid()', label: 'gen_random_uuid()' },
    { value: 'now()', label: 'now()' },
    { value: 'true', label: 'true' },
    { value: 'false', label: 'false' },
    { value: '0', label: '0' },
    { value: "'now'::text", label: "'now'::text" },
  ];

  const TEMPLATES = {
    users: {
      name: 'users',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, unique: false, pk: true, default: 'gen_random_uuid()' },
        { name: 'email', type: 'text', nullable: false, unique: true, pk: false, default: '' },
        { name: 'full_name', type: 'text', nullable: true, unique: false, pk: false, default: '' },
        { name: 'avatar_url', type: 'text', nullable: true, unique: false, pk: false, default: '' },
        { name: 'created_at', type: 'timestamptz', nullable: false, unique: false, pk: false, default: 'now()' },
        { name: 'updated_at', type: 'timestamptz', nullable: false, unique: false, pk: false, default: 'now()' },
      ],
      indexes: [],
    },
    products: {
      name: 'products',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, unique: false, pk: true, default: 'gen_random_uuid()' },
        { name: 'name', type: 'text', nullable: false, unique: false, pk: false, default: '' },
        { name: 'description', type: 'text', nullable: true, unique: false, pk: false, default: '' },
        { name: 'price', type: 'numeric', nullable: false, unique: false, pk: false, default: '' },
        { name: 'stock', type: 'integer', nullable: false, unique: false, pk: false, default: '0' },
        { name: 'category_id', type: 'uuid', nullable: true, unique: false, pk: false, default: '' },
        { name: 'is_active', type: 'boolean', nullable: false, unique: false, pk: false, default: 'true' },
        { name: 'created_at', type: 'timestamptz', nullable: false, unique: false, pk: false, default: 'now()' },
      ],
      indexes: [
        { columns: ['name'], unique: true },
      ],
    },
    orders: {
      name: 'orders',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, unique: false, pk: true, default: 'gen_random_uuid()' },
        { name: 'user_id', type: 'uuid', nullable: false, unique: false, pk: false, default: '' },
        { name: 'status', type: 'text', nullable: false, unique: false, pk: false, default: "'pending'" },
        { name: 'total', type: 'numeric', nullable: false, unique: false, pk: false, default: '' },
        { name: 'created_at', type: 'timestamptz', nullable: false, unique: false, pk: false, default: 'now()' },
      ],
      indexes: [
        { columns: ['user_id'], unique: false },
        { columns: ['status'], unique: false },
      ],
    },
    categories: {
      name: 'categories',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, unique: false, pk: true, default: 'gen_random_uuid()' },
        { name: 'name', type: 'text', nullable: false, unique: true, pk: false, default: '' },
        { name: 'slug', type: 'text', nullable: false, unique: true, pk: false, default: '' },
        { name: 'description', type: 'text', nullable: true, unique: false, pk: false, default: '' },
      ],
      indexes: [],
    },
    posts: {
      name: 'posts',
      columns: [
        { name: 'id', type: 'uuid', nullable: false, unique: false, pk: true, default: 'gen_random_uuid()' },
        { name: 'author_id', type: 'uuid', nullable: false, unique: false, pk: false, default: '' },
        { name: 'title', type: 'text', nullable: false, unique: false, pk: false, default: '' },
        { name: 'slug', type: 'text', nullable: false, unique: true, pk: false, default: '' },
        { name: 'body', type: 'text', nullable: true, unique: false, pk: false, default: '' },
        { name: 'published', type: 'boolean', nullable: false, unique: false, pk: false, default: 'false' },
        { name: 'published_at', type: 'timestamptz', nullable: true, unique: false, pk: false, default: '' },
        { name: 'created_at', type: 'timestamptz', nullable: false, unique: false, pk: false, default: 'now()' },
        { name: 'updated_at', type: 'timestamptz', nullable: false, unique: false, pk: false, default: 'now()' },
      ],
      indexes: [
        { columns: ['author_id'], unique: false },
        { columns: ['slug'], unique: true },
      ],
    },
  };

  /* ═══════════════════════════════════════════════════════
     STATE
     ═══════════════════════════════════════════════════════ */

  const saved = ToolStorage.load('sql-schema-builder');
  const s = saved ? saved.state : null;

  const state = {
    tables: s ? s.tables : [],
    rlsEnabled: s ? (s.rlsEnabled !== false) : true,
    grantsEnabled: s ? (s.grantsEnabled !== false) : true,
    includeIndexes: s ? (s.includeIndexes !== false) : true,
    includePolicies: s ? (s.includePolicies !== false) : true,
    dropIfExists: s ? (s.dropIfExists !== false) : false,
    activeTable: s ? s.activeTable : null,
    activeTab: s ? (s.activeTab || 'builder') : 'builder', // 'builder' | 'import'
  };

  let uid = 0;
  function nextId() { return ++uid; }

  /* ═══════════════════════════════════════════════════════
     HELPERS
     ═══════════════════════════════════════════════════════ */

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  function newColumn(overrides) {
    return Object.assign({
      _id: nextId(),
      name: '',
      type: 'text',
      nullable: true,
      unique: false,
      pk: false,
      default: '',
      fkTable: '',
      fkColumn: '',
      fkOnDelete: 'CASCADE',
      fkOnUpdate: 'CASCADE',
    }, overrides);
  }

  function newTable(name) {
    return {
      _id: nextId(),
      name: name || 'table_' + (state.tables.length + 1),
      columns: [],
      indexes: [],
      schema: 'public',
    };
  }

  function findTable(idOrName) {
    if (idOrName == null) return null;
    return state.tables.find(t => t._id === idOrName || t.name === idOrName);
  }

  function getOtherTables(excludeId) {
    return state.tables.filter(t => t._id !== excludeId);
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

        <!-- ═══ Tab Bar: Builder / Import ═══ -->
        <div class="sb-tab-bar">
          <button class="sb-tab ${state.activeTab === 'builder' ? 'active' : ''}" id="sb-tab-builder">
            <i class="fa-solid fa-hammer"></i> Constructor
          </button>
          <button class="sb-tab ${state.activeTab === 'import' ? 'active' : ''}" id="sb-tab-import">
            <i class="fa-solid fa-file-import"></i> Importar Excel/TSV
          </button>
        </div>

        <!-- ═══ Builder Panel ═══ -->
        <div id="sb-panel-builder" ${state.activeTab !== 'builder' ? 'style="display:none"' : ''}>
          <div class="sb-builder-layout">

            <!-- LEFT: Tables List + Editor -->
            <div class="sb-editor-panel">
              <!-- Tables sidebar -->
              <div class="sb-tables-sidebar">
                <div class="sb-sidebar-header">
                  <span class="sb-sidebar-title">Tablas</span>
                  <div style="display:flex;gap:4px;">
                    <button class="btn btn--primary btn--sm" id="sb-add-table" title="Nueva tabla vacía">
                      <i class="fa-solid fa-plus"></i> Tabla
                    </button>
                  </div>
                </div>
                <div class="sb-tables-list" id="sb-tables-list"></div>

                <!-- Templates -->
                <div class="sb-templates">
                  <span class="sb-sidebar-title" style="font-size:11px;">Templates</span>
                  <div class="sb-template-btns">
                    <button class="btn btn--ghost btn--sm sb-tpl-btn" data-tpl="users"><i class="fa-solid fa-users"></i> Users</button>
                    <button class="btn btn--ghost btn--sm sb-tpl-btn" data-tpl="products"><i class="fa-solid fa-box"></i> Products</button>
                    <button class="btn btn--ghost btn--sm sb-tpl-btn" data-tpl="orders"><i class="fa-solid fa-cart-shopping"></i> Orders</button>
                    <button class="btn btn--ghost btn--sm sb-tpl-btn" data-tpl="categories"><i class="fa-solid fa-tags"></i> Categories</button>
                    <button class="btn btn--ghost btn--sm sb-tpl-btn" data-tpl="posts"><i class="fa-solid fa-newspaper"></i> Posts</button>
                  </div>
                </div>
              </div>

              <!-- Table editor -->
              <div class="sb-table-editor" id="sb-table-editor">
                <div class="sb-empty-state">
                  <i class="fa-solid fa-table"></i>
                  <p>Agregá o seleccioná una tabla para empezar</p>
                </div>
              </div>
            </div>

            <!-- RIGHT: SQL Output -->
            <div class="sb-output-panel">
              <div class="sb-output-header">
                <span class="sb-sidebar-title"><i class="fa-solid fa-code"></i> SQL (PostgreSQL / Supabase)</span>
                <div class="sb-output-actions">
                  <button class="btn btn--primary btn--sm" id="sb-copy" disabled>
                    <i class="fa-regular fa-copy"></i> Copiar
                  </button>
                  <button class="btn btn--primary btn--sm" id="sb-download" disabled>
                    <i class="fa-solid fa-download"></i> .sql
                  </button>
                </div>
              </div>
              <pre class="sb-sql-output" id="sb-sql-output"><span class="sb-placeholder">El SQL generado aparecerá acá...</span></pre>
              <!-- Global Options -->
              <div class="sb-global-options" id="sb-global-options"></div>
            </div>

          </div>
        </div>

        <!-- ═══ Import Panel ═══ -->
        <div id="sb-panel-import" ${state.activeTab !== 'import' ? 'style="display:none"' : ''}>
          <div class="sb-import-layout">
            <div class="sb-input-section">
              <div class="sb-section-header">
                <label class="label" style="margin-bottom:0;">Pegá desde Excel</label>
                <div style="display:flex;gap:6px;">
                  <label class="btn btn--ghost btn--sm" title="Subir CSV o TSV" style="cursor:pointer;">
                    <i class="fa-solid fa-file-upload"></i> CSV/TSV
                    <input type="file" id="sb-import-file" accept=".csv,.tsv,.txt" style="display:none;">
                  </label>
                  <button class="btn btn--ghost btn--sm" id="sb-import-sample">Ejemplo</button>
                  <button class="btn btn--primary btn--sm" id="sb-import-btn" disabled>
                    <i class="fa-solid fa-wand-magic-sparkles"></i> Generar Schema
                  </button>
                </div>
              </div>
              <textarea class="input sb-textarea" id="sb-import-input" rows="10"
                placeholder="Copiá celdas desde Excel (Ctrl+C) y pegá acá (Ctrl+V)...&#10;&#10;La primera fila se usará como nombres de columnas.&#10;Los tipos se detectarán automáticamente según los datos."
                spellcheck="false"></textarea>
              <div class="sb-import-table-name">
                <span class="em-label">Nombre de tabla:</span>
                <input class="input sb-table-name-input" type="text" id="sb-import-name" placeholder="my_table" value="my_table">
              </div>
              <div class="sb-hint">
                <i class="fa-solid fa-lightbulb"></i>
                Seleccioná celdas en Excel y <strong>Ctrl+C</strong>, después pegá acá con <strong>Ctrl+V</strong>. La herramienta detectará tipos automáticamente (texto, números, booleanos, fechas) y generará el CREATE TABLE completo con GRANTs y RLS.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const tabBuilder = document.getElementById('sb-tab-builder');
  const tabImport = document.getElementById('sb-tab-import');
  const panelBuilder = document.getElementById('sb-panel-builder');
  const panelImport = document.getElementById('sb-panel-import');
  const tablesList = document.getElementById('sb-tables-list');
  const tableEditor = document.getElementById('sb-table-editor');
  const sqlOutput = document.getElementById('sb-sql-output');
  const globalOptions = document.getElementById('sb-global-options');
  const addTableBtn = document.getElementById('sb-add-table');
  const copyBtn = document.getElementById('sb-copy');
  const downloadBtn = document.getElementById('sb-download');
  const importInput = document.getElementById('sb-import-input');
  const importFile = document.getElementById('sb-import-file');
  const importName = document.getElementById('sb-import-name');
  const importSampleBtn = document.getElementById('sb-import-sample');
  const importBtn = document.getElementById('sb-import-btn');

  /* ═══════════════════════════════════════════════════════
     TAB SWITCHING
     ═══════════════════════════════════════════════════════ */

  function switchTab(tab) {
    state.activeTab = tab;
    tabBuilder.classList.toggle('active', tab === 'builder');
    tabImport.classList.toggle('active', tab === 'import');
    panelBuilder.style.display = tab === 'builder' ? '' : 'none';
    panelImport.style.display = tab === 'import' ? '' : 'none';
    saveState();
  }

  tabBuilder.addEventListener('click', () => switchTab('builder'));
  tabImport.addEventListener('click', () => switchTab('import'));

  /* ═══════════════════════════════════════════════════════
     RENDER: Tables List
     ═══════════════════════════════════════════════════════ */

  function renderTablesList() {
    if (state.tables.length === 0) {
      tablesList.innerHTML = '<div class="sb-no-tables">No hay tablas aún</div>';
      return;
    }

    tablesList.innerHTML = state.tables.map(t => `
      <div class="sb-table-item ${state.activeTable === t._id ? 'active' : ''}" data-tid="${t._id}">
        <i class="fa-solid fa-table"></i>
        <span class="sb-table-item-name">${escapeHtml(t.name)}</span>
        <span class="sb-table-item-count">${t.columns.length} cols</span>
        <button class="sb-table-item-del" data-tid="${t._id}" title="Eliminar tabla">&times;</button>
      </div>
    `).join('');

    /* Events */
    tablesList.querySelectorAll('.sb-table-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.classList.contains('sb-table-item-del')) return;
        state.activeTable = parseInt(el.dataset.tid);
        renderTablesList();
        renderTableEditor();
        generateSQL();
        saveState();
      });
    });
    tablesList.querySelectorAll('.sb-table-item-del').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const tid = parseInt(el.dataset.tid);
        state.tables = state.tables.filter(t => t._id !== tid);
        if (state.activeTable === tid) {
          state.activeTable = state.tables.length > 0 ? state.tables[0]._id : null;
        }
        renderTablesList();
        renderTableEditor();
        generateSQL();
        saveState();
      });
    });
  }

  /* ═══════════════════════════════════════════════════════
     RENDER: Table Editor
     ═══════════════════════════════════════════════════════ */

  function renderTableEditor() {
    const table = findTable(state.activeTable);
    if (!table) {
      tableEditor.innerHTML = `
        <div class="sb-empty-state">
          <i class="fa-solid fa-table"></i>
          <p>Agregá o seleccioná una tabla para empezar</p>
        </div>`;
      return;
    }

    const otherTables = getOtherTables(table._id);

    tableEditor.innerHTML = `
      <!-- Table Name -->
      <div class="sb-te-header">
        <div class="sb-te-name-row">
          <i class="fa-solid fa-table" style="color:var(--accent);"></i>
          <input class="input sb-te-name" type="text" value="${escapeHtml(table.name)}" id="sb-te-name" placeholder="nombre_tabla">
          <input class="input sb-te-schema" type="text" id="sb-te-schema" list="sb-schema-list" value="${escapeHtml(table.schema)}" placeholder="public">
          <datalist id="sb-schema-list">
            <option value="public">
            <option value="private">
            <option value="auth">
            <option value="storage">
            <option value="graphql_public">
            <option value="supabase_functions">
          </datalist>
        </div>
      </div>

      <!-- Columns -->
      <div class="sb-te-columns-header">
        <span>Columnas</span>
        <button class="btn btn--ghost btn--sm" id="sb-add-col"><i class="fa-solid fa-plus"></i> Columna</button>
      </div>

      <div class="sb-te-columns" id="sb-te-columns">
        ${table.columns.map((col, ci) => renderColumnRow(col, ci, otherTables)).join('')}
      </div>

      ${table.columns.length === 0 ? '<div class="sb-no-columns">No hay columnas. Hacé clic en "+ Columna"</div>' : ''}

      <!-- Indexes -->
      ${renderIndexesSection(table, otherTables)}
    `;

    /* Events */
    const nameInput = document.getElementById('sb-te-name');
    nameInput.addEventListener('input', () => {
      table.name = nameInput.value.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
      renderTablesList();
      generateSQL();
      saveState();
    });

    const schemaInput = document.getElementById('sb-te-schema');
    schemaInput.addEventListener('input', () => {
      table.schema = schemaInput.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase() || 'public';
      renderTablesList();
      generateSQL();
      saveState();
    });

    document.getElementById('sb-add-col').addEventListener('click', () => {
      table.columns.push(newColumn());
      renderTableEditor();
      generateSQL();
      saveState();
    });

    /* Column events */
    bindColumnEvents(table, otherTables);
    bindIndexEvents(table, otherTables);
  }

  function renderColumnRow(col, idx, otherTables) {
    const isFk = col.fkTable && col.fkColumn;
    return `
      <div class="sb-col-row ${isFk ? 'sb-col-fk' : ''} ${col.pk ? 'sb-col-pk' : ''}" data-cid="${col._id}">
        <span class="sb-col-drag" title="Arrastrar"><i class="fa-solid fa-grip-vertical"></i></span>
        <input class="input sb-col-name" type="text" value="${escapeHtml(col.name)}" placeholder="nombre" data-field="name">
        <select class="input sb-col-type" data-field="type">
          ${PG_TYPES.map(t => `<option value="${t.value}" ${col.type === t.value ? 'selected' : ''}>${t.label}</option>`).join('')}
        </select>
        <label class="sb-col-check" title="Primary Key">
          <input type="checkbox" ${col.pk ? 'checked' : ''} data-field="pk"> PK
        </label>
        <label class="sb-col-check" title="NOT NULL">
          <input type="checkbox" ${!col.nullable ? 'checked' : ''} data-field="nullable"> NN
        </label>
        <label class="sb-col-check" title="UNIQUE">
          <input type="checkbox" ${col.unique ? 'checked' : ''} data-field="unique"> UQ
        </label>
        <select class="input sb-col-default" data-field="default">
          ${DEFAULT_PRESETS.map(d => `<option value="${d.value}" ${col.default === d.value ? 'selected' : ''}>${d.label}</option>`).join('')}
          <option value="__custom__" ${!DEFAULT_PRESETS.find(d => d.value === col.default) && col.default ? 'selected' : ''}>(custom...)</option>
        </select>
        <input class="input sb-col-custom-default" type="text" value="${!DEFAULT_PRESETS.find(d => d.value === col.default) && col.default ? escapeHtml(col.default) : ''}" placeholder="custom" style="display:${!DEFAULT_PRESETS.find(d => d.value === col.default) && col.default ? '' : 'none'}; width:80px;">
        <button class="sb-col-del" data-cid="${col._id}" title="Eliminar">&times;</button>
      </div>
      ${isFk ? `
      <div class="sb-col-fk-row" data-cid="${col._id}">
        <i class="fa-solid fa-link"></i>
        <span>FK →</span>
        <select class="input sb-fk-table" data-field="fkTable">
          <option value="">(tabla...)</option>
          ${otherTables.map(t => `<option value="${t.name}" ${col.fkTable === t.name ? 'selected' : ''}>${t.name}</option>`).join('')}
        </select>
        <select class="input sb-fk-column" data-field="fkColumn">
          <option value="">(columna...)</option>
          ${(() => {
            const refTable = findTable(col.fkTable);
            if (!refTable) return '<option value="">-</option>';
            return refTable.columns.map(c => `<option value="${c.name}" ${col.fkColumn === c.name ? 'selected' : ''}>${c.name}</option>`).join('');
          })()}
        </select>
        <select class="input sb-fk-action" data-field="fkOnDelete">
          <option value="">ON DELETE</option>
          ${FK_ACTIONS.map(a => `<option value="${a}" ${col.fkOnDelete === a ? 'selected' : ''}>${a}</option>`).join('')}
        </select>
        <select class="input sb-fk-action" data-field="fkOnUpdate">
          <option value="">ON UPDATE</option>
          ${FK_ACTIONS.map(a => `<option value="${a}" ${col.fkOnUpdate === a ? 'selected' : ''}>${a}</option>`).join('')}
        </select>
        <button class="sb-fk-remove" data-cid="${col._id}" title="Quitar FK"><i class="fa-solid fa-xmark"></i></button>
      </div>` : ''}
    `;
  }

  function bindColumnEvents(table, otherTables) {
    /* Name, type, checks, default */
    tableEditor.querySelectorAll('.sb-col-row').forEach(row => {
      const cid = parseInt(row.dataset.cid);
      const col = table.columns.find(c => c._id === cid);
      if (!col) return;

      /* Name */
      row.querySelector('.sb-col-name').addEventListener('input', (e) => {
        col.name = e.target.value.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();
        generateSQL();
        saveState();
      });

      /* Type */
      row.querySelector('.sb-col-type').addEventListener('change', (e) => {
        col.type = e.target.value;
        generateSQL();
        saveState();
      });

      /* PK */
      row.querySelector('[data-field="pk"]').addEventListener('change', (e) => {
        col.pk = e.target.checked;
        if (col.pk) { col.nullable = false; col.unique = true; }
        renderTableEditor();
        generateSQL();
        saveState();
      });

      /* Nullable (inverted: checked = NOT NULL) */
      row.querySelector('[data-field="nullable"]').addEventListener('change', (e) => {
        col.nullable = !e.target.checked;
        generateSQL();
        saveState();
      });

      /* Unique */
      row.querySelector('[data-field="unique"]').addEventListener('change', (e) => {
        col.unique = e.target.checked;
        generateSQL();
        saveState();
      });

      /* Default preset */
      const defaultSelect = row.querySelector('.sb-col-default');
      const customInput = row.querySelector('.sb-col-custom-default');
      defaultSelect.addEventListener('change', (e) => {
        if (e.target.value === '__custom__') {
          customInput.style.display = '';
          customInput.focus();
          col.default = '';
        } else {
          customInput.style.display = 'none';
          col.default = e.target.value;
        }
        generateSQL();
        saveState();
      });
      customInput.addEventListener('input', (e) => {
        col.default = e.target.value;
        generateSQL();
        saveState();
      });

      /* Delete column */
      row.querySelector('.sb-col-del').addEventListener('click', () => {
        table.columns = table.columns.filter(c => c._id !== cid);
        renderTableEditor();
        generateSQL();
        saveState();
      });

      /* Add FK button (double-click on row) */
      if (!col.fkTable) {
        row.addEventListener('dblclick', () => {
          col.fkTable = '';
          col.fkColumn = '';
          renderTableEditor();
        });
      }
    });

    /* FK row events */
    tableEditor.querySelectorAll('.sb-col-fk-row').forEach(row => {
      const cid = parseInt(row.dataset.cid);
      const col = table.columns.find(c => c._id === cid);
      if (!col) return;

      row.querySelector('.sb-fk-table').addEventListener('change', (e) => {
        col.fkTable = e.target.value;
        col.fkColumn = '';
        renderTableEditor();
        generateSQL();
        saveState();
      });

      row.querySelector('.sb-fk-column').addEventListener('change', (e) => {
        col.fkColumn = e.target.value;
        generateSQL();
        saveState();
      });

      row.querySelector('[data-field="fkOnDelete"]').addEventListener('change', (e) => {
        col.fkOnDelete = e.target.value;
        generateSQL();
        saveState();
      });

      row.querySelector('[data-field="fkOnUpdate"]').addEventListener('change', (e) => {
        col.fkOnUpdate = e.target.value;
        generateSQL();
        saveState();
      });

      row.querySelector('.sb-fk-remove').addEventListener('click', () => {
        col.fkTable = '';
        col.fkColumn = '';
        col.fkOnDelete = 'CASCADE';
        col.fkOnUpdate = 'CASCADE';
        renderTableEditor();
        generateSQL();
        saveState();
      });
    });
  }

  /* ═══════════════════════════════════════════════════════
     RENDER: Indexes
     ═══════════════════════════════════════════════════════ */

  function renderIndexesSection(table, otherTables) {
    if (!table.indexes || table.indexes.length === 0) {
      return `
        <div class="sb-indexes-section">
          <div class="sb-te-columns-header">
            <span>Índices</span>
            <button class="btn btn--ghost btn--sm" id="sb-add-index"><i class="fa-solid fa-plus"></i> Índice</button>
          </div>
          <div class="sb-no-tables" style="font-size:12px;">Sin índices personalizados</div>
        </div>`;
    }

    return `
      <div class="sb-indexes-section">
        <div class="sb-te-columns-header">
          <span>Índices</span>
          <button class="btn btn--ghost btn--sm" id="sb-add-index"><i class="fa-solid fa-plus"></i> Índice</button>
        </div>
        ${table.indexes.map((idx, i) => `
          <div class="sb-index-row">
            <i class="fa-solid fa-bolt"></i>
            <input class="input" type="text" value="${(idx.columns || []).join(', ')}" data-idx="${i}" placeholder="col1, col2" style="flex:1;" title="Columnas separadas por coma">
            <label class="sb-col-check" title="UNIQUE index">
              <input type="checkbox" ${idx.unique ? 'checked' : ''} data-idx-unique="${i}"> UQ
            </label>
            <button class="sb-col-del" data-idx-del="${i}" title="Eliminar">&times;</button>
          </div>
        `).join('')}
      </div>`;
  }

  function bindIndexEvents(table, otherTables) {
    tableEditor.querySelectorAll('[data-idx]').forEach(input => {
      input.addEventListener('input', (e) => {
        const i = parseInt(e.target.dataset.idx);
        if (table.indexes[i]) {
          table.indexes[i].columns = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
          generateSQL();
          saveState();
        }
      });
    });
    tableEditor.querySelectorAll('[data-idx-unique]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const i = parseInt(e.target.dataset.idxUnique);
        if (table.indexes[i]) {
          table.indexes[i].unique = e.target.checked;
          generateSQL();
          saveState();
        }
      });
    });
    tableEditor.querySelectorAll('[data-idx-del]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const i = parseInt(e.target.dataset.idxDel);
        table.indexes.splice(i, 1);
        renderTableEditor();
        generateSQL();
        saveState();
      });
    });
    const addIdxBtn = document.getElementById('sb-add-index');
    if (addIdxBtn) {
      addIdxBtn.addEventListener('click', () => {
        if (!table.indexes) table.indexes = [];
        table.indexes.push({ columns: [], unique: false });
        renderTableEditor();
        saveState();
      });
    }
  }

  /* ═══════════════════════════════════════════════════════
     RENDER: Global Options
     ═══════════════════════════════════════════════════════ */

  function renderGlobalOptions() {
    globalOptions.innerHTML = `
      <div class="sb-options">
        <label class="sb-opt"><input type="checkbox" id="sb-opt-drop" ${state.dropIfExists ? 'checked' : ''}> DROP IF EXISTS</label>
        <label class="sb-opt"><input type="checkbox" id="sb-opt-grants" ${state.grantsEnabled ? 'checked' : ''}> GRANTs (Supabase roles)</label>
        <label class="sb-opt"><input type="checkbox" id="sb-opt-rls" ${state.rlsEnabled ? 'checked' : ''}> Enable RLS</label>
        <label class="sb-opt"><input type="checkbox" id="sb-opt-policies" ${state.includePolicies ? 'checked' : ''}> Basic policies</label>
        <label class="sb-opt"><input type="checkbox" id="sb-opt-indexes" ${state.includeIndexes ? 'checked' : ''}> Índices</label>
      </div>
    `;

    document.getElementById('sb-opt-drop').addEventListener('change', (e) => { state.dropIfExists = e.target.checked; generateSQL(); saveState(); });
    document.getElementById('sb-opt-grants').addEventListener('change', (e) => { state.grantsEnabled = e.target.checked; generateSQL(); saveState(); });
    document.getElementById('sb-opt-rls').addEventListener('change', (e) => { state.rlsEnabled = e.target.checked; generateSQL(); saveState(); });
    document.getElementById('sb-opt-policies').addEventListener('change', (e) => { state.includePolicies = e.target.checked; generateSQL(); saveState(); });
    document.getElementById('sb-opt-indexes').addEventListener('change', (e) => { state.includeIndexes = e.target.checked; generateSQL(); saveState(); });
  }

  /* ═══════════════════════════════════════════════════════
     SQL GENERATOR
     ═══════════════════════════════════════════════════════ */

  function generateSQL() {
    if (state.tables.length === 0) {
      sqlOutput.innerHTML = '<span class="sb-placeholder">El SQL generado aparecerá acá...</span>';
      copyBtn.disabled = true;
      downloadBtn.disabled = true;
      return;
    }

    const parts = [];

    for (const table of state.tables) {
      if (!table.name) continue;
      const schema = table.schema || 'public';
      const fqtn = `${schema}.${table.name}`;

      /* DROP IF EXISTS */
      if (state.dropIfExists) {
        parts.push(`DROP TABLE IF EXISTS ${fqtn};\n`);
      }

      /* CREATE TABLE */
      const colDefs = [];
      const fkDefs = [];

      for (const col of table.columns) {
        if (!col.name) continue;
        let def = `  ${col.name} ${col.type.toUpperCase()}`;

        if (col.pk) def += ' PRIMARY KEY';
        else if (col.unique) def += ' UNIQUE';

        if (!col.nullable && !col.pk) def += ' NOT NULL';

        if (col.default) def += ` DEFAULT ${col.default}`;

        colDefs.push(def);

        /* Foreign keys */
        if (col.fkTable && col.fkColumn) {
          let fk = `  CONSTRAINT ${table.name}_${col.name}_fkey FOREIGN KEY (${col.name}) REFERENCES ${schema}.${col.fkTable}(${col.fkColumn})`;
          if (col.fkOnDelete) fk += ` ON DELETE ${col.fkOnDelete}`;
          if (col.fkOnUpdate) fk += ` ON UPDATE ${col.fkOnUpdate}`;
          fkDefs.push(fk);
        }
      }

      if (colDefs.length > 0) {
        let sql = `CREATE TABLE ${fqtn} (\n${colDefs.join(',\n')}`;
        if (fkDefs.length > 0) sql += ',\n' + fkDefs.join(',\n');
        sql += '\n);';
        parts.push(sql);
      }

      /* Comments */
      parts.push('');

      /* Indexes */
      if (state.includeIndexes && table.indexes && table.indexes.length > 0) {
        for (const idx of table.indexes) {
          if (!idx.columns || idx.columns.length === 0) continue;
          const uniq = idx.unique ? 'UNIQUE ' : '';
          const idxName = `${table.name}_${idx.columns.join('_')}_idx`;
          parts.push(`CREATE ${uniq}INDEX IF NOT EXISTS ${idxName} ON ${fqtn} (${idx.columns.join(', ')});`);
        }
        parts.push('');
      }

      /* GRANTs */
      if (state.grantsEnabled) {
        parts.push(`-- Grants for ${table.name} (Supabase roles)`);
        parts.push(`GRANT SELECT ON ${fqtn} TO anon;`);
        parts.push(`GRANT SELECT, INSERT, UPDATE, DELETE ON ${fqtn} TO authenticated;`);
        parts.push(`GRANT ALL ON ${fqtn} TO service_role;`);
        parts.push('');
      }

      /* RLS */
      if (state.rlsEnabled) {
        parts.push(`-- Enable RLS for ${table.name}`);
        parts.push(`ALTER TABLE ${fqtn} ENABLE ROW LEVEL SECURITY;`);
        parts.push('');
      }

      /* Policies */
      if (state.includePolicies && state.rlsEnabled) {
        const hasUserId = table.columns.some(c => c.name === 'user_id' || c.name === 'author_id');
        if (hasUserId) {
          const userCol = table.columns.find(c => c.name === 'user_id' || c.name === 'author_id').name;
          parts.push(`-- Policies for ${table.name}`);
          parts.push(`CREATE POLICY "Authenticated users can view all ${table.name}" ON ${fqtn}`);
          parts.push(`  FOR SELECT TO authenticated`);
          parts.push(`  USING (true);`);
          parts.push('');
          parts.push(`CREATE POLICY "Users can insert own ${table.name}" ON ${fqtn}`);
          parts.push(`  FOR INSERT TO authenticated`);
          parts.push(`  WITH CHECK (auth.uid() = ${userCol});`);
          parts.push('');
          parts.push(`CREATE POLICY "Users can update own ${table.name}" ON ${fqtn}`);
          parts.push(`  FOR UPDATE TO authenticated`);
          parts.push(`  USING (auth.uid() = ${userCol});`);
          parts.push('');
          parts.push(`CREATE POLICY "Users can delete own ${table.name}" ON ${fqtn}`);
          parts.push(`  FOR DELETE TO authenticated`);
          parts.push(`  USING (auth.uid() = ${userCol});`);
          parts.push('');
        } else {
          parts.push(`-- Policies for ${table.name}`);
          parts.push(`CREATE POLICY "Authenticated users can view all ${table.name}" ON ${fqtn}`);
          parts.push(`  FOR SELECT TO authenticated`);
          parts.push(`  USING (true);`);
          parts.push('');
          parts.push(`CREATE POLICY "Authenticated users can insert ${table.name}" ON ${fqtn}`);
          parts.push(`  FOR INSERT TO authenticated`);
          parts.push(`  WITH CHECK (true);`);
          parts.push('');
          parts.push(`CREATE POLICY "Authenticated users can update ${table.name}" ON ${fqtn}`);
          parts.push(`  FOR UPDATE TO authenticated`);
          parts.push(`  USING (true);`);
          parts.push('');
          parts.push(`CREATE POLICY "Authenticated users can delete ${table.name}" ON ${fqtn}`);
          parts.push(`  FOR DELETE TO authenticated`);
          parts.push(`  USING (true);`);
          parts.push('');
        }
      }
    }

    const sql = parts.join('\n');
    sqlOutput.textContent = sql;
    copyBtn.disabled = false;
    downloadBtn.disabled = false;
    return sql;
  }

  /* ═══════════════════════════════════════════════════════
     TSV IMPORT
     ═══════════════════════════════════════════════════════ */

  function detectColumnType(values) {
    if (!values || values.length === 0) return 'text';
    const nonEmpty = values.filter(v => v.trim() !== '');
    if (nonEmpty.length === 0) return 'text';

    /* Boolean */
    const boolVals = nonEmpty.map(v => v.trim().toLowerCase());
    if (boolVals.every(v => ['true', 'false', '1', '0', 'yes', 'no', 'si', 'no'].includes(v))) {
      return 'boolean';
    }

    /* UUID */
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (nonEmpty.every(v => uuidRegex.test(v.trim()))) {
      return 'uuid';
    }

    /* Integer */
    const intRegex = /^-?\d+$/;
    if (nonEmpty.every(v => intRegex.test(v.trim()))) {
      return 'integer';
    }

    /* Numeric (decimal) */
    const numRegex = /^-?\d+([.,]\d+)?$/;
    if (nonEmpty.every(v => numRegex.test(v.trim()))) {
      return 'numeric';
    }

    /* Date */
    const dateRegex = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}/;
    if (nonEmpty.every(v => dateRegex.test(v.trim()))) {
      return 'date';
    }

    /* Timestamp */
    const tsRegex = /^\d{4}[-/]\d{1,2}[-/]\d{1,2}[\sT]/;
    if (nonEmpty.every(v => tsRegex.test(v.trim()))) {
      return 'timestamptz';
    }

    return 'text';
  }

  function parseTSV(text) {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length === 0) return null;

    const firstLine = lines[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;

    const delimiter = tabCount >= commaCount && tabCount > 0 ? '\t' : ',';

    const rows = lines.map(line => {
      if (delimiter === ',') {
        /* Simple CSV parse */
        const cells = [];
        let current = '', inQ = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (inQ) {
            if (ch === '"' && line[i+1] === '"') { current += '"'; i++; }
            else if (ch === '"') inQ = false;
            else current += ch;
          } else {
            if (ch === '"') inQ = true;
            else if (ch === ',') { cells.push(current); current = ''; }
            else current += ch;
          }
        }
        cells.push(current);
        return cells.map(c => c.trim());
      }
      return line.split('\t').map(c => c.trim());
    });

    return rows;
  }

  function importFromTSV() {
    const raw = importInput.value;
    if (!raw.trim()) return;

    const rows = parseTSV(raw);
    if (!rows || rows.length < 1) {
      MiniDevTools.showToast('No se pudo parsear los datos', 'error');
      return;
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const colCount = headers.length;

    /* Build columns with auto-detected types */
    const columns = [];
    columns.push(newColumn({
      name: 'id',
      type: 'uuid',
      nullable: false,
      unique: true,
      pk: true,
      default: 'gen_random_uuid()',
    }));

    for (let c = 0; c < colCount; c++) {
      const colName = headers[c]
        ? headers[c].replace(/[^a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ ]/g, '').trim().toLowerCase().replace(/\s+/g, '_').replace(/_+$/, '')
        : 'column_' + (c + 1);
      const colValues = dataRows.map(r => r[c] || '');
      const colType = detectColumnType(colValues);
      const allFilled = colValues.every(v => v.trim() !== '');

      columns.push(newColumn({
        name: colName,
        type: colType,
        nullable: !allFilled,
        unique: false,
        pk: false,
        default: '',
      }));
    }

    /* Add created_at */
    columns.push(newColumn({
      name: 'created_at',
      type: 'timestamptz',
      nullable: false,
      unique: false,
      pk: false,
      default: 'now()',
    }));

    const tableName = importName.value.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() || 'imported_table';

    const table = newTable(tableName);
    table.columns = columns;
    state.tables.push(table);
    state.activeTable = table._id;

    /* Switch to builder tab */
    switchTab('builder');
    renderTablesList();
    renderTableEditor();
    renderGlobalOptions();
    generateSQL();
    saveState();

    MiniDevTools.showToast(`Tabla "${tableName}" creada con ${colCount} columnas detectadas`, 'success');
  }

  /* ═══════════════════════════════════════════════════════
     EVENTS: ADD TABLE / TEMPLATES
     ═══════════════════════════════════════════════════════ */

  addTableBtn.addEventListener('click', () => {
    const table = newTable();
    table.columns.push(newColumn({ name: 'id', type: 'uuid', nullable: false, unique: true, pk: true, default: 'gen_random_uuid()' }));
    table.columns.push(newColumn({ name: 'created_at', type: 'timestamptz', nullable: false, unique: false, pk: false, default: 'now()' }));
    state.tables.push(table);
    state.activeTable = table._id;
    renderTablesList();
    renderTableEditor();
    generateSQL();
    saveState();
  });

  document.querySelectorAll('.sb-tpl-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tplName = btn.dataset.tpl;
      const tpl = TEMPLATES[tplName];
      if (!tpl) return;

      /* Deep clone */
      const table = newTable(tpl.name + '_' + (state.tables.filter(t => t.name.startsWith(tpl.name)).length || ''));
      table.name = tpl.name;
      table.columns = tpl.columns.map(c => newColumn(c));
      table.indexes = (tpl.indexes || []).map(i => ({ ...i, columns: [...i.columns] }));

      state.tables.push(table);
      state.activeTable = table._id;
      renderTablesList();
      renderTableEditor();
      generateSQL();
      saveState();
    });
  });

  /* ═══════════════════════════════════════════════════════
     EVENTS: IMPORT
     ═══════════════════════════════════════════════════════ */

  importInput.addEventListener('input', () => {
    importBtn.disabled = !importInput.value.trim();
  });

  importBtn.addEventListener('click', importFromTSV);

  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      importInput.value = ev.target.result;
      importBtn.disabled = false;
    };
    reader.readAsText(file);
    importFile.value = '';
  });

  /* Drag & drop on import textarea */
  importInput.addEventListener('dragover', (e) => {
    e.preventDefault();
    importInput.classList.add('em-textarea--dragover');
  });
  importInput.addEventListener('dragleave', () => {
    importInput.classList.remove('em-textarea--dragover');
  });
  importInput.addEventListener('drop', (e) => {
    e.preventDefault();
    importInput.classList.remove('em-textarea--dragover');
    const file = e.dataTransfer.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        importInput.value = ev.target.result;
        importBtn.disabled = false;
      };
      reader.readAsText(file);
    }
  });

  function loadImportSample() {
    importInput.value = [
      'Nombre\tEmail\tEdad\tCiudad\tActivo',
      'Ana García\tana@test.com\t30\tBuenos Aires\ttrue',
      'Juan Pérez\tjuan@test.com\t25\tCórdoba\ttrue',
      'María López\tmaria@test.com\t28\tRosario\tfalse',
      'Carlos Ruiz\tcarlos@test.com\t35\tMendoza\ttrue',
      'Laura Fernández\tlaura@test.com\t\tLa Plata\ttrue',
    ].join('\n');
    importName.value = 'users';
    importBtn.disabled = false;
  }

  importSampleBtn.addEventListener('click', loadImportSample);

  /* ═══════════════════════════════════════════════════════
     EVENTS: COPY & DOWNLOAD
     ═══════════════════════════════════════════════════════ */

  copyBtn.addEventListener('click', () => {
    const sql = sqlOutput.textContent;
    if (!sql || sql.includes('aparecerá acá')) return;
    MiniDevTools.copyToClipboard(sql, 'SQL copiado al portapapeles');
  });

  downloadBtn.addEventListener('click', () => {
    const sql = sqlOutput.textContent;
    if (!sql || sql.includes('aparecerá acá')) return;
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.sql';
    a.click();
    URL.revokeObjectURL(url);
  });

  /* ═══════════════════════════════════════════════════════
     PERSISTENCE
     ═══════════════════════════════════════════════════════ */

  function saveState() {
    ToolStorage.setField('sql-schema-builder', 'state', { ...state });
  }

  /* ═══════════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════════ */

  renderTablesList();
  renderTableEditor();
  renderGlobalOptions();
  generateSQL();
};

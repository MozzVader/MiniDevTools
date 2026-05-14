/* ═══════════════════════════════════════════════════════════════
   Boilerplate Generator — Starter templates para proyectos
   Templates: HTML5, HTML+CSS+JS, React SPA, Vue SPA,
   Express API, Next.js Page, Python Flask.
   Usa ToolStorage para persistir selección y opciones.
   ═══════════════════════════════════════════════════════════════ */

function render_boilerplate_generator(container, toolMeta) {

  /* ─── State ─── */
  let selectedTemplate = ToolStorage.getField('boilerplate-generator', 'template', 'html5');
  let generatedCode = '';

  /* ─── Templates catalog ─── */
  const templates = [
    { id: 'html5',          label: 'HTML5',              icon: 'fa-brands fa-html5',       lang: 'HTML' },
    { id: 'html-css-js',    label: 'HTML + CSS + JS',    icon: 'fa-brands fa-html5',       lang: 'HTML' },
    { id: 'react-spa',      label: 'React SPA',          icon: 'fa-brands fa-react',       lang: 'JSX' },
    { id: 'vue-spa',        label: 'Vue SPA',            icon: 'fa-brands fa-vuejs',       lang: 'Vue' },
    { id: 'nextjs-page',    label: 'Next.js Page',       icon: 'fa-solid fa-n',            lang: 'JSX' },
    { id: 'express-api',    label: 'Express API',        icon: 'fa-brands fa-node-js',     lang: 'JS' },
    { id: 'react-component',label: 'React Component',    icon: 'fa-brands fa-react',       lang: 'JSX' },
    { id: 'python-flask',   label: 'Python Flask',       icon: 'fa-brands fa-python',      lang: 'Python' },
  ];

  /* ─── Options ─── */
  const options = [
    { id: 'meta-viewport',  label: 'Viewport meta',         default: true,  applies: ['html5', 'html-css-js'] },
    { id: 'meta-desc',      label: 'Description meta',       default: true,  applies: ['html5', 'html-css-js'] },
    { id: 'font-awesome',   label: 'Font Awesome CDN',       default: false, applies: ['html5', 'html-css-js'] },
    { id: 'normalize-css',  label: 'Normalize CSS',          default: false, applies: ['html5', 'html-css-js'] },
    { id: 'typescript',     label: 'TypeScript',             default: false, applies: ['react-spa', 'nextjs-page', 'express-api', 'react-component'] },
    { id: 'comments',       label: 'Comentarios explicativos',default: true,  applies: ['*'] },
  ];

  /* ─── Read saved options ─── */
  const savedOptions = ToolStorage.load('boilerplate-generator')?.options || {};
  options.forEach(opt => {
    if (opt.id in savedOptions) {
      opt.value = savedOptions[opt.id];
    } else {
      opt.value = opt.default;
    }
  });

  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title"><i class="${toolMeta.icon}" style="margin-right:8px;"></i> ${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <!-- Template selector -->
        <label class="label">Plantilla</label>
        <div class="bl-templates">
          ${templates.map(t => `
            <button class="bl-template-btn ${t.id === selectedTemplate ? 'bl-template-btn--active' : ''}" data-id="${t.id}" type="button">
              <i class="${t.icon}"></i>
              <span>${t.label}</span>
            </button>
          `).join('')}
        </div>

        <!-- Options -->
        <div class="bl-options" id="bl-options">
          <label class="label" style="margin-bottom:8px;">Opciones</label>
          <div class="bl-options-grid">
            ${options.map(opt => `
              <label class="bl-option" data-option="${opt.id}">
                <input type="checkbox" ${opt.value ? 'checked' : ''}>
                <span class="bl-option__label">${opt.label}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Generate + Copy -->
        <div style="display:flex; gap:8px; margin-top:16px;">
          <button class="btn btn--primary" id="bl-generate">
            <i class="fa-solid fa-wand-magic-sparkles"></i> Generar
          </button>
          <button class="btn btn--secondary" id="bl-copy" disabled>
            <i class="fa-regular fa-copy"></i> Copiar
          </button>
        </div>

        <!-- Output -->
        <div id="bl-output-wrap" style="margin-top:16px; display:none;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <label class="label" style="margin-bottom:0;" id="bl-output-lang"></label>
            <span style="font-size:12px; color:var(--text-muted);" id="bl-output-lines"></span>
          </div>
          <div class="code-output bl-output" id="bl-output" style="min-height:200px; max-height:600px; overflow:auto;"></div>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const templateBtns = container.querySelectorAll('.bl-template-btn');
  const optionCheckboxes = container.querySelectorAll('.bl-option input');
  const generateBtn = document.getElementById('bl-generate');
  const copyBtn = document.getElementById('bl-copy');
  const outputWrap = document.getElementById('bl-output-wrap');
  const outputEl = document.getElementById('bl-output');
  const langLabel = document.getElementById('bl-output-lang');
  const linesLabel = document.getElementById('bl-output-lines');
  const optionsGrid = container.querySelector('.bl-options-grid');

  /* ─── Template Selection ─── */
  function selectTemplate(id) {
    selectedTemplate = id;
    templateBtns.forEach(b => b.classList.toggle('bl-template-btn--active', b.dataset.id === id));
    ToolStorage.setField('boilerplate-generator', 'template', id);
    updateVisibleOptions();
  }

  function updateVisibleOptions() {
    options.forEach(opt => {
      const applies = opt.applies.includes('*') || opt.applies.includes(selectedTemplate);
      const label = container.querySelector(`.bl-option[data-option="${opt.id}"]`);
      if (label) label.style.display = applies ? '' : 'none';
    });
  }

  templateBtns.forEach(btn => {
    btn.addEventListener('click', () => selectTemplate(btn.dataset.id));
  });

  optionCheckboxes.forEach(cb => {
    cb.addEventListener('change', saveOptions);
  });

  function saveOptions() {
    const opts = {};
    options.forEach(opt => {
      const cb = container.querySelector(`.bl-option[data-option="${opt.id}"] input`);
      if (cb) opt.value = cb.checked;
      opts[opt.id] = opt.value;
    });
    ToolStorage.setField('boilerplate-generator', 'options', opts);
  }

  function getOpt(id) {
    const cb = container.querySelector(`.bl-option[data-option="${id}"] input`);
    return cb ? cb.checked : false;
  }

  /* ─── Generate ─── */
  function generate() {
    const gen = generators[selectedTemplate];
    if (!gen) return;

    const withComments = getOpt('comments');
    generatedCode = gen({ opts: options.reduce((m, o) => { m[o.id] = o.value; return m; }, {}), comments: withComments });

    // Highlight
    outputEl.innerHTML = highlightCode(generatedCode, selectedTemplate);
    langLabel.textContent = templates.find(t => t.id === selectedTemplate).lang;
    linesLabel.textContent = generatedCode.split('\n').length + ' lineas';

    outputWrap.style.display = '';
    copyBtn.disabled = false;
  }

  /* ─── Copy ─── */
  copyBtn.addEventListener('click', () => {
    if (!generatedCode) return;
    MiniDevTools.copyToClipboard(generatedCode, 'Boilerplate copiado!');
  });

  generateBtn.addEventListener('click', generate);

  /* ─── Simple syntax highlight ─── */
  function highlightCode(code, tplId) {
    let escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Comments (single-line // and block /* */)
    escaped = escaped.replace(/(\/\/[^\n]*)/g, '<span class="bl-cmt">$1</span>');
    escaped = escaped.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="bl-cmt">$1</span>');
    // Python comments
    escaped = escaped.replace(/(#[^\n]*)/g, '<span class="bl-cmt">$1</span>');

    // Strings
    escaped = escaped.replace(/(&quot;(?:[^&]|&(?!quot;))*?&quot;)/g, '<span class="bl-str">$1</span>');
    escaped = escaped.replace(/(&#39;(?:[^&]|&(?!#39;))*?&#39;)/g, '<span class="bl-str">$1</span>');

    // HTML/JSX tags
    if (['html5', 'html-css-js', 'react-spa', 'nextjs-page', 'react-component'].includes(tplId)) {
      escaped = escaped.replace(/(&lt;\/?)([\w-]+)/g, '<span class="bl-bkt">$1</span><span class="bl-tag">$2</span>');
      escaped = escaped.replace(/(\/?)(&gt;)/g, '<span class="bl-bkt">$1$2</span>');
    }

    // Keywords
    const keywords = ['import', 'export', 'default', 'from', 'const', 'let', 'var', 'function', 'return', 'class', 'extends', 'if', 'else', 'async', 'await', 'try', 'catch', 'require', 'module', 'def', 'print', 'app', 'self'];
    keywords.forEach(kw => {
      const re = new RegExp('\\b(' + kw + ')\\b', 'g');
      escaped = escaped.replace(re, (match, p1, offset, str) => {
        // Don't highlight inside already-highlighted spans
        const before = str.substring(0, offset);
        if ((before.match(/<span/g) || []).length > (before.match(/<\/span>/g) || []).length) return match;
        return '<span class="bl-kw">' + p1 + '</span>';
      });
    });

    return escaped;
  }

  /* ═══════════════════════════════════════════════════════════════
     TEMPLATE GENERATORS
     ═══════════════════════════════════════════════════════════════ */

  const generators = {

    /* ── HTML5 (esqueleto minimo con archivos externos) ── */
    html5({ opts, comments }) {
      const c = comments;
      let code = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">`;
      if (opts['meta-viewport']) code += `
  <meta name="viewport" content="width=device-width, initial-scale=1.0">`;
      if (opts['meta-desc']) code += `
  <meta name="description" content="">`;
      code += `
  <title>Mi Proyecto</title>
  <link rel="stylesheet" href="styles.css">`;
      if (opts['normalize-css']) code += `
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css">`;
      if (opts['font-awesome']) code += `
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">`;
      code += `
</head>
<body>

${c ? '  <!-- Tu contenido va aqui -->\n' : ''}  <main>

  </main>

  <script src="app.js"><\/script>
</body>
</html>`;
      return code;
    },

    /* ── HTML + CSS + JS (todo inline, listo para usar) ── */
    'html-css-js'({ opts, comments }) {
      const c = comments;
      let code = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">`;
      if (opts['meta-viewport']) code += `
  <meta name="viewport" content="width=device-width, initial-scale=1.0">`;
      if (opts['meta-desc']) code += `
  <meta name="description" content="">`;
      code += `
  <title>Mi Proyecto</title>`;
      if (opts['normalize-css']) code += `
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css">`;
      if (opts['font-awesome']) code += `
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">`;
      code += `
${c ? '  <!-- Estilos inline -->\n' : ''}  <style>
${c ? '    /* Reset y estilos base */\n' : ''}    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background: #f8fafc;
    }

    main {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    h1 { margin-bottom: 1rem; }
    p  { margin-bottom: 0.5rem; }
  </style>
</head>
<body>

${c ? '  <!-- Contenido principal -->\n' : ''}  <main>
    <h1>Hello World</h1>
    <p>Listo para desarrollar.</p>
  </main>

${c ? '  <!-- Script inline -->\n' : ''}  <script>
${c ? '    // Inicializacion cuando el DOM este listo\n' : ''}    document.addEventListener('DOMContentLoaded', () => {
      console.log('App lista');
    });
  <\/script>
</body>
</html>`;
      return code;
    },

    /* ── React SPA ── */
    'react-spa'({ opts, comments }) {
      const ts = opts.typescript;
      const ext = ts ? 'tsx' : 'jsx';
      const c = comments;
      return `import React from 'react';
import ReactDOM from 'react-dom/client';
${c ? '// import App from \'./App\';\n\n' : ''}${c ? '// Componente principal\n' : ''}function App() {
  return (
    <div>
      <h1>Mi App React</h1>
      <p>Listo para desarrollar.</p>
    </div>
  );
}

${c ? '// Render\n' : ''}const root = ReactDOM.createRoot(
  document.getElementById('root')${ts ? ' as HTMLElement' : ''}
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
    },

    /* ── Vue SPA ── */
    'vue-spa'({ opts, comments }) {
      const c = comments;
      return `<template>
  <div>
    <h1>Mi App Vue</h1>
    <p>{{ message }}</p>
  </div>
</template>

<script${opts.typescript ? ' lang="ts"' : ''}>
${c ? '// Composition API\n' : ''}import { ref } from 'vue';

export default {
  setup() {
    const message = ref('Listo para desarrollar.');
    return { message };
  }
};
${'</'}script>

<style scoped>
</style>`;
    },

    /* ── Next.js Page ── */
    'nextjs-page'({ opts, comments }) {
      const ts = opts.typescript;
      const ext = ts ? 'tsx' : 'jsx';
      const c = comments;
      return `${c ? '// Next.js App Router Page\n' : ''}export default function Home() {
  return (
    <main>
      <h1>Mi Pagina Next.js</h1>
      <p>Listo para desarrollar.</p>
    </main>
  );
}`;
    },

    /* ── Express API ── */
    'express-api'({ opts, comments }) {
      const ts = opts.typescript;
      const c = comments;
      return `${c ? '// Express REST API\n' : ''}${c ? '// npm install express\n\n' : ''}const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

${c ? '// Middleware\n' : ''}app.use(express.json());

${c ? '// Rutas\n' : ''}app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/items', (req, res) => {
  res.json({ data: [] });
});

app.post('/api/items', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'El campo "name" es requerido' });
  }
  res.status(201).json({ id: 1, name, createdAt: new Date().toISOString() });
});

${c ? '// 404 handler\n' : ''}app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

${c ? '// Error handler\n' : ''}app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(\`Server corriendo en http://localhost:\${PORT}\`);
});`;
    },

    /* ── React Component ── */
    'react-component'({ opts, comments }) {
      const ts = opts.typescript;
      const c = comments;
      return `${c ? '// Componente React reutilizable\n' : ''}${ts ? 'interface Props {\n  title: string;\n  children?: React.ReactNode;\n}\n\n' : ''}export default function Card${ts ? '(props: Props)' : ''}(${ts ? '{ title, children }' : ''}) {
  return (
    <div className="card">
      <h2>${ts ? '{title}' : 'props.title'}</h2>
      <div className="card-body">
        ${ts ? '{children}' : '{props.children}'}
      </div>
    </div>
  );
}`;
    },

    /* ── Python Flask ── */
    'python-flask'({ opts, comments }) {
      const c = comments;
      return `${c ? '# Flask REST API\n' : ''}${c ? '# pip install flask\n\n' : ''}from flask import Flask, jsonify, request

app = Flask(__name__)

${c ? '# Rutas\n' : ''}@app.route('/api/health')
def health():
    return jsonify({"status": "ok"})

@app.route('/api/items', methods=['GET'])
def get_items():
    return jsonify({"data": []})

@app.route('/api/items', methods=['POST'])
def create_item():
    data = request.get_json()
    if not data or 'name' not in data:
        return jsonify({"error": "El campo 'name' es requerido"}), 400
    return jsonify({"id": 1, "name": data["name"]}), 201

${c ? '# Error handlers\n' : ''}@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Ruta no encontrada"}), 404

@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Error interno del servidor"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=3000)`;
    }
  };

  /* ─── Init ─── */
  updateVisibleOptions();
  generate();
}

/* Registro global para carga clasica (fallback) */
window['render_boilerplate-generator'] = render_boilerplate_generator;

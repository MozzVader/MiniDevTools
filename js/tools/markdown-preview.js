/* ═══════════════════════════════════════════════════════════════
   Markdown Previewer — Editor split-pane con preview en vivo
   Parser MD propio (zero dependencias).
   Soporta: headers, bold, italic, strikethrough, links, images,
   inline code, code blocks, lists, task lists, blockquotes,
   tables, horizontal rules.
   Usa ToolStorage para persistir contenido.
   ═══════════════════════════════════════════════════════════════ */

function render_markdown_preview(container, toolMeta) {

  /* ─── State ─── */
  const savedContent = ToolStorage.getField('markdown-preview', 'content', '');
  let rawMarkdown = savedContent || getDefaultContent();

  /* ─── Render UI ─── */
  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title"><i class="${toolMeta.icon}" style="margin-right:8px;"></i>${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <!-- Toolbar -->
        <div class="md-toolbar">
          <button class="md-toolbar__btn" data-action="h1" title="Heading 1"><b>H1</b></button>
          <button class="md-toolbar__btn" data-action="h2" title="Heading 2"><b>H2</b></button>
          <button class="md-toolbar__btn" data-action="h3" title="Heading 3"><b>H3</b></button>
          <div class="md-toolbar__sep"></div>
          <button class="md-toolbar__btn" data-action="bold" title="Bold (Ctrl+B)"><i class="fa-solid fa-bold"></i></button>
          <button class="md-toolbar__btn" data-action="italic" title="Italic (Ctrl+I)"><i class="fa-solid fa-italic"></i></button>
          <button class="md-toolbar__btn" data-action="strike" title="Strikethrough"><i class="fa-solid fa-strikethrough"></i></button>
          <div class="md-toolbar__sep"></div>
          <button class="md-toolbar__btn" data-action="link" title="Link"><i class="fa-solid fa-link"></i></button>
          <button class="md-toolbar__btn" data-action="image" title="Image"><i class="fa-solid fa-image"></i></button>
          <div class="md-toolbar__sep"></div>
          <button class="md-toolbar__btn" data-action="code" title="Inline code"><i class="fa-solid fa-code"></i></button>
          <button class="md-toolbar__btn" data-action="codeblock" title="Code block"><i class="fa-solid fa-terminal"></i></button>
          <div class="md-toolbar__sep"></div>
          <button class="md-toolbar__btn" data-action="ul" title="Unordered list"><i class="fa-solid fa-list-ul"></i></button>
          <button class="md-toolbar__btn" data-action="ol" title="Ordered list"><i class="fa-solid fa-list-ol"></i></button>
          <button class="md-toolbar__btn" data-action="task" title="Task list"><i class="fa-solid fa-square-check"></i></button>
          <div class="md-toolbar__sep"></div>
          <button class="md-toolbar__btn" data-action="quote" title="Blockquote"><i class="fa-solid fa-quote-left"></i></button>
          <button class="md-toolbar__btn" data-action="table" title="Table"><i class="fa-solid fa-table"></i></button>
          <button class="md-toolbar__btn" data-action="hr" title="Horizontal rule"><i class="fa-solid fa-minus"></i></button>
        </div>

        <!-- Split pane -->
        <div class="md-split">
          <!-- Editor -->
          <div class="md-editor">
            <div class="md-editor__label">
              <span><i class="fa-solid fa-pen-to-square" style="margin-right:4px;"></i> Editor</span>
              <span class="md-editor__stats" id="md-stats"></span>
            </div>
            <textarea class="md-editor__textarea" id="md-input" placeholder="Escribe tu markdown aqui..." spellcheck="false">${escapeHtml(rawMarkdown)}</textarea>
          </div>
          <!-- Preview -->
          <div class="md-preview">
            <div class="md-preview__label">
              <i class="fa-solid fa-eye" style="margin-right:4px;"></i> Preview
            </div>
            <div class="md-preview__content" id="md-preview"></div>
          </div>
        </div>

        <!-- Actions -->
        <div class="md-actions">
          <button class="btn btn--primary" id="md-copy-md">
            <i class="fa-regular fa-copy"></i> Copiar Markdown
          </button>
          <button class="btn btn--secondary" id="md-copy-html">
            <i class="fa-solid fa-code"></i> Copiar HTML
          </button>
          <button class="btn btn--ghost btn--sm" id="md-clear" title="Limpiar todo">
            <i class="fa-solid fa-trash-can"></i>
          </button>
          <span class="md-actions__info" id="md-info"></span>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const textarea   = document.getElementById('md-input');
  const preview    = document.getElementById('md-preview');
  const statsEl    = document.getElementById('md-stats');
  const infoEl     = document.getElementById('md-info');
  const copyMdBtn  = document.getElementById('md-copy-md');
  const copyHtmlBtn = document.getElementById('md-copy-html');
  const clearBtn   = document.getElementById('md-clear');
  const toolbarBtns = container.querySelectorAll('.md-toolbar__btn');

  /* ─── Preview Loop ─── */
  let debounceTimer = null;

  function scheduleUpdate() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(updatePreview, 80);
  }

  function updatePreview() {
    rawMarkdown = textarea.value;
    const html = parseMarkdown(rawMarkdown);
    if (!rawMarkdown.trim()) {
      preview.innerHTML = '<div class="md-empty">El preview aparecera aqui...</div>';
    } else {
      preview.innerHTML = html;
    }
    updateStats();
    ToolStorage.setField('markdown-preview', 'content', rawMarkdown);
  }

  function updateStats() {
    const text = rawMarkdown;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text.split('\n').length;
    statsEl.textContent = `${chars} chars · ${words} words · ${lines} lines`;
  }

  /* ─── Live input ─── */
  textarea.addEventListener('input', scheduleUpdate);

  /* Tab key inserts spaces */
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.value = textarea.value.substring(0, start) + '  ' + textarea.value.substring(end);
      textarea.selectionStart = textarea.selectionEnd = start + 2;
      scheduleUpdate();
    }
  });

  /* ─── Toolbar Actions ─── */
  toolbarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      insertSnippet(action);
      textarea.focus();
    });
  });

  function insertSnippet(action) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    let before = '', after = '', newCursorOffset = 0;

    switch (action) {
      case 'h1':
        before = linePrefix(start, '# '); after = '';
        if (!selected) after = '\n';
        break;
      case 'h2':
        before = linePrefix(start, '## '); after = '';
        if (!selected) after = '\n';
        break;
      case 'h3':
        before = linePrefix(start, '### '); after = '';
        if (!selected) after = '\n';
        break;
      case 'bold':
        before = '**'; after = '**';
        newCursorOffset = selected ? 0 : 2;
        break;
      case 'italic':
        before = '*'; after = '*';
        newCursorOffset = selected ? 0 : 1;
        break;
      case 'strike':
        before = '~~'; after = '~~';
        newCursorOffset = selected ? 0 : 2;
        break;
      case 'link':
        before = '['; after = '](url)';
        newCursorOffset = selected ? selected.length + 4 : 1;
        break;
      case 'image':
        before = '!['; after = '](url)';
        newCursorOffset = selected ? selected.length + 5 : 2;
        break;
      case 'code':
        before = '`'; after = '`';
        newCursorOffset = selected ? 0 : 1;
        break;
      case 'codeblock':
        before = linePrefix(start, '```\n'); after = '\n```';
        newCursorOffset = selected ? 0 : 4;
        break;
      case 'ul':
        before = linePrefix(start, '- '); after = '';
        if (!selected) after = '\n';
        break;
      case 'ol':
        before = linePrefix(start, '1. '); after = '';
        if (!selected) after = '\n';
        break;
      case 'task':
        before = linePrefix(start, '- [ ] '); after = '';
        if (!selected) after = '\n';
        break;
      case 'quote':
        before = linePrefix(start, '> '); after = '';
        if (!selected) after = '\n';
        break;
      case 'table':
        before = linePrefix(start, '| Columna 1 | Columna 2 | Columna 3 |\n| --- | --- | --- |\n| ');
        after = ' | Celda | Celda |\n';
        newCursorOffset = selected ? 0 : before.length;
        break;
      case 'hr':
        before = linePrefix(start, '\n---\n'); after = '';
        newCursorOffset = before.length;
        break;
    }

    textarea.value = textarea.value.substring(0, start) + before + selected + after + textarea.value.substring(end);
    const cursorPos = start + before.length + (selected ? selected.length : 0) + newCursorOffset;
    textarea.selectionStart = textarea.selectionEnd = cursorPos;
    scheduleUpdate();
  }

  /* Insert prefix at the beginning of the current line */
  function linePrefix(cursorPos, prefix) {
    const text = textarea.value;
    let lineStart = text.lastIndexOf('\n', cursorPos - 1) + 1;
    /* If we're at the start of a line or the cursor is right after a newline */
    return prefix;
  }

  /* ─── Copy Actions ─── */
  copyMdBtn.addEventListener('click', () => {
    MiniDevTools.copyToClipboard(rawMarkdown, 'Markdown copiado!');
  });

  copyHtmlBtn.addEventListener('click', () => {
    const html = parseMarkdown(rawMarkdown);
    MiniDevTools.copyToClipboard(html, 'HTML copiado!');
  });

  clearBtn.addEventListener('click', () => {
    if (!rawMarkdown.trim()) return;
    textarea.value = '';
    rawMarkdown = '';
    scheduleUpdate();
  });

  /* ─── Initial render ─── */
  updatePreview();

  /* ═══════════════════════════════════════════════════════════════
     MARKDOWN PARSER
     Zero-dependency parser. Processing order matters.
     ═══════════════════════════════════════════════════════════════ */

  function parseMarkdown(md) {
    /* 1. Normalize line endings */
    md = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    /* 2. Extract and protect fenced code blocks */
    const codeBlocks = [];
    md = md.replace(/```(\w*)\n([\s\S]*?)```/g, (m, lang, code) => {
      const idx = codeBlocks.length;
      const langTag = lang ? `<span class="md-lang-tag">${escapeHtml(lang)}</span>` : '';
      codeBlocks.push(`<pre><code>${langTag}${escapeHtml(code.replace(/\n$/, ''))}</code></pre>`);
      return `\n%%CODEBLOCK_${idx}%%\n`;
    });

    /* 3. Extract and protect inline code */
    const inlineCodes = [];
    md = md.replace(/`([^`\n]+)`/g, (m, code) => {
      const idx = inlineCodes.length;
      inlineCodes.push(`<code>${escapeHtml(code)}</code>`);
      return `%%INLINE_${idx}%%`;
    });

    /* 4. Process block-level elements line by line */
    const lines = md.split('\n');
    let html = '';
    let i = 0;
    let inList = false;
    let listType = ''; // 'ul' | 'ol' | 'task'
    let inTable = false;
    let tableRows = [];

    while (i < lines.length) {
      const line = lines[i];

      /* Close list if we hit a non-list item */
      const isListItem = /^(\s*)([-*+]|\d+\.)\s/.test(line) || /^(\s*)- \[[ xX]\] /.test(line);
      const isTableLine = /^\|/.test(line.trim());
      const isEmpty = line.trim() === '';

      if (inList && !isListItem && !isEmpty) {
        html += closeList(listType);
        inList = false;
        listType = '';
      }

      if (inTable && !isTableLine && !isEmpty) {
        html += buildTable(tableRows);
        tableRows = [];
        inTable = false;
      }

      /* Horizontal rule */
      if (/^(\s*)(---+|===+|\*\*\*+|___+)(\s*)$/.test(line) && !/^===+$/.test(line.trim())) {
        html += '<hr>';
        i++;
        continue;
      }

      /* Headers */
      const headerMatch = line.match(/^(#{1,6})\s+(.+)/);
      if (headerMatch) {
        const level = headerMatch[1].length;
        const text = parseInline(headerMatch[2]);
        html += `<h${level}>${text}</h${level}>`;
        i++;
        continue;
      }

      /* Blockquote */
      if (/^>\s?/.test(line)) {
        const quoteLines = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          quoteLines.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        html += `<blockquote><p>${parseInline(quoteLines.join('<br>'))}</p></blockquote>`;
        continue;
      }

      /* Fenced code block placeholder */
      const cbMatch = line.match(/^%%CODEBLOCK_(\d+)%%$/);
      if (cbMatch) {
        html += codeBlocks[parseInt(cbMatch[1])];
        i++;
        continue;
      }

      /* Task list */
      const taskMatch = line.match(/^(\s*)- \[([ xX])\]\s+(.*)/);
      if (taskMatch) {
        if (!inList || listType !== 'task') {
          if (inList) html += closeList(listType);
          html += '<ul class="md-task-list">';
          inList = true;
          listType = 'task';
        }
        const checked = taskMatch[2] !== ' ' ? ' checked' : '';
        const text = parseInline(taskMatch[3]);
        html += `<li class="${checked ? 'checked' : ''}"><input type="checkbox"${checked} disabled><span>${text}</span></li>`;
        i++;
        continue;
      }

      /* Unordered list */
      const ulMatch = line.match(/^(\s*)([-*+])\s+(.*)/);
      if (ulMatch) {
        if (!inList || listType !== 'ul') {
          if (inList) html += closeList(listType);
          html += '<ul>';
          inList = true;
          listType = 'ul';
        }
        html += `<li>${parseInline(ulMatch[3])}</li>`;
        i++;
        continue;
      }

      /* Ordered list */
      const olMatch = line.match(/^(\s*)\d+\.\s+(.*)/);
      if (olMatch) {
        if (!inList || listType !== 'ol') {
          if (inList) html += closeList(listType);
          html += '<ol>';
          inList = true;
          listType = 'ol';
        }
        html += `<li>${parseInline(olMatch[2])}</li>`;
        i++;
        continue;
      }

      /* Table */
      if (isTableLine) {
        inTable = true;
        tableRows.push(line.trim());
        i++;
        continue;
      }

      /* Empty line */
      if (isEmpty) {
        if (inList) {
          html += closeList(listType);
          inList = false;
          listType = '';
        }
        if (inTable) {
          html += buildTable(tableRows);
          tableRows = [];
          inTable = false;
        }
        i++;
        continue;
      }

      /* Paragraph — collect consecutive non-empty, non-special lines */
      const paraLines = [];
      while (i < lines.length && lines[i].trim() !== ''
        && !/^#{1,6}\s/.test(lines[i])
        && !/^>\s?/.test(lines[i])
        && !/^%%CODEBLOCK_\d+%%$/.test(lines[i])
        && !/^(\s*)([-*+]|\d+\.)\s/.test(lines[i])
        && !/^(\s*)- \[[ xX]\] /.test(lines[i])
        && !/^\|/.test(lines[i].trim())
        && !/^(\s*)(---+|\*\*\*+|___+)(\s*)$/.test(lines[i])
      ) {
        paraLines.push(lines[i]);
        i++;
      }
      if (paraLines.length > 0) {
        html += `<p>${parseInline(paraLines.join('\n'))}</p>`;
      }
    }

    /* Close any remaining open blocks */
    if (inList) html += closeList(listType);
    if (inTable && tableRows.length > 0) html += buildTable(tableRows);

    /* 5. Restore inline code placeholders */
    inlineCodes.forEach((code, idx) => {
      html = html.replace(`%%INLINE_${idx}%%`, code);
    });

    return html;
  }

  /* ─── Close list helper ─── */
  function closeList(type) {
    return type === 'ul' ? '</ul>' : type === 'ol' ? '</ol>' : type === 'task' ? '</ul>' : '';
  }

  /* ─── Build table from collected rows ─── */
  function buildTable(rows) {
    if (rows.length < 2) return '';

    /* Parse rows into cell arrays */
    const parsed = rows.map(row =>
      row.split('|').slice(1, -1).map(cell => cell.trim())
    );

    /* Detect alignment from separator row (row index 1) */
    const sepRow = parsed[1];
    const align = [];
    if (sepRow) {
      sepRow.forEach(cell => {
        if (/^:-+:$/.test(cell)) align.push('center');
        else if (/:$/.test(cell)) align.push('left');
        else if (/^:/.test(cell)) align.push('right');
        else align.push('left');
      });
    }

    /* Header */
    let html = '<table><thead><tr>';
    parsed[0].forEach((cell, ci) => {
      html += `<th>${parseInline(cell)}</th>`;
    });
    html += '</tr></thead><tbody>';

    /* Body rows (skip separator) */
    for (let r = 2; r < parsed.length; r++) {
      html += '<tr>';
      parsed[r].forEach((cell, ci) => {
        const style = align[ci] ? ` style="text-align:${align[ci]}"` : '';
        html += `<td${style}>${parseInline(cell)}</td>`;
      });
      html += '</tr>';
    }
    html += '</tbody></table>';
    return html;
  }

  /* ═══════════════════════════════════════════════════════════════
     INLINE PARSER — processes text within a block element
     ═══════════════════════════════════════════════════════════════ */

  function parseInline(text) {
    /* Restore escaped newlines in blockquotes */
    text = text.replace(/<br>/g, '\n');

    /* Escape HTML (but preserve our placeholders) */
    text = escapeHtml(text);
    /* Restore the newlines for blockquote display */
    text = text.replace(/\n/g, '<br>');

    /* Images: ![alt](url) */
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" loading="lazy">');

    /* Links: [text](url) */
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    /* Bold + Italic: ***text*** or ___text___ */
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');

    /* Bold: **text** or __text__ */
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');

    /* Italic: *text* or _text_ (but not inside a word) */
    text = text.replace(/(?<!\w)\*([^*\n]+)\*(?!\w)/g, '<em>$1</em>');
    text = text.replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, '<em>$1</em>');

    /* Strikethrough: ~~text~~ */
    text = text.replace(/~~(.+?)~~/g, '<del>$1</del>');

    /* Line breaks: two spaces at end of line + newline */
    text = text.replace(/  <br>/g, '<br>');

    return text;
  }

  /* ─── Escape HTML helper ─── */
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ─── Default content ─── */
  function getDefaultContent() {
    return `# Markdown Previewer

Escribe **markdown** en el panel izquierdo y ve el resultado en tiempo real.

## Formateo de texto

**Bold**, *italic*, ~~strikethrough~~, y ***bold + italic***.

## Links e imagenes

[Visita GitHub](https://github.com) para mas info.

![Logo](https://picsum.photos/600/200)

## Listas

### Desordenada
- HTML
- CSS
- JavaScript
  - React
  - Vue
  - Angular

### Ordenada
1. Clonar el repo
2. Instalar dependencias
3. Ejecutar npm start

### Task list
- [x] Crear proyecto
- [x] Agregar herramientas
- [ ] Deploy a produccion

## Bloques de codigo

Inline: usa \`console.log()\` para debuggear.

\`\`\`javascript
function saludar(nombre) {
  return \`Hola, \${nombre}!\`;
}

console.log(saludar('Mundo'));
\`\`\`

## Blockquote

> "Codigo es como humor. Cuando tienes que explicarlo, es malo."
> — Cory House

## Tablas

| Herramienta | Estado | Prioridad |
| :--- | :---: | ---: |
| UUID Generator | Completo | Alta |
| Code Formatter | Completo | Alta |
| Markdown Previewer | Completo | Media |

---

*Powered by MiniDevTools*`;
  }

}

/* Registro global */
window['render_markdown-preview'] = render_markdown_preview;

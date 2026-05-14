/* ═══════════════════════════════════════════════════════════════
   Lorem Ipsum AR — Generador de texto de relleno en español y latin
   Tipos: parrafos, oraciones, palabras, lista
   Opciones: incluir HTML (<p>), empezar con "Lorem ipsum..."
   Estadisticas en tiempo real, copiar al portapapeles.
   Usa ToolStorage para persistir estado.
   ═══════════════════════════════════════════════════════════════ */

function render_lorem_ipsum(container, toolMeta) {

  /* ─── State ─── */
  const saved = ToolStorage.load('lorem-ipsum');
  const s = saved ? saved.state : null;

  let type = s ? s.type : 'paragraphs';   /* paragraphs, sentences, words, list */
  let count = s ? s.count : 3;
  let lang = s ? s.lang : 'es';           /* es, latin */
  let startLorem = s ? s.startLorem : false;
  let wrapHTML = s ? s.wrapHTML : false;

  /* ─── Spanish word bank ─── */
  const ES_WORDS = [
    'aunque','apenas','casi','completo','considera','cualquier','cuando','derecho',
    'desarrollo','desde','diferente','durante','ejemplo','elemento','embargo','energia',
    'entre','equipo','escenario','esfuerzo','espacio','esto','forma','general','grupo',
    'hacia','heramienta','horizonte','importante','inicio','junto','lado','mayor',
    'mejor','mientras','mismo','momento','mucho','nada','nuevo','nuestro','número',
    'otro','paisaje','paso','poder','primero','problema','proceso','propio','puede',
    'quien','razón','real','resultado','sabe','según','ser','siempre','sino','sistema',
    'sobre','solo','sur','también','tanto','tiempo','tipo','todavía','todo','trabajo',
    'través','tiene','valor','varios','veces','verdad','vista','cada','cambio','casa',
    'causa','centro','cielo','cinco','común','contra','cuerpo','cual','cuatro','cuenta',
    'dado','debe','decir','dejar','del','demás','después','dia','dice','dinero','doce',
    'donde','dos','dudo','durante','ejemplo','ella','ellos','entonces','era','estado',
    'estar','estas','esta','estos','fin','fue','fueron','gran','gobierno','hacer',
    'hasta','hombre','hoy','hace','hay','lejos','luego','lugar','manera','mano','marzo',
    'medio','menos','mes','método','mil','mínimo','modo','mundo','más','mí','necesario',
    'necesita','ningún','noche','nos','nosotros','nuestro','ocho','parte','pasado',
    'pesar','poca','poco','primera','próximo','pudo','pues','qué','quién','reciente',
    'resto','saber','salud','sección','seis','señor','será','sido','siendo','siete',
    'siguiente','sin','sino','solo','sí','tal','tres','tuya','un','una','unas','unos',
    'usted','van','vamos','varias','vender','vía','vienen','vino','vir','volvió',
    'volver','vuestro','y','ya','yo','zona','posición','científico','tecnología',
    'digital','plataforma','algoritmo','información','usuario','servicio','modelo',
    'dato','código','análisis','red','pantalla','función','variable','objeto',
    'estructura','programa','librería','archivo','navegador','aplicación','servidor',
    'cliente','respuesta','petición','base','tabla','registro','consulta','campo',
    'índice','archivo','carpeta','ruta','dominio','protocolo','puerto','sesión',
    'token','clave','encriptado','certificado','seguridad','autenticación','permiso',
    'recurso','endpoint','método','parámetro','argumento','retorno','excepción',
    'documentación','interfaz','componente','módulo','paquete','dependencia','versión',
    'entorno','producción','desarrollo','prueba','depuración','implementación',
    'optimización','rendimiento','escalabilidad','disponibilidad','accesibilidad',
    'experiencia','diseño','prototipo','iteración','feedback','requerimiento',
    'especificación','arquitectura','patrón','framework','biblioteca','motor',
    'compilador','intérprete','ejecución','proceso','hilo','memoria','caché',
    'almacenamiento','respaldo','recuperación','migración','actualización','despliegue'
  ];

  /* ─── Classic Latin word bank ─── */
  const LA_WORDS = [
    'lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do',
    'eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim',
    'ad','minim','veniam','quis','nostrud','exercitation','ullamco','laboris','nisi',
    'aliquip','ex','ea','commodo','consequat','duis','aute','irure','in','reprehenderit',
    'voluptate','velit','esse','cillum','fugiat','nulla','pariatur','excepteur','sint',
    'occaecat','cupidatat','non','proident','sunt','culpa','qui','officia','deserunt',
    'mollit','anim','id','est','laborum','perspiciatis','unde','omnis','iste','natus',
    'error','voluptatem','accusantium','doloremque','laudantium','totam','rem','aperiam',
    'eaque','ipsa','quae','ab','illo','inventore','veritatis','quasi','architecto',
    'beatae','vitae','dicta','explicabo','nemo','ipsam','quia','voluptas','aspernatur',
    'aut','odit','fugit','consequuntur','magni','dolores','eos','ratione','sequi','nesciunt',
    'neque','porro','quisquam','dolorem','adipisci','numquam','eius','modi','tempora',
    'magnam','aliquam','quaerat','minima','nostrum','exercitationem','ullam','corporis',
    'suscipit','laboriosam','nihil','impedit','quo','minus','quod','maxime','placeat',
    'facere','possimus','assumenda','repellendus','temporibus','quibusdam','illum','fugiat'
  ];

  /* ─── Classic Latin opening ─── */
  const LOREM_OPENING = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';

  /* ─── Helpers ─── */
  function getWords() {
    return lang === 'es' ? ES_WORDS : LA_WORDS;
  }

  function pickRandom(arr, n) {
    const result = [];
    for (let i = 0; i < n; i++) {
      result.push(arr[Math.floor(Math.random() * arr.length)]);
    }
    return result;
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function generateSentence(minW, maxW) {
    const words = getWords();
    const len = minW + Math.floor(Math.random() * (maxW - minW + 1));
    const picked = pickRandom(words, len);
    return capitalize(picked.join(' ')) + '.';
  }

  function generateParagraph(minS, maxS) {
    const sentCount = minS + Math.floor(Math.random() * (maxS - minS + 1));
    const sentences = [];
    for (let i = 0; i < sentCount; i++) {
      sentences.push(generateSentence(6, 14));
    }
    return sentences.join(' ');
  }

  /* ─── Main generate function ─── */
  function generate() {
    let result = '';
    const n = Math.max(1, Math.min(count, type === 'words' ? 999 : 99));

    switch (type) {
      case 'paragraphs': {
        const paras = [];
        for (let i = 0; i < n; i++) {
          paras.push(generateParagraph(3, 7));
        }
        if (startLorem && lang === 'latin') paras[0] = LOREM_OPENING;
        else if (startLorem && lang === 'es') paras[0] = 'Lorem ipsum dolor sit amet, ' + paras[0].toLowerCase();
        if (wrapHTML) {
          result = paras.map(p => `  <p>${p}</p>`).join('\n');
        } else {
          result = paras.join('\n\n');
        }
        break;
      }

      case 'sentences': {
        const sents = [];
        for (let i = 0; i < n; i++) {
          sents.push(generateSentence(6, 14));
        }
        if (startLorem && lang === 'latin') sents[0] = LOREM_OPENING;
        else if (startLorem && lang === 'es') sents[0] = 'Lorem ipsum dolor sit amet, ' + sents[0].toLowerCase();
        if (wrapHTML) {
          result = sents.map(s => `  <p>${s}</p>`).join('\n');
        } else {
          result = sents.join(' ');
        }
        break;
      }

      case 'words': {
        const words = getWords();
        const picked = pickRandom(words, n);
        result = picked.join(' ');
        if (startLorem) {
          const loremW = lang === 'latin'
            ? ['Lorem', 'ipsum', 'dolor', 'sit', 'amet']
            : ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'];
          const head = loremW.slice(0, Math.min(loremW.length, n));
          result = [...head, ...picked.slice(head.length)].join(' ');
        }
        if (wrapHTML) {
          result = `  <p>${result}</p>`;
        }
        break;
      }

      case 'list': {
        const items = [];
        for (let i = 0; i < n; i++) {
          const wordCount = 4 + Math.floor(Math.random() * 8);
          const words = getWords();
          const picked = pickRandom(words, wordCount);
          items.push(capitalize(picked.join(' ')));
        }
        if (wrapHTML) {
          result = '<ul>\n' + items.map(i => `  <li>${i}</li>`).join('\n') + '\n</ul>';
        } else {
          result = items.map(i => `- ${i}`).join('\n');
        }
        break;
      }
    }

    return result;
  }

  /* ─── Statistics ─── */
  function getStats(text) {
    const chars = text.length;
    const charsNoSpace = text.replace(/\s/g, '').length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = (text.match(/[.!?]+(\s|$)/g) || []).length;
    const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim()).length : 0;
    return { chars, charsNoSpace, words, sentences, paragraphs };
  }

  /* ─── Render UI ─── */
  container.innerHTML = `
    <div class="tool-card">
      <div class="tool-card__header">
        <h2 class="tool-card__title"><i class="${toolMeta.icon}" style="margin-right:8px;"></i>${toolMeta.name}</h2>
        <p class="tool-card__description">${toolMeta.description}</p>
      </div>
      <div class="tool-card__body">

        <!-- Controls -->
        <div class="li-controls">
          <!-- Row 1: Type + Count + Generate -->
          <div class="li-row">
            <div class="li-type-group">
              <button class="li-type-btn ${type === 'paragraphs' ? 'li-type-btn--active' : ''}" data-type="paragraphs">
                <i class="fa-solid fa-paragraph"></i> Párrafos
              </button>
              <button class="li-type-btn ${type === 'sentences' ? 'li-type-btn--active' : ''}" data-type="sentences">
                <i class="fa-solid fa-align-left"></i> Oraciones
              </button>
              <button class="li-type-btn ${type === 'words' ? 'li-type-btn--active' : ''}" data-type="words">
                <i class="fa-solid fa-font"></i> Palabras
              </button>
              <button class="li-type-btn ${type === 'list' ? 'li-type-btn--active' : ''}" data-type="list">
                <i class="fa-solid fa-list-ul"></i> Lista
              </button>
            </div>

            <div class="li-count-group">
              <label class="label" for="li-count">Cantidad</label>
              <div class="li-count-wrap">
                <button class="li-count-btn" id="li-dec" data-tooltip="Menos"><i class="fa-solid fa-minus"></i></button>
                <input type="number" class="input li-count-input" id="li-count" value="${count}" min="1" max="99">
                <button class="li-count-btn" id="li-inc" data-tooltip="Más"><i class="fa-solid fa-plus"></i></button>
              </div>
            </div>

            <button class="btn btn--primary" id="li-generate">
              <i class="fa-solid fa-shuffle"></i> Generar
            </button>
          </div>

          <!-- Row 2: Language + Options -->
          <div class="li-options-row">
            <div class="li-lang-group">
              <button class="li-lang-btn ${lang === 'es' ? 'li-lang-btn--active' : ''}" data-lang="es">
                <i class="fa-solid fa-flag"></i> Español
              </button>
              <button class="li-lang-btn ${lang === 'latin' ? 'li-lang-btn--active' : ''}" data-lang="latin">
                <i class="fa-solid fa-language"></i> Latín
              </button>
            </div>

            <div class="li-checks">
              <label class="li-check">
                <input type="checkbox" id="li-lorem" ${startLorem ? 'checked' : ''}>
                <span>Empezar con "Lorem ipsum..."</span>
              </label>
              <label class="li-check">
                <input type="checkbox" id="li-html" ${wrapHTML ? 'checked' : ''}>
                <span>Incluir HTML</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Stats -->
        <div class="li-stats" id="li-stats">
          <span class="li-stat"><i class="fa-solid fa-font"></i> <strong id="li-st-words">0</strong> palabras</span>
          <span class="li-stat"><i class="fa-solid fa-text-width"></i> <strong id="li-st-chars">0</strong> caracteres</span>
          <span class="li-stat"><i class="fa-solid fa-align-left"></i> <strong id="li-st-sentences">0</strong> oraciones</span>
          <span class="li-stat"><i class="fa-solid fa-paragraph"></i> <strong id="li-st-paragraphs">0</strong> párrafos</span>
        </div>

        <!-- Output -->
        <div class="li-output-wrap">
          <div class="li-output-header">
            <span class="li-output-label">Texto generado</span>
            <div class="li-output-actions">
              <button class="btn btn--ghost btn--sm" id="li-select-all" data-tooltip="Seleccionar todo">
                <i class="fa-solid fa-object-group"></i>
              </button>
              <button class="btn btn--secondary btn--sm" id="li-copy" data-tooltip="Copiar texto">
                <i class="fa-regular fa-copy"></i> Copiar
              </button>
            </div>
          </div>
          <div class="li-output" id="li-output" tabindex="0">
            <p class="li-placeholder">Presioná <strong>Generar</strong> para crear texto de relleno</p>
          </div>
        </div>

      </div>
    </div>
  `;

  /* ─── DOM Refs ─── */
  const outputEl = document.getElementById('li-output');
  const countInput = document.getElementById('li-count');
  const generateBtn = document.getElementById('li-generate');
  const copyBtn = document.getElementById('li-copy');
  const selectAllBtn = document.getElementById('li-select-all');
  const loremCheck = document.getElementById('li-lorem');
  const htmlCheck = document.getElementById('li-html');
  const typeBtns = container.querySelectorAll('.li-type-btn');
  const langBtns = container.querySelectorAll('.li-lang-btn');

  const stWords = document.getElementById('li-st-words');
  const stChars = document.getElementById('li-st-chars');
  const stSentences = document.getElementById('li-st-sentences');
  const stParagraphs = document.getElementById('li-st-paragraphs');

  /* ─── Update output ─── */
  function updateOutput() {
    const text = generate();
    outputEl.textContent = text;

    const stats = getStats(text);
    stWords.textContent = stats.words;
    stChars.textContent = stats.chars;
    stSentences.textContent = stats.sentences;
    stParagraphs.textContent = stats.paragraphs;

    saveState();
  }

  /* ─── Type buttons ─── */
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      type = btn.dataset.type;
      typeBtns.forEach(b => b.classList.toggle('li-type-btn--active', b === btn));

      /* Adjust max based on type */
      const maxVal = type === 'words' ? 999 : 99;
      countInput.max = maxVal;
      if (count > maxVal) {
        count = maxVal;
        countInput.value = count;
      }

      updateOutput();
    });
  });

  /* ─── Language buttons ─── */
  langBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      lang = btn.dataset.lang;
      langBtns.forEach(b => b.classList.toggle('li-lang-btn--active', b === btn));
      updateOutput();
    });
  });

  /* ─── Count controls ─── */
  countInput.addEventListener('input', () => {
    const v = parseInt(countInput.value);
    count = (v && v >= 1) ? v : 1;
    updateOutput();
  });

  document.getElementById('li-dec').addEventListener('click', () => {
    count = Math.max(1, count - 1);
    countInput.value = count;
    updateOutput();
  });

  document.getElementById('li-inc').addEventListener('click', () => {
    const maxVal = type === 'words' ? 999 : 99;
    count = Math.min(maxVal, count + 1);
    countInput.value = count;
    updateOutput();
  });

  /* ─── Options ─── */
  loremCheck.addEventListener('change', () => {
    startLorem = loremCheck.checked;
    updateOutput();
  });

  htmlCheck.addEventListener('change', () => {
    wrapHTML = htmlCheck.checked;
    updateOutput();
  });

  /* ─── Generate button ─── */
  generateBtn.addEventListener('click', () => {
    updateOutput();
  });

  /* ─── Copy ─── */
  copyBtn.addEventListener('click', () => {
    const text = outputEl.textContent;
    if (!text || text.includes('Presioná')) return;
    MiniDevTools.copyToClipboard(text, 'Texto copiado!');
  });

  /* ─── Select All ─── */
  selectAllBtn.addEventListener('click', () => {
    const range = document.createRange();
    range.selectNodeContents(outputEl);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  });

  /* ─── Persistence ─── */
  function saveState() {
    ToolStorage.setField('lorem-ipsum', 'state', {
      type, count, lang, startLorem, wrapHTML
    });
  }

  /* ─── Init — generate on load ─── */
  updateOutput();
}

/* Registro global */
window['render_lorem-ipsum'] = render_lorem_ipsum;

/* ═══════════════════════════════════════════════════════════════
   MiniDevTools — Tool Registry
   Registro centralizado de todas las herramientas.
   Para agregar una herramienta nueva:
   1. Crear js/tools/tu-herramienta.js con una función render
   2. Crear css/tools/tu-herramienta.css
   3. Agregar el objeto al array TOOL_REGISTRY
   ═══════════════════════════════════════════════════════════════ */

const TOOL_REGISTRY = [
  // ─── IMAGENES ───
  {
    id: 'image-cropper',
    name: 'Image Cropper',
    icon: '🖼️',
    category: 'images',
    categoryLabel: 'Imágenes',
    description: 'Recortar imágenes a proporciones específicas',
    // render se carga via lazy loading desde js/tools/
    jsFile: 'js/tools/image-cropper.js',
    cssFile: 'css/tools/image-cropper.css',
    render: null // se llena dinámicamente
  },
  {
    id: 'image-resizer',
    name: 'Image Resizer',
    icon: '📐',
    category: 'images',
    categoryLabel: 'Imágenes',
    description: 'Redimensionar con opciones de calidad y formato',
    jsFile: 'js/tools/image-resizer.js',
    cssFile: 'css/tools/image-resizer.js',
    render: null
  },
  {
    id: 'image-to-base64',
    name: 'Image to Base64',
    icon: '🔢',
    category: 'images',
    categoryLabel: 'Imágenes',
    description: 'Convertir imágenes a base64 para CSS/HTML',
    jsFile: 'js/tools/image-to-base64.js',
    cssFile: null,
    render: null
  },
  {
    id: 'mac-frame',
    name: 'Marco macOS',
    icon: '🖥️',
    category: 'images',
    categoryLabel: 'Imágenes',
    description: 'Agregar marco estilo ventana macOS a imágenes',
    jsFile: 'js/tools/mac-frame.js',
    cssFile: 'css/tools/mac-frame.css',
    render: null
  },
  {
    id: 'favicon-generator',
    name: 'Favicon Generator',
    icon: '⭐',
    category: 'images',
    categoryLabel: 'Imágenes',
    description: 'Generar favicons en todos los tamaños',
    jsFile: 'js/tools/favicon-generator.js',
    cssFile: null,
    render: null
  },
  {
    id: 'placeholder-generator',
    name: 'Placeholder Generator',
    icon: '🖼️',
    category: 'images',
    categoryLabel: 'Imágenes',
    description: 'Generar placeholders con texto y colores',
    jsFile: 'js/tools/placeholder-generator.js',
    cssFile: null,
    render: null
  },

  // ─── CSS & DISEÑO ───
  {
    id: 'shadow-generator',
    name: 'Shadow Generator',
    icon: '🌑',
    category: 'css',
    categoryLabel: 'CSS & Diseño',
    description: 'Generador visual de box-shadow con preview',
    jsFile: 'js/tools/shadow-generator.js',
    cssFile: 'css/tools/shadow-generator.css',
    render: null
  },
  {
    id: 'border-radius-generator',
    name: 'Border Radius',
    icon: '⬜',
    category: 'css',
    categoryLabel: 'CSS & Diseño',
    description: 'Crear bordes redondeados personalizados',
    jsFile: 'js/tools/border-radius-generator.js',
    cssFile: null,
    render: null
  },
  {
    id: 'gradient-generator',
    name: 'Gradient Generator',
    icon: '🌈',
    category: 'css',
    categoryLabel: 'CSS & Diseño',
    description: 'Gradientes CSS con preview y código copiable',
    jsFile: 'js/tools/gradient-generator.js',
    cssFile: 'css/tools/gradient-generator.css',
    render: null
  },
  {
    id: 'color-palette',
    name: 'Color Palette',
    icon: '🎨',
    category: 'css',
    categoryLabel: 'CSS & Diseño',
    description: 'Generar paletas de colores exportables',
    jsFile: 'js/tools/color-palette.js',
    cssFile: 'css/tools/color-palette.css',
    render: null
  },
  {
    id: 'flexbox-playground',
    name: 'Flexbox Playground',
    icon: '📦',
    category: 'css',
    categoryLabel: 'CSS & Diseño',
    description: 'Visualizador interactivo de flexbox',
    jsFile: 'js/tools/flexbox-playground.js',
    cssFile: 'css/tools/flexbox-playground.css',
    render: null
  },
  {
    id: 'image-color-picker',
    name: 'Image Color Picker',
    icon: '💧',
    category: 'css',
    categoryLabel: 'CSS & Diseño',
    description: 'Extraer colores de una imagen',
    jsFile: 'js/tools/image-color-picker.js',
    cssFile: null,
    render: null
  },

  // ─── TEXTO & CÓDIGO ───
  {
    id: 'lorem-ipsum',
    name: 'Lorem Ipsum AR',
    icon: '📝',
    category: 'text',
    categoryLabel: 'Texto & Código',
    description: 'Generador de texto de relleno en español',
    jsFile: 'js/tools/lorem-ipsum.js',
    cssFile: null,
    render: null
  },
  {
    id: 'minifier',
    name: 'Minifier CSS/JS/HTML',
    icon: '🗜️',
    category: 'text',
    categoryLabel: 'Texto & Código',
    description: 'Comprimir código para producción',
    jsFile: 'js/tools/minifier.js',
    cssFile: null,
    render: null
  },
  {
    id: 'markdown-preview',
    name: 'Markdown Previewer',
    icon: '📋',
    category: 'text',
    categoryLabel: 'Texto & Código',
    description: 'Escribir markdown y ver preview en tiempo real',
    jsFile: 'js/tools/markdown-preview.js',
    cssFile: 'css/tools/markdown-preview.css',
    render: null
  },
  {
    id: 'character-counter',
    name: 'Character Counter',
    icon: '🔢',
    category: 'text',
    categoryLabel: 'Texto & Código',
    description: 'Contar caracteres, palabras, oraciones',
    jsFile: 'js/tools/character-counter.js',
    cssFile: null,
    render: null
  },
  {
    id: 'text-case-converter',
    name: 'Text Case Converter',
    icon: '🔤',
    category: 'text',
    categoryLabel: 'Texto & Código',
    description: 'Convertir entre mayúsculas, camelCase, snake_case...',
    jsFile: 'js/tools/text-case-converter.js',
    cssFile: null,
    render: null
  },

  // ─── UTILITARIOS DEV ───
  {
    id: 'code-formatter',
    name: 'Code Formatter',
    icon: '</> ',
    category: 'utils',
    categoryLabel: 'Utilitarios Dev',
    description: 'Formatear, minificar y validar JSON y HTML',
    jsFile: 'js/tools/code-formatter.js',
    cssFile: 'css/tools/code-formatter.css',
    render: null
  },
  {
    id: 'base64-encoder',
    name: 'Base64 Encode/Decode',
    icon: '🔐',
    category: 'utils',
    categoryLabel: 'Utilitarios Dev',
    description: 'Codificar y decodificar en base64',
    jsFile: 'js/tools/base64-encoder.js',
    cssFile: null,
    render: null
  },
  {
    id: 'url-encoder',
    name: 'URL Encode/Decode',
    icon: '🔗',
    category: 'utils',
    categoryLabel: 'Utilitarios Dev',
    description: 'Encodear y decodear URLs',
    jsFile: 'js/tools/url-encoder.js',
    cssFile: null,
    render: null
  },
  {
    id: 'timestamp-converter',
    name: 'Timestamp Converter',
    icon: '🕐',
    category: 'utils',
    categoryLabel: 'Utilitarios Dev',
    description: 'Convertir entre Unix timestamp y fecha legible',
    jsFile: 'js/tools/timestamp-converter.js',
    cssFile: null,
    render: null
  },
  {
    id: 'uuid-generator',
    name: 'UUID Generator',
    icon: '🔑',
    category: 'utils',
    categoryLabel: 'Utilitarios Dev',
    description: 'Generar UUIDs v4',
    jsFile: 'js/tools/uuid-generator.js',
    cssFile: null,
    render: null
  }
];

/* ─── HELPERS ─── */

// Obtener herramienta por ID
function getToolById(id) {
  return TOOL_REGISTRY.find(t => t.id === id) || null;
}

// Obtener herramientas agrupadas por categoría (orden preservado)
function getToolsByCategory() {
  const categories = [];
  const seen = new Set();

  TOOL_REGISTRY.forEach(tool => {
    if (!seen.has(tool.category)) {
      seen.add(tool.category);
      categories.push({
        id: tool.category,
        label: tool.categoryLabel,
        tools: TOOL_REGISTRY.filter(t => t.category === tool.category)
      });
    }
  });

  return categories;
}

// Obtener categorías en orden
function getCategories() {
  return getToolsByCategory().map(c => ({ id: c.id, label: c.label }));
}

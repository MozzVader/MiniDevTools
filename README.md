<p style="text-align: center;"> 
  # 🛠️ MiniDevTools 
</p>

<p style="text-align: center;"> 
  > Tu compendio de mini-herramientas para el día a día. Todo funciona offline. 
</p>

<p style="text-align: center;"> 
  ![License](https://img.shields.io/badge/License-CC%20BY--NC--ND%204.0-lightgrey?style=flat-square) 
</p>
<p style="text-align: center;">
  ![Offline](https://img.shields.io/badge/Funciona-Offline-brightgreen?style=flat-square) 
</p>
<p style="text-align: center;"> 
  ![HTML/CSS/JS](https://img.shields.io/badge/Tech-HTML%20%7C%20CSS%20%7C%20JS-orange?style=flat-square) 
</p>

---

## ✨ Características

- **100% offline** — Carga una vez, funciona siempre. Ideal para cuando no tenés internet.
- **Lazy loading** — Cada herramienta se carga solo cuando la necesitás.
- **Tema claro/oscuro** — Cambiá con un click. Tu elección se guarda automáticamente.
- **Persistencia** — Las preferencias y datos de cada herramienta se guardan en `localStorage`.
- **Buscador** — Encontrá cualquier herramienta al instante desde el sidebar.
- **Responsive** — Funciona en desktop, tablet y mobile.
- **Sin frameworks** — Vanilla JS puro. Sin React, sin Angular, sin bundler.

---

## 🧰 Herramientas (34)

### 🖼️ Imágenes
| Herramienta | Descripción |
|---|---|
| **Image Cropper** | Recortar imágenes a proporciones específicas |
| **Image Resizer** | Redimensionar con opciones de calidad y formato |
| **Image to Base64** | Convertir imágenes a base64 para CSS/HTML |
| **Marco macOS** | Agregar marco estilo ventana macOS a imágenes |
| **Favicon Generator** | Generar favicons en todos los tamaños |
| **Placeholder Generator** | Generar placeholders con texto y colores |
| **QR Generator** | Generar códigos QR con logo personalizado |
| **Image to Pixel Art** | Convertir imágenes a pixel art con paletas y ajustes |

### 🎨 CSS & Diseño
| Herramienta | Descripción |
|---|---|
| **Shadow Generator** | Generador visual de box-shadow con preview |
| **Border Radius** | Crear bordes redondeados personalizados |
| **Gradient Generator** | Gradientes CSS con preview y código copiable |
| **Color Palette** | Generar paletas de colores exportables |
| **Grid Playground** | Sandbox interactivo para CSS Grid con presets |
| **Flexbox Playground** | Visualizador interactivo de flexbox con presets |
| **Image Color Picker** | Extraer colores de una imagen |
| **Logo Generator** | Crear logos simples con formas, texto, iconos y paletas |

### 📝 Texto & Código
| Herramienta | Descripción |
|---|---|
| **Lorem Ipsum AR** | Generador de texto de relleno en español |
| **Minifier** | Comprimir código CSS/JS/HTML para producción |
| **Markdown Previewer** | Escribir markdown y ver preview en tiempo real |
| **Character Counter** | Contar caracteres, palabras, oraciones |
| **Text Case Converter** | Convertir entre mayúsculas, camelCase, snake_case... |
| **Boilerplate Generator** | Templates para HTML, React, Vue, Express y más |
| **HTML Live Preview** | Escribí HTML y ves el resultado en tiempo real con múltiples viewports |
| **Table Converter** | Convertir tablas entre Excel/CSV y Markdown en ambas direcciones |

### ⚡ Utilitarios Dev
| Herramienta | Descripción |
|---|---|
| **Code Formatter** | Formatear y minificar JSON, HTML, CSS y JavaScript con auto-detect |
| **JSON Formatter & Viewer** | Formatear, validar y explorar JSON con tree view interactivo |
| **Base64 Encode/Decode** | Codificar y decodificar en base64 |
| **URL Encode/Decode** | Encodear y decodear URLs |
| **Timestamp Converter** | Convertir entre Unix timestamp y fecha legible |
| **UUID Generator** | Generar UUIDs v4 |
| **Diff Viewer** | Comparar textos y resaltar diferencias con word-level diff |
| **Keyboard Event Viewer** | Inspeccionar event.key, event.code y keyCode de cada tecla |
| **SQL Schema Builder** | Crear schemas SQL para Supabase/PostgreSQL con GRANTs, RLS y exportar desde Excel |

---

## 🚀 Getting Started

No necesitás instalar nada. Abrí el link y listo:

**👉 [minidevtools.netlify.app](https://minidevtools.netlify.app)**

O si querés correrlo localmente:

```bash
git clone https://github.com/MozzVader/MiniDevTools.git
cd MiniDevTools

# Con cualquier servidor estático
npx serve .
# o
python3 -m http.server 8080
```

---

## 🏗️ Estructura

```
MiniDevTools/
├── index.html                  # SPA shell
├── css/
│   ├── global.css              # Variables de tema, layout, componentes
│   └── tools/                  # CSS por herramienta
├── js/
│   ├── registry.js             # Registro centralizado de herramientas
│   ├── app.js                  # Router + lazy loading
│   ├── sidebar.js              # Sidebar + buscador
│   ├── theme.js                # Theme toggle (claro/oscuro)
│   ├── storage.js              # ToolStorage (localStorage por herramienta)
│   └── tools/                  # Una carpeta por herramienta
└── README.md
```

---

## 🔧 Cómo agregar una herramienta

1. Crear `js/tools/tu-herramienta.js` con una función `window['render_tu-herramienta'] = function(container, toolMeta) { ... }`
2. Crear `css/tools/tu-herramienta.css` (opcional)
3. Registrarla en `TOOL_REGISTRY` en `js/registry.js`
4. Listo — el sidebar, el buscador y el lazy loading la detectan automáticamente

---

## 🎨 Tema

MiniDevTools usa un sistema de CSS custom properties con soporte para modo claro y oscuro. Los colores se definen en `css/global.css` y se aplican automáticamente a todos los componentes.

---

## 📄 Licencia

Este proyecto está licenciado bajo **Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)**.

- ✅ **Compartir** — Podés copiar y redistribuir el material en cualquier medio o formato.
- ✅ **Atribución** — Debés dar crédito apropiado al autor original.
- ❌ **No Comercial** — No podés usar el material con fines comerciales.
- ❌ **No Derivadas** — No podés modificar, transformar o construir sobre el material.

Ver [LICENSE](LICENSE) para más detalles.

---

<p align="center">
  Hecho con ❤️ por <a href="https://github.com/MozzVader">MozzVader</a>
</p>

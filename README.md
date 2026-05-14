# 🛠️ MiniDevTools

> Tu compendio de mini-herramientas para el día a día. Todo funciona offline, sin dependencias externas.

![License](https://img.shields.io/badge/License-CC%20BY--NC--ND%204.0-lightgrey?style=flat-square)
![Offline](https://img.shields.io/badge/Funciona-Offline-brightgreen?style=flat-square)
![No Dependencies](https://img.shields.io/badge/Dependencias-0-blue?style=flat-square)
![HTML/CSS/JS](https://img.shields.io/badge/Tech-HTML%20%7C%20CSS%20%7C%20JS-orange?style=flat-square)

---

## ✨ Características

- **100% offline** — No requiere servidor ni API externa. Carga una vez, funciona siempre.
- **Lazy loading** — Cada herramienta se carga solo cuando la necesitás.
- **Tema claro/oscuro** — Cambiá con un click. Tu elección se guarda automáticamente.
- **Persistencia** — Las preferencias de cada herramienta se guardan en `localStorage`.
- **Buscador** — Encontrá cualquier herramienta al instante desde el sidebar.
- **Responsive** — Funciona en desktop, tablet y mobile.
- **Sin frameworks** — Vanilla JS puro. Sin React, sin Angular, sin bundler.

---

## 🧰 Herramientas

### 🖼️ Imágenes
| Herramienta | Descripción |
|---|---|
| **Image Cropper** | Recortar imágenes a proporciones específicas |
| **Image Resizer** | Redimensionar con opciones de calidad y formato |
| **Image to Base64** | Convertir imágenes a base64 para CSS/HTML |
| **Marco macOS** | Agregar marco estilo ventana macOS a imágenes |
| **Favicon Generator** | Generar favicons en todos los tamaños |
| **Placeholder Generator** | Generar placeholders con texto y colores |

### 🎨 CSS & Diseño
| Herramienta | Descripción |
|---|---|
| **Shadow Generator** | Generador visual de box-shadow con preview |
| **Border Radius** | Crear bordes redondeados personalizados |
| **Gradient Generator** | Gradientes CSS con preview y código copiable |
| **Color Palette** | Generar paletas de colores exportables |
| **Flexbox Playground** | Visualizador interactivo de flexbox |
| **Image Color Picker** | Extraer colores de una imagen |

### 📝 Texto & Código
| Herramienta | Descripción |
|---|---|
| **Lorem Ipsum AR** | Generador de texto de relleno en español |
| **Minifier** | Comprimir código CSS/JS/HTML para producción |
| **Markdown Previewer** | Escribir markdown y ver preview en tiempo real |
| **Character Counter** | Contar caracteres, palabras, oraciones |
| **Text Case Converter** | Convertir entre mayúsculas, camelCase, snake_case... |
| **Boilerplate Generator** | Templates para HTML, React, Vue, Express y más |

### ⚡ Utilitarios Dev
| Herramienta | Descripción |
|---|---|
| **Code Formatter** | Formatear, minificar y validar JSON y HTML |
| **Base64 Encode/Decode** | Codificar y decodificar en base64 |
| **URL Encode/Decode** | Encodear y decodear URLs |
| **Timestamp Converter** | Convertir entre Unix timestamp y fecha legible |
| **UUID Generator** | Generar UUIDs v4 |

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
│       ├── code-formatter.css
│       ├── boilerplate-generator.css
│       └── mac-frame.css
├── js/
│   ├── registry.js             # Registro centralizado de herramientas
│   ├── app.js                  # Router + lazy loading
│   ├── sidebar.js              # Sidebar + buscador
│   ├── theme.js                # Theme toggle (claro/oscuro)
│   ├── storage.js              # ToolStorage (localStorage por herramienta)
│   └── tools/                  # Una carpeta por herramienta
│       ├── uuid-generator.js
│       ├── code-formatter.js
│       ├── mac-frame.js
│       └── boilerplate-generator.js
└── README.md
```

---

## 🔧 Cómo agregar una herramienta

1. Crear `js/tools/tu-herramienta.js` con una función `render_tu_herramienta(container, toolMeta)`
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

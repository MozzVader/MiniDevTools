/* ═══════════════════════════════════════════════════════════════
   Tool Stub — Archivo placeholder para herramientas no implementadas.
   Se copia como base para cada herramienta pendiente.
   ═══════════════════════════════════════════════════════════════ */

function render_image-cropper(container, toolMeta) {
  container.innerHTML = `
    <div class="tool-card" style="text-align:center; padding:60px 32px;">
      <div style="font-size:48px; margin-bottom:16px;">${toolMeta.icon || '🛠️'}</div>
      <h2 class="tool-card__title" style="margin-bottom:8px;">${toolMeta.name}</h2>
      <p class="tool-card__description" style="margin-bottom:24px;">${toolMeta.description}</p>
      <div style="display:inline-flex; align-items:center; gap:8px; padding:8px 16px; background:var(--accent-light); color:var(--accent); border-radius:var(--radius-full); font-size:13px; font-weight:500;">
        🚧 Pr&oacute;ximamente
      </div>
    </div>
  `;
}

// Registro global
window.render_image-cropper = render_image-cropper;

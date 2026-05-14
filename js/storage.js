/* ═══════════════════════════════════════════════════════════════
   MiniDevTools — Tool Storage
   Persistencia de preferencias por herramienta en localStorage.
   Cada herramienta guarda/recupera su ultima configuracion.
   ═══════════════════════════════════════════════════════════════ */

const ToolStorage = (() => {
  const PREFIX = 'minidevtools-tool-';

  /**
   * Guarda la configuracion de una herramienta.
   * @param {string} toolId - ID de la herramienta (ej: 'uuid-generator')
   * @param {object} data - Objeto con la configuracion a guardar
   * @example
   *   ToolStorage.save('uuid-generator', { uppercase: true, noDashes: false });
   *   ToolStorage.save('shadow-gen', { offsetX: 5, offsetY: 5, blur: 10, color: '#000' });
   */
  function save(toolId, data) {
    try {
      const key = PREFIX + toolId;
      // Merge con datos existentes (no sobrescribe todo)
      const existing = load(toolId);
      const merged = Object.assign({}, existing, data);
      localStorage.setItem(key, JSON.stringify(merged));
    } catch (e) {
      console.warn(`[ToolStorage] Error saving preferences for "${toolId}":`, e);
    }
  }

  /**
   * Recupera la configuracion guardada de una herramienta.
   * @param {string} toolId - ID de la herramienta
   * @returns {object|null} Configuracion guardada, o null si no existe
   * @example
   *   const prefs = ToolStorage.load('uuid-generator');
   *   // { uppercase: true, noDashes: false }
   */
  function load(toolId) {
    try {
      const key = PREFIX + toolId;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.warn(`[ToolStorage] Error loading preferences for "${toolId}":`, e);
      return null;
    }
  }

  /**
   * Elimina la configuracion guardada de una herramienta.
   * @param {string} toolId - ID de la herramienta
   */
  function clear(toolId) {
    try {
      localStorage.removeItem(PREFIX + toolId);
    } catch (e) {
      console.warn(`[ToolStorage] Error clearing preferences for "${toolId}":`, e);
    }
  }

  /**
   * Actualiza un campo especifico dentro de la configuracion de una herramienta.
   * @param {string} toolId - ID de la herramienta
   * @param {string} field - Nombre del campo
   * @param {*} value - Valor a guardar
   * @example
   *   ToolStorage.setField('uuid-generator', 'uppercase', true);
   */
  function setField(toolId, field, value) {
    save(toolId, { [field]: value });
  }

  /**
   * Obtiene un campo especifico de la configuracion de una herramienta.
   * @param {string} toolId - ID de la herramienta
   * @param {string} field - Nombre del campo
   * @param {*} fallback - Valor por defecto si no existe (default: null)
   * @returns {*} Valor del campo o fallback
   * @example
   *   const upper = ToolStorage.getField('uuid-generator', 'uppercase', false);
   */
  function getField(toolId, field, fallback) {
    const data = load(toolId);
    if (!data || !(field in data)) return fallback !== undefined ? fallback : null;
    return data[field];
  }

  /**
   * Limpia las preferencias de TODAS las herramientas.
   */
  function clearAll() {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(PREFIX)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    } catch (e) {
      console.warn('[ToolStorage] Error clearing all preferences:', e);
    }
  }

  return { save, load, clear, setField, getField, clearAll };
})();

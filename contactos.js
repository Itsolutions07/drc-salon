// Elegir un contacto del teléfono desde la versión web. En iPhone solo
// funciona si en Ajustes › Apps › Safari › Avanzado › Funciones
// experimentales está encendido "Contact Picker API".
window.drcContactos = {
  disponible() {
    return 'contacts' in navigator && 'ContactsManager' in window;
  },

  // Devuelve {"nombre": ..., "telefono": ...} en texto, o '' si se cancela.
  async elegir() {
    const lista = await navigator.contacts.select(['name', 'tel'], { multiple: false });
    if (!lista || lista.length === 0) return '';
    const c = lista[0];
    return JSON.stringify({
      nombre: (c.name && c.name[0]) || '',
      telefono: (c.tel && c.tel[0]) || '',
    });
  },
};

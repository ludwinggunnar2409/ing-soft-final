import { showToast } from '../utils/helpers.js';

// Cierra cualquier modal de Bootstrap abierto
export function closeAllModals() {
    const modals = document.querySelectorAll('.modal.show');
    modals.forEach(modal => {
        const instance = bootstrap.Modal.getInstance(modal);
        if (instance) instance.hide();
    });
}

// Muestra un spinner de carga en un contenedor
export function showSpinner(containerId) {
    const container = document.getElementById(containerId);
    if (container) {
        const spinner = `<div class="text-center my-4"><div class="spinner-border text-primary" role="status"></div><p>Cargando...</p></div>`;
        container.innerHTML = spinner;
    }
}

// Renderiza un mensaje de error amigable
export function renderError(container, message) {
    container.innerHTML = `<div class="alert alert-danger">⚠️ ${message}</div>`;
}

// Función para simular delay (útil en demos)
export function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

// Exportar también showToast para no depender de helpers en todos lados
export { showToast };
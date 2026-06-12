import { loadRoute } from './router.js';
import { renderNavbar } from './components/navbar.js';
import { logout, isAuthenticated } from './auth.js';
import { MockAPI } from './mockApi.js';

console.log('✅ main.js cargado');

// Registrar Service Worker (opcional)
// Registrar Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/siges/sw.js')
            .then(reg => console.log('✅ SW registrado:', reg))
            .catch(err => console.log('❌ SW error:', err));
    });
}

// ============================================
// FORZAR CREACIÓN DE SUBASTAS (IGNORAR LOCALSTORAGE)
// ============================================
console.log('🔄 FORZANDO creación de subastas...');

// Limpiar bandera para que se ejecute initializeSampleData
localStorage.removeItem('siges_initialized');

// Ejecutar inicialización
MockAPI.initializeSampleData();

// Verificar resultado
console.log('📊 Subastas después de inicializar:', MockAPI.getAuctions().length);

// Función para refrescar el navbar
export function refreshNavbar() {
    const navbarContainer = document.getElementById('navbar-placeholder');
    if (navbarContainer) {
        renderNavbar(navbarContainer);
    }
}

// Función de inicio
function init() {
    console.log('🚀 Iniciando aplicación...');
    refreshNavbar();
    loadRoute();
}

// Ejecutar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Exponer funciones globales
import { navigateTo } from './router.js';
window.navigateTo = navigateTo;
window.logout = logout;
window.refreshNavbar = refreshNavbar;

console.log('✅ main.js configurado');
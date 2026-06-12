import { loadRoute } from './router.js';
import { renderNavbar } from './components/navbar.js';
import { logout, isAuthenticated } from './auth.js';
import { MockAPI } from './mockApi.js';
import { generateDemoData } from './utils/demoData.js';

console.log('✅ main.js cargado');

// Registrar Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/siges/sw.js')
            .then(reg => console.log('✅ SW registrado:', reg))
            .catch(err => console.log('❌ SW error:', err));
    });
}

// Generar datos de demostración (si no existen o forzar)
if (!localStorage.getItem('siges_demo_generated')) {
    console.log('🏪 Generando datos de demostración por primera vez...');
    MockAPI.initializeSampleData();
    generateDemoData();
    localStorage.setItem('siges_demo_generated', 'true');
} else {
    console.log('⚠️ Datos demo ya existentes');
    // Asegurar que haya subastas
    if (MockAPI.getAuctions().length === 0) {
        MockAPI.initializeSampleData();
    }
}

console.log('📊 Estado actual:', {
    empeños: MockAPI.getPawns().length,
    subastas: MockAPI.getAuctions().length,
    notificaciones: MockAPI.getNotifications().length
});

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
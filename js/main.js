import { loadRoute } from './router.js';
import { renderNavbar } from './components/navbar.js';
import { logout, isAuthenticated } from './auth.js';
import { MockAPI } from './mockApi.js';

console.log('✅ main.js cargado');

// REGISTRAR Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(reg => console.log('✅ SW registrado:', reg))
            .catch(err => console.log('❌ SW error:', err));
    });
}

// Inicializar datos simulados
if (!localStorage.getItem('siges_initialized')) {
    MockAPI.addNotification('Bienvenido al sistema SIGES - Versión Demo');
    
    // Crear subastas de ejemplo con productos
    const products = MockAPI.getPublicProducts();
    products.forEach(product => {
        MockAPI.createAuction({
            id: product.id,
            name: product.name,
            description: product.description,
            image: product.image,
            currentPrice: product.startingPrice,
            startingPrice: product.startingPrice,
            status: 'ACTIVE',
            endTime: Date.now() + 7 * 86400000
        });
    });
    
    localStorage.setItem('siges_initialized', 'true');
    console.log('Datos iniciales creados');
}

// Función para refrescar el navbar
export function refreshNavbar() {
    const navbarContainer = document.getElementById('navbar-placeholder');
    if (navbarContainer) {
        renderNavbar(navbarContainer);
    }
}

// Función de inicio
function init() {
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
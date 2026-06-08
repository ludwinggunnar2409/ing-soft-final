import { getUserRole } from './auth.js';
import DashboardView from './modules/dashboard.js';
import PawnsView from './modules/pawns.js';
import ValuationView from './modules/valuation.js';
import AuctionsView from './modules/auctions.js';
import InventoryView from './modules/inventory.js';
import NotificationsView from './modules/notifications.js';
import FinanceView from './modules/finance.js';
import LoginView from './modules/login.js';

const routes = {
    '/': { view: DashboardView, roles: ['OWNER', 'EMPLOYEE', 'CLIENT'] },
    '/dashboard': { view: DashboardView, roles: ['OWNER', 'EMPLOYEE', 'CLIENT'] },
    '/pawns': { view: PawnsView, roles: ['EMPLOYEE', 'OWNER'] },
    '/valuation': { view: ValuationView, roles: ['EMPLOYEE', 'OWNER'] },
    '/auctions': { view: AuctionsView, roles: ['CLIENT', 'EMPLOYEE', 'OWNER'] },
    '/inventory': { view: InventoryView, roles: ['EMPLOYEE', 'OWNER'] },
    '/notifications': { view: NotificationsView, roles: ['CLIENT', 'EMPLOYEE', 'OWNER'] },
    '/finance': { view: FinanceView, roles: ['OWNER'] },
    '/login': { view: LoginView, roles: ['PUBLIC'] }
};

export function navigateTo(path) {
    const newPath = path.startsWith('/') ? path : '/' + path;
    window.history.pushState({}, '', window.location.origin + '/siges' + newPath);
    loadRoute(newPath);
}

export function loadRoute(path = window.location.pathname.replace('/siges', '') || '/') {
    const route = routes[path];
    const userRole = getUserRole();

    // Si la ruta no existe, mostrar 404
    if (!route) {
        document.getElementById('main-content').innerHTML = `<div class="alert alert-danger">Página no encontrada.</div>`;
        return;
    }

    // Si la ruta es pública, mostrar sin autenticación
    if (route.roles.includes('PUBLIC')) {
        const view = new route.view();
        view.render(document.getElementById('main-content'));
        return;
    }

    // Si no está autenticado y la ruta no es pública, redirigir a login
    if (!userRole) {
        navigateTo('/login');
        return;
    }

    // Verificar si el rol del usuario está permitido en la ruta
    if (!route.roles.includes(userRole)) {
        document.getElementById('main-content').innerHTML = `<div class="alert alert-danger">Acceso denegado. No tienes permiso.</div>`;
        return;
    }

    // Renderizar la vista
    const view = new route.view();
    view.render(document.getElementById('main-content'));
}

window.onpopstate = () => loadRoute();

// Exponer navigateTo globalmente para uso en onclick
window.navigateTo = navigateTo;
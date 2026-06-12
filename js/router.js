import { getUserRole } from './auth.js';
import DashboardView from './modules/dashboard.js';
import PawnsView from './modules/pawns.js';
import ValuationView from './modules/valuation.js';
import AuctionsView from './modules/auctions.js';
import InventoryView from './modules/inventory.js';
import NotificationsView from './modules/notifications.js';
import FinanceView from './modules/finance.js';
import FinanceReportsView from './modules/financeReports.js';
import LoginView from './modules/login.js';
import RegisterView from './modules/register.js';
import ClientProfileView from './modules/clientProfile.js';

// Detectar entorno
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const basePath = isLocal ? '/siges' : '';

const routes = {
    '/': { view: AuctionsView, roles: ['PUBLIC'] },
    '/dashboard': { view: DashboardView, roles: ['OWNER', 'EMPLOYEE', 'CLIENT'] },
    '/pawns': { view: PawnsView, roles: ['EMPLOYEE', 'OWNER'] },
    '/valuation': { view: ValuationView, roles: ['EMPLOYEE', 'OWNER'] },
    '/auctions': { view: AuctionsView, roles: ['PUBLIC'] },
    '/inventory': { view: InventoryView, roles: ['EMPLOYEE', 'OWNER'] },
    '/notifications': { view: NotificationsView, roles: ['CLIENT', 'EMPLOYEE', 'OWNER'] },
    '/finance': { view: FinanceView, roles: ['OWNER'] },
    '/finance-reports': { view: FinanceReportsView, roles: ['OWNER'] },
    '/login': { view: LoginView, roles: ['PUBLIC'] },
    '/mi-perfil': { view: ClientProfileView, roles: ['CLIENT'] },
    '/register': { view: RegisterView, roles: ['PUBLIC'] }
};

export function navigateTo(path) {
    const newPath = path.startsWith('/') ? path : '/' + path;
    const fullPath = basePath + newPath;
    window.history.pushState({}, '', window.location.origin + fullPath);
    loadRoute(newPath);
}

export function loadRoute(path = null) {
    let currentPath = path;
    if (!currentPath) {
        currentPath = window.location.pathname;
        if (isLocal) {
            currentPath = currentPath.replace(basePath, '') || '/';
        }
    }
    
    if (!currentPath.startsWith('/')) {
        currentPath = '/' + currentPath;
    }
    
    const route = routes[currentPath];
    const userRole = getUserRole();
    const mainContent = document.getElementById('main-content');
    
    if (!mainContent) return;
    
    if (!route) {
        mainContent.innerHTML = `<div class="alert alert-danger">Página no encontrada: ${currentPath}</div>`;
        return;
    }
    
    if (route.roles.includes('PUBLIC')) {
        const view = new route.view();
        view.render(mainContent);
        return;
    }
    
    if (!userRole) {
        navigateTo('/login');
        return;
    }
    
    if (!route.roles.includes(userRole)) {
        mainContent.innerHTML = `<div class="alert alert-danger">Acceso denegado. No tienes permiso para ver esta página.</div>`;
        return;
    }
    
    const view = new route.view();
    view.render(mainContent);
}

window.onpopstate = () => loadRoute();
window.navigateTo = navigateTo;
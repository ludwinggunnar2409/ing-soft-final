import { getUserRole } from './auth.js';
import DashboardView from './modules/dashboard.js';
import PawnsView from './modules/pawns.js';
import ValuationView from './modules/valuation.js';
import AuctionsView from './modules/auctions.js';
import InventoryView from './modules/inventory.js';
import NotificationsView from './modules/notifications.js';
import FinanceView from './modules/finance.js';
import LoginView from './modules/login.js';
import RegisterView from './modules/register.js';

// Detectar si estamos en localhost (XAMPP) o en Vercel
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const basePath = isLocal ? '/siges' : '';

const routes = {
    // Raíz pública - muestra subastas a todos
    '/': { view: AuctionsView, roles: ['PUBLIC'] },
    '/dashboard': { view: DashboardView, roles: ['OWNER', 'EMPLOYEE', 'CLIENT'] },
    '/pawns': { view: PawnsView, roles: ['EMPLOYEE', 'OWNER'] },
    '/valuation': { view: ValuationView, roles: ['EMPLOYEE', 'OWNER'] },
    '/auctions': { view: AuctionsView, roles: ['PUBLIC'] },
    '/inventory': { view: InventoryView, roles: ['EMPLOYEE', 'OWNER'] },
    '/notifications': { view: NotificationsView, roles: ['CLIENT', 'EMPLOYEE', 'OWNER'] },
    '/finance': { view: FinanceView, roles: ['OWNER'] },
    '/login': { view: LoginView, roles: ['PUBLIC'] },
    '/register': { view: RegisterView, roles: ['PUBLIC'] }
};

export function navigateTo(path) {
    const newPath = path.startsWith('/') ? path : '/' + path;
    const fullPath = basePath + newPath;
    window.history.pushState({}, '', window.location.origin + fullPath);
    loadRoute(newPath);
}

export function loadRoute(path = null) {
    // Obtener la ruta actual sin el basePath
    let currentPath = path;
    if (!currentPath) {
        currentPath = window.location.pathname;
        if (isLocal) {
            currentPath = currentPath.replace(basePath, '') || '/';
        }
    }
    
    // Asegurar que la ruta tenga '/' al inicio
    if (!currentPath.startsWith('/')) {
        currentPath = '/' + currentPath;
    }
    
    console.log('Cargando ruta:', currentPath); // Debug
    
    const route = routes[currentPath];
    const userRole = getUserRole();
    const mainContent = document.getElementById('main-content');
    
    if (!mainContent) return;

    // Si la ruta no existe, mostrar 404
    if (!route) {
        mainContent.innerHTML = `<div class="alert alert-danger">Página no encontrada: ${currentPath}</div>`;
        return;
    }

    console.log('Ruta encontrada, roles:', route.roles); // Debug

    // Si la ruta es pública, mostrar sin autenticación
    if (route.roles.includes('PUBLIC')) {
        console.log('Ruta pública, renderizando vista'); // Debug
        const view = new route.view();
        view.render(mainContent);
        return;
    }

    // Si no está autenticado y la ruta no es pública, redirigir a login
    if (!userRole) {
        navigateTo('/login');
        return;
    }

    // Verificar si el rol del usuario está permitido en la ruta
    if (!route.roles.includes(userRole)) {
        mainContent.innerHTML = `<div class="alert alert-danger">Acceso denegado. No tienes permiso para ver esta página.</div>`;
        return;
    }

    // Renderizar la vista
    const view = new route.view();
    view.render(mainContent);
}

window.onpopstate = () => loadRoute();

// Exponer navigateTo globalmente
window.navigateTo = navigateTo;
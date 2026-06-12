import { isAuthenticated, getUserRole, logout } from '../auth.js';
import { navigateTo } from '../router.js';
import { MockAPI } from '../mockApi.js';

export function renderNavbar(container) {
    const isAuth = isAuthenticated();
    const role = getUserRole();
    
    let menuItems = [];
    let userName = 'Usuario';
    
    if (isAuth) {
        const user = MockAPI.getCurrentUser();
        userName = user?.name || (role === 'OWNER' ? 'Dueño' : (role === 'EMPLOYEE' ? 'Empleado' : 'Cliente'));
        
        if (role === 'OWNER') {
            menuItems = [
                { label: 'Dashboard', path: '/dashboard' },
                { label: 'Empeños', path: '/pawns' },
                { label: 'Valuación', path: '/valuation' },
                { label: 'Subastas', path: '/auctions' },
                { label: 'Inventario', path: '/inventory' },
                { label: 'Notificaciones', path: '/notifications' },
                { label: 'Finanzas', path: '/finance' },
                { label: 'Reportes', path: '/finance-reports' }
            ];
        } else if (role === 'EMPLOYEE') {
            menuItems = [
                { label: 'Dashboard', path: '/dashboard' },
                { label: 'Empeños', path: '/pawns' },
                { label: 'Valuación', path: '/valuation' },
                { label: 'Subastas', path: '/auctions' },
                { label: 'Inventario', path: '/inventory' },
                { label: 'Notificaciones', path: '/notifications' }
            ];
        } else {
            menuItems = [
                { label: 'Dashboard', path: '/dashboard' },
                { label: 'Mis Subastas', path: '/auctions' },
                { label: 'Mi Perfil', path: '/mi-perfil' },  // ← Agrega esta línea
                { label: 'Notificaciones', path: '/notifications' }
            ];
        }
    } else {
        menuItems = [
            { label: 'Ver Subastas', path: '/auctions' },
            { label: 'Registrarse', path: '/register' },
            { label: 'Iniciar Sesión', path: '/login' }
        ];
    }
    
    const collapseId = 'navbarCollapse';
    const navHtml = `
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
            <div class="container">
                <a class="navbar-brand" href="#" onclick="window.navigateTo('/')">🏦 SIGES</a>
                <button class="navbar-toggler" type="button" id="navbarToggler">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="${collapseId}">
                    <ul class="navbar-nav me-auto">
                        ${menuItems.map(item => `<li class="nav-item"><a class="nav-link" href="#" data-nav-link="${item.path}">${item.label}</a></li>`).join('')}
                    </ul>
                    ${isAuth ? `
                        <div class="dropdown">
                            <button class="btn btn-outline-light dropdown-toggle" type="button" id="userDropdownBtn">
                                ${userName}
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end" id="userDropdownMenu">
                                <li><a class="dropdown-item" href="#" id="logoutLink">Cerrar sesión</a></li>
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        </nav>
    `;
    
    container.innerHTML = navHtml;
    
    // Manejo del menú colapsable
    const toggler = document.getElementById('navbarToggler');
    const collapseDiv = document.getElementById(collapseId);
    
    if (toggler && collapseDiv) {
        toggler.addEventListener('click', () => {
            collapseDiv.classList.toggle('show');
        });
        
        document.querySelectorAll('[data-nav-link]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const path = link.dataset.navLink;
                collapseDiv.classList.remove('show');
                window.navigateTo(path);
            });
        });
    }
    
    // Dropdown usuario
    if (isAuth) {
        const toggleBtn = document.getElementById('userDropdownBtn');
        const dropdownMenu = document.getElementById('userDropdownMenu');
        
        if (toggleBtn && dropdownMenu) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
            });
            
            document.addEventListener('click', () => {
                dropdownMenu.style.display = 'none';
            });
            
            document.getElementById('logoutLink')?.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    }
}
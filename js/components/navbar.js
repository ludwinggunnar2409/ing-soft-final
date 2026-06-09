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
                { label: 'Finanzas', path: '/finance' }
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
                { label: 'Notificaciones', path: '/notifications' }
            ];
        }
    } else {
        // Usuario no autenticado - evitar duplicados
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
                <button class="navbar-toggler" type="button" id="navbarToggler" aria-label="Toggle navigation">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="${collapseId}">
                    <ul class="navbar-nav me-auto">
                        ${menuItems.map(item => `<li class="nav-item"><a class="nav-link" href="#" data-nav-link="${item.path}">${item.label}</a></li>`).join('')}
                    </ul>
                    ${isAuth ? `
                        <div class="dropdown" id="userDropdownContainer">
                            <button class="btn btn-outline-light dropdown-toggle" type="button" id="userDropdownBtn">
                                ${userName}
                            </button>
                            <ul class="dropdown-menu" id="userDropdownMenu" style="display: none; position: absolute; right: 0; background: white; list-style: none; padding: 0.5rem 0; margin: 0; border-radius: 0.5rem; box-shadow: 0 2px 10px rgba(0,0,0,0.1); min-width: 150px; z-index: 1000;">
                                <li><a class="dropdown-item" href="#" id="logoutLink" style="display: block; padding: 0.5rem 1rem; color: #333; text-decoration: none;">Cerrar sesión</a></li>
                            </ul>
                        </div>
                    ` : ``}
                </div>
            </div>
        </nav>
    `;

    container.innerHTML = navHtml;

    // MANEJO MANUAL DEL COLAPSO
    const toggler = document.getElementById('navbarToggler');
    const collapseDiv = document.getElementById(collapseId);
    
    if (toggler && collapseDiv) {
        const toggleCollapse = () => {
            if (collapseDiv.classList.contains('show')) {
                collapseDiv.classList.remove('show');
                toggler.setAttribute('aria-expanded', 'false');
            } else {
                collapseDiv.classList.add('show');
                toggler.setAttribute('aria-expanded', 'true');
            }
        };
        
        toggler.addEventListener('click', toggleCollapse);
        
        const navLinks = collapseDiv.querySelectorAll('[data-nav-link]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const path = link.getAttribute('data-nav-link');
                if (collapseDiv.classList.contains('show')) {
                    collapseDiv.classList.remove('show');
                    toggler.setAttribute('aria-expanded', 'false');
                }
                window.navigateTo(path);
            });
        });
    }

    // DROPDOWN MANUAL
    if (isAuth) {
        const toggleBtn = document.getElementById('userDropdownBtn');
        const dropdownMenu = document.getElementById('userDropdownMenu');
        if (toggleBtn && dropdownMenu) {
            toggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isVisible = dropdownMenu.style.display === 'block';
                dropdownMenu.style.display = isVisible ? 'none' : 'block';
            });
            document.addEventListener('click', function closeDropdown(e) {
                if (toggleBtn && dropdownMenu && !toggleBtn.contains(e.target) && !dropdownMenu.contains(e.target)) {
                    dropdownMenu.style.display = 'none';
                }
            });
        }
        const logoutLink = document.getElementById('logoutLink');
        if (logoutLink) {
            logoutLink.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
            });
        }
    }
}
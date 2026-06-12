import { MockAPI } from '../mockApi.js';
import { formatMoney, getUSDRate } from '../utils/currency.js';
import { formatDate, showToast } from '../utils/helpers.js';
import { getUserRole, isAuthenticated } from '../auth.js';

export default class DashboardView {
    async render(container) {
        const role = getUserRole();
        const isAuth = isAuthenticated();
        const pawns = MockAPI.getPawns();
        const auctions = MockAPI.getAuctions();
        const user = MockAPI.getCurrentUser();
        
        if (role === 'OWNER') {
            // Dashboard para Dueño
            const activePawns = pawns.filter(p => p.status === 'ACTIVE');
            const totalLoan = activePawns.reduce((sum, p) => sum + (p.loanAmount || 0), 0);
            const totalValuation = activePawns.reduce((sum, p) => sum + (p.valuation || 0), 0);
            const activeAuctions = auctions.filter(a => a.status === 'ACTIVE');
            
            container.innerHTML = `
                <h2 class="mb-4">📊 Dashboard Ejecutivo - Dueño</h2>
                <div class="row g-4">
                    <div class="col-md-3"><div class="card p-3 bg-primary text-white"><h5>📦 Préstamos activos</h5><h2>${activePawns.length}</h2><small>${formatMoney(totalLoan)} prestados</small></div></div>
                    <div class="col-md-3"><div class="card p-3 bg-success text-white"><h5>💰 Valor en garantía</h5><h2>${formatMoney(totalValuation)}</h2><small>Ratio LTV: ${((totalLoan/totalValuation)*100).toFixed(1)}%</small></div></div>
                    <div class="col-md-3"><div class="card p-3 bg-warning text-dark"><h5>⚡ Subastas activas</h5><h2>${activeAuctions.length}</h2><small>Puja más alta: ${activeAuctions.length ? formatMoney(activeAuctions[0].currentPrice) : 'N/A'}</small></div></div>
                    <div class="col-md-3"><div class="card p-3 bg-info text-white"><h5>💱 Tipo de cambio</h5><h2>${getUSDRate()} Bs/USD</h2></div></div>
                </div>
                <div class="row mt-4"><div class="col"><div class="card p-3"><h5>📈 Últimos movimientos</h5><ul class="list-group">${MockAPI.getNotifications().slice(0,5).map(n=>`<li class="list-group-item">${n.message}<br><small>${formatDate(n.date)}</small></li>`).join('')}</ul></div></div></div>
            `;
        } 
        else if (role === 'EMPLOYEE') {
            // Dashboard para Empleado
            const activePawns = pawns.filter(p => p.status === 'ACTIVE');
            const expiringSoon = activePawns.filter(p => new Date(p.dueDate) < new Date(Date.now() + 3*86400000));
            const activeAuctions = auctions.filter(a => a.status === 'ACTIVE');
            
            container.innerHTML = `
                <h2 class="mb-4">📋 Panel de Empleado</h2>
                <div class="row g-4">
                    <div class="col-md-4"><div class="card p-3 text-center"><h5>📦 Prendas activas</h5><h2>${activePawns.length}</h2><button class="btn btn-sm btn-primary mt-2" onclick="window.navigateTo('/pawns')">Ver todas</button></div></div>
                    <div class="col-md-4"><div class="card p-3 text-center"><h5>⚠️ Por vencer (3 días)</h5><h2 class="text-warning">${expiringSoon.length}</h2><button class="btn btn-sm btn-warning mt-2" onclick="window.navigateTo('/inventory')">Gestionar</button></div></div>
                    <div class="col-md-4"><div class="card p-3 text-center"><h5>🔨 Subastas activas</h5><h2>${activeAuctions.length}</h2><button class="btn btn-sm btn-success mt-2" onclick="window.navigateTo('/auctions')">Monitorizar</button></div></div>
                </div>
                <div class="row mt-4"><div class="col"><div class="card p-3"><h5>📝 Acciones rápidas</h5><div class="d-flex gap-2 flex-wrap"><button class="btn btn-outline-primary" onclick="window.navigateTo('/pawns')">➕ Nuevo empeño</button><button class="btn btn-outline-secondary" onclick="window.navigateTo('/valuation')">🔍 Tasación rápida</button><button class="btn btn-outline-info" onclick="window.navigateTo('/inventory')">📍 Reubicar prenda</button></div></div></div></div>
            `;
        } 
        else if (role === 'CLIENT') {
            // Dashboard para Cliente MEJORADO
            const myPawns = pawns.filter(p => p.clientId === user?.id || p.clientEmail === user?.email);
            const myBids = MockAPI.getBids?.()?.filter(b => b.userId === user?.id) || [];
            const myNotifications = MockAPI.getNotifications().filter(n => n.userId === user?.id || n.userId === null).slice(0,5);
            
            container.innerHTML = `
                <h2 class="mb-4">👋 ¡Hola, ${user?.name || 'Cliente'}!</h2>
                
                <div class="row g-4 mb-4">
                    <div class="col-md-4"><div class="card p-3 text-center bg-primary text-white"><h5>📄 Mis empeños</h5><h2>${myPawns.length}</h2><small>Activos</small></div></div>
                    <div class="col-md-4"><div class="card p-3 text-center bg-warning text-dark"><h5>💰 Mis pujas</h5><h2>${myBids.length}</h2><small>Realizadas</small></div></div>
                    <div class="col-md-4"><div class="card p-3 text-center bg-info text-white"><h5>🔔 Notificaciones</h5><h2>${myNotifications.length}</h2><small>Recientes</small></div></div>
                </div>
                
                <div class="row">
                    <div class="col-md-6">
                        <div class="card p-3 mb-3">
                            <h5>📦 Mis Empeños Activos</h5>
                            ${myPawns.length > 0 ? `
                                <div class="table-responsive">
                                    <table class="table table-sm">
                                        <thead><tr><th>Producto</th><th>Préstamo</th><th>Vence</th><th>Estado</th></tr></thead>
                                        <tbody>
                                            ${myPawns.map(p => `
                                                <tr>
                                                    <td>${p.name}</td>
                                                    <td>${formatMoney(p.loanAmount)}</td>
                                                    <td>${formatDate(p.dueDate)}</td>
                                                    <td><span class="badge ${p.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}">${p.status}</span></td>
                                                </tr>
                                            `).join('')}
                                        </tbody>
                                    </table>
                                </div>
                            ` : '<p class="text-muted">No tienes empeños activos.</p>'}
                            <button class="btn btn-sm btn-outline-primary mt-2" onclick="window.navigateTo('/auctions')">🔍 Ver subastas</button>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card p-3 mb-3">
                            <h5>🔔 Notificaciones Recientes</h5>
                            ${myNotifications.length > 0 ? `
                                <div class="list-group">
                                    ${myNotifications.map(n => `
                                        <div class="list-group-item list-group-item-action">
                                            <small class="text-muted">${formatDate(n.date)}</small>
                                            <p class="mb-0 small">${n.message}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : '<p class="text-muted">No hay notificaciones recientes.</p>'}
                            <button class="btn btn-sm btn-outline-secondary mt-2" onclick="window.navigateTo('/notifications')">📋 Ver todas</button>
                        </div>
                    </div>
                </div>
                
                <div class="card p-3">
                    <h5>📊 Subastas Destacadas</h5>
                    <div class="row">
                        ${MockAPI.getAuctions().filter(a => a.status === 'ACTIVE').slice(0,3).map(a => `
                            <div class="col-md-4 mb-2">
                                <div class="card h-100">
                                    <img src="${a.image}" class="card-img-top" style="height:120px; object-fit:cover;" alt="${a.name}">
                                    <div class="card-body p-2">
                                        <h6 class="card-title">${a.name}</h6>
                                        <p class="card-text small">Puja: ${formatMoney(a.currentPrice)}</p>
                                        <button class="btn btn-sm btn-primary w-100" onclick="window.navigateTo('/auctions')">Ver subasta</button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `<div class="alert alert-info text-center">🔐 Inicia sesión para ver tu dashboard personalizado.<br><br><button class="btn btn-primary" onclick="window.navigateTo('/login')">Iniciar Sesión</button> <button class="btn btn-secondary" onclick="window.navigateTo('/register')">Registrarse</button></div>`;
        }
    }
}
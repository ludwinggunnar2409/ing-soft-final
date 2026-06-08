import { MockAPI } from '../mockApi.js';
import { formatMoney, getUSDRate } from '../utils/currency.js';
import { formatDate, showToast } from '../utils/helpers.js';
import { getUserRole } from '../auth.js';

export default class DashboardView {
    async render(container) {
        const role = getUserRole();
        const pawns = MockAPI.getPawns();
        const auctions = MockAPI.getAuctions();
        const user = MockAPI.getCurrentUser();

        if (role === 'OWNER') {
            // Dashboard para Dueño: KPIs financieros globales
            const activePawns = pawns.filter(p => p.status === 'ACTIVE');
            const totalLoan = activePawns.reduce((sum, p) => sum + (p.loanAmount || 0), 0);
            const totalValuation = activePawns.reduce((sum, p) => sum + (p.valuation || 0), 0);
            const activeAuctions = auctions.filter(a => a.status === 'ACTIVE');
            const commission = totalLoan * 0.03; // Comisión simulada 3%

            container.innerHTML = `
                <h2 class="mb-4">📊 Dashboard Ejecutivo - Dueño</h2>
                <div class="row g-4">
                    <div class="col-md-3"><div class="card p-3"><h5>📦 Préstamos activos</h5><h2>${activePawns.length}</h2><small>${formatMoney(totalLoan)} prestados</small></div></div>
                    <div class="col-md-3"><div class="card p-3"><h5>💰 Valor en garantía</h5><h2>${formatMoney(totalValuation)}</h2><small>Ratio LTV: ${((totalLoan/totalValuation)*100).toFixed(1)}%</small></div></div>
                    <div class="col-md-3"><div class="card p-3"><h5>⚡ Subastas activas</h5><h2>${activeAuctions.length}</h2><small>Puja más alta: ${activeAuctions.length ? formatMoney(activeAuctions[0].currentPrice) : 'N/A'}</small></div></div>
                    <div class="col-md-3"><div class="card p-3"><h5>📈 Comisión SaaS (mes)</h5><h2>${formatMoney(commission)}</h2><small>3% sobre préstamos</small></div></div>
                </div>
                <div class="row mt-4">
                    <div class="col-md-6"><div class="card p-3"><h5>📉 Capital en riesgo</h5><canvas id="riskChart" height="150"></canvas></div></div>
                    <div class="col-md-6"><div class="card p-3"><h5>🔔 Últimas notificaciones</h5><ul class="list-group">${MockAPI.getNotifications().slice(0,5).map(n=>`<li class="list-group-item">${n.message}<br><small>${formatDate(n.date)}</small></li>`).join('')}</ul></div></div>
                </div>
            `;
            // Gráfico simple
            new Chart(document.getElementById('riskChart'), {
                type: 'doughnut',
                data: { labels: ['Préstamos activos', 'Por vencer', 'En subasta'], datasets: [{ data: [totalLoan, totalLoan*0.2, totalLoan*0.1], backgroundColor: ['#2c3e50', '#e67e22', '#c0392b'] }] }
            });
        } 
        else if (role === 'EMPLOYEE') {
            // Dashboard para Empleado: gestión operativa
            const activePawns = pawns.filter(p => p.status === 'ACTIVE');
            const expiringSoon = activePawns.filter(p => new Date(p.dueDate) < new Date(Date.now() + 3*86400000));
            const pendingAuctions = auctions.filter(a => a.status === 'ACTIVE');

            container.innerHTML = `
                <h2 class="mb-4">📋 Panel de Empleado</h2>
                <div class="row g-4">
                    <div class="col-md-4"><div class="card p-3 text-center"><h5>📦 Prendas activas</h5><h2>${activePawns.length}</h2><button class="btn btn-sm btn-primary mt-2" onclick="window.navigateTo('/pawns')">Ver todas</button></div></div>
                    <div class="col-md-4"><div class="card p-3 text-center"><h5>⚠️ Por vencer (3 días)</h5><h2 class="text-warning">${expiringSoon.length}</h2><button class="btn btn-sm btn-warning mt-2" onclick="window.navigateTo('/inventory')">Gestionar</button></div></div>
                    <div class="col-md-4"><div class="card p-3 text-center"><h5>🔨 Subastas activas</h5><h2>${pendingAuctions.length}</h2><button class="btn btn-sm btn-success mt-2" onclick="window.navigateTo('/auctions')">Monitorizar</button></div></div>
                </div>
                <div class="row mt-4"><div class="col"><div class="card p-3"><h5>📝 Acciones rápidas</h5><div class="d-flex gap-2"><button class="btn btn-outline-primary" onclick="window.navigateTo('/pawns')">➕ Nuevo empeño</button><button class="btn btn-outline-secondary" onclick="window.navigateTo('/valuation')">🔍 Tasación rápida</button><button class="btn btn-outline-info" onclick="window.navigateTo('/inventory')">📍 Reubicar prenda</button></div></div></div></div>
            `;
        } 
        else if (role === 'CLIENT') {
            // Dashboard para Cliente: sus contratos y subastas donde ha pujado
            const myPawns = pawns.filter(p => p.clientId === user?.id);
            const myAuctions = auctions.filter(a => {
                const bids = MockAPI.getBids?.() || [];
                return bids.some(b => b.userId === user?.id) || myPawns.some(p => p.id === a.pawnId);
            });

            container.innerHTML = `
                <h2 class="mb-4">👋 Hola, ${user?.name || 'Cliente'}</h2>
                <div class="row g-4">
                    <div class="col-md-6"><div class="card p-3"><h5>📄 Mis empeños activos</h5>${myPawns.length ? `<ul class="list-group">${myPawns.map(p => `<li class="list-group-item">${p.name} - ${formatMoney(p.loanAmount)} prestado<br><small>Vence: ${formatDate(p.dueDate)}</small></li>`).join('')}</ul>` : '<p>No tienes empeños activos.</p>'}<button class="btn btn-sm btn-primary mt-2" onclick="window.navigateTo('/auctions')">Explorar subastas</button></div></div>
                    <div class="col-md-6"><div class="card p-3"><h5>🔔 Notificaciones recientes</h5><ul class="list-group">${MockAPI.getNotifications().slice(0,5).map(n=>`<li class="list-group-item">${n.message}<br><small>${formatDate(n.date)}</small></li>`).join('')}</ul></div></div>
                </div>
            `;
        } else {
            container.innerHTML = `<div class="alert alert-danger">No se ha detectado un rol válido. Inicia sesión nuevamente.</div>`;
        }
    }
}
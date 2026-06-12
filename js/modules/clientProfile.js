import { MockAPI } from '../mockApi.js';
import { formatDate, showToast } from '../utils/helpers.js';
import { formatMoney } from '../utils/currency.js';

export default class ClientProfileView {
    render(container) {
        const user = MockAPI.getCurrentUser();
        if (!user) {
            container.innerHTML = `<div class="alert alert-warning">Debes iniciar sesión para ver tu perfil.</div>`;
            return;
        }
        
        const pawns = MockAPI.getPawns();
        const myPawns = pawns.filter(p => p.clientId === user?.id || p.clientEmail === user?.email);
        const bids = MockAPI.getBids?.() || [];
        const myBids = bids.filter(b => b.userId === user?.id);
        
        container.innerHTML = `
            <h2 class="mb-4">👤 Mi Perfil</h2>
            
            <div class="row">
                <div class="col-md-4">
                    <div class="card p-3 mb-3">
                        <div class="text-center">
                            <div class="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" style="width:100px; height:100px; font-size:40px;">
                                ${user?.name?.charAt(0) || 'U'}
                            </div>
                            <h4 class="mt-2">${user?.name || 'Cliente'}</h4>
                            <p class="text-muted">${user?.email || 'Sin email'}</p>
                            <hr>
                            <p><strong>📱 Celular:</strong> ${user?.phone || 'No registrado'}</p>
                            <p><strong>👑 Rol:</strong> ${user?.role || 'Cliente'}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="card p-3 mb-3">
                        <h5>📦 Mis Empeños (${myPawns.length})</h5>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr><th>Producto</th><th>Préstamo</th><th>Interés</th><th>Vencimiento</th><th>Estado</th>
                                </thead>
                                <tbody>
                                    ${myPawns.map(p => `
                                        <tr>
                                            <td>${p.name || 'N/A'}</td>
                                            <td>${formatMoney(p.loanAmount || 0)}</td>
                                            <td>${((p.interestRate || 0.05) * 100).toFixed(1)}%</td>
                                            <td>${formatDate(p.dueDate)}</td>
                                            <td><span class="badge ${p.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}">${p.status || 'N/A'}</span></td>
                                        </tr>
                                    `).join('')}
                                    ${myPawns.length === 0 ? '<tr><td colspan="5" class="text-center">No tienes empeños registrados</td></tr>' : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="card p-3">
                        <h5>💰 Historial de Pujas (${myBids.length})</h5>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr><th>Producto</th><th>Monto</th><th>Fecha</th><th>Estado</th>
                                </thead>
                                <tbody>
                                    ${myBids.map(b => {
                                        const auction = MockAPI.getAuctions().find(a => a.id === b.auctionId);
                                        return `
                                            <tr>
                                                <td>${auction?.name || 'N/A'}</td>
                                                <td>${formatMoney(b.amount)}</td>
                                                <td>${formatDate(b.time)}</td>
                                                <td><span class="badge ${auction?.status === 'ACTIVE' ? 'bg-warning' : 'bg-secondary'}">${auction?.status === 'ACTIVE' ? 'Activa' : 'Finalizada'}</span></td>
                                            </tr>
                                        `;
                                    }).join('')}
                                    ${myBids.length === 0 ? '<tr><td colspan="4" class="text-center">No has realizado pujas aún</td></tr>' : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
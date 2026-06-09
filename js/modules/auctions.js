import { MockAPI } from '../mockApi.js';
import { formatMoney } from '../utils/currency.js';
import { showToast } from '../utils/helpers.js';
import { getUserRole, isAuthenticated } from '../auth.js';

export default class AuctionsView {
    render(container) {
        const auctions = MockAPI.getAuctions();
        const role = getUserRole();
        const isAuth = isAuthenticated();
        const activeAuctions = auctions.filter(a => a.status === 'ACTIVE');
        
        container.innerHTML = `
            <h2>🔨 Motor de Subastas</h2>
            ${role === 'OWNER' || role === 'EMPLOYEE' ? `<button class="btn btn-success mb-3" id="createAuctionBtn">+ Crear subasta (Admin/Empleado)</button>` : ''}
            <div id="auctionsList">
                ${activeAuctions.length === 0 ? 
                    `<div class="alert alert-info">No hay subastas activas en este momento. Vuelve más tarde.</div>` : 
                    `<div class="row">${activeAuctions.map(a => `
                        <div class="col-md-4 mb-3">
                            <div class="card h-100">
                                <img src="${a.image || 'https://picsum.photos/id/20/200/200'}" class="card-img-top" alt="${a.name}" style="height: 200px; object-fit: cover;">
                                <div class="card-body">
                                    <h5 class="card-title">${a.name}</h5>
                                    <p class="card-text small">${a.description || 'Sin descripción'}</p>
                                    <p class="card-text"><strong>Puja actual: ${formatMoney(a.currentPrice)}</strong></p>
                                    <p class="card-text"><small>Fin: ${new Date(a.endTime).toLocaleString()}</small></p>
                                    ${isAuth ? `
                                        <input type="number" id="bid-${a.id}" class="form-control mb-2" placeholder="Monto a pujar (mínimo ${formatMoney(a.currentPrice + 10)})">
                                        <button class="btn btn-primary w-100 placeBid" data-id="${a.id}">Pujar</button>
                                    ` : `
                                        <div class="alert alert-warning small text-center">
                                            🔒 Para pujar, <a href="#" onclick="window.navigateTo('/login')">inicia sesión</a> o 
                                            <a href="#" onclick="window.navigateTo('/register')">regístrate</a>
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                    `).join('')}</div>`
                }
            </div>
        `;

        // Botón crear subasta (solo admin/empleado)
        if (role === 'OWNER' || role === 'EMPLOYEE') {
            const createBtn = document.getElementById('createAuctionBtn');
            if (createBtn) {
                createBtn.onclick = () => {
                    const pawns = MockAPI.getPawns().filter(p => p.status === 'ACTIVE');
                    if (pawns.length === 0) return showToast('No hay prendas activas para subastar', 'warning');
                    const p = pawns[0];
                    MockAPI.createAuction({
                        id: p.id,
                        name: p.name,
                        description: p.description || 'Producto en subasta',
                        image: p.image || 'https://picsum.photos/id/20/200/200',
                        currentPrice: p.loanAmount,
                        startingPrice: p.loanAmount,
                        status: 'ACTIVE',
                        endTime: Date.now() + 7 * 86400000
                    });
                    showToast(`Subasta creada para ${p.name}`);
                    this.render(container);
                };
            }
        }

        // Eventos de puja (solo usuarios autenticados)
        if (isAuth) {
            document.querySelectorAll('.placeBid').forEach(btn => {
                btn.onclick = () => {
                    const auctionId = btn.dataset.id;
                    const amount = parseFloat(document.getElementById(`bid-${auctionId}`).value);
                    if (isNaN(amount)) return showToast('Ingrese monto válido', 'danger');
                    try {
                        MockAPI.placeBid(auctionId, 'currentUser', amount);
                        showToast('Puja registrada', 'success');
                        MockAPI.addNotification(`Nueva puja de ${formatMoney(amount)} en subasta ${auctionId}`);
                        this.render(container);
                    } catch(e) { showToast(e.message, 'danger'); }
                };
            });
        }
    }
}
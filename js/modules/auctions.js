import { MockAPI } from '../mockApi.js';
import { formatMoney } from '../utils/currency.js';
import { showToast } from '../utils/helpers.js';
import { getUserRole } from '../auth.js';

export default class AuctionsView {
    render(container) {
        const auctions = MockAPI.getAuctions();
        const role = getUserRole();
        const activeAuctions = auctions.filter(a => a.status === 'ACTIVE');
        
        container.innerHTML = `
            <h2>🔨 Motor de Subastas</h2>
            ${role !== 'CLIENT' ? `<button class="btn btn-success mb-3" id="createAuctionBtn">+ Crear subasta (Admin/Empleado)</button>` : ''}
            <div id="auctionsList">
                ${activeAuctions.length === 0 ? 
                    `<div class="alert alert-info">No hay subastas activas en este momento. Vuelve más tarde.</div>` : 
                    `<div class="row">${activeAuctions.map(a => `
                        <div class="col-md-4 mb-3">
                            <div class="card">
                                <div class="card-body">
                                    <h5>Subasta #${a.id.slice(-6)}</h5>
                                    <p>Puja actual: <strong>${formatMoney(a.currentPrice)}</strong></p>
                                    <p>Fin: ${new Date(a.endTime).toLocaleString()}</p>
                                    ${role !== 'CLIENT' ? '' : `
                                        <input type="number" id="bid-${a.id}" class="form-control mb-2" placeholder="Monto a pujar (mínimo ${formatMoney(a.currentPrice + 10)})">
                                        <button class="btn btn-primary placeBid" data-id="${a.id}">Pujar</button>
                                    `}
                                </div>
                            </div>
                        </div>
                    `).join('')}</div>`
                }
            </div>
        `;

        if (role !== 'CLIENT') {
            const createBtn = document.getElementById('createAuctionBtn');
            if (createBtn) {
                createBtn.onclick = () => {
                    const pawns = MockAPI.getPawns().filter(p => p.status === 'ACTIVE');
                    if (pawns.length === 0) return showToast('No hay prendas activas para subastar', 'warning');
                    const p = pawns[0];
                    MockAPI.createAuction(p.id, p.loanAmount);
                    showToast(`Subasta creada para ${p.name}`);
                    this.render(container);
                };
            }
        }

        if (role === 'CLIENT') {
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
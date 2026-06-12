import { MockAPI } from '../mockApi.js';
import { formatMoney } from '../utils/currency.js';
import { showToast } from '../utils/helpers.js';
import { getUserRole, isAuthenticated } from '../auth.js';

export default class AuctionsView {
    constructor() {
        this.paymentInterval = null;
    }
    
    render(container) {
        const auctions = MockAPI.getAuctions();
        const role = getUserRole();
        const isAuth = isAuthenticated();
        const activeAuctions = auctions.filter(a => a.status === 'ACTIVE');
        const waitingPayment = auctions.filter(a => a.status === 'WAITING_PAYMENT');
        
        container.innerHTML = `
            <h2 class="mb-4">🔨 Motor de Subastas</h2>
            
            ${waitingPayment.length > 0 ? `
                <div class="alert alert-warning">
                    <h6>⏰ Subastas esperando pago</h6>
                    ${waitingPayment.map(a => `
                        <div class="d-flex justify-content-between align-items-center border-bottom pb-2 mb-2">
                            <div><strong>${a.name}</strong> - Ganador: ${a.winner?.userName || 'Usuario'} - ${formatMoney(a.currentPrice)}</div>
                            ${isAuth && a.winner?.userId === MockAPI.getCurrentUser()?.id ? 
                                `<button class="btn btn-success btn-sm payNowBtn" data-id="${a.id}">💰 Pagar ahora</button>` : 
                                `<span class="text-muted">Esperando pago...</span>`
                            }
                        </div>
                    `).join('')}
                </div>
            ` : ''}
            
            ${role === 'OWNER' || role === 'EMPLOYEE' ? 
                `<button class="btn btn-success mb-3" id="createAuctionBtn">+ Crear subasta manual</button>` : ''}
            
            <div id="auctionsList">
                ${activeAuctions.length === 0 ? 
                    `<div class="alert alert-info">No hay subastas activas en este momento.</div>` : 
                    `<div class="row">${activeAuctions.map(a => this.renderAuctionCard(a, isAuth)).join('')}</div>`
                }
            </div>
            
            <div id="paymentModalContainer"></div>
        `;
        
        // Eventos
        if (role === 'OWNER' || role === 'EMPLOYEE') {
            document.getElementById('createAuctionBtn')?.addEventListener('click', () => this.showCreateAuctionModal());
        }
        
        document.querySelectorAll('.placeBid').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const auctionId = btn.dataset.id;
                const input = document.getElementById(`bid-${auctionId}`);
                const amount = parseFloat(input?.value);
                if (isNaN(amount)) return showToast('Ingrese un monto válido', 'danger');
                this.placeBid(auctionId, amount);
            });
        });
        
        document.querySelectorAll('.buyNow').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const auctionId = btn.dataset.id;
                const price = parseFloat(btn.dataset.price);
                this.showDirectPurchaseModal(auctionId, price);
            });
        });
        
        document.querySelectorAll('.payNowBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const auctionId = btn.dataset.id;
                this.processWinnerPayment(auctionId);
            });
        });
        
        // Iniciar temporizadores
        this.startTimers(activeAuctions);
    }
    
    renderAuctionCard(auction, isAuth) {
        const timeLeft = auction.endTime - Date.now();
        const isEndingSoon = timeLeft < 60000; // Último minuto
        
        return `
            <div class="col-md-4 mb-3">
                <div class="card h-100 ${isEndingSoon ? 'border-danger' : ''}">
                    <img src="${auction.image}" class="card-img-top" alt="${auction.name}" style="height: 200px; object-fit: cover;">
                    <div class="card-body">
                        <h5 class="card-title">${auction.name}</h5>
                        <p class="card-text small">${auction.description || 'Sin descripción'}</p>
                        <p class="card-text">
                            <strong>Puja actual: ${formatMoney(auction.currentPrice)}</strong>
                        </p>
                        <p class="card-text">
                            <small>Compra directa: ${formatMoney(auction.directBuyPrice || auction.currentPrice * 1.5)}</small>
                        </p>
                        <p class="card-text">
                            <small id="timer-${auction.id}">⏰ ${this.formatTimeLeft(timeLeft)}</small>
                        </p>
                        ${isAuth ? `
                            <input type="number" id="bid-${auction.id}" class="form-control mb-2" 
                                   placeholder="Monto a pujar (mín ${formatMoney(auction.currentPrice + 10)})">
                            <div class="d-grid gap-2">
                                <button class="btn btn-primary placeBid" data-id="${auction.id}">Pujar</button>
                                <button class="btn btn-success buyNow" data-id="${auction.id}" 
                                        data-price="${auction.directBuyPrice || auction.currentPrice * 1.5}">
                                    💰 Comprar ahora (${formatMoney(auction.directBuyPrice || auction.currentPrice * 1.5)})
                                </button>
                            </div>
                        ` : `
                            <div class="alert alert-warning small text-center">
                                🔒 <a href="#" onclick="window.navigateTo('/login')">Inicia sesión</a> o 
                                <a href="#" onclick="window.navigateTo('/register')">regístrate</a> para pujar
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }
    
    formatTimeLeft(ms) {
        if (ms <= 0) return 'Finalizada';
        const hours = Math.floor(ms / (60 * 60 * 1000));
        const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
        const seconds = Math.floor((ms % (60 * 1000)) / 1000);
        
        if (hours > 0) return `${hours}h ${minutes}m`;
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    }
    
    startTimers(auctions) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        
        this.timerInterval = setInterval(() => {
            auctions.forEach(auction => {
                const timeLeft = auction.endTime - Date.now();
                const timerElement = document.getElementById(`timer-${auction.id}`);
                if (timerElement) {
                    timerElement.textContent = `⏰ ${this.formatTimeLeft(timeLeft)}`;
                    if (timeLeft <= 0) {
                        // Recargar para actualizar estado
                        this.render(document.getElementById('main-content'));
                    }
                }
            });
        }, 1000);
    }
    
    async placeBid(auctionId, amount) {
        try {
            const result = MockAPI.placeBid(auctionId, MockAPI.getCurrentUser()?.id, amount);
            if (result) {
                showToast('Puja registrada exitosamente', 'success');
                // Recargar para actualizar
                this.render(document.getElementById('main-content'));
            }
        } catch (error) {
            showToast(error.message, 'danger');
        }
    }
    
    showDirectPurchaseModal(auctionId, price) {
        const modalHtml = `
            <div class="modal fade" id="directPurchaseModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5>💰 Compra Directa</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p>Estás a punto de comprar este producto por <strong>${formatMoney(price)}</strong></p>
                            <p>Métodos de pago disponibles:</p>
                            <div class="list-group mb-3">
                                <button class="list-group-item list-group-item-action paymentMethod" data-method="qr">📱 QR Simple (BCP/BISA)</button>
                                <button class="list-group-item list-group-item-action paymentMethod" data-method="transfer">🏦 Transferencia bancaria</button>
                                <button class="list-group-item list-group-item-action paymentMethod" data-method="cash">💵 Pago en tienda</button>
                            </div>
                            <div id="paymentDetails" class="alert alert-info"></div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('paymentModalContainer').innerHTML = modalHtml;
        const modal = new bootstrap.Modal(document.getElementById('directPurchaseModal'));
        modal.show();
        
        document.querySelectorAll('.paymentMethod').forEach(btn => {
            btn.addEventListener('click', () => {
                const method = btn.dataset.method;
                const details = document.getElementById('paymentDetails');
                
                if (method === 'qr') {
                    details.innerHTML = `
                        <strong>Código QR generado:</strong><br>
                        <div class="text-center p-3 bg-white rounded">
                            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PagoSIGES-${Date.now()}" alt="QR">
                            <p class="mt-2 small">Escanea el código desde tu billetera móvil</p>
                        </div>
                        <button class="btn btn-success w-100 mt-2" id="confirmPaymentBtn">✅ Confirmar pago (simulado)</button>
                    `;
                } else if (method === 'transfer') {
                    details.innerHTML = `
                        <strong>Datos para transferencia:</strong><br>
                        Banco: BISA<br>
                        Cuenta: 123-456789-0<br>
                        CI: 1234567<br>
                        Referencia: SIGES-${Date.now()}<br>
                        <button class="btn btn-success w-100 mt-2" id="confirmPaymentBtn">✅ Confirmar pago (simulado)</button>
                    `;
                } else {
                    details.innerHTML = `
                        <strong>Pago en tienda:</strong><br>
                        Puedes pagar en nuestras oficinas dentro de las próximas 24 horas.<br>
                        Dirección: Av. Principal #123, Edificio SIGES<br>
                        <button class="btn btn-success w-100 mt-2" id="confirmPaymentBtn">✅ Reservar producto</button>
                    `;
                }
                
                document.getElementById('confirmPaymentBtn')?.addEventListener('click', () => {
                    this.completeDirectPurchase(auctionId, price);
                    modal.hide();
                });
            });
        });
    }
    
    completeDirectPurchase(auctionId, price) {
        const auction = MockAPI.getAuctions().find(a => a.id === auctionId);
        if (auction) {
            auction.status = 'SOLD';
            auction.finalPrice = price;
            auction.winner = { userId: MockAPI.getCurrentUser()?.id, amount: price };
            auction.winnerPaid = true;
            MockAPI.updateAuction(auctionId, auction);
            
            MockAPI.addNotification(
                `🎉 ¡Compra exitosa! Has adquirido "${auction.name}" por ${formatMoney(price)}. ` +
                `Puedes recoger tu producto en nuestra tienda presentando este comprobante.`,
                MockAPI.getCurrentUser()?.id
            );
            
            showToast('Compra realizada con éxito', 'success');
            this.render(document.getElementById('main-content'));
        }
    }
    
    processWinnerPayment(auctionId) {
        const auction = MockAPI.getAuctions().find(a => a.id === auctionId);
        if (auction && auction.winner) {
            auction.winnerPaid = true;
            auction.status = 'COMPLETED';
            MockAPI.updateAuction(auctionId, auction);
            
            MockAPI.addNotification(
                `✅ Pago confirmado. Puedes recoger "${auction.name}" en nuestra tienda. ` +
                `Presenta tu CI y este comprobante.`,
                auction.winner.userId
            );
            
            showToast('Pago registrado correctamente', 'success');
            this.render(document.getElementById('main-content'));
        }
    }
    
    showCreateAuctionModal() {
        const pawns = MockAPI.getPawns().filter(p => p.status === 'ACTIVE' || p.status === 'IN_AUCTION');
        if (pawns.length === 0) {
            showToast('No hay prendas disponibles para subastar', 'warning');
            return;
        }
        
        const modalHtml = `
            <div class="modal fade" id="createAuctionModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5>➕ Crear Subasta Manual</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="mb-3">
                                <label>Seleccionar prenda</label>
                                <select id="auctionPawnId" class="form-select">
                                    ${pawns.map(p => `<option value="${p.id}">${p.name} - Deuda: ${formatMoney(p.loanAmount)}</option>`).join('')}
                                </select>
                            </div>
                            <div class="mb-3">
                                <label>Precio base (Bs)</label>
                                <input type="number" id="auctionStartPrice" class="form-control" readonly>
                            </div>
                            <div class="mb-3">
                                <label>Precio compra directa (+50%)</label>
                                <input type="number" id="auctionDirectPrice" class="form-control" readonly>
                            </div>
                            <div class="mb-3">
                                <label>Duración (días)</label>
                                <select id="auctionDuration" class="form-select">
                                    <option value="3">3 días</option>
                                    <option value="7" selected>7 días</option>
                                    <option value="14">14 días</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button class="btn btn-primary" id="confirmCreateAuction">Crear Subasta</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('paymentModalContainer').innerHTML = modalHtml;
        const modal = new bootstrap.Modal(document.getElementById('createAuctionModal'));
        modal.show();
        
        const pawnSelect = document.getElementById('auctionPawnId');
        const startPriceInput = document.getElementById('auctionStartPrice');
        const directPriceInput = document.getElementById('auctionDirectPrice');
        
        const updatePrices = () => {
            const pawn = pawns.find(p => p.id === pawnSelect.value);
            if (pawn) {
                startPriceInput.value = pawn.loanAmount;
                directPriceInput.value = Math.round(pawn.loanAmount * 1.5);
            }
        };
        
        pawnSelect.addEventListener('change', updatePrices);
        updatePrices();
        
        document.getElementById('confirmCreateAuction').onclick = () => {
            const pawnId = pawnSelect.value;
            const pawn = pawns.find(p => p.id === pawnId);
            const duration = parseInt(document.getElementById('auctionDuration').value);
            
            const auctionData = {
                id: `auction_${pawnId}_${Date.now()}`,
                pawnId: pawn.id,
                name: pawn.name,
                description: pawn.description || 'Producto en subasta',
                image: pawn.photos?.[0] || 'https://picsum.photos/id/20/200/200',
                currentPrice: pawn.loanAmount,
                startingPrice: pawn.loanAmount,
                minPrice: pawn.loanAmount,
                directBuyPrice: Math.round(pawn.loanAmount * 1.5),
                status: 'ACTIVE',
                endTime: Date.now() + (duration * 24 * 60 * 60 * 1000),
                bids: []
            };
            
            MockAPI.createAuction(auctionData);
            MockAPI.updatePawn(pawn.id, { status: 'IN_AUCTION' });
            
            showToast('Subasta creada exitosamente', 'success');
            modal.hide();
            this.render(document.getElementById('main-content'));
        };
    }
}
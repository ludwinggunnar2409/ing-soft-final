// Automatización de subastas: conversión por impago, extensiones, liquidaciones

import { MockAPI } from '../mockApi.js';
import { showToast } from '../helpers.js';
import { formatMoney } from '../currency.js';

// Verificar empeños en mora y convertirlos a subasta
export function checkAndConvertToAuction() {
    const pawns = MockAPI.getPawns();
    const now = new Date();
    let converted = 0;
    
    pawns.forEach(pawn => {
        // Solo empeños activos con más de 90 días de atraso
        if (pawn.status === 'ACTIVE' && pawn.dueDate) {
            const dueDate = new Date(pawn.dueDate);
            const daysOverdue = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
            
            if (daysOverdue >= 90) {
                // Convertir a subasta
                const auctionData = {
                    id: `auction_${pawn.id}_${Date.now()}`,
                    pawnId: pawn.id,
                    name: pawn.name,
                    description: pawn.description || 'Producto en subasta por falta de pago',
                    image: pawn.photos?.[0] || 'https://picsum.photos/id/20/200/200',
                    currentPrice: pawn.loanAmount, // Precio base = deuda
                    startingPrice: pawn.loanAmount,
                    minPrice: pawn.loanAmount, // No puede ser menor a la deuda
                    directBuyPrice: Math.round(pawn.loanAmount * 1.5), // +50%
                    status: 'ACTIVE',
                    endTime: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 días
                    bids: [],
                    winner: null,
                    winnerPaid: false,
                    paymentDeadline: null
                };
                
                MockAPI.createAuction(auctionData);
                MockAPI.updatePawn(pawn.id, { status: 'IN_AUCTION' });
                
                // Notificar al cliente
                MockAPI.addNotification(
                    `🚨 SUBASTA: Su empeño "${pawn.name}" ha sido enviado a subasta por falta de pago. ` +
                    `Precio base: ${formatMoney(pawn.loanAmount)}. Compra directa: ${formatMoney(Math.round(pawn.loanAmount * 1.5))}`,
                    pawn.clientId
                );
                
                converted++;
            }
        }
    });
    
    if (converted > 0) {
        console.log(`${converted} empeños convertidos a subasta`);
    }
    
    return converted;
}

// Verificar subastas vencidas y procesar ganador
export function checkExpiredAuctions() {
    const auctions = MockAPI.getAuctions();
    const now = Date.now();
    let processed = 0;
    
    auctions.forEach(auction => {
        if (auction.status === 'ACTIVE' && auction.endTime <= now) {
            // Subasta terminada
            if (auction.bids && auction.bids.length > 0) {
                // Ordenar pujas de mayor a menor
                const sortedBids = [...auction.bids].sort((a, b) => b.amount - a.amount);
                const winner = sortedBids[0];
                
                auction.status = 'WAITING_PAYMENT';
                auction.winner = winner;
                auction.winnerPaid = false;
                auction.paymentDeadline = now + (5 * 60 * 1000); // 5 minutos para pagar
                
                // Notificar al ganador
                MockAPI.addNotification(
                    `🏆 ¡FELICITACIONES! Ganaste la subasta de "${auction.name}" con una puja de ${formatMoney(winner.amount)}. ` +
                    `Tienes 5 minutos para realizar el pago.`,
                    winner.userId
                );
                
                // Notificar a los perdedores
                sortedBids.slice(1).forEach(bid => {
                    MockAPI.addNotification(
                        `📢 Fuiste superado en la subasta de "${auction.name}". La puja ganadora fue de ${formatMoney(winner.amount)}.`,
                        bid.userId
                    );
                });
            } else {
                // Sin pujas - subasta desierta
                auction.status = 'DESERTED';
                
                // Reducir precio 10% para reintentar
                const newPrice = Math.round(auction.startingPrice * 0.9);
                if (newPrice >= auction.minPrice * 0.7) { // No bajar más del 30%
                    // Re-programar subasta
                    auction.startingPrice = newPrice;
                    auction.currentPrice = newPrice;
                    auction.endTime = now + (7 * 24 * 60 * 60 * 1000);
                    auction.status = 'ACTIVE';
                    
                    MockAPI.addNotification(
                        `🔄 Subasta de "${auction.name}" sin pujas. Reintentando con precio base: ${formatMoney(newPrice)}`,
                        null
                    );
                } else {
                    auction.status = 'CLOSED';
                    MockAPI.addNotification(
                        `❌ Subasta de "${auction.name}" cerrada sin éxito. El producto será donado o liquidado.`,
                        null
                    );
                }
            }
            
            MockAPI.updateAuction(auction.id, auction);
            processed++;
        }
    });
    
    return processed;
}

// Verificar pagos pendientes de subastas
export function checkPendingPayments() {
    const auctions = MockAPI.getAuctions();
    const now = Date.now();
    let expired = 0;
    
    auctions.forEach(auction => {
        if (auction.status === 'WAITING_PAYMENT' && 
            auction.paymentDeadline && 
            auction.paymentDeadline <= now &&
            !auction.winnerPaid) {
            
            // Pago expirado - pasar al siguiente postor
            if (auction.bids && auction.bids.length > 1) {
                const sortedBids = [...auction.bids].sort((a, b) => b.amount - a.amount);
                const nextWinner = sortedBids[1];
                
                auction.winner = nextWinner;
                auction.paymentDeadline = now + (5 * 60 * 1000);
                auction.currentPrice = nextWinner.amount;
                
                MockAPI.addNotification(
                    `⏰ El ganador anterior no completó el pago. ¡Eres el nuevo ganador de "${auction.name}"! ` +
                    `Tienes 5 minutos para pagar ${formatMoney(nextWinner.amount)}.`,
                    nextWinner.userId
                );
            } else {
                auction.status = 'ACTIVE';
                auction.endTime = now + (24 * 60 * 60 * 1000); // Extender 24 horas
                auction.paymentDeadline = null;
                
                MockAPI.addNotification(
                    `🔄 La subasta de "${auction.name}" se ha reactivado por falta de pago del ganador.`,
                    null
                );
            }
            
            MockAPI.updateAuction(auction.id, auction);
            expired++;
        }
    });
    
    return expired;
}

// Ejecutar todas las tareas automáticas
export function runAuctionJobs() {
    console.log('🔄 Ejecutando jobs de subastas...');
    const converted = checkAndConvertToAuction();
    const expired = checkExpiredAuctions();
    const payments = checkPendingPayments();
    console.log(`✅ Convertidos: ${converted}, Finalizadas: ${expired}, Pagos expirados: ${payments}`);
}

// Programar ejecución cada hora
if (typeof window !== 'undefined') {
    // Ejecutar al cargar
    setTimeout(runAuctionJobs, 5000);
    // Cada hora
    setInterval(runAuctionJobs, 60 * 60 * 1000);
}
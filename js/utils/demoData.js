import { MockAPI } from '../mockApi.js';
import { generateId } from './helpers.js';

// Clientes de ejemplo
const clientesDemo = [
    { name: 'Carlos Méndez', ci: '1234567LP', email: 'carlos@mail.com', phone: '71234567', address: 'Av. América #123' },
    { name: 'María Fernández', ci: '8765432CB', email: 'maria@mail.com', phone: '72345678', address: 'Calle Sucre #456' },
    { name: 'José Quispe', ci: '4567890SC', email: 'jose@mail.com', phone: '73456789', address: 'Av. Libertad #789' },
    { name: 'Ana Rodríguez', ci: '5678901LP', email: 'ana@mail.com', phone: '74567890', address: 'Calle Junín #321' },
    { name: 'Pedro Vargas', ci: '6789012CB', email: 'pedro@mail.com', phone: '75678901', address: 'Av. San Martín #654' }
];

// Productos adicionales
const productosDemo = [
    { name: 'iPhone 12', category: 'Electrónica', valuation: 3500, loanAmount: 2450, interestRate: 0.05, months: 6 },
    { name: 'Samsung Galaxy S22', category: 'Electrónica', valuation: 3200, loanAmount: 2240, interestRate: 0.05, months: 3 },
    { name: 'iPad Pro 11"', category: 'Electrónica', valuation: 4200, loanAmount: 2940, interestRate: 0.055, months: 6 },
    { name: 'TV LG 55"', category: 'Electrónica', valuation: 2800, loanAmount: 1960, interestRate: 0.05, months: 3 },
    { name: 'PlayStation 5', category: 'Electrónica', valuation: 3800, loanAmount: 2660, interestRate: 0.055, months: 6 },
    { name: 'Collar de oro', category: 'Joyería', valuation: 5200, loanAmount: 3640, interestRate: 0.04, months: 12 },
    { name: 'Pulsera de plata', category: 'Joyería', valuation: 1200, loanAmount: 840, interestRate: 0.04, months: 3 },
    { name: 'Moto Honda CB190', category: 'Vehículos', valuation: 18500, loanAmount: 12950, interestRate: 0.06, months: 12 }
];

// Generar fecha aleatoria (días atrás)
function randomDate(daysAgoMax) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgoMax));
    return date.toISOString();
}

// Generar estado aleatorio
function randomStatus() {
    const statuses = ['ACTIVE', 'COMPLETED', 'IN_AUCTION'];
    const weights = [0.6, 0.3, 0.1];
    const random = Math.random();
    let sum = 0;
    for (let i = 0; i < statuses.length; i++) {
        sum += weights[i];
        if (random < sum) return statuses[i];
    }
    return 'ACTIVE';
}

export function generateDemoData() {
    console.log('🏪 Generando datos de demostración...');
    
    // 1. Crear empeños históricos
    const existingPawns = MockAPI.getPawns();
    if (existingPawns.length === 0) {
        
        // Empeños activos (5)
        for (let i = 0; i < 5; i++) {
            const client = clientesDemo[i % clientesDemo.length];
            const product = productosDemo[i % productosDemo.length];
            const startDate = randomDate(180); // hasta 6 meses atrás
            const dueDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + product.months));
            
            MockAPI.createPawn({
                name: product.name,
                category: product.category,
                description: `${product.name} en buen estado, incluye accesorios originales.`,
                valuation: product.valuation,
                loanAmount: product.loanAmount,
                interestRate: product.interestRate,
                months: product.months,
                status: 'ACTIVE',
                startDate: startDate,
                dueDate: dueDate.toISOString(),
                clientName: client.name,
                clientCI: client.ci,
                clientEmail: client.email,
                clientPhone: client.phone,
                clientAddress: client.address,
                contractType: Math.random() > 0.5 ? 'mensual' : 'pago_unico',
                location: `Estante ${Math.floor(Math.random() * 5) + 1}-Nivel ${Math.floor(Math.random() * 3) + 1}`
            });
        }
        
        // Empeños completados/pagados (3)
        const completados = [
            { name: 'iPhone 13', category: 'Electrónica', valuation: 4800, loanAmount: 3360, client: clientesDemo[0], months: 3 },
            { name: 'Anillo de compromiso', category: 'Joyería', valuation: 6800, loanAmount: 4760, client: clientesDemo[2], months: 6 },
            { name: 'MacBook Air', category: 'Electrónica', valuation: 7200, loanAmount: 5040, client: clientesDemo[4], months: 12 }
        ];
        
        completados.forEach(product => {
            const startDate = randomDate(365);
            const dueDate = new Date(new Date(startDate).setMonth(new Date(startDate).getMonth() + product.months));
            
            MockAPI.createPawn({
                name: product.name,
                category: product.category,
                description: `${product.name} entregado a tiempo.`,
                valuation: product.valuation,
                loanAmount: product.loanAmount,
                interestRate: 0.05,
                months: product.months,
                status: 'COMPLETED',
                startDate: startDate,
                dueDate: dueDate.toISOString(),
                clientName: product.client.name,
                clientCI: product.client.ci,
                clientEmail: product.client.email,
                clientPhone: product.client.phone,
                clientAddress: product.client.address,
                contractType: 'pago_unico'
            });
        });
    }
    
    // 2. Crear subastas históricas y activas
    const existingAuctions = MockAPI.getAuctions();
    if (existingAuctions.length <= 5) {
        // Subastas activas (3)
        const activeAuctions = [
            { name: 'iPhone 14 Pro', price: 5200, directPrice: 7800, endDays: 2 },
            { name: 'Rolex Datejust', price: 15500, directPrice: 23250, endDays: 5 },
            { name: 'Samsung QLED 65"', price: 3800, directPrice: 5700, endDays: 1 }
        ];
        
        activeAuctions.forEach(auction => {
            MockAPI.createAuction({
                id: generateId(),
                name: auction.name,
                description: `Producto en excelente estado. Subasta activa.`,
                image: `https://picsum.photos/id/${Math.floor(Math.random() * 20)}/200/200`,
                currentPrice: auction.price,
                startingPrice: auction.price,
                minPrice: auction.price,
                directBuyPrice: auction.directPrice,
                status: 'ACTIVE',
                endTime: Date.now() + (auction.endDays * 24 * 60 * 60 * 1000),
                bids: [
                    { userId: '3', amount: auction.price + 200, time: new Date(Date.now() - 3600000).toISOString() },
                    { userId: '4', amount: auction.price + 100, time: new Date(Date.now() - 7200000).toISOString() }
                ]
            });
        });
        
        // Subastas finalizadas (2)
        const finishedAuctions = [
            { name: 'MacBook Pro M2', finalPrice: 8500, winner: 'Carlos Méndez', winnerId: '3' },
            { name: 'Anillo de diamantes', finalPrice: 9200, winner: 'Ana Rodríguez', winnerId: '5' }
        ];
        
        finishedAuctions.forEach(auction => {
            MockAPI.createAuction({
                id: generateId(),
                name: auction.name,
                description: `Subasta finalizada.`,
                image: `https://picsum.photos/id/${Math.floor(Math.random() * 20) + 20}/200/200`,
                currentPrice: auction.finalPrice,
                startingPrice: auction.finalPrice * 0.7,
                minPrice: auction.finalPrice * 0.7,
                directBuyPrice: auction.finalPrice * 1.5,
                status: 'COMPLETED',
                endTime: Date.now() - (Math.random() * 14 * 24 * 60 * 60 * 1000),
                bids: [
                    { userId: auction.winnerId, amount: auction.finalPrice, time: new Date(Date.now() - 15 * 24 * 3600000).toISOString() }
                ],
                winner: { userId: auction.winnerId, userName: auction.winner, amount: auction.finalPrice },
                winnerPaid: true
            });
        });
    }
    
    // 3. Crear notificaciones históricas
    const existingNotifs = MockAPI.getNotifications();
    if (existingNotifs.length < 10) {
        const notificacionesDemo = [
            { msg: '📱 El empeño de Carlos Méndez (iPhone 12) vence en 3 días', daysAgo: 2, userId: '1' },
            { msg: '💰 Pago recibido de María Fernández por Bs. 450', daysAgo: 5, userId: '1' },
            { msg: '🔨 Nueva subasta: Rolex Datejust - Puja inicial Bs. 15,500', daysAgo: 1, userId: null },
            { msg: '🏆 ¡Felicidades! Has ganado la subasta de MacBook Pro', daysAgo: 3, userId: '3' },
            { msg: '📦 Producto entregado: Anillo de diamantes a Ana Rodríguez', daysAgo: 7, userId: '1' },
            { msg: '⚠️ El empeño de José Quispe (TV LG) tiene 15 días de atraso', daysAgo: 4, userId: '1' },
            { msg: '💎 Nueva valuación: Collar de oro valorado en Bs. 5,200', daysAgo: 6, userId: null },
            { msg: '🔄 Subasta de Samsung QLED extendida por 2 minutos', daysAgo: 0, userId: null },
            { msg: '✅ Pago completado para el empeño de Pedro Vargas', daysAgo: 10, userId: '1' },
            { msg: '📊 Reporte mensual: Utilidad del mes Bs. 18,500', daysAgo: 15, userId: '1' }
        ];
        
        notificacionesDemo.forEach(notif => {
            const date = new Date();
            date.setDate(date.getDate() - notif.daysAgo);
            MockAPI.addNotification(notif.msg, notif.userId);
        });
    }
    
    // 4. Registrar pujas adicionales
    console.log('✅ Datos de demostración generados correctamente');
    console.log(`📦 Empeños: ${MockAPI.getPawns().length}`);
    console.log(`🔨 Subastas: ${MockAPI.getAuctions().length}`);
    console.log(`🔔 Notificaciones: ${MockAPI.getNotifications().length}`);
}

// Función para resetear y generar datos frescos
export function resetAndGenerateDemo() {
    // Limpiar datos actuales
    localStorage.removeItem('siges_initialized');
    
    // Recargar la página para reiniciar
    window.location.reload();
}
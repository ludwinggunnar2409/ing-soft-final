import { generateId } from './utils/helpers.js';

// Datos iniciales simulados
let users = [
    { id: '1', name: 'Dueño SIGES', email: 'owner@siges.com', password: 'owner123', role: 'OWNER' },
    { id: '2', name: 'Empleado Juan', email: 'empleado@siges.com', password: 'emp123', role: 'EMPLOYEE' },
    { id: '3', name: 'Cliente Ana', email: 'cliente@mail.com', password: 'cli123', role: 'CLIENT' }
];

let pawns = [
    { id: 'p1', name: 'iPhone 13', category: 'Electrónica', photos: [], status: 'ACTIVE', valuation: 2500, loanAmount: 1750, interestRate: 0.05, startDate: new Date().toISOString(), dueDate: new Date(Date.now()+30*86400000).toISOString(), clientId: '3', location: 'A1-B2-C3' }
];

let auctions = [];
let bids = [];
let notifications = [];

// Productos de ejemplo para subastas (con imágenes reales)
const sampleProducts = [
    { id: 'prod1', name: 'iPhone 14 Pro', description: '256GB, color morado, como nuevo', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTk77pl-B7sASOuVQjW4JHZNK3loBt0kXKcVw&s', category: 'Electrónica', startingPrice: 5000 },
    { id: 'prod2', name: 'Rolex Datejust', description: 'Acero inoxidable, año 2020', image: 'https://mywatchllc.com/cdn/shop/files/0C1191CA-778F-47FD-99BD-D59092B1926C.jpg?v=1710446245&width=823', category: 'Joyería', startingPrice: 15000 },
    { id: 'prod3', name: 'Samsung QLED 65"', description: 'TV 4K, modelo 2023', image: 'https://sm.pcmag.com/t/pcmag_me/review/s/samsung-65/samsung-65-inch-s95c-oled-tv_1ruf.1920.jpg', category: 'Electrónica', startingPrice: 3500 },
    { id: 'prod4', name: 'Anillo de diamantes', description: '18k oro blanco, 1.5 quilates', image: 'https://cristaljoyas.com/media/catalog/product/cache/84670e791a5bf9945d428408edd61f53/a/s/as4rb-11642ew.jpg', category: 'Joyería', startingPrice: 8000 },
    { id: 'prod5', name: 'MacBook Pro M2', description: '16GB RAM, 512GB SSD', image: 'https://techcrunch.com/wp-content/uploads/2023/01/CMC_5928.jpg?resize=668,445', category: 'Electrónica', startingPrice: 7500 }
];

export const MockAPI = {
    // Autenticación
    login: async (email, pass) => {
        const user = users.find(u => u.email === email && u.password === pass);
        if (!user) throw new Error('Credenciales inválidas');
        const token = btoa(JSON.stringify({ id: user.id, role: user.role, name: user.name, exp: Date.now() + 3600000 }));
        localStorage.setItem('token', token);
        return { user, token };
    },

    getCurrentUser: () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try { 
            return JSON.parse(atob(token)); 
        } catch(e) { 
            return null; 
        }
    },

    logout: () => localStorage.removeItem('token'),

    // Registro de nuevos usuarios
    register: async (userData) => {
        const existing = users.find(u => u.email === userData.email);
        if (existing) throw new Error('El correo ya está registrado');
        const newUser = { 
            id: generateId(), 
            name: userData.name,
            email: userData.email,
            password: userData.password,
            phone: userData.phone || '',
            role: 'CLIENT'
        };
        users.push(newUser);
        return newUser;
    },

    // Productos públicos para subastas
    getPublicProducts: () => {
        return sampleProducts.map(p => ({ ...p, image: p.image || 'https://picsum.photos/id/20/200/200' }));
    },

    // Prendas/Empeños
    getPawns: () => [...pawns],

    createPawn: (data) => { 
        const newPawn = { 
            id: generateId(), 
            ...data, 
            status: 'ACTIVE', 
            startDate: new Date().toISOString(), 
            dueDate: new Date(Date.now() + data.days * 86400000).toISOString() 
        }; 
        pawns.push(newPawn); 
        return newPawn; 
    },

    updatePawn: (id, data) => { 
        const index = pawns.findIndex(p => p.id === id); 
        if (index !== -1) pawns[index] = { ...pawns[index], ...data }; 
        return pawns[index]; 
    },

    // Subastas
    getAuctions: () => auctions,

    createAuction: (auctionData) => { 
        const auction = { 
            id: auctionData.id || generateId(),
            name: auctionData.name || 'Producto en subasta',
            description: auctionData.description || 'Sin descripción',
            image: auctionData.image || 'https://picsum.photos/id/20/200/200',
            currentPrice: auctionData.currentPrice || auctionData.startingPrice || 0,
            startingPrice: auctionData.startingPrice || 0,
            status: auctionData.status || 'ACTIVE',
            endTime: auctionData.endTime || (Date.now() + 7 * 86400000),
            bids: []
        }; 
        auctions.push(auction); 
        return auction; 
    },

    placeBid: (auctionId, userId, amount) => { 
        const auction = auctions.find(a => a.id === auctionId); 
        if (!auction || auction.status !== 'ACTIVE') throw new Error('Subasta no activa'); 
        if (amount <= auction.currentPrice) throw new Error('La puja debe ser mayor al precio actual'); 
        auction.currentPrice = amount; 
        bids.push({ auctionId, userId, amount, time: new Date() }); 
        return auction; 
    },

    getBids: () => [...bids],

    // Notificaciones
    getNotifications: () => notifications,

    addNotification: (msg) => notifications.unshift({ 
        id: generateId(), 
        message: msg, 
        read: false, 
        date: new Date() 
    })
};
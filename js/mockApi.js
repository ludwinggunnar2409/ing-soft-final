import { generateId, formatDate } from './utils/helpers.js';
import { getUSDRate, convertToBOB } from './utils/currency.js';

// Datos iniciales simulados
let users = [
    { id: '1', name: 'Dueño SIGES', email: 'owner@siges.com', password: 'owner123', role: 'OWNER' },
    { id: '2', name: 'Empleado Juan', email: 'empleado@siges.com', password: 'emp123', role: 'EMPLOYEE' },
    { id: '3', name: 'Cliente Ana', email: 'cliente@mail.com', password: 'cli123', role: 'CLIENT' }
];
let pawns = [
    { id: 'p1', name: 'iPhone 13', category: 'Electrónica', photos: [], status: 'ACTIVE', valuation: 2500, loanAmount: 1750, interestRate: 0.05, startDate: new Date().toISOString(), dueDate: new Date(Date.now()+30*86400000).toISOString(), clientId: '3', location: 'A1-B2-C3' }
];
let contracts = pawns.map(p => ({ ...p, contractId: generateId(), signed: false, pdfUrl: null }));
let auctions = [];
let bids = [];
let notifications = [];

// Funciones CRUD
export const MockAPI = {
    login: async (email, pass) => {
        const user = users.find(u => u.email === email && u.password === pass);
        if (!user) throw new Error('Credenciales inválidas');
        const token = btoa(JSON.stringify({ id: user.id, role: user.role, exp: Date.now()+3600000 }));
        localStorage.setItem('token', token);
        return { user, token };
    },
    getCurrentUser: () => {
        const token = localStorage.getItem('token');
        if (!token) return null;
        try { return JSON.parse(atob(token)); } catch(e) { return null; }
    },
    logout: () => localStorage.removeItem('token'),
    getPawns: () => [...pawns],
    // Dentro del objeto MockAPI, añade:
    getBids: () => [...bids],
    createPawn: (data) => { const newPawn = { id: generateId(), ...data, status: 'ACTIVE', startDate: new Date().toISOString(), dueDate: new Date(Date.now()+data.days*86400000).toISOString() }; pawns.push(newPawn); return newPawn; },
    updatePawn: (id, data) => { const index = pawns.findIndex(p=>p.id===id); if(index!==-1) pawns[index]={...pawns[index],...data}; return pawns[index]; },
    getAuctions: () => auctions,
    createAuction: (pawnId, startingPrice) => { const auction = { id: generateId(), pawnId, startingPrice, currentPrice: startingPrice, status: 'ACTIVE', endTime: Date.now()+3600000, bids: [] }; auctions.push(auction); return auction; },
    placeBid: (auctionId, userId, amount) => { const auction = auctions.find(a=>a.id===auctionId); if(!auction || auction.status!=='ACTIVE') throw new Error('Subasta no activa'); if(amount <= auction.currentPrice) throw new Error('Puja menor o igual'); auction.currentPrice = amount; bids.push({ auctionId, userId, amount, time: new Date() }); return auction; },
    getNotifications: () => notifications,
    addNotification: (msg) => notifications.unshift({ id: generateId(), message: msg, read: false, date: new Date() })
    
};
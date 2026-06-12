// Gestión de IndexedDB para persistencia real

const DB_NAME = 'SIGES_DB';
const DB_VERSION = 2;
const STORES = {
    USERS: 'users',
    PAWNS: 'pawns',
    CONTRACTS: 'contracts',
    AUCTIONS: 'auctions',
    BIDS: 'bids',
    NOTIFICATIONS: 'notifications',
    PHOTOS: 'photos',
    SETTINGS: 'settings'
};

let db = null;
let dbReady = false;
let pendingRequests = [];

// Inicializar base de datos
export async function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('Error opening DB:', request.error);
            reject(request.error);
        };
        
        request.onsuccess = () => {
            db = request.result;
            dbReady = true;
            console.log('✅ IndexedDB inicializada correctamente');
            // Procesar requests pendientes
            pendingRequests.forEach(cb => cb());
            pendingRequests = [];
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Crear almacenes si no existen
            if (!db.objectStoreNames.contains(STORES.USERS)) {
                const usersStore = db.createObjectStore(STORES.USERS, { keyPath: 'id' });
                usersStore.createIndex('email', 'email', { unique: true });
            }
            
            if (!db.objectStoreNames.contains(STORES.PAWNS)) {
                const pawnsStore = db.createObjectStore(STORES.PAWNS, { keyPath: 'id' });
                pawnsStore.createIndex('status', 'status');
                pawnsStore.createIndex('clientId', 'clientId');
                pawnsStore.createIndex('dueDate', 'dueDate');
            }
            
            if (!db.objectStoreNames.contains(STORES.CONTRACTS)) {
                const contractsStore = db.createObjectStore(STORES.CONTRACTS, { keyPath: 'id' });
                contractsStore.createIndex('pawnId', 'pawnId');
                contractsStore.createIndex('contractNumber', 'contractNumber');
            }
            
            if (!db.objectStoreNames.contains(STORES.AUCTIONS)) {
                const auctionsStore = db.createObjectStore(STORES.AUCTIONS, { keyPath: 'id' });
                auctionsStore.createIndex('status', 'status');
                auctionsStore.createIndex('endTime', 'endTime');
            }
            
            if (!db.objectStoreNames.contains(STORES.BIDS)) {
                db.createObjectStore(STORES.BIDS, { keyPath: 'id', autoIncrement: true });
            }
            
            if (!db.objectStoreNames.contains(STORES.NOTIFICATIONS)) {
                const notifStore = db.createObjectStore(STORES.NOTIFICATIONS, { keyPath: 'id', autoIncrement: true });
                notifStore.createIndex('userId', 'userId');
                notifStore.createIndex('read', 'read');
                notifStore.createIndex('createdAt', 'createdAt');
            }
            
            if (!db.objectStoreNames.contains(STORES.PHOTOS)) {
                db.createObjectStore(STORES.PHOTOS, { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
                db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
            }
        };
    });
}

// Esperar a que DB esté lista
async function waitForDB() {
    if (dbReady && db) return db;
    return new Promise(resolve => {
        pendingRequests.push(() => resolve(db));
    });
}

// Funciones genéricas CRUD
export async function getAll(storeName) {
    await waitForDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result || []);
    });
}

export async function getById(storeName, id) {
    await waitForDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

export async function save(storeName, data) {
    await waitForDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

export async function remove(storeName, id) {
    await waitForDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

export async function query(storeName, indexName, value) {
    await waitForDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

// Configuración del sistema
export async function getSetting(key, defaultValue = null) {
    await waitForDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.SETTINGS, 'readonly');
        const store = transaction.objectStore(STORES.SETTINGS);
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            const result = request.result;
            resolve(result ? result.value : defaultValue);
        };
    });
}

export async function setSetting(key, value) {
    await waitForDB();
    return save(STORES.SETTINGS, { key, value });
}

// Inicializar configuraciones por defecto
export async function initDefaultSettings() {
    const defaults = {
        'interest_rates': {
            mensual: { 3: 0.05, 6: 0.055, 12: 0.065 },
            pago_unico: { 3: 0.15, 6: 0.22, 12: 0.35 }
        },
        'direct_purchase_markup': 0.5,
        'devaluation_rates': {
            celulares: { anual: 0.25, modelos_nuevos_cada: 12 },
            laptops: { anual: 0.20, modelos_nuevos_cada: 18 },
            tablets: { anual: 0.22, modelos_nuevos_cada: 12 }
        },
        'max_loan_months': 12,
        'grace_period_days': 90,
        'auction_extension_seconds': 120,
        'payment_grace_minutes': 5
    };
    
    for (const [key, value] of Object.entries(defaults)) {
        const existing = await getSetting(key);
        if (existing === null) {
            await setSetting(key, value);
        }
    }
    console.log('✅ Configuraciones por defecto inicializadas');
}
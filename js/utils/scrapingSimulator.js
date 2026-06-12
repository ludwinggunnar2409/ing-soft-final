// Simulación de web scraping de precios de productos usados en Bolivia
// Fuentes simuladas: Facebook Marketplace, OLX Bolivia, Mercado Libre Bolivia, Seltel

const priceSources = {
    'Facebook Marketplace': { weight: 0.35, domain: 'facebook.com' },
    'OLX Bolivia': { weight: 0.25, domain: 'olx.com.bo' },
    'Mercado Libre Bolivia': { weight: 0.30, domain: 'mercadolibre.com.bo' },
    'Seltel': { weight: 0.10, domain: 'seltel.com' }
};

// Base de datos simulada de precios de referencia por producto
const referencePrices = {
    // Celulares
    'iphone 14 pro': { min: 4500, max: 5500, avg: 5000, condition: 'usado' },
    'iphone 13': { min: 3500, max: 4200, avg: 3850, condition: 'usado' },
    'iphone 12': { min: 2800, max: 3500, avg: 3150, condition: 'usado' },
    'samsung s23': { min: 3800, max: 4800, avg: 4300, condition: 'usado' },
    'samsung s22': { min: 3000, max: 3800, avg: 3400, condition: 'usado' },
    'samsung s21': { min: 2400, max: 3100, avg: 2750, condition: 'usado' },
    'xiaomi 12': { min: 2200, max: 3000, avg: 2600, condition: 'usado' },
    'xiaomi 11': { min: 1800, max: 2500, avg: 2150, condition: 'usado' },
    'motorola edge': { min: 2000, max: 2800, avg: 2400, condition: 'usado' },
    'pixel 7': { min: 2800, max: 3600, avg: 3200, condition: 'usado' },
    
    // Laptops
    'macbook pro': { min: 7000, max: 12000, avg: 9500, condition: 'usado' },
    'macbook air': { min: 5500, max: 8500, avg: 7000, condition: 'usado' },
    'dell xps': { min: 5000, max: 8000, avg: 6500, condition: 'usado' },
    'lenovo thinkpad': { min: 3500, max: 6000, avg: 4750, condition: 'usado' },
    'hp spectre': { min: 4500, max: 7000, avg: 5750, condition: 'usado' },
    'asus rog': { min: 6000, max: 10000, avg: 8000, condition: 'usado' },
    
    // Tablets
    'ipad pro': { min: 4000, max: 7000, avg: 5500, condition: 'usado' },
    'ipad air': { min: 3000, max: 5000, avg: 4000, condition: 'usado' },
    'samsung tab': { min: 2000, max: 4000, avg: 3000, condition: 'usado' },
    
    // Joyas (precios referenciales por gramo)
    'oro 18k': { min: 250, max: 350, avg: 300, condition: 'nuevo', unit: 'gramo' },
    'oro 14k': { min: 180, max: 260, avg: 220, condition: 'nuevo', unit: 'gramo' },
    'plata 925': { min: 8, max: 15, avg: 11.5, condition: 'nuevo', unit: 'gramo' },
    'diamante': { min: 2000, max: 5000, avg: 3500, condition: 'nuevo', unit: 'quilate' },
    
    // Vehículos (simplificado)
    'auto': { min: 30000, max: 80000, avg: 55000, condition: 'usado' },
    'moto': { min: 5000, max: 15000, avg: 10000, condition: 'usado' }
};

// Factores de condición del producto
const conditionFactors = {
    'Excelente': 0.95,
    'Bueno': 0.85,
    'Regular': 0.70,
    'Malo': 0.50
};

// Factores de depreciación por antigüedad (por año)
const ageDepreciation = {
    'Electrónica': {
        'Celulares': 0.25,  // 25% anual
        'Laptops': 0.20,
        'Tablets': 0.22,
        'TVs': 0.15,
        'default': 0.18
    },
    'Joyería': {
        'default': 0.05  // 5% anual (pierde poco valor)
    },
    'Vehículos': {
        'default': 0.15  // 15% anual
    },
    'default': {
        'default': 0.12
    }
};

// Buscar precio de referencia por nombre de producto
function findReferencePrice(productName) {
    const lowerName = productName.toLowerCase();
    
    for (const [key, data] of Object.entries(referencePrices)) {
        if (lowerName.includes(key)) {
            return { ...data, matchedKey: key };
        }
    }
    return null;
}

// Calcular precio promedio de todas las fuentes
function calculateAveragePrice(reference, condition, ageYears = 0) {
    let basePrice = reference.avg;
    
    // Aplicar factor de condición
    const conditionFactor = conditionFactors[condition] || conditionFactors.Bueno;
    let adjustedPrice = basePrice * conditionFactor;
    
    // Aplicar depreciación por antigüedad
    if (ageYears > 0) {
        const category = reference.category || 'default';
        const subCategory = reference.subCategory || 'default';
        const annualRate = ageDepreciation[category]?.[subCategory] || 
                          ageDepreciation[category]?.default || 
                          ageDepreciation.default.default;
        const depreciationFactor = Math.pow(1 - annualRate, ageYears);
        adjustedPrice = adjustedPrice * depreciationFactor;
    }
    
    return {
        min: reference.min * conditionFactor,
        max: reference.max * conditionFactor,
        avg: Math.round(adjustedPrice),
        sources: priceSources
    };
}

// Función principal: obtener precio de mercado simulado
export async function getMarketPrice(productName, category, condition, ageYears = 0) {
    // Simular delay de red (100-500ms)
    await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100));
    
    const reference = findReferencePrice(productName);
    
    if (!reference) {
        // Si no hay referencia exacta, usar precio genérico por categoría
        const genericPrices = {
            'Electrónica': { min: 500, max: 3000, avg: 1500 },
            'Joyería': { min: 200, max: 5000, avg: 1000 },
            'Vehículos': { min: 10000, max: 50000, avg: 25000 },
            'default': { min: 100, max: 1000, avg: 500 }
        };
        const generic = genericPrices[category] || genericPrices.default;
        
        return {
            success: true,
            productName,
            marketPrice: generic.avg,
            priceRange: { min: generic.min, max: generic.max },
            confidence: 0.6,
            suggestedLoan: Math.round(generic.avg * 0.6),
            conditionFactor: conditionFactors[condition] || 0.8,
            sources: priceSources
        };
    }
    
    const result = calculateAveragePrice(reference, condition, ageYears);
    
    return {
        success: true,
        productName,
        matchedProduct: reference.matchedKey,
        marketPrice: result.avg,
        priceRange: { min: result.min, max: result.max },
        confidence: 0.85,
        suggestedLoan: Math.round(result.avg * 0.6), // Préstamo = 60% del valor de mercado
        conditionFactor: conditionFactors[condition] || 0.8,
        sources: result.sources,
        ageDepreciation: ageYears > 0 ? `${(ageDepreciation[category]?.default || 0.12) * 100}% anual` : null
    };
}

// Obtener precio promedio de múltiples fuentes (simulado)
export async function getAveragePriceFromSources(productName, category, condition) {
    const sources = [];
    const basePrice = await getMarketPrice(productName, category, condition);
    
    for (const [source, config] of Object.entries(priceSources)) {
        // Simular pequeñas variaciones por fuente
        const variation = 0.9 + Math.random() * 0.2;
        sources.push({
            source,
            price: Math.round(basePrice.marketPrice * variation),
            weight: config.weight
        });
    }
    
    // Calcular promedio ponderado
    let weightedSum = 0;
    let totalWeight = 0;
    for (const s of sources) {
        weightedSum += s.price * s.weight;
        totalWeight += s.weight;
    }
    const finalPrice = Math.round(weightedSum / totalWeight);
    
    return {
        productName,
        marketPrice: finalPrice,
        sources,
        recommendedLoan: Math.round(finalPrice * 0.6),
        timestamp: new Date().toISOString()
    };
}
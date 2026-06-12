// Control de devaluación de productos (especialmente electrónicos)

// Tasas de devaluación por categoría y subcategoría
const devaluationConfig = {
    'Electrónica': {
        'Celulares': {
            annualRate: 0.30,           // 30% anual (pierde valor rápido)
            newModelReleasedEvery: 12,   // meses
            floor: 0.20                  // nunca menos del 20% del valor original
        },
        'Laptops': {
            annualRate: 0.25,
            newModelReleasedEvery: 18,
            floor: 0.25
        },
        'Tablets': {
            annualRate: 0.28,
            newModelReleasedEvery: 12,
            floor: 0.22
        },
        'TVs': {
            annualRate: 0.18,
            newModelReleasedEvery: 24,
            floor: 0.30
        },
        'Audífonos': {
            annualRate: 0.20,
            newModelReleasedEvery: 12,
            floor: 0.25
        },
        'default': {
            annualRate: 0.22,
            newModelReleasedEvery: 12,
            floor: 0.25
        }
    },
    'Joyería': {
        'default': {
            annualRate: 0.05,            // 5% anual (se mantiene mejor)
            floor: 0.60
        }
    },
    'Vehículos': {
        'default': {
            annualRate: 0.15,
            floor: 0.35
        }
    },
    'Herramientas': {
        'default': {
            annualRate: 0.12,
            floor: 0.40
        }
    },
    'default': {
        'default': {
            annualRate: 0.15,
            floor: 0.35
        }
    }
};

// Historial de lanzamientos de modelos (para saber cuándo salió un modelo)
const modelReleaseDates = {
    // Celulares
    'iphone 14 pro': { releaseDate: '2022-09-16', initialPrice: 5500 },
    'iphone 14': { releaseDate: '2022-09-16', initialPrice: 4800 },
    'iphone 13': { releaseDate: '2021-09-24', initialPrice: 4500 },
    'iphone 12': { releaseDate: '2020-10-23', initialPrice: 4200 },
    'samsung s23': { releaseDate: '2023-02-17', initialPrice: 4800 },
    'samsung s22': { releaseDate: '2022-02-25', initialPrice: 4500 },
    'samsung s21': { releaseDate: '2021-01-29', initialPrice: 4200 },
    'xiaomi 12': { releaseDate: '2022-03-15', initialPrice: 3500 },
    'xiaomi 11': { releaseDate: '2021-02-08', initialPrice: 3200 },
    // Laptops
    'macbook pro m2': { releaseDate: '2022-06-15', initialPrice: 12000 },
    'macbook air m2': { releaseDate: '2022-07-15', initialPrice: 9500 },
    'dell xps 15': { releaseDate: '2022-03-01', initialPrice: 8500 }
};

// Obtener configuración de devaluación para un producto
export function getDevaluationConfig(category, subCategory = 'default') {
    const catConfig = devaluationConfig[category] || devaluationConfig.default;
    return catConfig[subCategory] || catConfig.default;
}

// Calcular edad del producto en meses
function getProductAgeInMonths(productName, startDate) {
    // Si tenemos fecha de inicio (cuando se registró en el sistema)
    if (startDate) {
        const start = new Date(startDate);
        const now = new Date();
        return (now - start) / (1000 * 60 * 60 * 24 * 30);
    }
    
    // Si no, estimar por modelo
    const lowerName = productName.toLowerCase();
    for (const [model, data] of Object.entries(modelReleaseDates)) {
        if (lowerName.includes(model)) {
            const release = new Date(data.releaseDate);
            const now = new Date();
            return (now - release) / (1000 * 60 * 60 * 24 * 30);
        }
    }
    return 0; // Producto genérico, asumir nuevo
}

// Calcular valor actual después de devaluación
export function calculateCurrentValue(product, valuationDate = new Date()) {
    const category = product.category || 'default';
    const subCategory = product.subCategory || 'default';
    const config = getDevaluationConfig(category, subCategory);
    
    const monthsOld = getProductAgeInMonths(product.name, product.startDate);
    const yearsOld = monthsOld / 12;
    
    // Calcular factor de devaluación
    let devaluationFactor = Math.pow(1 - config.annualRate, yearsOld);
    
    // Aplicar floor (valor mínimo)
    if (devaluationFactor < config.floor) {
        devaluationFactor = config.floor;
    }
    
    const originalValue = product.originalValue || product.valuation || 0;
    const currentValue = Math.round(originalValue * devaluationFactor);
    
    return {
        originalValue,
        currentValue,
        devaluationPercent: ((1 - devaluationFactor) * 100).toFixed(1),
        monthsOld: Math.round(monthsOld),
        config: {
            annualRate: config.annualRate * 100,
            floor: config.floor * 100
        }
    };
}

// Proyectar valor futuro (para planificación)
export function projectFutureValue(product, monthsInFuture) {
    const current = calculateCurrentValue(product);
    const config = getDevaluationConfig(product.category, product.subCategory);
    
    const yearsFuture = monthsInFuture / 12;
    const futureFactor = Math.pow(1 - config.annualRate, yearsFuture);
    let futureValue = current.currentValue * futureFactor;
    
    if (futureValue < current.currentValue * config.floor) {
        futureValue = current.currentValue * config.floor;
    }
    
    return {
        currentValue: current.currentValue,
        futureValue: Math.round(futureValue),
        monthsInFuture,
        projectedLoss: Math.round(current.currentValue - futureValue)
    };
}

// Sugerir precio de empeño basado en devaluación y margen de seguridad
export function suggestPawnValue(product, conditionFactor = 0.85, safetyMargin = 0.30) {
    const currentValue = calculateCurrentValue(product);
    const marketPrice = product.marketPrice || currentValue.currentValue;
    
    // Precio de empeño = valor actual * condición * (1 - margen de seguridad)
    const pawnValue = Math.round(marketPrice * conditionFactor * (1 - safetyMargin));
    
    return {
        marketPrice,
        pawnValue,
        conditionFactor,
        safetyMargin: safetyMargin * 100,
        devaluationApplied: currentValue.devaluationPercent,
        recommendedMaxMonths: 12
    };
}
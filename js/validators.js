// Validaciones estrictas para todos los formularios

export const Validators = {
    // Validar email con @ y dominio
    email: (value) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(value) ? null : 'Correo electrónico inválido';
    },
    
    // Validar celular boliviano (8 dígitos, opcional +591 o 0)
    phone: (value) => {
        const clean = value.replace(/[+\s-]/g, '');
        const regex = /^(591|0)?[67]\d{7}$/;
        return regex.test(clean) ? null : 'Celular inválido (ej: 71234567 o +59171234567)';
    },
    
    // Validar CI boliviano (4-10 dígitos, opcional letra)
    ci: (value) => {
        const regex = /^\d{4,10}[A-Z]?$/;
        return regex.test(value) ? null : 'Cédula de identidad inválida';
    },
    
    // Validar texto (no vacío, longitud controlada)
    text: (value, fieldName = 'Campo', min = 2, max = 100) => {
        if (!value || value.trim().length < min) return `${fieldName} debe tener al menos ${min} caracteres`;
        if (value.length > max) return `${fieldName} no puede exceder ${max} caracteres`;
        return null;
    },
    
    // Validar dirección
    address: (value) => {
        if (!value || value.trim().length < 5) return 'Dirección debe tener al menos 5 caracteres';
        if (value.length > 200) return 'Dirección no puede exceder 200 caracteres';
        return null;
    },
    
    // Validar monto (positivo, no más de 1M Bs)
    amount: (value, max = 1000000) => {
        const num = parseFloat(value);
        if (isNaN(num)) return 'Monto inválido';
        if (num <= 0) return 'El monto debe ser mayor a 0';
        if (num > max) return `El monto no puede exceder ${max} Bs`;
        return null;
    },
    
    // Validar porcentaje (0-100)
    percentage: (value) => {
        const num = parseFloat(value);
        if (isNaN(num)) return 'Porcentaje inválido';
        if (num < 0) return 'El porcentaje no puede ser negativo';
        if (num > 100) return 'El porcentaje no puede exceder 100%';
        return null;
    },
    
    // Validar tasa de interés (0-50%)
    interestRate: (value) => {
        const num = parseFloat(value);
        if (isNaN(num)) return 'Tasa inválida';
        if (num < 0) return 'La tasa no puede ser negativa';
        if (num > 0.5) return 'La tasa no puede exceder 50%';
        return null;
    },
    
    // Validar fecha (futura, máximo 12 meses)
    futureDate: (value, maxMonths = 12) => {
        const date = new Date(value);
        const now = new Date();
        if (isNaN(date.getTime())) return 'Fecha inválida';
        if (date <= now) return 'La fecha debe ser futura';
        const monthsDiff = (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth());
        if (monthsDiff > maxMonths) return `La fecha no puede exceder ${maxMonths} meses`;
        return null;
    },
    
    // Validar que el valor no sea absurdo (texto largo)
    noTextbook: (value, maxLength = 500) => {
        if (value && value.length > maxLength) return `El texto es demasiado largo (máx ${maxLength} caracteres)`;
        return null;
    }
};
// Moneda local: Bolivianos (BOB) con factor de conversión USD simulado
let usdRate = 6.96; // tipo de cambio simulado (puede modificarse desde admin)

export function getCurrencySymbol() { return 'Bs'; }
export function formatMoney(amount) { return `${getCurrencySymbol()} ${amount.toFixed(2)}`; }
export function setUSDRate(rate) { usdRate = rate; }
export function getUSDRate() { return usdRate; }
export function convertToUSD(amountBOB) { return amountBOB / usdRate; }
export function convertToBOB(amountUSD) { return amountUSD * usdRate; }
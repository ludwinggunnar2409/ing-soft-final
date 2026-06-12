// Generación de contratos PDF con QR y todos los datos legales

import { formatMoney } from './utils/currency.js';
import { formatDate } from './utils/helpers.js';

// Generar código QR simulado (en producción usar librería real)
function generateQRCode(data) {
    // Simulación de QR - en realidad sería una imagen generada
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
}

// Generar número de contrato único
function generateContractNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `SIG-${year}${month}-${random}`;
}

// Generar contrato PDF (simulado - en producción usar jsPDF)
export async function generateContract(pawnData, clientData, contractDetails) {
    const contractNumber = generateContractNumber();
    const issueDate = new Date();
    const dueDate = new Date(contractDetails.dueDate);
    
    // Calcular total a pagar según tipo de contrato
    let totalToPay = pawnData.loanAmount;
    let paymentSchedule = [];
    
    if (contractDetails.contractType === 'mensual') {
        const monthlyInterest = pawnData.loanAmount * contractDetails.monthlyRate;
        const monthlyPayment = pawnData.loanAmount / contractDetails.months + monthlyInterest;
        totalToPay = monthlyPayment * contractDetails.months;
        
        for (let i = 1; i <= contractDetails.months; i++) {
            const due = new Date(issueDate);
            due.setMonth(due.getMonth() + i);
            paymentSchedule.push({
                number: i,
                dueDate: due,
                amount: monthlyPayment,
                interest: monthlyInterest,
                capital: pawnData.loanAmount / contractDetails.months
            });
        }
    } else {
        // Pago único
        totalToPay = pawnData.loanAmount * (1 + contractDetails.totalInterest);
    }
    
    const contractData = {
        contractNumber,
        issueDate: formatDate(issueDate),
        dueDate: formatDate(dueDate),
        client: clientData,
        item: {
            name: pawnData.name,
            category: pawnData.category,
            description: pawnData.description,
            photos: pawnData.photos || [],
            condition: pawnData.condition
        },
        financial: {
            loanAmount: pawnData.loanAmount,
            interestRate: contractDetails.monthlyRate || contractDetails.totalInterest,
            interestType: contractDetails.contractType === 'mensual' ? 'Mensual' : 'Único al vencimiento',
            totalToPay,
            paymentSchedule
        },
        terms: {
            maxMonths: contractDetails.months,
            gracePeriodDays: 90,
            auctionAfterDays: 90,
            directPurchaseMarkup: 0.5
        },
        qrCode: generateQRCode(JSON.stringify({
            contractNumber,
            clientId: clientData.id,
            itemId: pawnData.id,
            validationUrl: `https://ing-soft-final.vercel.app/validate/${contractNumber}`
        }))
    };
    
    // Simular generación de PDF (en producción usar jsPDF)
    console.log('Contrato generado:', contractData);
    
    // Guardar en localStorage/IndexedDB
    const contracts = JSON.parse(localStorage.getItem('siges_contracts') || '[]');
    contracts.push(contractData);
    localStorage.setItem('siges_contracts', JSON.stringify(contracts));
    
    return contractData;
}

// Obtener contrato por número
export function getContract(contractNumber) {
    const contracts = JSON.parse(localStorage.getItem('siges_contracts') || '[]');
    return contracts.find(c => c.contractNumber === contractNumber);
}

// Descargar PDF (simulado)
export function downloadContract(contractData) {
    // Simular descarga
    const blob = new Blob([JSON.stringify(contractData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contrato_${contractData.contractNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Contrato generado y descargado', 'success');
}

// Importar showToast localmente para evitar dependencia circular
function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed bottom-0 end-0 m-3 shadow`;
    toast.style.zIndex = 9999;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
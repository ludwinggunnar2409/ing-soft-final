import { MockAPI } from '../mockApi.js';
import { formatMoney } from '../utils/currency.js';
import { showToast } from '../utils/helpers.js';

export default class ValuationView {
    render(container) {
        container.innerHTML = `
            <h2>🔍 Valuación Inteligente</h2>
            <div class="row"><div class="col-md-6"><div class="card p-3"><h5>Nueva Tasación</h5><input id="itemName" class="form-control mb-2" placeholder="Nombre del artículo"><select id="category" class="form-select mb-2"><option>Electrónica</option><option>Joyería</option><option>Vehículos</option></select><input id="marketPrice" class="form-control mb-2" placeholder="Precio de mercado referencia (Bs)"><select id="condition" class="form-select mb-2"><option>Excelente</option><option>Bueno</option><option>Regular</option></select><button id="calculateBtn" class="btn btn-primary">Calcular préstamo máximo</button><div id="result" class="mt-3"></div></div></div><div class="col-md-6"><div class="card p-3"><h5>Precio del Oro (simulado)</h5><h3>${formatMoney(350)} / gramo</h3><small>Cotización actualizada cada 10 min (mock)</small></div></div></div>
        `;
        document.getElementById('calculateBtn').onclick = () => {
            const market = parseFloat(document.getElementById('marketPrice').value);
            const conditionFactor = { 'Excelente':0.9, 'Bueno':0.7, 'Regular':0.5 }[document.getElementById('condition').value];
            const margin = 0.3; // 30% margen de seguridad
            let maxLoan = market * conditionFactor * (1 - margin);
            if (isNaN(maxLoan)) return showToast('Ingrese precio válido', 'danger');
            document.getElementById('result').innerHTML = `<div class="alert alert-success">Préstamo sugerido: ${formatMoney(maxLoan)}<br><small>Basado en ${document.getElementById('condition').value}, margen ${margin*100}%</small></div>`;
            showToast('Tasación completada');
        };
    }
}
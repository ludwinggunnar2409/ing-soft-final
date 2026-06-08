import { MockAPI } from '../mockApi.js';
import { formatMoney, getUSDRate } from '../utils/currency.js';
import { showToast } from '../utils/helpers.js';

export default class FinanceView {
    render(container) {
        const pawns = MockAPI.getPawns();
        const totalLoan = pawns.reduce((s,p)=>s+(p.loanAmount||0),0);
        const totalInterest = pawns.reduce((s,p)=>s+(p.loanAmount*p.interestRate||0),0);
        container.innerHTML = `
            <h2>💰 Finanzas y Reportes (Dueño)</h2>
            <div class="row g-3"><div class="col-md-3"><div class="card p-3"><h5>Capital en riesgo</h5><h3>${formatMoney(totalLoan)}</h3></div></div><div class="col-md-3"><div class="card p-3"><h5>Intereses devengados</h5><h3>${formatMoney(totalInterest)}</h3></div></div><div class="col-md-3"><div class="card p-3"><h5>Comisiones SaaS (mes)</h5><h3>${formatMoney(totalLoan*0.03)}</h3><small>3% sobre préstamos</small></div></div><div class="col-md-3"><div class="card p-3"><h5>Tipo de cambio</h5><h3>${getUSDRate()} Bs/USD</h3><button id="adjustRate" class="btn btn-sm btn-warning">Ajustar +2%</button></div></div></div>
            <div class="mt-4"><canvas id="profitChart" width="400" height="200"></canvas></div>
            <button class="btn btn-primary mt-3" id="exportExcel">Exportar reporte (CSV)</button>
        `;
        new Chart(document.getElementById('profitChart'), { type: 'line', data: { labels: ['Ene','Feb','Mar','Abr','May'], datasets: [{ label: 'Utilidad neta (Bs)', data: [12000,14500,13200,16800,19500] }] } });
        document.getElementById('adjustRate').onclick = async () => {
            const { setUSDRate } = await import('../utils/currency.js');
            setUSDRate(getUSDRate() * 1.02);
            showToast('Tasa cambiaria actualizada (simulación inflación)');
            this.render(container);
        };
        document.getElementById('exportExcel').onclick = () => {
            let csv = "ID,Prenda,Préstamo,Interés\n" + pawns.map(p=>`${p.id},${p.name},${p.loanAmount},${p.loanAmount*p.interestRate}`).join("\n");
            const blob = new Blob([csv], {type: 'text/csv'});
            const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'reporte_siges.csv'; link.click();
            showToast('Reporte exportado');
        };
    }
}
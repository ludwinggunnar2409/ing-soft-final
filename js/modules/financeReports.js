import { MockAPI } from '../mockApi.js';
import { formatMoney } from '../utils/currency.js';
import { formatDate, showToast } from '../utils/helpers.js';

export default class FinanceReportsView {
    constructor() {
        this.charts = {};
    }
    
    render(container) {
        const pawns = MockAPI.getPawns();
        const auctions = MockAPI.getAuctions();
        const completedAuctions = auctions.filter(a => a.status === 'COMPLETED');
        
        // Tasas de interés por defecto (configurables desde aquí)
        const interestRates = {
            mensual: { 3: 0.05, 6: 0.055, 12: 0.065 },
            pago_unico: { 3: 0.15, 6: 0.22, 12: 0.35 }
        };
        
        // Calcular estadísticas
        const totalInvested = pawns.reduce((sum, p) => sum + (p.loanAmount || 0), 0);
        const totalInterest = pawns.reduce((sum, p) => sum + ((p.loanAmount || 0) * (p.interestRate || 0.05)), 0);
        const totalAuctionRevenue = completedAuctions.reduce((sum, a) => sum + (a.finalPrice || 0), 0);
        const activePawns = pawns.filter(p => p.status === 'ACTIVE').length;
        const inAuction = pawns.filter(p => p.status === 'IN_AUCTION').length;
        
        // Agrupar por categoría
        const byCategory = {};
        pawns.forEach(p => {
            const cat = p.category || 'General';
            if (!byCategory[cat]) byCategory[cat] = { count: 0, totalValue: 0, totalLoan: 0 };
            byCategory[cat].count++;
            byCategory[cat].totalValue += p.valuation || 0;
            byCategory[cat].totalLoan += p.loanAmount || 0;
        });
        
        container.innerHTML = `
            <h2 class="mb-4">📊 Panel de Control - Dueño</h2>
            
            <div class="row g-3 mb-4">
                <div class="col-md-3"><div class="card p-3 bg-primary text-white"><h6>💰 Capital invertido</h6><h3>${formatMoney(totalInvested)}</h3><small>En ${activePawns} empeños activos</small></div></div>
                <div class="col-md-3"><div class="card p-3 bg-success text-white"><h6>📈 Intereses generados</h6><h3>${formatMoney(totalInterest)}</h3><small>Proyectado</small></div></div>
                <div class="col-md-3"><div class="card p-3 bg-warning text-dark"><h6>🏆 Subastas completadas</h6><h3>${completedAuctions.length}</h3><small>Ingresos: ${formatMoney(totalAuctionRevenue)}</small></div></div>
                <div class="col-md-3"><div class="card p-3 bg-info text-white"><h6>⚠️ En subasta</h6><h3>${inAuction}</h3><small>Items en proceso</small></div></div>
            </div>
            
            <div class="card mb-4">
                <div class="card-header bg-dark text-white">🔍 Filtros de búsqueda</div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-4 mb-2"><label>Categoría</label><select id="filterCategory" class="form-select"><option value="all">Todas</option>${Object.keys(byCategory).map(c => `<option value="${c}">${c}</option>`).join('')}</select></div>
                        <div class="col-md-4 mb-2"><label>Estado</label><select id="filterStatus" class="form-select"><option value="all">Todos</option><option value="ACTIVE">Activos</option><option value="IN_AUCTION">En subasta</option></select></div>
                        <div class="col-md-4 mb-2"><label>Buscar producto</label><input type="text" id="filterProduct" class="form-control" placeholder="Nombre..."></div>
                    </div>
                    <button id="applyFiltersBtn" class="btn btn-primary mt-2">Aplicar filtros</button>
                    <button id="exportReportBtn" class="btn btn-secondary mt-2 ms-2">📥 Exportar reporte</button>
                </div>
            </div>
            
            <div class="row mb-4">
                <div class="col-md-6"><div class="card p-3"><h6>Distribución por categoría</h6><canvas id="categoryChart" height="200"></canvas></div></div>
                <div class="col-md-6"><div class="card p-3"><h6>Rentabilidad mensual</h6><canvas id="profitChart" height="200"></canvas></div></div>
            </div>
            
            <div class="card">
                <div class="card-header bg-dark text-white">📋 Listado de Empeños</div>
                <div class="card-body p-0">
                    <div class="table-responsive">
                        <table class="table table-striped mb-0">
                            <thead><tr><th>ID</th><th>Producto</th><th>Categoría</th><th>Cliente</th><th>Préstamo</th><th>Estado</th><th>Vencimiento</th></tr></thead>
                            <tbody id="pawnsTableBody">
                                ${pawns.map(p => `
                                    <tr data-category="${p.category || 'General'}" data-status="${p.status}" data-name="${(p.name || '').toLowerCase()}">
                                        <td>${p.id?.slice(-6) || 'N/A'}</td>
                                        <td>${p.name || 'N/A'}</td>
                                        <td>${p.category || 'General'}</td>
                                        <td>${p.clientName || 'N/A'}</td>
                                        <td>${formatMoney(p.loanAmount || 0)}</td>
                                        <td><span class="badge ${p.status === 'ACTIVE' ? 'bg-success' : 'bg-warning'}">${p.status || 'N/A'}</span></td>
                                        <td>${p.dueDate ? formatDate(p.dueDate) : 'N/A'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="card mt-4">
                <div class="card-header bg-dark text-white">⚙️ Configuración del Sistema</div>
                <div class="card-body">
                    <h6>Tasas de interés - Cuotas mensuales</h6>
                    <div class="row mb-3">
                        <div class="col-md-4"><label>3 meses (%)</label><input type="number" id="rateM3" class="form-control" value="5" step="0.5" min="0" max="50"></div>
                        <div class="col-md-4"><label>6 meses (%)</label><input type="number" id="rateM6" class="form-control" value="5.5" step="0.5" min="0" max="50"></div>
                        <div class="col-md-4"><label>12 meses (%)</label><input type="number" id="rateM12" class="form-control" value="6.5" step="0.5" min="0" max="50"></div>
                    </div>
                    <h6>Tasas de interés - Pago único</h6>
                    <div class="row mb-3">
                        <div class="col-md-4"><label>3 meses (%)</label><input type="number" id="rateU3" class="form-control" value="15" step="0.5" min="0" max="50"></div>
                        <div class="col-md-4"><label>6 meses (%)</label><input type="number" id="rateU6" class="form-control" value="22" step="0.5" min="0" max="50"></div>
                        <div class="col-md-4"><label>12 meses (%)</label><input type="number" id="rateU12" class="form-control" value="35" step="0.5" min="0" max="50"></div>
                    </div>
                    <div class="row">
                        <div class="col-md-6"><label>Margen compra directa (%)</label><input type="number" id="directMarkup" class="form-control" value="50" step="5" min="10" max="100"></div>
                        <div class="col-md-6"><label>Días de gracia antes de subasta</label><input type="number" id="graceDays" class="form-control" value="90" step="5" min="30" max="180"></div>
                    </div>
                    <button id="saveSettingsBtn" class="btn btn-primary mt-3">💾 Guardar configuración</button>
                </div>
            </div>
        `;
        
        // Inicializar gráficas
        this.initCategoryChart(byCategory);
        this.initProfitChart();
        
        // Eventos
        document.getElementById('applyFiltersBtn').onclick = () => this.applyFilters();
        document.getElementById('exportReportBtn').onclick = () => this.exportReport();
        document.getElementById('saveSettingsBtn').onclick = () => {
            showToast('Configuración guardada (simulada)', 'success');
        };
    }
    
    applyFilters() {
        const category = document.getElementById('filterCategory').value;
        const status = document.getElementById('filterStatus').value;
        const product = document.getElementById('filterProduct').value.toLowerCase();
        
        const rows = document.querySelectorAll('#pawnsTableBody tr');
        rows.forEach(row => {
            let show = true;
            if (category !== 'all' && row.dataset.category !== category) show = false;
            if (status !== 'all' && row.dataset.status !== status) show = false;
            if (product && !row.dataset.name.includes(product)) show = false;
            row.style.display = show ? '' : 'none';
        });
    }
    
    exportReport() {
        const rows = document.querySelectorAll('#pawnsTableBody tr:visible');
        let csv = "ID,Producto,Categoría,Cliente,Préstamo,Estado,Vencimiento\n";
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            csv += Array.from(cells).map(cell => `"${cell.innerText.replace(/"/g, '""')}"`).join(',') + '\n';
        });
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_siges_${new Date().toISOString().slice(0, 19)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Reporte exportado', 'success');
    }
    
    initCategoryChart(byCategory) {
        const ctx = document.getElementById('categoryChart')?.getContext('2d');
        if (!ctx) return;
        const categories = Object.keys(byCategory);
        const values = categories.map(c => byCategory[c].totalLoan);
        new Chart(ctx, { type: 'pie', data: { labels: categories, datasets: [{ data: values, backgroundColor: ['#2c3e50', '#e67e22', '#27ae60', '#3498db', '#9b59b6'] }] } });
    }
    
    initProfitChart() {
        const ctx = document.getElementById('profitChart')?.getContext('2d');
        if (!ctx) return;
        new Chart(ctx, { type: 'line', data: { labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'], datasets: [{ label: 'Utilidad (Bs)', data: [12500, 14800, 13200, 16900, 18700, 20500], borderColor: '#2c3e50', fill: true }] } });
    }
}
import { MockAPI } from '../mockApi.js';
import { formatDate, showToast } from '../utils/helpers.js';
import { formatMoney } from '../utils/currency.js';

export default class InventoryView {
    render(container) {
        const pawns = MockAPI.getPawns();
        const activePawns = pawns.filter(p => p.status === 'ACTIVE');
        const completedPawns = pawns.filter(p => p.status === 'COMPLETED');
        const soonExpiring = activePawns.filter(p => new Date(p.dueDate) < new Date(Date.now() + 3*86400000));
        
        // Movimientos recientes (simulados)
        const movimientos = [
            { type: 'entrada', item: 'iPhone 12', date: new Date(Date.now() - 2*86400000), user: 'Empleado Juan' },
            { type: 'salida', item: 'MacBook Air', date: new Date(Date.now() - 5*86400000), user: 'Cliente Ana' },
            { type: 'movimiento', item: 'Rolex Datejust', date: new Date(Date.now() - 1*86400000), user: 'Empleado Juan', from: 'Estante 2', to: 'Subasta' },
            { type: 'entrada', item: 'Samsung Galaxy S22', date: new Date(Date.now() - 7*86400000), user: 'Empleado Carlos' },
            { type: 'salida', item: 'Anillo de diamantes', date: new Date(Date.now() - 10*86400000), user: 'Cliente María' }
        ];
        
        container.innerHTML = `
            <h2>🏚️ Almacén y Trazabilidad</h2>
            
            <div class="row g-3 mb-4">
                <div class="col-md-3"><div class="card p-3 bg-primary text-white"><h5>📦 En custodia</h5><h3>${activePawns.length}</h3><small>Items activos</small></div></div>
                <div class="col-md-3"><div class="card p-3 bg-success text-white"><h5>✅ Completados</h5><h3>${completedPawns.length}</h3><small>Items entregados</small></div></div>
                <div class="col-md-3"><div class="card p-3 bg-warning text-dark"><h5>⚠️ Por vencer</h5><h3 class="text-danger">${soonExpiring.length}</h3><small>En 3 días o menos</small></div></div>
                <div class="col-md-3"><div class="card p-3 bg-info text-white"><h5>📊 Ocupación</h5><h3>${Math.min(100, Math.round((activePawns.length / 50) * 100))}%</h3><small>Capacidad total</small></div></div>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="card p-3 mb-3">
                        <h5>📍 Mapa de Almacén</h5>
                        <div class="bg-light p-3 rounded" style="font-family: monospace;">
                            <div class="d-flex gap-2 mb-2">
                                <div class="p-2 bg-success rounded text-white">E1</div>
                                <div class="p-2 bg-success rounded text-white">E2</div>
                                <div class="p-2 bg-warning rounded">E3</div>
                                <div class="p-2 bg-danger rounded text-white">E4</div>
                                <div class="p-2 bg-success rounded text-white">E5</div>
                            </div>
                            <div class="d-flex gap-2 mb-2">
                                <div class="p-2 bg-warning rounded">E6</div>
                                <div class="p-2 bg-success rounded text-white">E7</div>
                                <div class="p-2 bg-success rounded text-white">E8</div>
                                <div class="p-2 bg-warning rounded">E9</div>
                                <div class="p-2 bg-success rounded text-white">E10</div>
                            </div>
                            <small>🟢 Libre 🟡 Semi-ocupado 🔴 Lleno</small>
                        </div>
                    </div>
                    
                    <div class="card p-3">
                        <h5>📋 Próximos vencimientos</h5>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead> 
                                    <th>Producto</th><th>Cliente</th><th>Vence</th><th>Acción</th>
                                </thead>
                                <tbody>
                                    ${soonExpiring.slice(0,5).map(p => `
                                        <tr class="table-warning">
                                            <td>${p.name || 'N/A'}</td>
                                            <td>${p.clientName || 'N/A'}</td>
                                            <td>${formatDate(p.dueDate)}</td>
                                            <td><button class="btn btn-sm btn-primary" onclick="window.navigateTo('/pawns')">Refrendar</button></td>
                                        </tr>
                                    `).join('')}
                                    ${soonExpiring.length === 0 ? '<tr><td colspan="4" class="text-center">No hay vencimientos próximos</td></tr>' : ''}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card p-3 mb-3">
                        <h5>📦 Items en custodia por categoría</h5>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead><th>Categoría</th><th>Cantidad</th><th>Valor total</th></thead>
                                <tbody>
                                    ${(() => {
                                        const byCat = {};
                                        activePawns.forEach(p => {
                                            const cat = p.category || 'General';
                                            byCat[cat] = byCat[cat] || { count: 0, total: 0 };
                                            byCat[cat].count++;
                                            byCat[cat].total += p.loanAmount || 0;
                                        });
                                        return Object.entries(byCat).map(([cat, data]) => `
                                            <tr><td>${cat}</td><td>${data.count}</td><td>${formatMoney(data.total)}</td></tr>
                                        `).join('');
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <div class="card p-3">
                        <h5>🔄 Últimos movimientos</h5>
                        <div class="list-group">
                            ${movimientos.map(m => `
                                <div class="list-group-item">
                                    <div class="d-flex justify-content-between">
                                        <span>
                                            ${m.type === 'entrada' ? '📥' : m.type === 'salida' ? '📤' : '🔄'} 
                                            <strong>${m.item}</strong>
                                        </span>
                                        <small>${formatDate(m.date)}</small>
                                    </div>
                                    <div class="small text-muted">
                                        ${m.type === 'entrada' ? `Registrado por: ${m.user}` : 
                                          m.type === 'salida' ? `Entregado a: ${m.user}` : 
                                          `Movido de ${m.from} a ${m.to} por ${m.user}`}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
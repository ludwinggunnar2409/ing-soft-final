import { MockAPI } from '../mockApi.js';
import { formatMoney } from '../utils/currency.js';
import { formatDate, showToast } from '../utils/helpers.js';

export default class InventoryView {
    render(container) {
        const pawns = MockAPI.getPawns();
        const soonExpiring = pawns.filter(p => new Date(p.dueDate) < new Date(Date.now()+3*86400000) && p.status==='ACTIVE');
        container.innerHTML = `
            <h2>🏚️ Almacén y Trazabilidad</h2>
            <div class="alert alert-warning">⚠️ Prendas por vencer (3 días): ${soonExpiring.length}</div>
            <div class="row"><div class="col-md-4"><div class="card p-3"><h5>Mapa de calor (simulado)</h5><div class="coordinate-map">📍 Pasillo A - Estante 2 - Nivel 3<br>🟩🟨🟥🟩🟨</div><small>Saturación: 65%</small></div></div><div class="col-md-8"><div class="card p-3"><h5>Inventario físico</h5><div class="table-responsive"><table class="table"><thead><tr><th>Prenda</th><th>Ubicación</th><th>Estado</th><th>Vence</th><th>Acción</th></tr></thead><tbody>${pawns.map(p=>`<tr><td>${p.name}</td><td>${p.location || 'A1-B2'}</td><td>${p.status}</td><td>${formatDate(p.dueDate)}</td><td><button class="btn btn-sm btn-secondary moveItem" data-id="${p.id}">Reubicar</button></td></tr>`).join('')}</tbody></tr></div></div></div></div>
        `;
        document.querySelectorAll('.moveItem').forEach(btn => {
            btn.onclick = () => {
                const newLoc = prompt('Nueva ubicación (Ej: C3-D4)');
                if(newLoc) { MockAPI.updatePawn(btn.dataset.id, { location: newLoc }); showToast('Ubicación actualizada'); this.render(container); }
            };
        });
    }
}
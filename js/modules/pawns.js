import { MockAPI } from '../mockApi.js';
import { formatMoney } from '../utils/currency.js';
import { formatDate, showToast } from '../utils/helpers.js';


export default class PawnsView {
    render(container) {
        const pawns = MockAPI.getPawns();
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3"><h2>📝 Empeños Activos</h2><button class="btn btn-primary" id="newPawnBtn">+ Nuevo Empeño</button></div>
            <div class="table-responsive"><table class="table table-hover"><thead><tr><th>ID</th><th>Prenda</th><th>Valuación</th><th>Préstamo</th><th>Interés mensual</th><th>Vencimiento</th><th>Acciones</th></tr></thead><tbody>${pawns.map(p => `
                <tr><td>${p.id.slice(-6)}</td><td>${p.name}</td><td>${formatMoney(p.valuation)}</td><td>${formatMoney(p.loanAmount)}</td><td>${(p.interestRate*100).toFixed(1)}%</td><td>${formatDate(p.dueDate)}</td><td><button class="btn btn-sm btn-outline-success refrendar" data-id="${p.id}">Refrendar</button> <button class="btn btn-sm btn-outline-danger desempenar" data-id="${p.id}">Desempeñar</button> <button class="btn btn-sm btn-outline-info generarPDF" data-id="${p.id}">PDF</button></td></tr>`).join('')}</tbody></table></div>
            <div id="modalContainer"></div>
        `;

        document.getElementById('newPawnBtn').onclick = () => this.showNewPawnModal();
        document.querySelectorAll('.refrendar').forEach(btn => btn.onclick = () => this.refrendar(btn.dataset.id));
        document.querySelectorAll('.desempenar').forEach(btn => btn.onclick = () => this.desempenar(btn.dataset.id));
        document.querySelectorAll('.generarPDF').forEach(btn => btn.onclick = () => this.generatePDF(btn.dataset.id));
    }

    showNewPawnModal() {
        const modalHtml = `<div class="modal fade" id="pawnModal" tabindex="-1"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h5>Nuevo Empeño</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div><div class="modal-body"><input id="pName" class="form-control mb-2" placeholder="Nombre del bien"><input id="pValuation" class="form-control mb-2" placeholder="Valuación (Bs)"><input id="pLoanPct" class="form-control mb-2" placeholder="% préstamo (ej. 70)"><input id="pDays" class="form-control mb-2" placeholder="Días de plazo"></div><div class="modal-footer"><button class="btn btn-primary" id="savePawn">Guardar</button></div></div></div></div>`;
        document.getElementById('modalContainer').innerHTML = modalHtml;
        const modal = new bootstrap.Modal(document.getElementById('pawnModal'));
        modal.show();
        document.getElementById('savePawn').onclick = () => {
            const name = document.getElementById('pName').value;
            const valuation = parseFloat(document.getElementById('pValuation').value);
            const loanPct = parseFloat(document.getElementById('pLoanPct').value) / 100;
            const days = parseInt(document.getElementById('pDays').value);
            if (!name || isNaN(valuation) || isNaN(loanPct) || isNaN(days)) return showToast('Complete todos los campos', 'danger');
            const loanAmount = valuation * loanPct;
            MockAPI.createPawn({ name, category: 'General', valuation, loanAmount, interestRate: 0.05, days, clientId: MockAPI.getCurrentUser()?.id || '3' });
            showToast('Empeño registrado');
            modal.hide();
            this.render(document.getElementById('main-content'));
        };
    }

    refrendar(id) {
        const pawn = MockAPI.getPawns().find(p => p.id === id);
        if (!pawn) return;
        const newDue = new Date(Date.now() + 30 * 86400000).toISOString();
        MockAPI.updatePawn(id, { dueDate: newDue });
        MockAPI.addNotification(`Refrendo realizado para ${pawn.name} - nueva fecha ${formatDate(newDue)}`);
        showToast('Refrendo exitoso');
        this.render(document.getElementById('main-content'));
    }

    desempenar(id) {
        const pawn = MockAPI.getPawns().find(p => p.id === id);
        if (!pawn) return;
        MockAPI.updatePawn(id, { status: 'RETIRED' });
        MockAPI.addNotification(`Prenda ${pawn.name} desempeñada y entregada al cliente`);
        showToast('Desempeño completado');
        this.render(document.getElementById('main-content'));
    }

    generatePDF(id) {
        const pawn = MockAPI.getPawns().find(p => p.id === id);
        if (!pawn) return;
        // Usar la librería global cargada en index.html
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.text(`Contrato de Empeño SIGES`, 20, 20);
        doc.text(`Prenda: ${pawn.name}`, 20, 40);
        doc.text(`Valuación: ${formatMoney(pawn.valuation)}`, 20, 50);
        doc.text(`Préstamo: ${formatMoney(pawn.loanAmount)}`, 20, 60);
        doc.text(`Plazo hasta: ${formatDate(pawn.dueDate)}`, 20, 70);
        doc.save(`contrato_${pawn.id}.pdf`);
        showToast('PDF generado (simulado)');
    }
}
import { MockAPI } from '../mockApi.js';
import { formatMoney } from '../utils/currency.js';
import { formatDate, showToast } from '../utils/helpers.js';
import { Validators } from '../validators.js';
import { startCamera, stopCamera, capturePhoto, getDeviceType, selectFile } from '../camera.js';
import { generateContract, downloadContract } from '../contractGenerator.js';
import ValuationAssistant from './valuationAssistant.js';

export default class PawnsView {
    constructor() {
        this.currentPhotos = [];
        this.currentClientData = {};
        this.currentValuation = null;
        this.cameraActive = false;
        this.videoElement = null;
    }
    
    render(container) {
        const pawns = MockAPI.getPawns();
        container.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h2>📝 Gestión de Empeños</h2>
                <button class="btn btn-primary" id="newPawnBtn">+ Nuevo Empeño</button>
            </div>
            
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr><th>ID</th><th>Prenda</th><th>Cliente</th><th>Préstamo</th><th>Tipo</th><th>Vencimiento</th><th>Estado</th><th>Acciones</th>
                        </thead>
                    <tbody>
                        ${pawns.map(p => `
                            <tr>
                                <td>${p.id?.slice(-6) || 'N/A'}</td>
                                <td>${p.name || 'N/A'}</td>
                                <td>${p.clientName || 'N/A'}</td>
                                <td>${formatMoney(p.loanAmount || 0)}</td>
                                <td>${p.contractType === 'mensual' ? 'Cuotas mensuales' : 'Pago único'}</td>
                                <td>${formatDate(p.dueDate)}</td>
                                <td><span class="badge ${p.status === 'ACTIVE' ? 'bg-success' : 'bg-secondary'}">${p.status || 'N/A'}</span></td>
                                <td>
                                    <button class="btn btn-sm btn-outline-info viewContract" data-id="${p.id}">📄 Contrato</button>
                                    ${p.status === 'ACTIVE' ? `<button class="btn btn-sm btn-outline-warning recordPayment" data-id="${p.id}">💰 Pagar</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            <div id="modalContainer"></div>
        `;
        
        document.getElementById('newPawnBtn').onclick = () => this.showNewPawnModal();
        document.querySelectorAll('.viewContract').forEach(btn => btn.onclick = () => this.viewContract(btn.dataset.id));
        document.querySelectorAll('.recordPayment').forEach(btn => btn.onclick = () => this.recordPayment(btn.dataset.id));
    }
    
    showNewPawnModal() {
        this.currentStep = 1;
        this.currentPhotos = [];
        this.currentClientData = {};
        this.currentValuation = null;
        this.renderStep1();
    }
    
    renderStep1() {
        const modalHtml = `
            <div class="modal fade" id="pawnModal" tabindex="-1" data-bs-backdrop="static">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5>📝 Nuevo Empeño - Paso 1/3: Datos del Cliente</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="clientForm">
                                <div class="row">
                                    <div class="col-md-6 mb-2"><label>Nombre completo *</label><input type="text" id="clientName" class="form-control" required></div>
                                    <div class="col-md-6 mb-2"><label>Cédula de identidad *</label><input type="text" id="clientCI" class="form-control" placeholder="1234567LP" required></div>
                                    <div class="col-md-6 mb-2"><label>Correo electrónico *</label><input type="email" id="clientEmail" class="form-control" required></div>
                                    <div class="col-md-6 mb-2"><label>Celular *</label><input type="tel" id="clientPhone" class="form-control" placeholder="71234567" required></div>
                                    <div class="col-12 mb-2"><label>Dirección completa *</label><textarea id="clientAddress" class="form-control" rows="2" required></textarea></div>
                                </div>
                                <div id="clientErrors" class="text-danger small mt-2"></div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button class="btn btn-primary" id="nextToProductBtn">Siguiente →</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('modalContainer').innerHTML = modalHtml;
        const modal = new bootstrap.Modal(document.getElementById('pawnModal'));
        modal.show();
        document.getElementById('nextToProductBtn').onclick = () => this.validateAndNextStep();
    }
    
    validateAndNextStep() {
        const name = document.getElementById('clientName').value;
        const ci = document.getElementById('clientCI').value;
        const email = document.getElementById('clientEmail').value;
        const phone = document.getElementById('clientPhone').value;
        const address = document.getElementById('clientAddress').value;
        
        const errors = [];
        const nameError = Validators.text(name, 'Nombre', 2, 100);
        if (nameError) errors.push(nameError);
        const ciError = Validators.ci(ci);
        if (ciError) errors.push(ciError);
        const emailError = Validators.email(email);
        if (emailError) errors.push(emailError);
        const phoneError = Validators.phone(phone);
        if (phoneError) errors.push(phoneError);
        const addressError = Validators.address(address);
        if (addressError) errors.push(addressError);
        
        if (errors.length > 0) {
            document.getElementById('clientErrors').innerHTML = errors.join('<br>');
            return;
        }
        
        this.currentClientData = { name, ci, email, phone, address };
        this.renderStep2();
    }
    
    renderStep2() {
        const modalBody = document.querySelector('#pawnModal .modal-body');
        const modalHeader = document.querySelector('#pawnModal .modal-header h5');
        modalHeader.innerHTML = '📝 Nuevo Empeño - Paso 2/3: Datos del Producto y Valuación';
        
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <form id="productForm">
                        <div class="mb-2"><label>Nombre del producto *</label><input type="text" id="productName" class="form-control" required></div>
                        <div class="row">
                            <div class="col-md-6 mb-2"><label>Categoría *</label>
                                <select id="productCategory" class="form-select">
                                    <option value="Electrónica">Electrónica</option>
                                    <option value="Joyería">Joyería</option>
                                    <option value="Vehículos">Vehículos</option>
                                    <option value="Herramientas">Herramientas</option>
                                    <option value="Otros">Otros</option>
                                </select>
                            </div>
                            <div class="col-md-6 mb-2"><label>Condición *</label>
                                <select id="productCondition" class="form-select">
                                    <option value="Excelente">Excelente</option>
                                    <option value="Bueno" selected>Bueno</option>
                                    <option value="Regular">Regular</option>
                                    <option value="Malo">Malo</option>
                                </select>
                            </div>
                        </div>
                        <div class="mb-2"><label>Descripción</label><textarea id="productDesc" class="form-control" rows="2"></textarea></div>
                        <div class="mb-2"><label>Valor declarado por cliente (Bs)</label><input type="number" id="declaredValue" class="form-control"></div>
                        <button type="button" id="openAssistantBtn" class="btn btn-outline-primary w-100 mt-2">🤖 Usar Asistente de Valuación</button>
                    </form>
                </div>
                <div class="col-md-6">
                    <div class="border rounded p-2 mb-2">
                        <label class="form-label">📸 Fotos del producto (mínimo 3)</label>
                        <div id="photoPreview" class="d-flex flex-wrap gap-2 mb-2" style="min-height: 100px;"></div>
                        <div class="d-flex gap-2">
                            <button type="button" id="takePhotoBtn" class="btn btn-sm btn-primary">📷 Tomar foto</button>
                            <button type="button" id="uploadPhotoBtn" class="btn btn-sm btn-secondary">📁 Subir archivo</button>
                        </div>
                        <div id="cameraContainer" style="display:none;" class="mt-2">
                            <video id="cameraVideo" autoplay playsinline style="width:100%; border-radius:8px;"></video>
                            <button id="capturePhotoBtn" class="btn btn-success btn-sm mt-1 w-100">Capturar</button>
                        </div>
                    </div>
                    <div id="valuationResult" class="border rounded p-2 bg-light">
                        <div class="text-center text-muted">Usa el asistente para obtener una valuación</div>
                    </div>
                </div>
            </div>
            <div id="productErrors" class="text-danger small mt-2"></div>
        `;
        
        const modalFooter = document.querySelector('#pawnModal .modal-footer');
        modalFooter.innerHTML = `
            <button class="btn btn-secondary" id="backToClientBtn">← Atrás</button>
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-primary" id="nextToContractBtn">Siguiente →</button>
        `;
        
        document.getElementById('backToClientBtn').onclick = () => this.renderStep1();
        document.getElementById('nextToContractBtn').onclick = () => this.validateAndGoToStep3();
        this.setupCamera();
        document.getElementById('openAssistantBtn').onclick = () => this.openValuationAssistant();
        this.updatePhotoPreview();
    }
    
    setupCamera() {
        const takeBtn = document.getElementById('takePhotoBtn');
        const uploadBtn = document.getElementById('uploadPhotoBtn');
        const cameraContainer = document.getElementById('cameraContainer');
        const videoElement = document.getElementById('cameraVideo');
        const captureBtn = document.getElementById('capturePhotoBtn');
        
        takeBtn.onclick = async () => {
            try {
                cameraContainer.style.display = 'block';
                this.videoElement = videoElement;
                // Cambiar facingMode a 'user' para cámara frontal si falla 'environment'
                const success = await startCamera(videoElement, 'user');
                if (!success) {
                    // Si falla, usar selector de archivos
                    cameraContainer.style.display = 'none';
                    this.selectPhotoFile();
                }
                this.cameraActive = true;
            } catch (error) {
                console.error('Error:', error);
                cameraContainer.style.display = 'none';
                this.selectPhotoFile();
            }
        };
        
        uploadBtn.onclick = () => this.selectPhotoFile();
        
        captureBtn.onclick = () => {
            if (this.videoElement && this.videoElement.videoWidth > 0) {
                const photo = capturePhoto(this.videoElement);
                this.currentPhotos.push(photo);
                this.updatePhotoPreview();
                stopCamera();
                cameraContainer.style.display = 'none';
                this.cameraActive = false;
            }
        };
    }
    
    async selectPhotoFile() {
        const photo = await selectFile();
        if (photo) {
            this.currentPhotos.push(photo);
            this.updatePhotoPreview();
        }
    }
    
    updatePhotoPreview() {
        const container = document.getElementById('photoPreview');
        if (container) {
            container.innerHTML = this.currentPhotos.map((photo, i) => `
                <div class="position-relative">
                    <img src="${photo}" style="width:80px; height:80px; object-fit:cover; border-radius:8px;">
                    <button class="btn btn-sm btn-danger position-absolute top-0 end-0 rounded-circle" onclick="this.closest('.position-relative').remove(); window.removePhoto(${i})" style="padding:0 5px;">×</button>
                </div>
            `).join('');
        }
    }
    
    openValuationAssistant() {
        const container = document.getElementById('valuationResult');
        const assistant = new ValuationAssistant(container, (valuation) => {
            this.currentValuation = valuation;
            document.getElementById('productName').value = valuation.name;
            document.getElementById('productCategory').value = valuation.category;
            document.getElementById('productCondition').value = valuation.condition;
            container.innerHTML += `<div class="alert alert-success mt-2 small">✅ Valuación aplicada: Préstamo sugerido ${formatMoney(valuation.suggestedLoan)}</div>`;
        });
        assistant.render();
    }
    
    validateAndGoToStep3() {
        const productName = document.getElementById('productName')?.value;
        const errors = [];
        if (!productName) errors.push('Nombre del producto es requerido');
        if (this.currentPhotos.length < 3) errors.push('Se requieren al menos 3 fotos del producto');
        
        if (errors.length > 0) {
            document.getElementById('productErrors').innerHTML = errors.join('<br>');
            return;
        }
        
        this.currentProductData = {
            name: productName,
            category: document.getElementById('productCategory').value,
            condition: document.getElementById('productCondition').value,
            description: document.getElementById('productDesc').value,
            declaredValue: parseFloat(document.getElementById('declaredValue').value) || 0,
            photos: this.currentPhotos
        };
        this.renderStep3();
    }
    
    renderStep3() {
        const modalHeader = document.querySelector('#pawnModal .modal-header h5');
        modalHeader.innerHTML = '📝 Nuevo Empeño - Paso 3/3: Tipo de Contrato';
        
        const modalBody = document.querySelector('#pawnModal .modal-body');
        modalBody.innerHTML = `
            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-2">
                        <div class="card-header">📅 Tipo de contrato</div>
                        <div class="card-body">
                            <select id="contractType" class="form-select mb-3">
                                <option value="mensual">Cuotas mensuales</option>
                                <option value="pago_unico">Pago único a plazo fijo</option>
                            </select>
                            <div id="monthlyOptions">
                                <label>Plazo (meses)</label>
                                <select id="monthsSelect" class="form-select">
                                    <option value="3">3 meses</option>
                                    <option value="6">6 meses</option>
                                    <option value="12">12 meses</option>
                                </select>
                            </div>
                            <div id="singleOptions" style="display:none;">
                                <label>Fecha acordada de pago</label>
                                <input type="date" id="agreedDate" class="form-control">
                            </div>
                            <div class="mt-3 p-2 bg-light rounded">
                                <h6>💰 Resumen financiero</h6>
                                <div id="financialSummary"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="card">
                        <div class="card-header">📋 Resumen del empeño</div>
                        <div class="card-body">
                            <p><strong>Cliente:</strong> ${this.currentClientData.name}</p>
                            <p><strong>Producto:</strong> ${this.currentProductData.name}</p>
                            <p><strong>Valuación:</strong> ${this.currentValuation ? formatMoney(this.currentValuation.marketPrice) : 'Pendiente'}</p>
                            <p><strong>Fotos:</strong> ${this.currentPhotos.length} capturadas</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        const contractTypeSelect = document.getElementById('contractType');
        const monthlyOptions = document.getElementById('monthlyOptions');
        const singleOptions = document.getElementById('singleOptions');
        
        contractTypeSelect.onchange = () => {
            const isMonthly = contractTypeSelect.value === 'mensual';
            monthlyOptions.style.display = isMonthly ? 'block' : 'none';
            singleOptions.style.display = isMonthly ? 'none' : 'block';
            this.updateFinancialSummary();
        };
        
        document.getElementById('monthsSelect').onchange = () => this.updateFinancialSummary();
        document.getElementById('agreedDate').onchange = () => this.updateFinancialSummary();
        
        this.updateFinancialSummary();
        
        const modalFooter = document.querySelector('#pawnModal .modal-footer');
        modalFooter.innerHTML = `
            <button class="btn btn-secondary" id="backToProductBtn">← Atrás</button>
            <button class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button class="btn btn-success" id="createContractBtn">✅ Generar Contrato y Registrar</button>
        `;
        
        document.getElementById('backToProductBtn').onclick = () => this.renderStep2();
        document.getElementById('createContractBtn').onclick = () => this.createContract();
    }
    
    updateFinancialSummary() {
        const contractType = document.getElementById('contractType').value;
        const months = parseInt(document.getElementById('monthsSelect')?.value || 3);
        const baseAmount = this.currentValuation?.suggestedLoan || this.currentProductData.declaredValue || 5000;
        
        const rates = {
            mensual: { 3: 0.05, 6: 0.055, 12: 0.065 },
            pago_unico: { 3: 0.15, 6: 0.22, 12: 0.35 }
        };
        
        let totalToPay, monthlyPayment;
        const summaryDiv = document.getElementById('financialSummary');
        
        if (contractType === 'mensual') {
            const monthlyRate = rates.mensual[months];
            monthlyPayment = (baseAmount / months) + (baseAmount * monthlyRate);
            totalToPay = monthlyPayment * months;
            summaryDiv.innerHTML = `
                <p>Préstamo: ${formatMoney(baseAmount)}</p>
                <p>Interés mensual: ${(monthlyRate * 100)}%</p>
                <p>Cuota mensual: ${formatMoney(monthlyPayment)}</p>
                <p><strong>Total a pagar: ${formatMoney(totalToPay)}</strong></p>
            `;
        } else {
            const totalRate = rates.pago_unico[months];
            totalToPay = baseAmount * (1 + totalRate);
            summaryDiv.innerHTML = `
                <p>Préstamo: ${formatMoney(baseAmount)}</p>
                <p>Interés total: ${(totalRate * 100)}%</p>
                <p><strong>Total a pagar: ${formatMoney(totalToPay)}</strong></p>
            `;
        }
        
        this.contractDetails = {
            contractType,
            months,
            baseAmount,
            totalToPay,
            monthlyRate: rates.mensual[months],
            totalInterest: rates.pago_unico[months]
        };
    }
    
    async createContract() {
        const newPawn = MockAPI.createPawn({
            name: this.currentProductData.name,
            category: this.currentProductData.category,
            condition: this.currentProductData.condition,
            description: this.currentProductData.description,
            photos: this.currentPhotos,
            valuation: this.currentValuation?.marketPrice || this.currentProductData.declaredValue,
            loanAmount: this.contractDetails.baseAmount,
            interestRate: this.contractDetails.contractType === 'mensual' ? this.contractDetails.monthlyRate : this.contractDetails.totalInterest,
            contractType: this.contractDetails.contractType,
            months: this.contractDetails.months,
            startDate: new Date().toISOString(),
            dueDate: this.contractDetails.contractType === 'pago_unico' && document.getElementById('agreedDate').value 
                ? document.getElementById('agreedDate').value 
                : new Date(Date.now() + this.contractDetails.months * 30 * 86400000).toISOString(),
            clientId: 'new_' + Date.now(),
            clientName: this.currentClientData.name,
            clientCI: this.currentClientData.ci,
            clientEmail: this.currentClientData.email,
            clientPhone: this.currentClientData.phone,
            clientAddress: this.currentClientData.address,
            status: 'ACTIVE'
        });
        
        showToast('Empeño registrado correctamente', 'success');
        const modal = bootstrap.Modal.getInstance(document.getElementById('pawnModal'));
        modal.hide();
        this.render(document.getElementById('main-content'));
    }
    
    viewContract(id) {
        showToast('Contrato disponible en el panel del cliente', 'info');
    }
    
    recordPayment(id) {
        showToast('Funcionalidad de pagos en desarrollo', 'info');
    }
}

window.removePhoto = function(index) {
    if (window.currentPawnsView && window.currentPawnsView.currentPhotos) {
        window.currentPawnsView.currentPhotos.splice(index, 1);
        window.currentPawnsView.updatePhotoPreview();
    }
};
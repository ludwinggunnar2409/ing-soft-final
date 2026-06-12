// Asistente de valuación para empleados/owner
// Integra scraping simulado y devaluación

import { MockAPI } from '../mockApi.js';
import { getMarketPrice, getAveragePriceFromSources } from '../utils/scrapingSimulator.js';
import { calculateCurrentValue, suggestPawnValue, projectFutureValue } from '../utils/devaluation.js';
import { formatMoney } from '../utils/currency.js';
import { showToast } from '../utils/helpers.js';

export default class ValuationAssistant {
    constructor(container, onValuationComplete) {
        this.container = container;
        this.onComplete = onValuationComplete;
        this.currentProduct = null;
    }
    
    render() {
        this.container.innerHTML = `
            <div class="card shadow-lg">
                <div class="card-header bg-primary text-white">
                    <h5 class="mb-0">🤖 Asistente de Valuación Inteligente</h5>
                    <small>Busca precios de referencia en mercado boliviano</small>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-7">
                            <div class="mb-3">
                                <label class="form-label">Nombre del producto</label>
                                <input type="text" id="productName" class="form-control" placeholder="Ej: iPhone 14 Pro, MacBook Pro M2">
                            </div>
                            <div class="row">
                                <div class="col-md-6">
                                    <label class="form-label">Categoría</label>
                                    <select id="category" class="form-select">
                                        <option value="Electrónica">Electrónica</option>
                                        <option value="Joyería">Joyería</option>
                                        <option value="Vehículos">Vehículos</option>
                                        <option value="Herramientas">Herramientas</option>
                                        <option value="Otros">Otros</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Subcategoría</label>
                                    <select id="subCategory" class="form-select">
                                        <option value="Celulares">Celulares</option>
                                        <option value="Laptops">Laptops</option>
                                        <option value="Tablets">Tablets</option>
                                        <option value="TVs">TVs</option>
                                        <option value="default">Otros</option>
                                    </select>
                                </div>
                            </div>
                            <div class="row mt-2">
                                <div class="col-md-6">
                                    <label class="form-label">Condición</label>
                                    <select id="condition" class="form-select">
                                        <option value="Excelente">Excelente</option>
                                        <option value="Bueno" selected>Bueno</option>
                                        <option value="Regular">Regular</option>
                                        <option value="Malo">Malo</option>
                                    </select>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Antigüedad (años)</label>
                                    <input type="number" id="age" class="form-control" value="0" min="0" max="10" step="0.5">
                                </div>
                            </div>
                            <div class="mt-3">
                                <button id="searchPriceBtn" class="btn btn-primary w-100">
                                    🔍 Buscar precio de mercado
                                </button>
                            </div>
                        </div>
                        <div class="col-md-5">
                            <div id="valuationResult" class="border rounded p-3 bg-light" style="min-height: 300px;">
                                <div class="text-center text-muted">
                                    <i class="bi bi-search"></i><br>
                                    Ingresa los datos y busca<br>
                                    precios de referencia
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <button id="applyValuationBtn" class="btn btn-success" disabled>
                        ✅ Aplicar valuación al registro
                    </button>
                </div>
            </div>
        `;
        
        // Eventos
        document.getElementById('searchPriceBtn').onclick = () => this.searchPrice();
        document.getElementById('applyValuationBtn').onclick = () => this.applyValuation();
        
        // Actualizar subcategorías según categoría
        document.getElementById('category').onchange = () => this.updateSubCategories();
        this.updateSubCategories();
    }
    
    updateSubCategories() {
        const category = document.getElementById('category').value;
        const subSelect = document.getElementById('subCategory');
        const options = {
            'Electrónica': ['Celulares', 'Laptops', 'Tablets', 'TVs', 'Audífonos', 'default'],
            'Joyería': ['Anillos', 'Cadenas', 'Pulseras', 'Relojes', 'default'],
            'Vehículos': ['Autos', 'Motos', 'default'],
            'Herramientas': ['default'],
            'Otros': ['default']
        };
        
        const cats = options[category] || ['default'];
        subSelect.innerHTML = cats.map(c => `<option value="${c}">${c === 'default' ? 'Otros' : c}</option>`).join('');
    }
    
    async searchPrice() {
        const productName = document.getElementById('productName').value;
        const category = document.getElementById('category').value;
        const condition = document.getElementById('condition').value;
        const age = parseFloat(document.getElementById('age').value);
        
        if (!productName) {
            showToast('Ingresa el nombre del producto', 'warning');
            return;
        }
        
        // Mostrar loading
        const resultDiv = document.getElementById('valuationResult');
        resultDiv.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary"></div>
                <p class="mt-2">Buscando precios en mercado boliviano...</p>
                <small>Consultando Facebook Marketplace, OLX, Mercado Libre...</small>
            </div>
        `;
        
        try {
            // Obtener precio de mercado simulado
            const priceData = await getMarketPrice(productName, category, condition, age);
            const sourceData = await getAveragePriceFromSources(productName, category, condition);
            
            // Guardar producto actual
            this.currentProduct = {
                name: productName,
                category,
                subCategory: document.getElementById('subCategory').value,
                condition,
                age,
                marketPrice: priceData.marketPrice,
                priceRange: priceData.priceRange,
                sources: sourceData.sources,
                confidence: priceData.confidence,
                suggestedLoan: priceData.suggestedLoan
            };
            
            // Mostrar resultado
            resultDiv.innerHTML = `
                <h6 class="mb-3">📊 Resultado de la búsqueda</h6>
                <div class="mb-2">
                    <strong>${productName}</strong>
                    <span class="badge bg-secondary ms-2">${condition}</span>
                </div>
                <div class="mb-2">
                    <span class="text-muted">Precio de mercado:</span>
                    <h4 class="text-success mb-0">${formatMoney(priceData.marketPrice)}</h4>
                    <small>Rango: ${formatMoney(priceData.priceRange.min)} - ${formatMoney(priceData.priceRange.max)}</small>
                </div>
                <div class="mb-2">
                    <span class="text-muted">Confianza:</span>
                    <div class="progress" style="height: 5px;">
                        <div class="progress-bar ${priceData.confidence > 0.7 ? 'bg-success' : 'bg-warning'}" 
                             style="width: ${priceData.confidence * 100}%"></div>
                    </div>
                    <small>${Math.round(priceData.confidence * 100)}%</small>
                </div>
                <div class="mb-2">
                    <span class="text-muted">Préstamo sugerido (60%):</span>
                    <strong>${formatMoney(priceData.suggestedLoan)}</strong>
                </div>
                <div class="mb-2">
                    <span class="text-muted">Fuentes consultadas:</span>
                    <ul class="small mb-0">
                        ${sourceData.sources.map(s => `
                            <li>${s.source}: ${formatMoney(s.price)}</li>
                        `).join('')}
                    </ul>
                </div>
                ${age > 0 ? `<div class="alert alert-info small mb-0 mt-2">
                    ⚠️ Depreciación aplicada: ${Math.round(age)} años
                </div>` : ''}
            `;
            
            // Habilitar botón de aplicar
            document.getElementById('applyValuationBtn').disabled = false;
            
        } catch (error) {
            console.error(error);
            resultDiv.innerHTML = `
                <div class="alert alert-danger">
                    Error al buscar precios. Intenta nuevamente.
                </div>
            `;
        }
    }
    
    applyValuation() {
        if (this.currentProduct && this.onComplete) {
            this.onComplete(this.currentProduct);
            showToast('Valuación aplicada al registro', 'success');
        }
    }
}
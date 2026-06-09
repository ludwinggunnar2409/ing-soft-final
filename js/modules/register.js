import { MockAPI } from '../mockApi.js';
import { showToast } from '../utils/helpers.js';
import { navigateTo } from '../router.js';

export default class RegisterView {
    render(container) {
        container.innerHTML = `
            <div class="row justify-content-center mt-5">
                <div class="col-md-5">
                    <div class="card shadow">
                        <div class="card-header bg-success text-white text-center">
                            <h3>📝 Registro Rápido</h3>
                            <small>Para participar en subastas</small>
                        </div>
                        <div class="card-body">
                            <form id="registerForm">
                                <div class="mb-3">
                                    <label class="form-label">Nombre completo</label>
                                    <input type="text" id="regName" class="form-control" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Correo electrónico</label>
                                    <input type="email" id="regEmail" class="form-control" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Teléfono (opcional)</label>
                                    <input type="tel" id="regPhone" class="form-control">
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Contraseña</label>
                                    <input type="password" id="regPassword" class="form-control" required>
                                </div>
                                <button type="submit" class="btn btn-success w-100">Registrarse y participar</button>
                            </form>
                            <hr>
                            <div class="text-center">
                                <small>¿Ya tienes cuenta? <a href="#" onclick="window.navigateTo('/login')">Inicia sesión</a></small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const phone = document.getElementById('regPhone').value;
            const password = document.getElementById('regPassword').value;
            
            try {
                await MockAPI.register({ name, email, phone, password, role: 'CLIENT' });
                showToast('Registro exitoso. Ahora inicia sesión.', 'success');
                navigateTo('/login');
            } catch (err) {
                showToast(err.message, 'danger');
            }
        });
    }
}
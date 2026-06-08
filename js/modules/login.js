import { login } from '../auth.js';
import { showToast } from '../components/common.js';
import { navigateTo } from '../router.js';

export default class LoginView {
    render(container) {
        container.innerHTML = `
            <div class="row justify-content-center mt-5">
                <div class="col-md-5">
                    <div class="card shadow">
                        <div class="card-header bg-dark text-white text-center">
                            <h3>🏦 SIGES - Sistema de Empeños</h3>
                            <small>Mockup funcional PWA</small>
                        </div>
                        <div class="card-body">
                            <form id="loginForm">
                                <div class="mb-3">
                                    <label class="form-label">Correo electrónico</label>
                                    <input type="email" id="email" class="form-control" placeholder="ej. owner@siges.com" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Contraseña</label>
                                    <input type="password" id="password" class="form-control" required>
                                </div>
                                <button type="submit" class="btn btn-primary w-100">Ingresar</button>
                            </form>
                            <hr>
                            <div class="small text-muted">
                                <strong>Cuentas demo:</strong><br>
                                👑 Dueño: owner@siges.com / owner123<br>
                                👩‍💼 Empleado: empleado@siges.com / emp123<br>
                                🧑 Cliente: cliente@mail.com / cli123
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            try {
                await login(email, password);
                showToast('Sesión iniciada correctamente', 'success');
                if (window.refreshNavbar) window.refreshNavbar();
                navigateTo('/dashboard');
            } catch (err) {
                showToast(err.message, 'danger');
            }
        });
    }
}
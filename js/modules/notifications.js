import { MockAPI } from '../mockApi.js';
import { formatDate, showToast } from '../utils/helpers.js';

export default class NotificationsView {
    render(container) {
        const notifs = MockAPI.getNotifications();
        container.innerHTML = `
            <h2>🔔 Centro de Notificaciones</h2>
            <div class="list-group" id="notificationsList">
                ${notifs.map(n => `
                    <div class="list-group-item ${n.read ? '' : 'list-group-item-warning'}">
                        ${n.message}<br>
                        <small>${formatDate(n.date)}</small>
                    </div>
                `).join('')}
            </div>
            <button class="btn btn-secondary mt-3" id="clearNotifs">Marcar todas como leídas</button>
        `;
        
        const clearBtn = document.getElementById('clearNotifs');
        if (clearBtn) {
            clearBtn.onclick = () => {
                showToast('Notificaciones marcadas como leídas (simulado)', 'info');
                this.render(container);
            };
        }
    }
}
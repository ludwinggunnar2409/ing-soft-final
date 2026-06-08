export function generateId() { return Date.now() + '-' + Math.random().toString(36).substr(2, 6); }
export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `alert alert-${type} position-fixed bottom-0 end-0 m-3 shadow`;
    toast.style.zIndex = 9999;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
export function formatDate(date) { return new Date(date).toLocaleDateString('es-BO'); }
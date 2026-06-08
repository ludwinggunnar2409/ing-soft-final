import { MockAPI } from './mockApi.js';

export function isAuthenticated() {
    return !!localStorage.getItem('token');
}

export function getUserRole() {
    const token = localStorage.getItem('token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token));
        return payload.role;
    } catch(e) {
        return null;
    }
}

export function login(email, password) {
    return MockAPI.login(email, password);
}

export function logout() {
    localStorage.removeItem('token');
    if (window.refreshNavbar) window.refreshNavbar();
    if (window.navigateTo) window.navigateTo('/login');
    else window.location.href = '/siges/';
}
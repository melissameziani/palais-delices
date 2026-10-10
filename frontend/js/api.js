/**
 * ================================================================
 * GESTIONNAIRE API COMPLET - PALAIS DES DÉLICES
 * ================================================================
 * Couche d'abstraction pour toutes les communications avec l'API Django
 * Gère l'authentification JWT, les erreurs, et tous les services
 */

// ========== CONFIGURATION GLOBALE ==========

const API_CONFIG = {
    BASE_URL: 'http://127.0.0.1:8001/api', // port 8001 : laisse le 8000 libre pour d'autres projets
    TIMEOUT: 30000, // 30 secondes
    RETRY_ATTEMPTS: 3,
    
    ENDPOINTS: {
        // Authentication
        AUTH_LOGIN: '/auth/login/',
        AUTH_REGISTER: '/auth/register/',
        AUTH_LOGOUT: '/auth/logout/',
        AUTH_PROFILE: '/auth/profile/',
        AUTH_CHANGE_PASSWORD: '/auth/change-password/',
        AUTH_TOKEN_REFRESH: '/auth/token/refresh/',
        AUTH_TOKEN_VERIFY: '/auth/token/verify/',
        
        // Menu
        MENU_CATEGORIES: '/menu/categories/',
        MENU_CATEGORIES_WITH_PLATS: '/menu/categories-with-plats/',
        MENU_PLATS: '/menu/plats/',
        MENU_SPECIALITES: '/menu/specialites/',
        MENU_SEARCH: '/menu/search/',
        
        // Restaurant & Réservations
        RESTAURANT_TABLES: '/restaurant/tables/',
        RESTAURANT_TABLES_DISPONIBLES: '/restaurant/tables/disponibles/',
        RESTAURANT_RESERVATIONS: '/restaurant/reservations/',
        RESTAURANT_MES_RESERVATIONS: '/restaurant/reservations/mes-reservations/',
        
        // Commandes
        ORDERS_COMMANDES: '/orders/commandes/',
        ORDERS_MY_ORDERS: '/orders/commandes/my_orders/',
        ORDERS_STATS: '/orders/commandes/order_stats/',
        ORDERS_LIGNES: '/orders/lignes/',
        
        // Paiements
        PAYMENTS_PAIEMENTS: '/payments/paiements/',
        PAYMENTS_STATS: '/payments/paiements/payment_stats/',
        
        // Dashboard
        DASHBOARD_STATS: '/dashboard/stats/',
        DASHBOARD_REVENUE: '/dashboard/revenue/',
        DASHBOARD_ORDERS_TODAY: '/dashboard/orders-today/',
    }
};

// ========== CLASSE GESTIONNAIRE API PRINCIPAL ==========

class ApiManager {
    constructor() {
        this.baseUrl = API_CONFIG.BASE_URL;
        this.timeout = API_CONFIG.TIMEOUT;
        this.retryAttempts = API_CONFIG.RETRY_ATTEMPTS;
        
        // État de l'authentification
        this.isAuthenticated = false;
        this.currentUser = null;
        this.accessToken = null;
        this.refreshToken = null;
        
        // Initialiser depuis localStorage
        this.initializeFromStorage();
        
        // Queue pour les requêtes en attente de refresh token
        this.refreshQueue = [];
        this.isRefreshing = false;
    }

    // ========== GESTION DE L'AUTHENTIFICATION ==========

    /**
     * Initialise l'état depuis localStorage
     */
    initializeFromStorage() {
        this.accessToken = localStorage.getItem('authToken');
        this.refreshToken = localStorage.getItem('refreshToken');
        
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.isAuthenticated = true;
        }
    }

    /**
     * Sauvegarde les tokens et infos utilisateur
     */
    saveAuthData(authData) {
        this.accessToken = authData.tokens.access;
        this.refreshToken = authData.tokens.refresh;
        this.currentUser = authData.user;
        this.isAuthenticated = true;
        
        localStorage.setItem('authToken', this.accessToken);
        localStorage.setItem('refreshToken', this.refreshToken);
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        console.log('✅ Données d\'authentification sauvegardées');
    }

    /**
     * Nettoie les données d'authentification
     */
    clearAuthData() {
        this.accessToken = null;
        this.refreshToken = null;
        this.currentUser = null;
        this.isAuthenticated = false;
        
        localStorage.removeItem('authToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('currentUser');
        
        console.log('🔓 Données d\'authentification nettoyées');
    }

    /**
     * Rafraîchit le token d'accès
     */
    async refreshAccessToken() {
        if (!this.refreshToken) {
            throw new Error('Aucun refresh token disponible');
        }

        if (this.isRefreshing) {
            // Attendre que le refresh en cours se termine
            return new Promise((resolve, reject) => {
                this.refreshQueue.push({ resolve, reject });
            });
        }

        this.isRefreshing = true;

        try {
            const response = await fetch(this.baseUrl + API_CONFIG.ENDPOINTS.AUTH_TOKEN_REFRESH, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    refresh: this.refreshToken
                })
            });

            if (!response.ok) {
                throw new Error('Échec du rafraîchissement du token');
            }

            const data = await response.json();
            this.accessToken = data.access;
            localStorage.setItem('authToken', this.accessToken);

            // Résoudre toutes les requêtes en attente
            this.refreshQueue.forEach(({ resolve }) => resolve(this.accessToken));
            this.refreshQueue = [];

            return this.accessToken;

        } catch (error) {
            // Rejeter toutes les requêtes en attente
            this.refreshQueue.forEach(({ reject }) => reject(error));
            this.refreshQueue = [];
            
            // Déconnecter l'utilisateur
            this.clearAuthData();
            throw error;
            
        } finally {
            this.isRefreshing = false;
        }
    }

    // ========== GESTION DES REQUÊTES HTTP ==========

    /**
     * Headers par défaut pour les requêtes
     */
    getHeaders(includeAuth = false, contentType = 'application/json') {
        const headers = {};
        
        if (contentType) {
            headers['Content-Type'] = contentType;
        }
        
        if (includeAuth && this.accessToken) {
            headers['Authorization'] = `Bearer ${this.accessToken}`;
        }
        
        return headers;
    }

    /**
     * Requête HTTP générique avec gestion d'erreurs et retry
     */
    async request(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : this.baseUrl + endpoint;
        
        const config = {
            timeout: this.timeout,
            ...options,
            headers: {
                ...this.getHeaders(options.requireAuth, options.contentType),
                ...options.headers
            }
        };

        // Supprimer les options personnalisées
        delete config.requireAuth;
        delete config.contentType;
        delete config.retryCount;

        let lastError;
        
        for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
            try {
                const response = await this.fetchWithTimeout(url, config);
                
                // Gestion de l'authentification expirée
                if (response.status === 401 && this.refreshToken && options.requireAuth) {
                    try {
                        await this.refreshAccessToken();
                        // Retry avec le nouveau token
                        config.headers['Authorization'] = `Bearer ${this.accessToken}`;
                        const retryResponse = await this.fetchWithTimeout(url, config);
                        return await this.handleResponse(retryResponse);
                    } catch (refreshError) {
                        throw new ApiError('Session expirée, veuillez vous reconnecter', 401);
                    }
                }
                
                return await this.handleResponse(response);
                
            } catch (error) {
                lastError = error;
                
                // Ne pas retry certaines erreurs
                if (error instanceof ApiError && [400, 401, 403, 404, 422].includes(error.status)) {
                    throw error;
                }
                
                // Attendre avant le retry
                if (attempt < this.retryAttempts - 1) {
                    await this.delay(1000 * (attempt + 1));
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Fetch avec timeout
     */
    async fetchWithTimeout(url, config) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);
        
        try {
            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new ApiError('Timeout de la requête', 408);
            }
            throw error;
        }
    }

    /**
     * Gestion des réponses HTTP
     */
    async handleResponse(response) {
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        
        if (!response.ok) {
            const message = data.error || data.detail || data.message || `Erreur HTTP ${response.status}`;
            throw new ApiError(message, response.status, data);
        }
        
        return data;
    }

    /**
     * Délai pour les retry
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ========== MÉTHODES HTTP SIMPLIFIÉES ==========

    async get(endpoint, params = {}, options = {}) {
        const url = new URL(endpoint.startsWith('http') ? endpoint : this.baseUrl + endpoint);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.append(key, params[key]);
            }
        });

        return this.request(url.toString(), {
            method: 'GET',
            ...options
        });
    }

    async post(endpoint, data = null, options = {}) {
        const config = {
            method: 'POST',
            ...options
        };

        if (data !== null) {
            if (data instanceof FormData) {
                config.body = data;
                config.contentType = null; // Laisser le navigateur définir le Content-Type
            } else {
                config.body = JSON.stringify(data);
            }
        }

        return this.request(endpoint, config);
    }

    async put(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options
        });
    }

    async patch(endpoint, data, options = {}) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
            ...options
        });
    }

    async delete(endpoint, options = {}) {
        return this.request(endpoint, {
            method: 'DELETE',
            ...options
        });
    }
}

// ========== CLASSE D'ERREUR PERSONNALISÉE ==========

class ApiError extends Error {
    constructor(message, status = 500, data = null) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

// ========== SERVICES SPÉCIALISÉS ==========

/**
 * Service d'authentification
 */
class AuthService {
    constructor(apiManager) {
        this.api = apiManager;
    }

    async login(credentials) {
        try {
            const result = await this.api.post(API_CONFIG.ENDPOINTS.AUTH_LOGIN, credentials);
            
            if (result.tokens) {
                this.api.saveAuthData(result);
                
                // Événement personnalisé pour notifier la connexion
                window.dispatchEvent(new CustomEvent('userLoggedIn', { 
                    detail: result.user 
                }));
            }
            
            return result;
        } catch (error) {
            throw new ApiError(
                error.message || 'Erreur lors de la connexion',
                error.status || 400
            );
        }
    }

    async register(userData) {
        try {
            const result = await this.api.post(API_CONFIG.ENDPOINTS.AUTH_REGISTER, userData);
            
            if (result.tokens) {
                this.api.saveAuthData(result);
                
                // Événement personnalisé pour notifier l'inscription
                window.dispatchEvent(new CustomEvent('userRegistered', { 
                    detail: result.user 
                }));
            }
            
            return result;
        } catch (error) {
            throw new ApiError(
                error.message || 'Erreur lors de l\'inscription',
                error.status || 400
            );
        }
    }

    async logout() {
        try {
            if (this.api.refreshToken) {
                await this.api.post(API_CONFIG.ENDPOINTS.AUTH_LOGOUT, {
                    refresh: this.api.refreshToken
                }, { requireAuth: true });
            }
        } catch (error) {
            console.warn('Erreur lors de la déconnexion côté serveur:', error);
        } finally {
            this.api.clearAuthData();
            
            // Événement personnalisé pour notifier la déconnexion
            window.dispatchEvent(new CustomEvent('userLoggedOut'));
        }
    }

    async getProfile() {
        return this.api.get(API_CONFIG.ENDPOINTS.AUTH_PROFILE, {}, { requireAuth: true });
    }

    async updateProfile(data) {
        return this.api.patch(API_CONFIG.ENDPOINTS.AUTH_PROFILE, data, { requireAuth: true });
    }

    async changePassword(passwordData) {
        return this.api.post(API_CONFIG.ENDPOINTS.AUTH_CHANGE_PASSWORD, passwordData, { requireAuth: true });
    }

    async verifyToken() {
        return this.api.get(API_CONFIG.ENDPOINTS.AUTH_TOKEN_VERIFY, {}, { requireAuth: true });
    }

    isAuthenticated() {
        return this.api.isAuthenticated;
    }

    getCurrentUser() {
        return this.api.currentUser;
    }
}

/**
 * Service de menu
 */
class MenuService {
    constructor(apiManager) {
        this.api = apiManager;
    }

    async getCategories() {
        return this.api.get(API_CONFIG.ENDPOINTS.MENU_CATEGORIES);
    }

    async getCategoriesWithPlats() {
        return this.api.get(API_CONFIG.ENDPOINTS.MENU_CATEGORIES_WITH_PLATS);
    }

    async getPlats(filters = {}) {
        return this.api.get(API_CONFIG.ENDPOINTS.MENU_PLATS, filters);
    }

    async getPlatDetail(platId) {
        return this.api.get(`${API_CONFIG.ENDPOINTS.MENU_PLATS}${platId}/`);
    }

    async getSpecialites() {
        return this.api.get(API_CONFIG.ENDPOINTS.MENU_SPECIALITES);
    }

    async searchPlats(query) {
        return this.api.get(API_CONFIG.ENDPOINTS.MENU_SEARCH, { q: query });
    }

    async getPlatsByCategory(categoryId) {
        return this.api.get(`/menu/categories/${categoryId}/plats/`);
    }
}

/**
 * Service de réservations
 */
class ReservationService {
    constructor(apiManager) {
        this.api = apiManager;
    }

    async getTables() {
        return this.api.get(API_CONFIG.ENDPOINTS.RESTAURANT_TABLES);
    }

    async getAvailableTables(date, time, guests) {
        return this.api.get(API_CONFIG.ENDPOINTS.RESTAURANT_TABLES_DISPONIBLES, {
            date,
            heure: time,
            nb_personnes: guests
        });
    }

    async createReservation(reservationData) {
        return this.api.post(API_CONFIG.ENDPOINTS.RESTAURANT_RESERVATIONS, reservationData, { 
            requireAuth: true 
        });
    }

    async getReservations() {
        return this.api.get(API_CONFIG.ENDPOINTS.RESTAURANT_RESERVATIONS, {}, { 
            requireAuth: true 
        });
    }

    async getMyReservations() {
        return this.api.get(API_CONFIG.ENDPOINTS.RESTAURANT_MES_RESERVATIONS, {}, { 
            requireAuth: true 
        });
    }

    async getReservationDetail(reservationId) {
        return this.api.get(`${API_CONFIG.ENDPOINTS.RESTAURANT_RESERVATIONS}${reservationId}/`, {}, { 
            requireAuth: true 
        });
    }

    async updateReservation(reservationId, data) {
        return this.api.patch(`${API_CONFIG.ENDPOINTS.RESTAURANT_RESERVATIONS}${reservationId}/`, data, { 
            requireAuth: true 
        });
    }

    async cancelReservation(reservationId) {
        return this.api.post(`${API_CONFIG.ENDPOINTS.RESTAURANT_RESERVATIONS}${reservationId}/annuler/`, {}, { 
            requireAuth: true 
        });
    }

    async deleteReservation(reservationId) {
        return this.api.delete(`${API_CONFIG.ENDPOINTS.RESTAURANT_RESERVATIONS}${reservationId}/`, { 
            requireAuth: true 
        });
    }
}

/**
 * Service de commandes
 */
class OrderService {
    constructor(apiManager) {
        this.api = apiManager;
    }

    async createOrder(orderData) {
        return this.api.post(API_CONFIG.ENDPOINTS.ORDERS_COMMANDES, orderData, { 
            requireAuth: true 
        });
    }

    async getOrders() {
        return this.api.get(API_CONFIG.ENDPOINTS.ORDERS_COMMANDES, {}, { 
            requireAuth: true 
        });
    }

    async getMyOrders() {
        return this.api.get(API_CONFIG.ENDPOINTS.ORDERS_MY_ORDERS, {}, { 
            requireAuth: true 
        });
    }

    async getOrderDetail(orderId) {
        return this.api.get(`${API_CONFIG.ENDPOINTS.ORDERS_COMMANDES}${orderId}/`, {}, { 
            requireAuth: true 
        });
    }

    async updateOrderStatus(orderId, status) {
        return this.api.post(`${API_CONFIG.ENDPOINTS.ORDERS_COMMANDES}${orderId}/update_status/`, 
            { statut: status }, 
            { requireAuth: true }
        );
    }

    async cancelOrder(orderId) {
        return this.api.post(`${API_CONFIG.ENDPOINTS.ORDERS_COMMANDES}${orderId}/cancel_order/`, {}, { 
            requireAuth: true 
        });
    }

    async getOrderStats() {
        return this.api.get(API_CONFIG.ENDPOINTS.ORDERS_STATS, {}, { 
            requireAuth: true 
        });
    }
}

/**
 * Service de paiements
 */
class PaymentService {
    constructor(apiManager) {
        this.api = apiManager;
    }

    async createPayment(paymentData) {
        return this.api.post(API_CONFIG.ENDPOINTS.PAYMENTS_PAIEMENTS, paymentData, { 
            requireAuth: true 
        });
    }

    async getPayments() {
        return this.api.get(API_CONFIG.ENDPOINTS.PAYMENTS_PAIEMENTS, {}, { 
            requireAuth: true 
        });
    }

    async getPaymentDetail(paymentId) {
        return this.api.get(`${API_CONFIG.ENDPOINTS.PAYMENTS_PAIEMENTS}${paymentId}/`, {}, { 
            requireAuth: true 
        });
    }

    async completePayment(paymentId) {
        return this.api.post(`${API_CONFIG.ENDPOINTS.PAYMENTS_PAIEMENTS}${paymentId}/complete_payment/`, {}, { 
            requireAuth: true 
        });
    }

    async failPayment(paymentId, reason = '') {
        return this.api.post(`${API_CONFIG.ENDPOINTS.PAYMENTS_PAIEMENTS}${paymentId}/fail_payment/`, 
            { raison: reason }, 
            { requireAuth: true }
        );
    }

    async refundPayment(paymentId, amount, reason) {
        return this.api.post(`${API_CONFIG.ENDPOINTS.PAYMENTS_PAIEMENTS}${paymentId}/refund_payment/`, 
            { montant: amount, raison: reason }, 
            { requireAuth: true }
        );
    }

    async getPaymentStats() {
        return this.api.get(API_CONFIG.ENDPOINTS.PAYMENTS_STATS, {}, { 
            requireAuth: true 
        });
    }
}

/**
 * Service de dashboard (à créer côté Django)
 */
class DashboardService {
    constructor(apiManager) {
        this.api = apiManager;
    }

    async getOverviewStats() {
        return this.api.get(API_CONFIG.ENDPOINTS.DASHBOARD_STATS, {}, { 
            requireAuth: true 
        });
    }

    async getRevenueStats(period = 'month') {
        return this.api.get(API_CONFIG.ENDPOINTS.DASHBOARD_REVENUE, 
            { period }, 
            { requireAuth: true }
        );
    }

    async getTodayOrders() {
        return this.api.get(API_CONFIG.ENDPOINTS.DASHBOARD_ORDERS_TODAY, {}, { 
            requireAuth: true 
        });
    }
}

// ========== INITIALISATION GLOBALE ==========

// Instance globale du gestionnaire API
const apiManager = new ApiManager();

// Services globaux
const authService = new AuthService(apiManager);
const menuService = new MenuService(apiManager);
const reservationService = new ReservationService(apiManager);
const orderService = new OrderService(apiManager);
const paymentService = new PaymentService(apiManager);
const dashboardService = new DashboardService(apiManager);

// ========== UTILITAIRES GLOBAUX ==========

/**
 * Gestionnaire d'erreurs global
 */
function handleApiError(error, showToUser = true) {
    console.error('❌ Erreur API:', error);
    
    let message = 'Une erreur inattendue s\'est produite';
    
    if (error instanceof ApiError) {
        message = error.message;
    } else if (error.message) {
        message = error.message;
    }
    
    if (showToUser) {
        // Utiliser votre système de notification existant
        if (typeof showMessage === 'function') {
            showMessage(message, 'error');
        } else {
            alert(message);
        }
    }
    
    return message;
}

/**
 * Vérification de la connexion réseau
 */
function checkNetworkConnection() {
    return navigator.onLine;
}

/**
 * Formatage des données pour l'affichage
 */
function formatApiResponse(data, type = 'default') {
    switch (type) {
        case 'currency':
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
            }).format(data);
            
        case 'date':
            return new Intl.DateTimeFormat('fr-FR').format(new Date(data));
            
        case 'datetime':
            return new Intl.DateTimeFormat('fr-FR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            }).format(new Date(data));
            
        default:
            return data;
    }
}

// ========== EXPOSITION GLOBALE ==========

// Exposer les services et utilitaires globalement
window.apiManager = apiManager;
window.authService = authService;
window.menuService = menuService;
window.reservationService = reservationService;
window.orderService = orderService;
window.paymentService = paymentService;
window.dashboardService = dashboardService;

// Utilitaires
window.handleApiError = handleApiError;
window.checkNetworkConnection = checkNetworkConnection;
window.formatApiResponse = formatApiResponse;
window.ApiError = ApiError;

// Configuration pour le debugging
window.API_CONFIG = API_CONFIG;

console.log('🚀 Gestionnaire API initialisé avec succès');
console.log('📡 Services disponibles:', {
    auth: 'authService',
    menu: 'menuService', 
    reservation: 'reservationService',
    order: 'orderService',
    payment: 'paymentService',
    dashboard: 'dashboardService'
});
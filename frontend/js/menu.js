// CONSTANTES GLOBALES
const DEFAULT_IMAGE = 'https://via.placeholder.com/80x60?text=Plat';
const CART_KEY = 'cart';
const USER_KEY = 'currentUser';
const ORDERS_KEY = 'orders';
const USER_ORDERS_KEY = 'userOrders';

// ÉTAT GLOBAL
let cart = JSON.parse(localStorage.getItem(CART_KEY)) || [];
let currentDish = {};
let saveTimeout;

// FONCTIONS UTILITAIRES
function formatPrice(price) {
    return new Intl.NumberFormat('fr-DZ', {
        style: 'currency',
        currency: 'DZD'
    }).format(price);
}

function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

function showFeedback(message, type = 'success') {
    const feedback = document.createElement('div');
    feedback.className = `feedback ${type}`;
    feedback.textContent = message;
    document.body.appendChild(feedback);

    setTimeout(() => {
        feedback.classList.add('fade-out');
        setTimeout(() => feedback.remove(), 500);
    }, 3000);
}

function saveCart() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    }, 500);
}

// FONCTIONS DU PANIER
function updateCartDisplay() {
    const cartCount = document.getElementById("cart-count");
    const cartItems = document.getElementById("cart-items");
    const cartTotal = document.getElementById("cart-total");

    cartCount.innerText = cart.length;
    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.innerHTML = "<p style='padding: 10px; color: #888;'>Votre panier est vide.</p>";
        cartTotal.innerText = formatPrice(0);
        return;
    }

    let total = 0;
    cart.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "cart-item";

        // Bloc de gauche : titre + ingrédients
        const detailsDiv = document.createElement("div");
        detailsDiv.className = "item-details";
        detailsDiv.innerHTML = `
            <strong>${sanitizeInput(item.name)}</strong><br>
            ${item.ingredients ? item.ingredients.map(ing => `<div>${sanitizeInput(ing)}</div>`).join("") : ""}
            <br><strong>Quantité:</strong> ${item.qty} × ${formatPrice(item.price)}
            <div class="quantity-controls">
                <button onclick="updateQuantity(${index}, ${item.qty - 1})">-</button>
                <span>${item.qty}</span>
                <button onclick="updateQuantity(${index}, ${item.qty + 1})">+</button>
            </div>
        `;

        // Image à droite
        const img = document.createElement("img");
        img.src = item.image || DEFAULT_IMAGE;
        img.alt = item.name;

        // Bouton supprimer
        const delBtn = document.createElement("button");
        delBtn.className = "delete-btn";
        delBtn.innerHTML = "&times;";
        delBtn.onclick = () => removeFromCart(index);

        li.appendChild(detailsDiv);
        li.appendChild(img);
        li.appendChild(delBtn);
        cartItems.appendChild(li);

        total += item.price * item.qty;
    });

    cartTotal.innerText = formatPrice(total);
    saveCart();
}

/**
 * Ajoute un article au panier avec validation des données
 * @param {string} name - Nom du produit
 * @param {number|string} price - Prix unitaire
 * @param {number|string} qty - Quantité désirée
 * @param {string} [image] - URL de l'image (optionnelle)
 * @param {string[]} [ingredients] - Liste des ingrédients (optionnelle)
 */
function addToCart(name, price, qty, image, ingredients) {
    try {
        if (!name || !price) throw new Error('Informations produit manquantes');
        if (qty <= 0) throw new Error('Quantité invalide');

        const item = {
            name: sanitizeInput(name),
            price: parseInt(price),
            qty: parseInt(qty),
            image: image || DEFAULT_IMAGE,
            ingredients: (ingredients || []).map(sanitizeInput)
        };

        cart.push(item);
        updateCartDisplay();
        showFeedback('Article ajouté au panier');
    } catch (error) {
        console.error('Erreur ajout panier:', error);
        showFeedback(error.message, 'error');
    }
}

function removeFromCart(index) {
    if (index >= 0 && index < cart.length) {
        const removedItem = cart.splice(index, 1)[0];
        showFeedback(`${removedItem.name} retiré du panier`);
        updateCartDisplay();
    }
}

function updateQuantity(index, newQty) {
    if (newQty > 0) {
        cart[index].qty = newQty;
        updateCartDisplay();
    } else {
        removeFromCart(index);
    }
}

function clearCart() {
    cart = [];
    updateCartDisplay();
    showFeedback('Panier vidé');
}

// FONCTIONS MODALES
function toggleCartModal() {
    const modal = document.getElementById("cart-modal");
    modal.style.display = modal.style.display === "block" ? "none" : "block";
}

function openDishModal(name, price, imageSrc, description, ingredients) {
    currentDish = {
        name: sanitizeInput(name),
        price: parseInt(price),
        image: imageSrc || DEFAULT_IMAGE,
        ingredients: (ingredients || []).map(sanitizeInput)
    };

    document.getElementById("modal-dish-name").innerText = currentDish.name;
    document.getElementById("modal-dish-img").src = currentDish.image;
    document.getElementById("modal-dish-img").alt = currentDish.name;
    document.getElementById("modal-dish-price").innerText = formatPrice(currentDish.price);
    document.getElementById("modal-dish-description").innerText = description || "Un plat savoureux préparé avec soin.";

    const list = document.getElementById("modal-dish-ingredients");
    list.innerHTML = "";
    currentDish.ingredients.forEach(ing => {
        const li = document.createElement("li");
        li.innerText = ing;
        list.appendChild(li);
    });

    document.getElementById("dish-qty").value = 1;
    document.getElementById("dish-modal").style.display = "block";
}

function closeDishModal() {
    document.getElementById("dish-modal").style.display = "none";
}

function addModalDishToCart() {
    const qty = parseInt(document.getElementById("dish-qty").value) || 1;
    addToCart(
        currentDish.name,
        currentDish.price,
        qty,
        currentDish.image,
        currentDish.ingredients
    );
    closeDishModal();
}

// COMMANDE & HISTORIQUE
function prepareCheckout() {
    const currentUser = JSON.parse(localStorage.getItem(USER_KEY));
    if (!currentUser) {
        showFeedback('Vous devez vous connecter pour commander', 'error');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
    }

    if (cart.length === 0) {
        showFeedback('Votre panier est vide', 'error');
        return;
    }

    const button = event.target;
    const originalText = button.innerHTML;
    button.innerHTML = '⏳ Préparation...';
    button.disabled = true;

    // Simuler un traitement asynchrone
    setTimeout(() => {
        document.getElementById("cart-modal").style.display = "none";
        window.location.href = 'commande.html';
    }, 800);
}

function showOrderHistory() {
    const currentUser = JSON.parse(localStorage.getItem(USER_KEY));
    if (!currentUser) {
        showFeedback('Connectez-vous pour voir vos commandes', 'error');
        setTimeout(() => window.location.href = 'index.html', 1500);
        return;
    }

    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
    const myOrders = orders.filter(order =>
        order.userId === currentUser.id ||
        order.customerEmail === currentUser.email
    );

    if (myOrders.length === 0) {
        showFeedback('Aucune commande trouvée', 'info');
        return;
    }

    showOrderHistoryModal(myOrders);
}

function showOrderHistoryModal(orders) {
    let modal = document.getElementById('order-history-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'order-history-modal';
        modal.className = 'modal';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.maxWidth = '600px';
        modalContent.style.maxHeight = '80vh';
        modalContent.style.overflowY = 'auto';

        modalContent.innerHTML = `
            <span class="close" onclick="closeOrderHistoryModal()">&times;</span>
            <h2>📋 Mes Commandes</h2>
            <div id="orders-list"></div>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);
    }

    modal.style.display = 'block';
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '';

    orders.forEach((order, index) => {
        const orderDiv = document.createElement('div');
        orderDiv.className = 'order-item';

        const orderDate = new Date(order.date || Date.now()).toLocaleDateString('fr-FR');
        const orderNumber = order.orderNumber || `CMD${Date.now()}${index}`;
        const total = order.total || cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const status = order.status || 'En préparation';

        orderDiv.innerHTML = `
            <div class="order-header">
                <strong>Commande #${orderNumber}</strong>
                <span class="order-total">${formatPrice(total)}</span>
            </div>
            <div class="order-meta">
                📅 ${orderDate} | 📊 ${status}
            </div>
            <div class="order-items">
                ${(order.items || cart).map(item =>
                    `• ${item.name} × ${item.qty || 1}`
                ).join('<br>')}
            </div>
        `;

        ordersList.appendChild(orderDiv);
    });
}

function closeOrderHistoryModal() {
    const modal = document.getElementById('order-history-modal');
    if (modal) modal.style.display = 'none';
}

// NAVIGATION & UI
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile');
    const burgerMenu = document.querySelector('.burger-menu');

    if (mobileMenu && burgerMenu) {
        mobileMenu.classList.toggle('active');
        burgerMenu.classList.toggle('active');
    }
}

function toggleDropdown(menuId, event) {
    event.preventDefault();
    const menu = document.getElementById(menuId);
    menu.style.display = menu.style.display === "block" ? "none" : "block";
}

function filterMenus(filter) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Simulation de filtrage
    console.log(`Filtre appliqué: ${filter}`);
    const container = document.getElementById('menusContainer');
    container.style.opacity = '0.5';
    setTimeout(() => container.style.opacity = '1', 300);
}

// INITIALISATION
document.addEventListener("DOMContentLoaded", function() {
    loadMenuFromAPI();
    updateCartDisplay();

    // Gestion des boutons "Commander"
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('commander')) {
            const button = e.target;
            const card = button.closest('.menu-card');
            const name = button.dataset.name;
            const price = button.dataset.price;
            const img = card.querySelector('img')?.src || "";

            const ingredientsData = {
                "Avocado toast au saumon": ["avocat", "pain noir", "saumon fumé", "citron", "Fromage frais"],
                // ... (autres plats)
            };

            const ingredients = ingredientsData[name] || ["Ingrédients non spécifiés"];
            openDishModal(name, price, img, "", ingredients);
        }

        if (e.target.classList.contains('checkout-btn')) {
            prepareCheckout();
        }
    });

    // Masquer les menus dropdown au chargement
    ['dropdown-accueil', 'dropdown-reservation'].forEach(id => {
        const menu = document.getElementById(id);
        if (menu) menu.style.display = "none";
    });
});

// Ajouter au début du fichier
async function loadMenuFromAPI() {
    try {
        console.log('🔄 Chargement du menu depuis l\'API...');
        
        const categories = await menuService.getCategoriesWithPlats();
        console.log('✅ Menu chargé:', categories);
        
        // Afficher les catégories dans votre interface
        displayMenuCategories(categories);
        
    } catch (error) {
        console.error('❌ Erreur API, utilisation des données statiques:', error);
        // Garder vos données statiques en fallback
    }
}

// Dans menu.js
async function loadMenu() {
    try {
        const categories = await menuService.getCategoriesWithPlats();
        displayMenu(categories);
    } catch (error) {
        handleApiError(error);
    }
}

// Dans reservation.js
async function createReservation(data) {
    try {
        const result = await reservationService.createReservation(data);
        console.log('Réservation créée:', result);
    } catch (error) {
        handleApiError(error);
    }
}

// Dans commande.js
async function placeOrder(orderData) {
    try {
        const order = await orderService.createOrder(orderData);
        console.log('Commande créée:', order);
    } catch (error) {
        handleApiError(error);
    }
}
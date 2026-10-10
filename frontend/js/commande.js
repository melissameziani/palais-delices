/**
 * Système de commande moderne - Le Palais des Délices
 * Architecture complète avec navigation fluide, validations et UX optimisée
 */

// ========== VARIABLES GLOBALES ==========

// État de l'application
let currentStep = 1;
let isProcessing = false;
let cartData = [];
let userSession = null;

// Configuration des frais
const DELIVERY_CONFIG = {
    home: { fee: 500, label: 'Livraison à domicile', time: '30-45 min' },
    pickup: { fee: 0, label: 'Retrait en magasin', time: '15-20 min' }
};

// Données du formulaire
let orderData = {
    deliveryMethod: 'delivery',
    paymentMethod: 'card',
    customerInfo: {},
    addressInfo: {},
    paymentInfo: {},
    totals: {
        subtotal: 0,
        deliveryFee: 500,
        total: 0
    }
};

// ========== INITIALISATION ==========

/**
 * Initialisation complète du système de commande
 */
function initializeCommande() {
    console.log('🚀 Initialisation du système de commande...');
    
    try {
        // Charger la session utilisateur
        loadUserSession();
        
        // Charger le panier depuis localStorage
        loadCartData();
        
        // Configurer les écouteurs d'événements
        setupEventListeners();
        
        // Afficher l'étape 1
        showStep(1);
        
        // Charger les articles du panier
        loadCartItems();
        
        // Synchroniser tous les récapitulatifs
        syncAllSummaries();
        
        // Préremplir les formulaires si possible
        prefillUserData();
        
        console.log('✅ Système de commande initialisé avec succès');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        showErrorMessage('Erreur lors du chargement de la page. Veuillez actualiser.');
    }
}

/**
 * Configuration de tous les écouteurs d'événements
 */
function setupEventListeners() {
    console.log('🔧 Configuration des écouteurs d\'événements...');
    
    // Navigation
    setupNavigationListeners();
    
    // Formulaires
    setupFormListeners();
    
    // Panier
    setupCartListeners();
    
    // Paiement
    setupPaymentListeners();
    
    // Validation en temps réel
    setupValidationListeners();
}

/**
 * Écouteurs de navigation
 */
function setupNavigationListeners() {
    // Boutons de navigation (gérés dans le HTML avec onclick)
    console.log('Navigation listeners configurés');
}

/**
 * Écouteurs des formulaires
 */
function setupFormListeners() {
    // Mode de livraison
    const deliveryInputs = document.querySelectorAll('input[name="deliveryMethod"]');
    deliveryInputs.forEach(input => {
        input.addEventListener('change', handleDeliveryMethodChange);
    });
    
    // Mode de paiement
    const paymentInputs = document.querySelectorAll('input[name="paymentMethod"]');
    paymentInputs.forEach(input => {
        input.addEventListener('change', handlePaymentMethodChange);
    });
    
    // Formatage des champs de carte
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', formatCardNumber);
    }
    
    const expiryInput = document.getElementById('expiryDate');
    if (expiryInput) {
        expiryInput.addEventListener('input', formatExpiryDate);
    }
    
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', formatCVV);
    }
}

/**
 * Écouteurs du panier
 */
function setupCartListeners() {
    // Les événements du panier sont configurés dynamiquement
    // lors du chargement des articles
    console.log('Cart listeners configurés');
}

/**
 * Écouteurs du paiement
 */
function setupPaymentListeners() {
    // Acceptation des CGV
    const termsCheckbox = document.getElementById('termsAccept');
    if (termsCheckbox) {
        termsCheckbox.addEventListener('change', validateStep3);
    }
}

/**
 * Écouteurs de validation en temps réel
 */
function setupValidationListeners() {
    // Validation du formulaire de livraison
    const deliveryForm = document.getElementById('deliveryForm');
    if (deliveryForm) {
        const inputs = deliveryForm.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', validateDeliveryField);
            input.addEventListener('input', clearFieldError);
        });
    }
    
    // Validation du formulaire de paiement
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        const inputs = paymentForm.querySelectorAll('input[required]');
        inputs.forEach(input => {
            input.addEventListener('blur', validatePaymentField);
            input.addEventListener('input', clearFieldError);
        });
    }
}

// ========== NAVIGATION ENTRE ÉTAPES ==========

/**
 * Navigation vers l'étape suivante
 */
function nextStep() {
    if (isProcessing) return;
    
    console.log(`🔄 Navigation: Étape ${currentStep} → ${currentStep + 1}`);
    
    // Valider l'étape actuelle
    if (!validateCurrentStep()) {
        console.log('❌ Validation échouée pour l\'étape', currentStep);
        return;
    }
    
    // Sauvegarder les données de l'étape
    saveCurrentStepData();
    
    // Naviguer vers l'étape suivante
    if (currentStep < 3) {
        showStep(currentStep + 1);
    }
}

/**
 * Navigation vers l'étape précédente
 */
function previousStep() {
    if (isProcessing) return;
    
    console.log(`🔄 Navigation: Étape ${currentStep} → ${currentStep - 1}`);
    
    if (currentStep > 1) {
        showStep(currentStep - 1);
    }
}

/**
 * Afficher une étape spécifique
 */
function showStep(stepNumber) {
    console.log(`👁️ Affichage de l'étape ${stepNumber}`);
    
    // Masquer toutes les étapes
    document.querySelectorAll('.checkout-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Afficher l'étape demandée
    const targetStep = document.getElementById(`step${stepNumber}`);
    if (targetStep) {
        targetStep.classList.add('active');
        currentStep = stepNumber;
        
        // Mettre à jour la progress bar
        updateProgressBar(stepNumber);
        
        // Actions spécifiques par étape
        handleStepSpecificActions(stepNumber);
        
        // Faire défiler vers le haut
        scrollToTop();
        
    } else {
        console.error(`❌ Étape ${stepNumber} introuvable`);
    }
}

/**
 * Mise à jour de la progress bar
 */
function updateProgressBar(activeStep) {
    console.log(`📊 Mise à jour progress bar: étape ${activeStep}`);
    
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        const stepNum = index + 1;
        
        if (stepNum <= activeStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
    
    // Animer les lignes de progression
    document.querySelectorAll('.progress-line').forEach((line, index) => {
        const lineAfter = line.querySelector('::after') || line;
        if (index + 1 < activeStep) {
            line.style.setProperty('--progress-width', '100%');
        } else {
            line.style.setProperty('--progress-width', '0%');
        }
    });
}

/**
 * Actions spécifiques par étape
 */
function handleStepSpecificActions(stepNumber) {
    switch (stepNumber) {
        case 1:
            loadCartItems();
            syncAllSummaries();
            break;
            
        case 2:
            updateDeliveryDisplay();
            syncAllSummaries();
            break;
            
        case 3:
            updatePaymentDisplay();
            updateFinalSummary();
            break;
    }
}

/**
 * Faire défiler vers le haut
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// ========== GESTION DU PANIER ==========

/**
 * Charger les données du panier depuis localStorage
 */
function loadCartData() {
    try {
        const storedCart = localStorage.getItem('cart');
        cartData = storedCart ? JSON.parse(storedCart) : [];
        
        console.log(`🛒 Panier chargé: ${cartData.length} articles`);
        console.log('Contenu du panier:', cartData);
        
    } catch (error) {
        console.error('❌ Erreur lors du chargement du panier:', error);
        cartData = [];
    }
}

/**
 * Afficher les articles du panier
 */
function loadCartItems() {
    console.log('🔄 Chargement des articles du panier...');
    
    const cartContainer = document.getElementById('cartItems');
    const emptyContainer = document.getElementById('cartEmpty');
    const itemCountDisplay = document.getElementById('itemCountDisplay');
    
    if (!cartContainer) {
        console.error('❌ Container cartItems introuvable');
        return;
    }
    
    // Vider le container
    cartContainer.innerHTML = '';
    
    // Vérifier si le panier est vide
    if (cartData.length === 0) {
        if (emptyContainer) emptyContainer.style.display = 'block';
        if (itemCountDisplay) itemCountDisplay.textContent = '0 article';
        cartContainer.style.display = 'none';
        
        // Désactiver le bouton suivant
        const nextBtn = document.getElementById('nextBtn1');
        if (nextBtn) {
            nextBtn.disabled = true;
            nextBtn.classList.add('disabled');
        }
        
        return;
    }
    
    // Afficher les articles
    if (emptyContainer) emptyContainer.style.display = 'none';
    cartContainer.style.display = 'block';
    
    cartData.forEach((item, index) => {
        const cartItemElement = createCartItemElement(item, index);
        cartContainer.appendChild(cartItemElement);
    });
    
    // Mettre à jour le compteur
    if (itemCountDisplay) {
        const count = cartData.length;
        itemCountDisplay.textContent = `${count} article${count > 1 ? 's' : ''}`;
    }
    
    // Activer le bouton suivant
    const nextBtn = document.getElementById('nextBtn1');
    if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.classList.remove('disabled');
    }
    
    // Calculer les totaux
    calculateTotals();
}

/**
 * Créer l'élément HTML d'un article du panier
 */
function createCartItemElement(item, index) {
    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.setAttribute('data-index', index);
    
    // Calculer le prix total pour cet article
    const totalPrice = (item.price * (item.qty || item.quantity || 1));
    
    cartItem.innerHTML = `
        <img src="${item.image || 'images/default-dish.jpg'}" 
             alt="${item.name}" 
             onerror="this.src='images/default-dish.jpg'">
        
        <div class="cart-item-info">
            <h4>${item.name}</h4>
            <p>${item.description || 'Délicieux plat de notre restaurant'}</p>
        </div>
        
        <div class="cart-item-quantity">
            <button type="button" class="quantity-btn" onclick="updateQuantity(${index}, -1)">
                <i class="fas fa-minus"></i>
            </button>
            <span class="quantity-display">${item.qty || item.quantity || 1}</span>
            <button type="button" class="quantity-btn" onclick="updateQuantity(${index}, 1)">
                <i class="fas fa-plus"></i>
            </button>
        </div>
        
        <div class="cart-item-price">
            ${totalPrice.toFixed(2)} DA
        </div>
        
        <button type="button" class="remove-btn" onclick="removeCartItem(${index})" 
                title="Supprimer cet article">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    return cartItem;
}

/**
 * Mettre à jour la quantité d'un article
 */
function updateQuantity(index, change) {
    console.log(`📝 Mise à jour quantité: article ${index}, changement ${change}`);
    
    if (index < 0 || index >= cartData.length) {
        console.error('❌ Index d\'article invalide:', index);
        return;
    }
    
    const item = cartData[index];
    const currentQty = item.qty || item.quantity || 1;
    const newQty = Math.max(1, currentQty + change);
    
    // Mettre à jour la quantité
    item.qty = newQty;
    if (item.quantity) item.quantity = newQty;
    
    // Sauvegarder dans localStorage
    localStorage.setItem('cart', JSON.stringify(cartData));
    
    // Recharger l'affichage
    loadCartItems();
    
    // Synchroniser les récapitulatifs
    syncAllSummaries();
    
    console.log(`✅ Quantité mise à jour: ${newQty}`);
}

/**
 * Supprimer un article du panier
 */
function removeCartItem(index) {
    console.log(`🗑️ Suppression de l'article ${index}`);
    
    if (index < 0 || index >= cartData.length) {
        console.error('❌ Index d\'article invalide:', index);
        return;
    }
    
    // Confirmation
    const item = cartData[index];
    if (!confirm(`Supprimer "${item.name}" du panier ?`)) {
        return;
    }
    
    // Supprimer l'article
    cartData.splice(index, 1);
    
    // Sauvegarder dans localStorage
    localStorage.setItem('cart', JSON.stringify(cartData));
    
    // Recharger l'affichage
    loadCartItems();
    
    // Synchroniser les récapitulatifs
    syncAllSummaries();
    
    console.log(`✅ Article supprimé du panier`);
}

// ========== CALCULS FINANCIERS ==========

/**
 * Calculer tous les totaux
 */
function calculateTotals() {
    console.log('💰 Calcul des totaux...');
    
    // Calculer le sous-total
    const subtotal = cartData.reduce((total, item) => {
        const qty = item.qty || item.quantity || 1;
        return total + (item.price * qty);
    }, 0);
    
    // Calculer les frais de livraison
    const deliveryFee = orderData.deliveryMethod === 'delivery' ? 
        DELIVERY_CONFIG.home.fee : DELIVERY_CONFIG.pickup.fee;
    
    // Calculer le total général
    const grandTotal = subtotal + deliveryFee;
    
    // Sauvegarder dans orderData
    orderData.totals = {
        subtotal: subtotal,
        deliveryFee: deliveryFee,
        total: grandTotal
    };
    
    console.log('💰 Totale calculés:', orderData.totals);
    
    return orderData.totals;
}

/**
 * Formater un montant en dinars algériens
 */
function formatPrice(amount) {
    return `${(amount / 100).toFixed(2)} DA`;
}

// ========== SYNCHRONISATION DES RÉCAPITULATIFS ==========

/**
 * Synchroniser tous les récapitulatifs
 */
function syncAllSummaries() {
    console.log('🔄 Synchronisation de tous les récapitulatifs...');
    
    // Calculer les totaux
    const totals = calculateTotals();
    
    // Mettre à jour tous les affichages
    updateStep1Summary(totals);
    updateStep2Summary(totals);
    updateStep3Summary(totals);
    
    // Mettre à jour le badge panier dans la navbar
    updateCartBadge();
}

/**
 * Mettre à jour le récapitulatif de l'étape 1
 */
function updateStep1Summary(totals) {
    const elements = {
        subtotal: document.getElementById('subtotalAmount'),
        delivery: document.getElementById('deliveryFeeAmount'),
        total: document.getElementById('totalAmount')
    };
    
    if (elements.subtotal) {
        elements.subtotal.textContent = formatPrice(totals.subtotal);
    }
    
    if (elements.delivery) {
        elements.delivery.textContent = totals.deliveryFee > 0 ? 
            formatPrice(totals.deliveryFee) : 'À calculer';
    }
    
    if (elements.total) {
        elements.total.textContent = formatPrice(totals.total);
    }
}

/**
 * Mettre à jour le récapitulatif de l'étape 2
 */
function updateStep2Summary(totals) {
    const elements = {
        subtotal: document.getElementById('subtotalAmount2'),
        delivery: document.getElementById('deliveryFeeAmount2'),
        total: document.getElementById('totalAmount2'),
        deliveryLine: document.getElementById('deliveryFeeLine')
    };
    
    if (elements.subtotal) {
        elements.subtotal.textContent = formatPrice(totals.subtotal);
    }
    
    if (elements.delivery) {
        elements.delivery.textContent = formatPrice(totals.deliveryFee);
    }
    
    if (elements.total) {
        elements.total.textContent = formatPrice(totals.total);
    }
    
    // Mettre à jour le libellé de livraison
    if (elements.deliveryLine) {
        const deliveryLabel = elements.deliveryLine.querySelector('span:first-child');
        if (deliveryLabel) {
            deliveryLabel.textContent = DELIVERY_CONFIG[
                orderData.deliveryMethod === 'delivery' ? 'home' : 'pickup'
            ].label;
        }
    }
}

/**
 * Mettre à jour le récapitulatif de l'étape 3
 */
function updateStep3Summary(totals) {
    const elements = {
        subtotal: document.getElementById('finalSubtotal'),
        delivery: document.getElementById('finalDeliveryFee'),
        total: document.getElementById('finalTotal'),
        itemCount: document.getElementById('finalItemCount'),
        deliveryLabel: document.getElementById('finalDeliveryLabel')
    };
    
    if (elements.subtotal) {
        elements.subtotal.textContent = formatPrice(totals.subtotal);
    }
    
    if (elements.delivery) {
        elements.delivery.textContent = formatPrice(totals.deliveryFee);
    }
    
    if (elements.total) {
        elements.total.textContent = formatPrice(totals.total);
    }
    
    if (elements.itemCount) {
        elements.itemCount.textContent = cartData.length;
    }
    
    if (elements.deliveryLabel) {
        elements.deliveryLabel.textContent = DELIVERY_CONFIG[
            orderData.deliveryMethod === 'delivery' ? 'home' : 'pickup'
        ].label;
    }
}

/**
 * Mettre à jour le badge panier
 */
function updateCartBadge() {
    const cartBadge = document.getElementById('cartBadge');
    if (cartBadge) {
        const totalItems = cartData.reduce((total, item) => {
            return total + (item.qty || item.quantity || 1);
        }, 0);
        cartBadge.textContent = totalItems;
    }
}

// ========== GESTION DES MODES DE LIVRAISON ==========

/**
 * Gérer le changement de mode de livraison
 */
function handleDeliveryMethodChange(event) {
    const method = event.target.value;
    console.log(`🚚 Changement mode de livraison: ${method}`);
    
    orderData.deliveryMethod = method;
    
    // Afficher/masquer la section adresse
    const addressSection = document.getElementById('addressSection');
    if (addressSection) {
        if (method === 'delivery') {
            addressSection.style.display = 'block';
            // Rendre les champs adresse obligatoires
            const addressInputs = addressSection.querySelectorAll('input[required]');
            addressInputs.forEach(input => input.required = true);
        } else {
            addressSection.style.display = 'none';
            // Retirer l'obligation des champs adresse
            const addressInputs = addressSection.querySelectorAll('input');
            addressInputs.forEach(input => input.required = false);
        }
    }
    
    // Mettre à jour l'affichage des délais
    updateDeliveryDisplay();
    
    // Recalculer les totaux
    syncAllSummaries();
}

/**
 * Mettre à jour l'affichage des informations de livraison
 */
function updateDeliveryDisplay() {
    const config = DELIVERY_CONFIG[
        orderData.deliveryMethod === 'delivery' ? 'home' : 'pickup'
    ];
    
    // Mettre à jour le temps estimé
    const estimatedTimeElement = document.getElementById('estimatedTime');
    if (estimatedTimeElement) {
        estimatedTimeElement.textContent = config.time;
    }
    
    // Mettre à jour les éléments finaux
    const finalDeliveryMethod = document.getElementById('finalDeliveryMethod');
    const finalDeliveryTime = document.getElementById('finalDeliveryTime');
    
    if (finalDeliveryMethod) {
        finalDeliveryMethod.textContent = config.label;
    }
    
    if (finalDeliveryTime) {
        finalDeliveryTime.textContent = `dans ${config.time}`;
    }
}

// ========== GESTION DES MODES DE PAIEMENT ==========

/**
 * Gérer le changement de mode de paiement
 */
function handlePaymentMethodChange(event) {
    const method = event.target.value;
    console.log(`💳 Changement mode de paiement: ${method}`);
    
    orderData.paymentMethod = method;
    
    // Afficher/masquer les formulaires appropriés
    const cardFormContainer = document.getElementById('cardFormContainer');
    const cashMessage = document.getElementById('cashMessage');
    
    if (method === 'card') {
        if (cardFormContainer) cardFormContainer.style.display = 'block';
        if (cashMessage) cashMessage.style.display = 'none';
    } else {
        if (cardFormContainer) cardFormContainer.style.display = 'none';
        if (cashMessage) cashMessage.style.display = 'block';
    }
    
    // Mettre à jour l'affichage final
    updatePaymentDisplay();
}

/**
 * Mettre à jour l'affichage des informations de paiement
 */
function updatePaymentDisplay() {
    const finalPaymentMethod = document.getElementById('finalPaymentMethod');
    if (finalPaymentMethod) {
        const methodText = orderData.paymentMethod === 'card' ? 
            'Carte bancaire' : 'Espèces à la livraison';
        finalPaymentMethod.textContent = methodText;
    }
}

// ========== FORMATAGE DES CHAMPS ==========

/**
 * Formater le numéro de carte
 */
function formatCardNumber(event) {
    let value = event.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    const formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    event.target.value = formattedValue;
}

/**
 * Formater la date d'expiration
 */
function formatExpiryDate(event) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    event.target.value = value;
}

/**
 * Formater le CVV
 */
function formatCVV(event) {
    event.target.value = event.target.value.replace(/[^0-9]/g, '').substring(0, 3);
}

// ========== VALIDATION ==========

/**
 * Valider l'étape actuelle
 */
function validateCurrentStep() {
    switch (currentStep) {
        case 1:
            return validateStep1();
        case 2:
            return validateStep2();
        case 3:
            return validateStep3();
        default:
            return true;
    }
}

/**
 * Valider l'étape 1 (Panier)
 */
function validateStep1() {
    console.log('✅ Validation étape 1...');
    
    if (cartData.length === 0) {
        showErrorMessage('Votre panier est vide. Ajoutez des articles avant de continuer.');
        return false;
    }
    
    console.log('✅ Étape 1 validée');
    return true;
}

/**
 * Valider l'étape 2 (Livraison)
 */
function validateStep2() {
    console.log('✅ Validation étape 2...');
    
    const form = document.getElementById('deliveryForm');
    if (!form) {
        console.error('❌ Formulaire de livraison introuvable');
        return false;
    }
    
    // Valider les champs obligatoires
    const requiredFields = form.querySelectorAll('input[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            showFieldError(field, 'Ce champ est obligatoire');
            isValid = false;
        }
    });
    
    // Validation spécifique du téléphone
    const phoneField = document.getElementById('phone');
    if (phoneField && phoneField.value) {
        const phonePattern = /^[0-9]{10}$/;
        if (!phonePattern.test(phoneField.value.replace(/\s/g, ''))) {
            showFieldError(phoneField, 'Numéro de téléphone invalide');
            isValid = false;
        }
    }
    
    // Validation de l'email si fourni
    const emailField = document.getElementById('email');
    if (emailField && emailField.value) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(emailField.value)) {
            showFieldError(emailField, 'Adresse email invalide');
            isValid = false;
        }
    }
    
    if (!isValid) {
        showErrorMessage('Veuillez remplire tous le formulaire.');
        return false;
    }
    
    console.log('✅ Étape 2 validée');
    return true;
}

/**
 * Valider l'étape 3 (Paiement)
 */
function validateStep3() {
    console.log('✅ Validation étape 3...');
    
    // Vérifier l'acceptation des CGV
    const termsCheckbox = document.getElementById('termsAccept');
    if (!termsCheckbox || !termsCheckbox.checked) {
        showErrorMessage('Vous devez accepter les conditions générales pour continuer.');
        return false;
    }
    
    // Si paiement par carte, valider le formulaire
    if (orderData.paymentMethod === 'card') {
        const paymentForm = document.getElementById('paymentForm');
        if (!paymentForm) {
            console.error('❌ Formulaire de paiement introuvable');
            return false;
        }
        
        const requiredFields = paymentForm.querySelectorAll('input[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                showFieldError(field, 'Ce champ est obligatoire');
                isValid = false;
            }
        });
        
        // Validation spécifique de la carte
        const cardNumber = document.getElementById('cardNumber');
        if (cardNumber && cardNumber.value) {
            const cardNumberClean = cardNumber.value.replace(/\s/g, '');
            if (cardNumberClean.length < 16) {
                showFieldError(cardNumber, 'Numéro de carte incomplet');
                isValid = false;
            }
        }
        
        // Validation de la date d'expiration
        const expiryDate = document.getElementById('expiryDate');
        if (expiryDate && expiryDate.value) {
            const expiryPattern = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
            if (!expiryPattern.test(expiryDate.value)) {
                showFieldError(expiryDate, 'Date d\'expiration invalide (MM/AA)');
                isValid = false;
            }
        }
        
        // Validation du CVV
        const cvv = document.getElementById('cvv');
        if (cvv && cvv.value) {
            if (cvv.value.length !== 3) {
                showFieldError(cvv, 'CVV doit contenir 3 chiffres');
                isValid = false;
            }
        }
        
        if (!isValid) {
            showErrorMessage('Veuillez corriger les erreurs dans le formulaire de paiement.');
            return false;
        }
    }
    
    console.log('✅ Étape 3 validée');
    return true;
}

/**
 * Validation d'un champ de livraison
 */
function validateDeliveryField(event) {
    const field = event.target;
    clearFieldError(field);
    
    if (field.required && !field.value.trim()) {
        showFieldError(field, 'Ce champ est obligatoire');
    }
}

/**
 * Validation d'un champ de paiement
 */
function validatePaymentField(event) {
    const field = event.target;
    clearFieldError(field);
    
    if (field.required && !field.value.trim()) {
        showFieldError(field, 'Ce champ est obligatoire');
    }
}

/**
 * Afficher une erreur sur un champ
 */
function showFieldError(field, message) {
    // Supprimer l'erreur existante
    clearFieldError(field);
    
    // Ajouter la classe d'erreur
    field.classList.add('error');
    
    // Créer le message d'erreur
    const errorElement = document.createElement('div');
    errorElement.className = 'field-error';
    errorElement.textContent = message;
    
    // Insérer le message après le champ
    field.parentNode.insertBefore(errorElement, field.nextSibling);
}

/**
 * Effacer l'erreur d'un champ
 */
function clearFieldError(field) {
    if (typeof field === 'object' && field.target) {
        field = field.target;
    }
    
    field.classList.remove('error');
    const errorElement = field.parentNode.querySelector('.field-error');
    if (errorElement) {
        errorElement.remove();
    }
}

/**
 * Afficher un message d'erreur général
 */
function showErrorMessage(message) {
    // Créer ou utiliser un container de messages
    let messageContainer = document.getElementById('errorMessageContainer');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'errorMessageContainer';
        messageContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #e74c3c;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            z-index: 9999;
            max-width: 400px;
            font-weight: 500;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(messageContainer);
    }
    
    messageContainer.textContent = message;
    messageContainer.style.display = 'block';
    
    // Masquer après 5 secondes
    setTimeout(() => {
        messageContainer.style.display = 'none';
    }, 5000);
}

// ========== SAUVEGARDE DES DONNÉES ==========

/**
 * Sauvegarder les données de l'étape actuelle
 */
function saveCurrentStepData() {
    console.log(`💾 Sauvegarde des données de l'étape ${currentStep}`);
    
    switch (currentStep) {
        case 1:
            // Les données du panier sont déjà sauvegardées
            break;
            
        case 2:
            saveDeliveryData();
            break;
            
        case 3:
            savePaymentData();
            break;
    }
}

/**
 * Sauvegarder les données de livraison
 */
function saveDeliveryData() {
    const form = document.getElementById('deliveryForm');
    if (!form) return;
    
    const formData = new FormData(form);
    orderData.customerInfo = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        phone: formData.get('phone'),
        email: formData.get('email')
    };
    
    if (orderData.deliveryMethod === 'delivery') {
        orderData.addressInfo = {
            address: formData.get('address'),
            city: formData.get('city'),
            zipCode: formData.get('zipCode'),
            instructions: formData.get('instructions')
        };
    }
    
    console.log('💾 Données de livraison sauvegardées:', orderData.customerInfo);
}

/**
 * Sauvegarder les données de paiement
 */
function savePaymentData() {
    if (orderData.paymentMethod === 'card') {
        const form = document.getElementById('paymentForm');
        if (!form) return;
        
        const formData = new FormData(form);
        // Ne pas sauvegarder les vraies données de carte (sécurité)
        orderData.paymentInfo = {
            cardLast4: formData.get('cardNumber')?.slice(-4) || '',
            cardName: formData.get('cardName')
        };
    } else {
        orderData.paymentInfo = {
            method: 'cash'
        };
    }
    
    console.log('💾 Données de paiement sauvegardées');
}

// ========== TRAITEMENT DE LA COMMANDE ==========

/**
 * Traiter et finaliser la commande
 */
async function processOrder() {
    console.log('🔄 Traitement de la commande finale...');
    
    // Vérifier si on n'est pas déjà en train de traiter
    if (isProcessing) {
        console.log('⚠️ Traitement déjà en cours...');
        return;
    }
    
    // Valider une dernière fois
    if (!validateStep3()) {
        return;
    }
    
    try {
        // Marquer comme en traitement
        isProcessing = true;
        showLoadingOverlay(true);
        
        // Sauvegarder toutes les données
        saveCurrentStepData();
        
        // Créer l'objet commande final
        const finalOrder = createFinalOrder();
        
        // Simuler le traitement (remplacer par un vrai appel API)
        await simulateOrderProcessing();
        
        // Sauvegarder la commande
        saveOrderToHistory(finalOrder);
        
        // Vider le panier
        clearCart();
        
        // Afficher le modal de succès
        showSuccessModal(finalOrder);
        
        console.log('✅ Commande traitée avec succès:', finalOrder);
        
    } catch (error) {
        console.error('❌ Erreur lors du traitement de la commande:', error);
        showErrorMessage('Erreur lors du traitement de votre commande. Veuillez réessayer.');
        
    } finally {
        isProcessing = false;
        showLoadingOverlay(false);
    }
}

/**
 * Créer l'objet commande final
 */
function createFinalOrder() {
    const orderNumber = generateOrderNumber();
    const now = new Date();
    
    return {
        orderNumber: orderNumber,
        date: now.toISOString(),
        status: 'confirmed',
        items: [...cartData],
        customer: { ...orderData.customerInfo },
        delivery: {
            method: orderData.deliveryMethod,
            address: orderData.deliveryMethod === 'delivery' ? { ...orderData.addressInfo } : null,
            estimatedTime: DELIVERY_CONFIG[orderData.deliveryMethod === 'delivery' ? 'home' : 'pickup'].time
        },
        payment: {
            method: orderData.paymentMethod,
            info: { ...orderData.paymentInfo }
        },
        totals: { ...orderData.totals },
        notes: orderData.addressInfo?.instructions || ''
    };
}

/**
 * Générer un numéro de commande unique
 */
function generateOrderNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `CMD${timestamp}${random}`;
}

/**
 * Simuler le traitement de la commande
 */
function simulateOrderProcessing() {
    return new Promise((resolve) => {
        // Simuler un délai de traitement de 2-3 secondes
        setTimeout(resolve, 2500);
    });
}

/**
 * Sauvegarder la commande dans l'historique
 */
function saveOrderToHistory(order) {
    try {
        // Récupérer l'historique existant
        let orderHistory = JSON.parse(localStorage.getItem('orderHistory')) || [];
        
        // Ajouter la nouvelle commande
        orderHistory.unshift(order);
        
        // Limiter à 50 commandes max
        if (orderHistory.length > 50) {
            orderHistory = orderHistory.slice(0, 50);
        }
        
        // Sauvegarder
        localStorage.setItem('orderHistory', JSON.stringify(orderHistory));
        
        console.log('💾 Commande sauvegardée dans l\'historique');
        
    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
    }
}

/**
 * Vider le panier
 */
function clearCart() {
    cartData = [];
    localStorage.removeItem('cart');
    console.log('🗑️ Panier vidé');
}

// ========== MODAL DE SUCCÈS ==========

/**
 * Afficher le modal de succès
 */
function showSuccessModal(order) {
    console.log('🎉 Affichage du modal de succès');
    
    const modal = document.getElementById('successModal');
    if (!modal) {
        console.error('❌ Modal de succès introuvable');
        return;
    }
    
    // Remplir les données du modal
    updateSuccessModalData(order);
    
    // Afficher le modal
    modal.style.display = 'flex';
    
    // Ajouter l'animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 100);
}

/**
 * Mettre à jour les données du modal de succès
 */
function updateSuccessModalData(order) {
    const elements = {
        orderNumber: document.getElementById('orderNumber'),
        successTotal: document.getElementById('successTotal'),
        successDelivery: document.getElementById('successDelivery'),
        successTime: document.getElementById('successTime')
    };
    
    if (elements.orderNumber) {
        elements.orderNumber.textContent = order.orderNumber;
    }
    
    if (elements.successTotal) {
        elements.successTotal.textContent = formatPrice(order.totals.total);
    }
    
    if (elements.successDelivery) {
        elements.successDelivery.textContent = DELIVERY_CONFIG[
            order.delivery.method === 'delivery' ? 'home' : 'pickup'
        ].label;
    }
    
    if (elements.successTime) {
        elements.successTime.textContent = order.delivery.estimatedTime;
    }
}

/**
 * Retourner à l'accueil
 */
function goToHome() {
    window.location.href = 'index.html';
}

/**
 * Imprimer la commande
 */
function printOrder() {
    window.print();
}

// ========== GESTION DE L'INTERFACE ==========

/**
 * Afficher/masquer l'overlay de chargement
 */
function showLoadingOverlay(show) {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = show ? 'flex' : 'none';
    }
}

/**
 * Charger la session utilisateur
 */
function loadUserSession() {
    try {
        const currentUser = localStorage.getItem('currentUser');
        if (currentUser) {
            userSession = JSON.parse(currentUser);
            console.log('👤 Session utilisateur chargée:', userSession);
        }
    } catch (error) {
        console.error('❌ Erreur lors du chargement de la session:', error);
    }
}

/**
 * Préremplir les données utilisateur
 */
function prefillUserData() {
    if (!userSession) return;
    
    console.log('📝 Préremplissage des données utilisateur...');
    
    // Préremplir le formulaire de livraison
    const fields = {
        firstName: document.getElementById('firstName'),
        lastName: document.getElementById('lastName'),
        email: document.getElementById('email'),
        phone: document.getElementById('phone')
    };
    
    if (fields.firstName && userSession.prenom) {
        fields.firstName.value = userSession.prenom;
    }
    
    if (fields.lastName && userSession.nom) {
        fields.lastName.value = userSession.nom;
    }
    
    if (fields.email && userSession.email) {
        fields.email.value = userSession.email;
    }
    
    if (fields.phone && userSession.telephone) {
        fields.phone.value = userSession.telephone;
    }
}

/**
 * Mettre à jour le récapitulatif final
 */
function updateFinalSummary() {
    console.log('📊 Mise à jour du récapitulatif final...');
    
    // Afficher la liste détaillée des articles
    const finalItemsList = document.getElementById('finalItemsList');
    if (finalItemsList && cartData.length > 0) {
        finalItemsList.innerHTML = '';
        
        cartData.forEach(item => {
            const qty = item.qty || item.quantity || 1;
            const itemElement = document.createElement('div');
            itemElement.className = 'final-item';
            itemElement.style.cssText = `
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
                font-size: 0.9rem;
            `;
            
            itemElement.innerHTML = `
                <span>${item.name} × ${qty}</span>
                <span>${formatPrice(item.price * qty)}</span>
            `;
            
            finalItemsList.appendChild(itemElement);
        });
    }
    
    // Synchroniser les totaux
    syncAllSummaries();
}

// ========== INITIALISATION AU CHARGEMENT ==========

/**
 * Démarrage automatique quand le DOM est prêt
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM chargé, initialisation du système de commande...');
    initializeCommande();
});

/**
 * Gestion de la fermeture de page
 */
window.addEventListener('beforeunload', function(e) {
    if (isProcessing) {
        e.preventDefault();
        e.returnValue = 'Une commande est en cours de traitement. Êtes-vous sûr de vouloir quitter ?';
    }
});

/**
 * Fonctions globales exportées pour l'HTML
 */
window.nextStep = nextStep;
window.previousStep = previousStep;
window.updateQuantity = updateQuantity;
window.removeCartItem = removeCartItem;
window.processOrder = processOrder;
window.goToHome = goToHome;
window.printOrder = printOrder;

console.log('🎯 Système de commande chargé et prêt !');
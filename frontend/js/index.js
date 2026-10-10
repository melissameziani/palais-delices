/**
 * Scripts pour la page d'accueil - Le Palais des Délices
 * Gère l'authentification, le carrousel, les modals et la navigation
 */

// ========== VARIABLES GLOBALES ==========

let currentUser = null;
let users = JSON.parse(localStorage.getItem('users')) || [];

// ========== GESTION DU CARROUSEL (VERSION SIMPLE) ==========

let currentSlideIndex = 1;
let slideInterval;

// Fonction pour changer de slide
function changeSlide(n) {
    showSlide(currentSlideIndex += n);
    resetAutoSlide();
}

// Fonction pour aller à un slide spécifique
function currentSlide(n) {
    showSlide(currentSlideIndex = n);
    resetAutoSlide();
}

// Fonction pour afficher le slide
function showSlide(n) {
    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    
    if (n > slides.length) { currentSlideIndex = 1; }
    if (n < 1) { currentSlideIndex = slides.length; }
    
    // Masquer tous les slides
    slides.forEach(slide => slide.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));
    
    // Afficher le slide actuel
    if (slides[currentSlideIndex - 1]) {
        slides[currentSlideIndex - 1].classList.add('active');
    }
    if (dots[currentSlideIndex - 1]) {
        dots[currentSlideIndex - 1].classList.add('active');
    }
}

// Défilement automatique
function autoSlide() {
    currentSlideIndex++;
    if (currentSlideIndex > 3) currentSlideIndex = 1;
    showSlide(currentSlideIndex);
}

// Réinitialiser le défilement automatique
function resetAutoSlide() {
    clearInterval(slideInterval);
    slideInterval = setInterval(autoSlide, 5000);
}

// Initialiser le carrousel
function initializeCarousel() {
    // Démarrer le défilement automatique
    slideInterval = setInterval(autoSlide, 5000);
    
    // Pause au survol
    const carouselContainer = document.querySelector('.carousel-container');
    if (carouselContainer) {
        carouselContainer.addEventListener('mouseenter', () => {
            clearInterval(slideInterval);
        });
        
        carouselContainer.addEventListener('mouseleave', () => {
            resetAutoSlide();
        });
    }
}

// ========== GESTION DE LA NAVIGATION MOBILE ==========

/**
 * Toggle du menu mobile burger
 */
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile');
    const burgerMenu = document.querySelector('.burger-menu');
    
    if (mobileMenu && burgerMenu) {
        mobileMenu.classList.toggle('active');
        burgerMenu.classList.toggle('active');
    }
}

/**
 * Gestion des dropdowns de réservation
 */
function showReservationDropdown() {
    const dropdown = document.getElementById('dropdown-reservation');
    if (dropdown) {
        dropdown.style.display = 'block';
    }
}

function hideReservationDropdown() {
    const dropdown = document.getElementById('dropdown-reservation');
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

function toggleReservationDropdown(event) {
    event.preventDefault();
    const dropdown = document.getElementById('dropdown-reservation');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

// Gestion du dropdown Accueil
function showAccueilDropdown() {
    const menu = document.getElementById("dropdown-accueil");
    if (menu) {
        menu.style.display = "block";
    }
}

function hideAccueilDropdown() {
    const menu = document.getElementById("dropdown-accueil");
    if (menu) {
        menu.style.display = "none";
    }
}

function toggleAccueilDropdown(event) {
    event.preventDefault();
    const menu = document.getElementById("dropdown-accueil");
    if (menu) {
        if (menu.style.display === "block") {
            menu.style.display = "none";
        } else {
            menu.style.display = "block";
        }
    }
}

// ========== FONCTIONS D'AUTHENTIFICATION ==========

/**
 * Bascule entre les onglets de connexion et d'inscription
 */
function switchTab(tabName) {
    // Gérer les onglets
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active'));
    
    // Activer l'onglet sélectionné
    event.target.classList.add('active');
    document.getElementById(tabName + 'Form').classList.add('active');
    
    // Nettoyer les erreurs
    clearAllFormErrors();
    hideMessage();
}

/**
 * Ferme le modal d'authentification
 */
function closeModal() {
    document.getElementById('authModal').style.display = 'none';
    clearAllFormErrors();
    hideMessage();
}

/**
 * Ouvre le modal d'authentification
 */
function openModal(type = 'login') {
    document.getElementById('authModal').style.display = 'block';
    switchTab(type);
}

/**
 * Affiche un message
 */
function showMessage(message, type = 'error') {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        // Auto-masquer les messages de succès après 3 secondes
        if (type === 'success') {
            setTimeout(() => {
                hideMessage();
            }, 3000);
        }
    }
}

/**
 * Masque le message
 */
function hideMessage() {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}

/**
 * Nettoie toutes les erreurs de formulaire
 */
function clearAllFormErrors() {
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
    });
    document.querySelectorAll('.error-message').forEach(error => {
        error.style.display = 'none';
    });
}

/**
 * Vérifie la force du mot de passe
 */
function checkPasswordStrength() {
    const password = document.getElementById('password');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (!password || !strengthFill || !strengthText) return false;
    
    const passwordValue = password.value;
    let strength = 0;
    let message = '';
    
    // Critères de validation
    const criteria = {
        length: passwordValue.length >= 8,
        lowercase: /[a-z]/.test(passwordValue),
        uppercase: /[A-Z]/.test(passwordValue),
        number: /\d/.test(passwordValue),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(passwordValue)
    };
    
    // Calculer la force
    strength = Object.values(criteria).filter(Boolean).length;
    
    // Mettre à jour l'affichage
    strengthFill.className = 'strength-fill';
    strengthText.className = 'strength-text';
    
    if (passwordValue.length === 0) {
        message = 'Minimum 8 caractères, majuscule, chiffre et caractère spécial';
        strengthFill.style.width = '0%';
    } else if (strength <= 2) {
        strengthFill.classList.add('weak');
        strengthText.classList.add('weak');
        message = 'Mot de passe faible';
    } else if (strength === 3) {
        strengthFill.classList.add('fair');
        strengthText.classList.add('fair');
        message = 'Mot de passe moyen';
    } else if (strength === 4) {
        strengthFill.classList.add('good');
        strengthText.classList.add('good');
        message = 'Bon mot de passe';
    } else {
        strengthFill.classList.add('strong');
        strengthText.classList.add('strong');
        message = 'Mot de passe excellent';
    }
    
    strengthText.textContent = message;
    
    // Activer/désactiver le bouton d'inscription
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.disabled = strength < 3;
    }
    
    return strength >= 3;
}

/**
 * Vérifie la correspondance des mots de passe
 */
function checkPasswordMatch() {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    
    if (!password || !confirmPassword) return false;
    
    const confirmGroup = confirmPassword.closest('.form-group');
    
    if (confirmPassword.value === '') {
        return;
    }
    
    if (password.value !== confirmPassword.value) {
        confirmGroup.classList.add('error');
        const errorMsg = confirmGroup.querySelector('.error-message');
        if (errorMsg) {
            errorMsg.textContent = 'Les mots de passe ne correspondent pas';
            errorMsg.style.display = 'block';
        }
        return false;
    } else {
        confirmGroup.classList.remove('error');
        const errorMsg = confirmGroup.querySelector('.error-message');
        if (errorMsg) {
            errorMsg.style.display = 'none';
        }
        return true;
    }
}

/**
 * Gestion de l'inscription avec API
 */
async function handleRegister(event) {
    event.preventDefault();
    
    // Validation du formulaire
    if (!validateRegistrationForm()) {
        return;
    }
    
    // Récupérer les données du formulaire
    const formData = new FormData(event.target);
    const userData = {
        prenom: formData.get('prenom'),
        nom: formData.get('nom'),
        email: formData.get('email'),
        telephone: formData.get('telephone'),
        password: formData.get('password'),
    };
    
    try {
        showMessage('Création du compte en cours...', 'info');
        
        // Appeler l'API d'inscription
        const result = await authService.register(userData);
        
        if (result.success) {
            showMessage('Compte créé avec succès ! Vous êtes maintenant connecté.', 'success');
            updateUIForLoggedInUser();
            setTimeout(() => {
                closeModal();
            }, 2000);
        }
        
    } catch (error) {
        console.error('Erreur inscription:', error);
        showMessage(error.message || 'Erreur lors de l\'inscription', 'error');
    }
}

/**
 * Gestion de la connexion avec API
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const credentials = {
        email: formData.get('email'),
        password: formData.get('password')
    };
    
    try {
        showMessage('Connexion en cours...', 'info');
        
        // Appeler l'API de connexion
        const result = await authService.login(credentials);
        
        if (result.success) {
            showMessage('Connexion réussie !', 'success');
            updateUIForLoggedInUser();
            setTimeout(() => {
                closeModal();
            }, 1500);
        }
        
    } catch (error) {
        console.error('Erreur connexion:', error);
        showMessage(error.message || 'Erreur lors de la connexion', 'error');
    }
}

/**
 * Validation du formulaire d'inscription
 */
function validateRegistrationForm() {
    let isValid = true;
    
    // Vérifier la force du mot de passe
    if (!checkPasswordStrength()) {
        showFieldError('password', 'Le mot de passe n\'est pas assez fort');
        isValid = false;
    }
    
    // Vérifier la correspondance des mots de passe
    if (!checkPasswordMatch()) {
        isValid = false;
    }
    
    return isValid;
}

/**
 * Affiche une erreur sur un champ spécifique
 */
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
        const group = field.closest('.form-group');
        const errorMsg = group.querySelector('.error-message');
        
        group.classList.add('error');
        if (errorMsg) {
            errorMsg.textContent = message;
            errorMsg.style.display = 'block';
        }
    }
}

/**
 * Met à jour l'interface pour un utilisateur connecté
 */
function updateUIForLoggedInUser() {
    // Mettre à jour le bouton de navigation
    const authItem = document.querySelector('.auth-item a');
    if (authItem && authService.isAuthenticated()) {
        const user = authService.getCurrentUser();
        authItem.textContent = `Bonjour ${user.prenom}`;
        authItem.onclick = () => logout();
    }
}

/**
 * Déconnexion
 */
async function logout() {
    try {
        await authService.logout();
        
        // Réinitialiser l'interface
        const authItem = document.querySelector('.auth-item a');
        if (authItem) {
            authItem.textContent = 'Connexion';
            authItem.onclick = () => openModal('login');
        }
        
        showMessage('Déconnexion réussie', 'success');
        
    } catch (error) {
        console.error('Erreur déconnexion:', error);
    }
}

// ========== INITIALISATION ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page d\'accueil initialisée');
    
    // Vérifier si l'utilisateur est déjà connecté
    if (authService.isAuthenticated()) {
        updateUIForLoggedInUser();
    }
    
    // Gestion du menu mobile
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
    }
    
    // Fermer le modal en cliquant à l'extérieur
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('authModal');
        if (event.target === modal) {
            closeModal();
        }
    });
});

console.log('✅ Fonctions d\'authentification chargées');
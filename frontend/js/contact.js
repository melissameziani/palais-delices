/**
 * Scripts pour la page de contact - Le Palais des Délices
 * Gère la validation du formulaire et l'envoi des messages
 */

// ========== VARIABLES GLOBALES ==========

const contactForm = document.getElementById('contactForm');
const confirmationModal = document.getElementById('confirmationModal');

// ========== VALIDATION DU FORMULAIRE ==========

/**
 * Valide un champ spécifique
 */
function validateField(field) {
    const formGroup = field.closest('.form-group');
    const errorMessage = formGroup.querySelector('.error-message');
    let isValid = true;
    let message = '';

    // Réinitialiser l'état d'erreur
    formGroup.classList.remove('error');
    errorMessage.style.display = 'none';

    // Validation selon le type de champ
    switch (field.type) {
        case 'text':
            if (field.required && field.value.trim() === '') {
                isValid = false;
                message = 'Ce champ est requis';
            } else if (field.value.trim().length < 2) {
                isValid = false;
                message = 'Minimum 2 caractères requis';
            }
            break;

        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (field.required && field.value.trim() === '') {
                isValid = false;
                message = 'L\'email est requis';
            } else if (field.value.trim() !== '' && !emailRegex.test(field.value)) {
                isValid = false;
                message = 'Format d\'email invalide';
            }
            break;

        case 'tel':
            const phoneRegex = /^(\+213|0)[5-7][0-9]{8}$/;
            if (field.value.trim() !== '' && !phoneRegex.test(field.value.replace(/\s/g, ''))) {
                isValid = false;
                message = 'Format de téléphone invalide (+213XXXXXXXXX)';
            }
            break;

        case 'select-one':
            if (field.required && field.value === '') {
                isValid = false;
                message = 'Veuillez sélectionner une option';
            }
            break;

        case 'textarea':
            if (field.required && field.value.trim() === '') {
                isValid = false;
                message = 'Ce champ est requis';
            } else if (field.value.trim().length < 10) {
                isValid = false;
                message = 'Minimum 10 caractères requis';
            }
            break;
    }

    // Afficher l'erreur si nécessaire
    if (!isValid) {
        formGroup.classList.add('error');
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
    }

    return isValid;
}

/**
 * Valide tout le formulaire
 */
function validateForm() {
    const fields = contactForm.querySelectorAll('input, select, textarea');
    let isFormValid = true;

    fields.forEach(field => {
        if (!validateField(field)) {
            isFormValid = false;
        }
    });

    return isFormValid;
}

/**
 * Configuration de la validation en temps réel
 */
function setupFormValidation() {
    const fields = contactForm.querySelectorAll('input, select, textarea');

    fields.forEach(field => {
        // Validation sur la perte de focus
        field.addEventListener('blur', () => {
            validateField(field);
        });

        // Supprimer l'erreur quand l'utilisateur commence à taper
        field.addEventListener('input', () => {
            const formGroup = field.closest('.form-group');
            if (formGroup.classList.contains('error')) {
                formGroup.classList.remove('error');
                formGroup.querySelector('.error-message').style.display = 'none';
            }
        });
    });

    // Formatage automatique du numéro de téléphone
    const phoneField = document.getElementById('phone');
    if (phoneField) {
        phoneField.addEventListener('input', formatPhoneNumber);
    }
}

/**
 * Formate automatiquement le numéro de téléphone
 */
function formatPhoneNumber(event) {
    let value = event.target.value.replace(/\D/g, '');
    
    if (value.startsWith('213')) {
        value = '+' + value;
    } else if (value.startsWith('0')) {
        // Garder le format national
    } else if (value.length > 0) {
        value = '0' + value;
    }

    // Limiter à 13 caractères pour +213XXXXXXXXX
    if (value.startsWith('+213')) {
        value = value.substring(0, 13);
        // Ajouter des espaces pour la lisibilité
        value = value.replace(/(\+213)(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    } else {
        value = value.substring(0, 10);
        // Format national avec espaces
        value = value.replace(/(\d{4})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    }

    event.target.value = value;
}

// ========== GESTION DU FORMULAIRE ==========

/**
 * Gère la soumission du formulaire
 */
function handleFormSubmit(event) {
    event.preventDefault();

    // Valider le formulaire
    if (!validateForm()) {
        // Faire défiler vers la première erreur
        const firstError = contactForm.querySelector('.form-group.error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    // Collecter les données du formulaire
    const formData = new FormData(contactForm);
    const data = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        timestamp: new Date().toISOString()
    };

    // Simuler l'envoi (à remplacer par votre logique backend)
    sendContactMessage(data);
}

/**
 * Simule l'envoi du message de contact
 */
function sendContactMessage(data) {
    // Afficher un état de chargement
    const submitBtn = contactForm.querySelector('.submit-btn');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
    submitBtn.disabled = true;

    // Simuler un délai d'envoi
    setTimeout(() => {
        // Sauvegarder le message localement (en attendant le backend)
        saveMessageLocally(data);
        
        // Réinitialiser le bouton
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        // Réinitialiser le formulaire
        contactForm.reset();
        
        // Afficher la confirmation
        showConfirmationModal();
        
        console.log('Message de contact envoyé:', data);
    }, 2000);
}

/**
 * Sauvegarde le message localement
 */
function saveMessageLocally(data) {
    const messages = JSON.parse(localStorage.getItem('contactMessages') || '[]');
    messages.push(data);
    localStorage.setItem('contactMessages', JSON.stringify(messages));
}

/**
 * Affiche le modal de confirmation
 */
function showConfirmationModal() {
    confirmationModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

/**
 * Ferme le modal de confirmation
 */
function closeConfirmationModal() {
    confirmationModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// ========== FONCTIONS DE NAVIGATION ==========

/**
 * Fonctions de navigation héritées de index.js
 */
function showAccueilDropdown() {
    const dropdown = document.getElementById('dropdown-accueil');
    if (dropdown) dropdown.style.display = 'block';
}

function hideAccueilDropdown() {
    const dropdown = document.getElementById('dropdown-accueil');
    if (dropdown) dropdown.style.display = 'none';
}

function toggleAccueilDropdown(event) {
    event.preventDefault();
    const dropdown = document.getElementById('dropdown-accueil');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

function showReservationDropdown() {
    const dropdown = document.getElementById('dropdown-reservation');
    if (dropdown) dropdown.style.display = 'block';
}

function hideReservationDropdown() {
    const dropdown = document.getElementById('dropdown-reservation');
    if (dropdown) dropdown.style.display = 'none';
}

function toggleReservationDropdown(event) {
    event.preventDefault();
    const dropdown = document.getElementById('dropdown-reservation');
    if (dropdown) {
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
}

function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobile');
    const burgerMenu = document.querySelector('.burger-menu');
    
    if (mobileMenu && burgerMenu) {
        mobileMenu.classList.toggle('active');
        burgerMenu.classList.toggle('active');
    }
}

function openModal(type) {
    // Rediriger vers la page d'accueil pour l'authentification
    window.location.href = `index.html#${type}`;
}

// ========== INITIALISATION ==========

/**
 * Initialise la page de contact
 */
function initializeContactPage() {
    // Configuration de la validation du formulaire
    if (contactForm) {
        setupFormValidation();
        contactForm.addEventListener('submit', handleFormSubmit);
    }

    // Fermer le modal en cliquant à l'extérieur
    if (confirmationModal) {
        confirmationModal.addEventListener('click', function(event) {
            if (event.target === this) {
                closeConfirmationModal();
            }
        });
    }

    // Masquer les dropdowns au chargement
    const dropdowns = ['dropdown-accueil', 'dropdown-reservation'];
    dropdowns.forEach(id => {
        const dropdown = document.getElementById(id);
        if (dropdown) dropdown.style.display = 'none';
    });

    // Fermer les dropdowns en cliquant ailleurs
    document.addEventListener('click', function(event) {
        const accueilDropdown = document.getElementById('dropdown-accueil');
        const reservationDropdown = document.getElementById('dropdown-reservation');
        const dropdownButtons = event.target.closest('.dropdown');

        if (!dropdownButtons) {
            if (accueilDropdown) accueilDropdown.style.display = 'none';
            if (reservationDropdown) reservationDropdown.style.display = 'none';
        }
    });

    console.log('Page de contact initialisée');
}

// Initialiser au chargement du DOM
document.addEventListener('DOMContentLoaded', initializeContactPage);

// Exposer les fonctions globalement pour les appels inline
window.showAccueilDropdown = showAccueilDropdown;
window.hideAccueilDropdown = hideAccueilDropdown;
window.toggleAccueilDropdown = toggleAccueilDropdown;
window.showReservationDropdown = showReservationDropdown;
window.hideReservationDropdown = hideReservationDropdown;
window.toggleReservationDropdown = toggleReservationDropdown;
window.toggleMobileMenu = toggleMobileMenu;
window.openModal = openModal;
window.closeConfirmationModal = closeConfirmationModal;
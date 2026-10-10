/**
 * Scripts pour la page de réservation - Le Palais des Délices
 * Gère la réservation de tables, la validation et les confirmations
 */

// ========== VARIABLES GLOBALES ==========

let existingReservations = [];
let tables = [
    { id: 1, capacity: 2, available: true },
    { id: 2, capacity: 2, available: true },
    { id: 3, capacity: 4, available: true },
    { id: 4, capacity: 4, available: true },
    { id: 5, capacity: 6, available: true },
    { id: 6, capacity: 6, available: true },
    { id: 7, capacity: 8, available: true },
    { id: 8, capacity: 8, available: true }
];

const openingHour = 6;
const closingHour = 24;

// ========== GESTION DES RÉSERVATIONS ==========

/**
 * Récupère les réservations existantes pour une date donnée
 */
async function fetchReservations(date) {
    try {
        const response = await fetch(`https://exemple.com/api/reservations?date=${date}`);
        if (!response.ok) throw new Error("Erreur de réponse API");
        existingReservations = await response.json();
        updateTablesAvailability();
    } catch (error) {
        console.error("Erreur lors de la récupération des réservations :", error);
        // En cas d'erreur API, continuer avec les réservations locales
        existingReservations = JSON.parse(localStorage.getItem('reservations') || '[]');
        updateTablesAvailability();
    }
}

/**
 * Met à jour la disponibilité des tables
 */
function updateTablesAvailability() {
    const dateInput = document.getElementById('reservationDate');
    const startTimeSelect = document.getElementById('startTime');
    const durationSelect = document.getElementById('duration');
    const tablesSelect = document.getElementById('tablesSelect');
    const tableHint = document.getElementById("tableHint");
    const noTablesMessage = document.getElementById("noTablesMessage");

    if (!dateInput || !startTimeSelect || !durationSelect || !tablesSelect) {
        console.error('Éléments du formulaire introuvables');
        return;
    }

    const date = dateInput.value;
    const startHour = parseFloat(startTimeSelect.value);
    const duration = parseFloat(durationSelect.value);

    // Réinitialiser les messages
    tableHint.style.display = "none";
    noTablesMessage.style.display = "none";

    // Vérifier si tous les champs requis sont remplis
    if (!date || isNaN(startHour) || isNaN(duration)) {
        tableHint.style.display = "block";
        tablesSelect.innerHTML = '';
        return;
    }

    const endHour = startHour + duration;
    tablesSelect.innerHTML = '';
    let tablesAvailable = 0;

    // Générer les options de tables
    tables.forEach(table => {
        const option = document.createElement('option');
        option.value = table.id;
        option.textContent = `Table ${table.id} (${table.capacity} personnes)`;

        // Vérifier si la table est réservée pour ce créneau
        const isReserved = existingReservations.some(res =>
            res.tableIds.includes(table.id) &&
            res.date === date &&
            (
                (startHour >= res.start && startHour < res.end) ||
                (endHour > res.start && endHour <= res.end) ||
                (startHour <= res.start && endHour >= res.end)
            )
        );

        if (isReserved) {
            option.disabled = true;
            option.classList.add('unavailable');
            option.textContent += ' - Non disponible';
        } else {
            option.classList.add('available');
            tablesAvailable++;
        }

        tablesSelect.appendChild(option);
    });

    // Afficher le message si aucune table n'est disponible
    if (tablesAvailable === 0) {
        noTablesMessage.style.display = "block";
    }
}

/**
 * Sauvegarde une réservation localement
 */
function saveReservationLocally(reservationData) {
    const reservations = JSON.parse(localStorage.getItem('reservations') || '[]');
    
    const reservation = {
        id: Date.now(),
        name: reservationData.name,
        phone: reservationData.phone,
        email: reservationData.email,
        date: reservationData.date,
        start: reservationData.startTime,
        end: reservationData.startTime + reservationData.duration,
        duration: reservationData.duration,
        tableIds: reservationData.tables.map(id => parseInt(id)),
        createdAt: new Date().toISOString()
    };

    reservations.push(reservation);
    localStorage.setItem('reservations', JSON.stringify(reservations));
    console.log('Réservation sauvegardée:', reservation);
}

/**
 * NOUVELLE VERSION - Utilise l'API Django
 */
async function fetchAvailableTables(date, time, guests) {
    try {
        const response = await reservationService.getAvailableTables(date, time, guests);
        return response.tables_disponibles || [];
    } catch (error) {
        console.error('❌ Erreur API réservation:', error);
        // Utiliser votre logique statique existante
        return generateStaticTables();
    }
}

/**
 * CORRECTION - Créer une réservation via l'API Django
 */
async function createReservationAPI(reservationData) {
    try {
        // ✅ CORRECTION: Utiliser le bon endpoint et format
        const response = await fetch(API_CONFIG.BASE_URL + '/restaurant/reservations/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}`, // Fonction à implémenter
            },
            body: JSON.stringify({
                dateReservation: reservationData.date,
                heureReservation: reservationData.time,
                nbPersonnes: reservationData.guests,
                table: reservationData.tableId,
                commentaire: reservationData.specialRequests || ''
            })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Réservation créée:', result.id);
            return {
                success: true,
                reservationId: result.id,
                reservation: result
            };
        } else {
            throw new Error(result.error || 'Erreur lors de la réservation');
        }
        
    } catch (error) {
        console.error('❌ Erreur création réservation:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Modifier la fonction de recherche existante
 */
async function searchTables() {
    if (!validateForm()) return;
    
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const guests = parseInt(document.getElementById('guests').value);
    
    showLoadingSpinner(true);
    
    try {
        // Utiliser la nouvelle fonction API
        const availableTables = await fetchAvailableTables(date, time, guests);
        
        if (availableTables.length > 0) {
            displayTables(availableTables);
            showTablesSection();
        } else {
            showNoTablesMessage();
        }
        
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        showErrorMessage('Erreur lors de la recherche des tables disponibles');
    } finally {
        showLoadingSpinner(false);
    }
}

/**
 * Modifier la fonction de confirmation
 */
async function confirmReservation() {
    if (!selectedTable || isProcessing) return;
    
    isProcessing = true;
    showLoadingSpinner(true);
    
    try {
        const reservationData = {
            date: document.getElementById('date').value,
            time: document.getElementById('time').value,
            guests: parseInt(document.getElementById('guests').value),
            tableId: selectedTable.id,
            specialRequests: document.getElementById('special-requests').value
        };
        
        // Essayer l'API Django d'abord
        const apiResult = await createReservationAPI(reservationData);
        
        if (apiResult.success) {
            // Succès API
            const reservation = {
                ...reservationData,
                id: apiResult.reservationId,
                status: 'confirmed',
                createdAt: new Date().toISOString()
            };
            
            showSuccessModal(reservation);
        } else {
            // Fallback vers localStorage si API échoue
            console.log('🔄 Fallback vers localStorage');
            const localReservation = saveToLocalStorage(reservationData);
            showSuccessModal(localReservation);
        }
        
    } catch (error) {
        console.error('❌ Erreur complète:', error);
        showErrorMessage('Erreur lors de la réservation. Veuillez réessayer.');
    } finally {
        isProcessing = false;
        showLoadingSpinner(false);
    }
}

// ========== VALIDATION DU FORMULAIRE ==========

/**
 * Valide le formulaire de réservation
 */
function validateReservationForm() {
    const name = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phoneNumber").value.trim();
    const email = document.getElementById("emailAddress").value.trim();
    const tablesSelect = document.getElementById('tablesSelect');

    // Validation des champs obligatoires
    if (!name || !phone || !email) {
        alert("Tous les champs doivent être remplis.");
        return false;
    }

    // Validation du téléphone (format algérien)
    if (!/^0[5-7][0-9]{8}$/.test(phone)) {
        alert("Le numéro de téléphone doit être au format algérien (10 chiffres commençant par 0).");
        return false;
    }

    // Validation de l'email (Gmail uniquement)
    if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
        alert("Veuillez entrer une adresse Gmail valide.");
        return false;
    }

    // Validation de la sélection de tables
    const selectedTables = Array.from(tablesSelect.selectedOptions)
        .map(option => option.value)
        .filter(value => value && !tablesSelect.querySelector(`option[value="${value}"]`).disabled);

    if (selectedTables.length === 0) {
        alert('Veuillez sélectionner au moins une table disponible');
        return false;
    }

    return true;
}

/**
 * Configuration de la validation en temps réel
 */
function setupRealTimeValidation() {
    const phoneInput = document.getElementById("phoneNumber");
    const emailInput = document.getElementById("emailAddress");
    const phoneFeedback = document.getElementById("phoneFeedback");
    const emailFeedback = document.getElementById("emailFeedback");

    // Validation du téléphone en temps réel
    if (phoneInput && phoneFeedback) {
        phoneInput.addEventListener("input", function () {
            const phoneValue = phoneInput.value.trim();

            if (/^0[5-7][0-9]{8}$/.test(phoneValue)) {
                phoneFeedback.textContent = "Numéro valide ✅";
                phoneFeedback.className = "feedback-message valid";
            } else {
                phoneFeedback.textContent = "Format attendu : 10 chiffres commençant par 0 (ex: 0673997520)";
                phoneFeedback.className = "feedback-message invalid";
            }
        });
    }

    // Validation de l'email en temps réel
    if (emailInput && emailFeedback) {
        emailInput.addEventListener("input", function () {
            const emailValue = emailInput.value.trim();
            if (/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(emailValue)) {
                emailFeedback.textContent = "Adresse email valide ✅";
                emailFeedback.className = "feedback-message valid";
            } else {
                emailFeedback.textContent = "Veuillez entrer une adresse Gmail valide (ex: nom@gmail.com)";
                emailFeedback.className = "feedback-message invalid";
            }
        });
    }
}

// ========== GESTION DES MODALS ==========

/**
 * Affiche le récapitulatif de réservation
 */
function showReservationSummary(reservationData) {
    const recapText = `
        <b>Nom :</b> ${reservationData.name}<br>
        <b>Téléphone :</b> ${reservationData.phone}<br>
        <b>Email :</b> ${reservationData.email}<br>
        <b>Date :</b> ${reservationData.date}<br>
        <b>Heure :</b> ${reservationData.startTime}:00 pour ${reservationData.duration}h<br>
        <b>Tables :</b> ${reservationData.tables.join(', ')}
    `;

    document.getElementById("recapText").innerHTML = recapText;
    document.getElementById("recapOverlay").style.display = "flex";
}

/**
 * Confirme la réservation
 */
function confirmReservation() {
    const reservationData = window.pendingReservation;
    
    if (!reservationData) {
        console.error('Aucune réservation en attente');
        return;
    }

    // Sauvegarder la réservation
    saveReservationLocally(reservationData);

    // Fermer le récapitulatif
    document.getElementById("recapOverlay").style.display = "none";

    // Afficher la confirmation
    const confirmationText = `
        <b>Nom :</b> ${reservationData.name}<br>
        <b>Téléphone :</b> ${reservationData.phone}<br>
        <b>Email :</b> ${reservationData.email}<br>
        <b>Date :</b> ${reservationData.date}<br>
        <b>Heure :</b> ${reservationData.startTime}:00 pour ${reservationData.duration}h<br>
        <b>Tables :</b> ${reservationData.tables.join(', ')}<br><br>
        ✅ Une confirmation vous sera envoyée par SMS ou Email.
    `;

    document.getElementById("confirmationText").innerHTML = confirmationText;
    document.getElementById("confirmationOverlay").style.display = "flex";

    // Réinitialiser le formulaire
    resetReservationForm();

    // Nettoyer la réservation en attente
    delete window.pendingReservation;
}

/**
 * Annule la réservation
 */
function cancelReservation() {
    document.getElementById("recapOverlay").style.display = "none";

    // Créer et afficher le modal d'annulation
    showCancellationModal();

    // Réinitialiser le formulaire
    resetReservationForm();

    // Nettoyer la réservation en attente
    delete window.pendingReservation;
}

/**
 * Affiche le modal d'annulation
 */
function showCancellationModal() {
    // Création de l'overlay d'annulation
    const annulationOverlay = document.createElement('div');
    annulationOverlay.className = 'overlay';
    annulationOverlay.style.display = 'flex';

    // Création de la boîte d'annulation
    const annulationBox = document.createElement('div');
    annulationBox.className = 'annulation-box';

    // Contenu du modal
    annulationBox.innerHTML = `
        <div class="annulation-icon">❌</div>
        <h2>Réservation annulée</h2>
        <p>Revenez quand vous voulez 😊</p>
        <button onclick="closeCancellationModal()">Fermer</button>
    `;

    annulationOverlay.appendChild(annulationBox);
    document.body.appendChild(annulationOverlay);

    // Stocker la référence pour pouvoir la fermer
    annulationOverlay.id = 'cancellationOverlay';

    // Fermeture automatique après 5 secondes
    setTimeout(() => {
        closeCancellationModal();
    }, 5000);
}

/**
 * Ferme le modal d'annulation
 */
function closeCancellationModal() {
    const overlay = document.getElementById('cancellationOverlay');
    if (overlay && overlay.parentNode) {
        document.body.removeChild(overlay);
    }
}

/**
 * Ferme le modal de confirmation
 */
function closeConfirmation() {
    document.getElementById("confirmationOverlay").style.display = "none";
    delete window.pendingReservation;
}

/**
 * Réinitialise le formulaire de réservation
 */
function resetReservationForm() {
    document.getElementById("reservationForm").reset();
    document.getElementById('tablesSelect').innerHTML = '';
    document.getElementById("tableHint").style.display = "block";
    document.getElementById("noTablesMessage").style.display = "none";
}

// ========== GESTION DU FORMULAIRE ==========

/**
 * Gère la soumission du formulaire
 */
function handleReservationSubmit(event) {
    event.preventDefault();

    // ✅ NOUVEAU: Vérifier l'authentification
    if (!isUserAuthenticated()) {
        showMessage('Vous devez être connecté pour faire une réservation.', 'error');
        openModal('login');
        return;
    }

    // Valider le formulaire
    if (!validateReservationForm()) {
        return;
    }

    // Collecter les données
    const name = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phoneNumber").value.trim();
    const email = document.getElementById("emailAddress").value.trim();
    const dateInput = document.getElementById('reservationDate');
    const startTimeSelect = document.getElementById('startTime');
    const durationSelect = document.getElementById('duration');
    const tablesSelect = document.getElementById('tablesSelect');

    const selectedTables = Array.from(tablesSelect.selectedOptions)
        .map(option => option.value)
        .filter(value => value && !tablesSelect.querySelector(`option[value="${value}"]`).disabled);

    const reservationData = {
        name: name,
        phone: phone,
        email: email,
        date: dateInput.value,
        startTime: parseInt(startTimeSelect.value),
        duration: parseInt(durationSelect.value),
        tables: selectedTables
    };

    // Stocker temporairement la réservation
    window.pendingReservation = reservationData;

    // Afficher le récapitulatif
    showReservationSummary(reservationData);
}

/**
 * Configuration de la sélection multiple des tables
 */
function setupTableSelection() {
    const tablesSelect = document.getElementById('tablesSelect');
    
    if (!tablesSelect) return;

    // Permettre la sélection multiple personnalisée
    tablesSelect.addEventListener('mousedown', function(e) {
        e.preventDefault();
        const option = e.target;
        if (option.tagName === 'OPTION') {
            if (option.disabled) return;
            option.selected = !option.selected;
            const event = new Event('change');
            tablesSelect.dispatchEvent(event);
        }
    });

    // Logger les tables sélectionnées
    tablesSelect.addEventListener('change', function() {
        const selectedOptions = Array.from(this.selectedOptions)
            .filter(opt => opt.value && !opt.disabled);
        console.log('Tables sélectionnées:', selectedOptions.map(opt => opt.value));
    });
}

// ========== INITIALISATION ==========

/**
 * Initialise la page de réservation
 */
function initializeReservationPage() {
    // Configuration des dates
    const dateInput = document.getElementById('reservationDate');
    if (dateInput) {
        const today = new Date();
        dateInput.min = today.toISOString().split('T')[0];
        const maxDate = new Date(today);
        maxDate.setDate(today.getDate() + 30);
        dateInput.max = maxDate.toISOString().split('T')[0];

        // Écouteur pour charger les réservations existantes
        dateInput.addEventListener('change', function () {
            fetchReservations(dateInput.value);
        });
    }

    // Configuration des heures
    const startTimeSelect = document.getElementById('startTime');
    if (startTimeSelect) {
        for (let hour = openingHour; hour < closingHour; hour++) {
            const option = document.createElement('option');
            option.value = hour;
            option.textContent = `${hour}:00`;
            startTimeSelect.appendChild(option);
        }
    }

    // Configuration des écouteurs d'événements
    const durationSelect = document.getElementById('duration');
    if (startTimeSelect && durationSelect) {
        startTimeSelect.addEventListener('change', updateTablesAvailability);
        durationSelect.addEventListener('change', updateTablesAvailability);
    }

    // Configuration du formulaire
    const reservationForm = document.getElementById('reservationForm');
    if (reservationForm) {
        reservationForm.addEventListener('submit', handleReservationSubmit);
    }

    // Configuration de la sélection des tables
    setupTableSelection();

    // Configuration de la validation en temps réel
    setupRealTimeValidation();

    // Configuration des boutons de confirmation
    document.addEventListener('click', function(e) {
        if (e.target.id === 'confirmBtn') {
            confirmReservation();
        }
    });

    console.log('Page de réservation initialisée');
}

// ========== FONCTIONS DE NAVIGATION ==========

/**
 * Fonctions de navigation (héritées pour la compatibilité)
 */
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

function showReservationDropdown() {
    const menu = document.getElementById("dropdown-reservation");
    if (menu) {
        menu.style.display = "block";
    }
}

function hideReservationDropdown() {
    const menu = document.getElementById("dropdown-reservation");
    if (menu) {
        menu.style.display = "none";
    }
}

function toggleReservationDropdown(event) {
    event.preventDefault();
    const menu = document.getElementById("dropdown-reservation");
    if (menu) {
        if (menu.style.display === "block") {
            menu.style.display = "none";
        } else {
            menu.style.display = "block";
        }
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
    // Redirection vers la page d'accueil pour l'authentification
    window.location.href = `index.html#${type}`;
}

// ========== FERMETURE DES DROPDOWNS ==========

/**
 * Ferme les dropdowns en cliquant ailleurs
 */
function setupDropdownClosing() {
    document.addEventListener('click', function(event) {
        const accueilDropdown = document.getElementById('dropdown-accueil');
        const reservationDropdown = document.getElementById('dropdown-reservation');
        const dropdownButton = event.target.closest('.dropdown');

        if (!dropdownButton) {
            if (accueilDropdown) accueilDropdown.style.display = 'none';
            if (reservationDropdown) reservationDropdown.style.display = 'none';
        }
    });
}

// ========== LANCEMENT DE L'APPLICATION ==========

// Initialiser au chargement du DOM
document.addEventListener("DOMContentLoaded", function() {
    initializeReservationPage();
    setupDropdownClosing();
});

// Exposer les fonctions globalement pour les appels inline
window.showAccueilDropdown = showAccueilDropdown;
window.hideAccueilDropdown = hideAccueilDropdown;
window.toggleAccueilDropdown = toggleAccueilDropdown;
window.showReservationDropdown = showReservationDropdown;
window.hideReservationDropdown = hideReservationDropdown;
window.toggleReservationDropdown = toggleReservationDropdown;
window.toggleMobileMenu = toggleMobileMenu;
window.openModal = openModal;
window.closeConfirmation = closeConfirmation;
window.closeCancellationModal = closeCancellationModal;

// Fonctions pour les boutons du modal (compatibilité)
window.closeRecap = cancelReservation;

/**
 * NOUVEAU - Récupérer le token d'authentification
 */
function getAuthToken() {
    // À adapter selon votre système d'authentification
    return localStorage.getItem('authToken') || '';
}

/**
 * NOUVEAU - Vérifier si l'utilisateur est connecté
 */
function isUserAuthenticated() {
    return !!getAuthToken();
}

/**
 * CORRECTION - Gérer l'authentification dans les réservations
 */
async function handleReservationSubmit(event) {
    event.preventDefault();

    // ✅ NOUVEAU: Vérifier l'authentification
    if (!isUserAuthenticated()) {
        showMessage('Vous devez être connecté pour faire une réservation.', 'error');
        openModal('login');
        return;
    }

    // Valider le formulaire
    if (!validateReservationForm()) {
        return;
    }

    // Collecter les données
    const name = document.getElementById("fullName").value.trim();
    const phone = document.getElementById("phoneNumber").value.trim();
    const email = document.getElementById("emailAddress").value.trim();
    const dateInput = document.getElementById('reservationDate');
    const startTimeSelect = document.getElementById('startTime');
    const durationSelect = document.getElementById('duration');
    const tablesSelect = document.getElementById('tablesSelect');

    const selectedTables = Array.from(tablesSelect.selectedOptions)
        .map(option => option.value)
        .filter(value => value && !tablesSelect.querySelector(`option[value="${value}"]`).disabled);

    const reservationData = {
        name: name,
        phone: phone,
        email: email,
        date: dateInput.value,
        startTime: parseInt(startTimeSelect.value),
        duration: parseInt(durationSelect.value),
        tables: selectedTables
    };

    // Stocker temporairement la réservation
    window.pendingReservation = reservationData;

    // Afficher le récapitulatif
    showReservationSummary(reservationData);
}
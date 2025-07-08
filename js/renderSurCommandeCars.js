document.addEventListener("DOMContentLoaded", () => {
  // Initialize the page
  setTimeout(() => {
    loadSurCommandeCars();
  }, 100);

  function loadSurCommandeCars() {
    showLoading(true);
    hideNoResults();
    
    // Fetch cars with 'sur commande' filter
    fetch('https://smay.onrender.com/api/cars/?availability=sur commande')
      .then(res => res.json())
      .then(cars => {
        renderCars(cars);
      })
      .catch(error => {
        console.error('Error loading sur commande cars:', error);
        showError();
      })
      .finally(() => {
        showLoading(false);
      });
  }

  function renderCars(cars) {
    const container = document.getElementById('card-container');
    container.innerHTML = ''; // Clear existing cards

    if (cars.length === 0) {
      showNoResults();
      return;
    }

    hideNoResults();
    
    // Render cars
    cars.forEach(car => {
      const card = createCarCard(car);
      container.appendChild(card);
    });
  }

  function createCarCard(car) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl shadow p-6 hover:shadow-2xl transition duration-300';

    // Extract display tags
    const displayTags = [
      car.basic_details?.Année,
      car.basic_details?.Etat,
      car.technical_specs?.Energie,
      car.technical_specs?.Motor,
      car.technical_specs?.Power
    ].filter(Boolean);

    // Translate tags (from car.tags array)
    const translatedTags = car.tags.map(tag => {
      const tagKey = tag.toLowerCase();
      return window.getTranslation ? window.getTranslation(tagKey) || tag : tag;
    });

    // Fallback image if missing
    const imageUrl = car.images.length > 0 ? car.images[0] : 'images/default.jpg';

    // Add availability badge (should be "sur commande" for all cars on this page)
    const availabilityBadge = createAvailabilityBadge(car.basic_details?.Availability);

    card.innerHTML = `
      <div class="relative">
        <img src="${imageUrl}" alt="${car.title}" class="rounded-xl mb-3 w-full h-[40rem] lg:h-48 object-cover">
        ${availabilityBadge}
      </div>
      <h3 class="text-[4.2rem] lg:text-2xl font-bold mb-4 text-center">${car.title}</h3>
      <div class="flex flex-wrap gap-2 mb-[4.2rem] lg:mb-[2.4rem]">
        ${translatedTags.map(tag => `<span class="bg-blue-100 text-blue-700 text-[2.1rem] lg:text-sm px-6 lg:px-3 py-2 lg:py-2 rounded-md">${tag}</span>`).join('')}
      </div>
      <p class="text-red-600 text-[4.2rem] lg:text-2xl font-semibold mb-4 text-center">
        ${car.price} ${window.getCurrentLanguage && window.getCurrentLanguage() === 'ar' ? 'دج' : 'DA'}
      </p>
      <div class="flex justify-center">
        <a href="details.html?id=${car.id}" class="bg-blue-600 text-white text-center py-3 px-80 lg:px-8 rounded-full text-[3rem] lg:text-lg font-semibold hover:bg-blue-700 transition">
          ${window.getTranslation ? window.getTranslation('view-more') : 'Voir Plus'}
        </a>
      </div>
    `;

    return card;
  }

  function createAvailabilityBadge(availability) {
    if (!availability) return '';
    
    const isSurCommande = availability.toLowerCase() === 'sur commande';
    const badgeClass = isSurCommande 
      ? 'bg-blue-500 text-white' 
      : 'bg-gray-500 text-white';
    
    const badgeText = isSurCommande 
      ? (window.getTranslation ? window.getTranslation('Sur command') || 'Sur Commande' : 'Sur Commande')
      : availability;
    
    return `
      <div class="absolute top-2 right-2 ${badgeClass} px-3 py-1 rounded-full text-[1.5rem] lg:text-xs font-semibold shadow-md">
        ${badgeText}
      </div>
    `;
  }

  function showLoading(show) {
    const loader = document.getElementById('loading-indicator');
    if (show) {
      loader.classList.remove('hidden');
    } else {
      loader.classList.add('hidden');
    }
  }

  function showNoResults() {
    const noResults = document.getElementById('no-results');
    noResults.classList.remove('hidden');
  }

  function hideNoResults() {
    const noResults = document.getElementById('no-results');
    noResults.classList.add('hidden');
  }

  function showError() {
    const container = document.getElementById('card-container');
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <div class="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md mx-auto">
          <div class="text-red-400 mb-4">
            <svg class="w-16 h-16 lg:w-12 lg:h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 class="text-[2.5rem] lg:text-xl font-semibold text-red-600 mb-2">Erreur de chargement</h3>
          <p class="text-[2rem] lg:text-sm text-red-500 mb-4">Impossible de charger les voitures. Veuillez réessayer.</p>
          <button onclick="location.reload()" class="bg-red-600 text-white px-6 py-2 rounded-full text-[2rem] lg:text-sm font-semibold hover:bg-red-700 transition">
            Réessayer
          </button>
        </div>
      </div>
    `;
  }
});
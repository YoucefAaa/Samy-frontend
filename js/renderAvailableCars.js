document.addEventListener("DOMContentLoaded", () => {
  // Pagination variables
  let currentPage = 1;
  let allCars = [];
  const CARS_PER_PAGE = 10;
  const STORAGE_KEY = 'carListingState';

  // Initialize the page
  setTimeout(() => {
    loadPageState();
  }, 100);

  function loadPageState() {
    // Try to restore state from sessionStorage
    const savedState = sessionStorage.getItem(STORAGE_KEY);
    
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        allCars = state.allCars || [];
        currentPage = state.currentPage || 1;
        
        // If we have saved cars, render them instead of fetching
        if (allCars.length > 0) {
          renderAllPagesUpToCurrent();
          return;
        }
      } catch (error) {
        console.error('Error parsing saved state:', error);
        // If parsing fails, continue with normal loading
      }
    }
    
    // No saved state or empty cars, load fresh data
    loadAvailableCars();
  }

  function savePageState() {
    const state = {
      allCars: allCars,
      currentPage: currentPage,
      timestamp: Date.now()
    };
    
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Error saving state to sessionStorage:', error);
    }
  }

  function loadAvailableCars() {
    showLoading(true);
    hideNoResults();
    
    // Fetch cars with 'Disponible' filter
    fetch('https://samy-auto.onrender.com/api/cars/?availability=Disponible')
      .then(res => res.json())
      .then(cars => {
        allCars = cars; // Store all cars
        currentPage = 1; // Reset to first page
        renderCars(true); // Pass true to indicate initial load
        savePageState(); // Save state after loading
      })
      .catch(error => {
        console.error('Error loading available cars:', error);
        showError();
      })
      .finally(() => {
        showLoading(false);
      });
  }

  function renderAllPagesUpToCurrent() {
    const container = document.getElementById('card-container');
    container.innerHTML = ''; // Clear container

    if (allCars.length === 0) {
      showNoResults();
      return;
    }

    hideNoResults();
    
    // Render all cars from page 1 to current page
    const totalCarsToShow = currentPage * CARS_PER_PAGE;
    const carsToShow = allCars.slice(0, totalCarsToShow);
    
    carsToShow.forEach(car => {
      const card = createCarCard(car);
      container.appendChild(card);
    });
    
    // Handle Load More button
    updateLoadMoreButton();
  }

  function renderCars(isInitialLoad = false) {
    const container = document.getElementById('card-container');
    
    if (isInitialLoad) {
      container.innerHTML = ''; // Clear only on initial load
    }

    if (allCars.length === 0) {
      showNoResults();
      return;
    }

    hideNoResults();
    
    // Calculate which cars to show
    const startIndex = (currentPage - 1) * CARS_PER_PAGE;
    const endIndex = startIndex + CARS_PER_PAGE;
    const carsToShow = allCars.slice(startIndex, endIndex);
    
    // Render new cars
    carsToShow.forEach(car => {
      const card = createCarCard(car);
      container.appendChild(card);
    });
    
    // Handle Load More button
    updateLoadMoreButton();
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
    const language = window.getCurrentLanguage ? window.getCurrentLanguage() : 'fr';
    const userTags = language === 'ar' ? car.tags_ar : car.tags_fr;
    const userTagsClean = (userTags && userTags.length > 0) ? userTags : [];


    // Fallback image if missing
    const imageUrl = car.images.length > 0 
      ? `https://samy-auto.onrender.com${car.images[0]}` 
      : 'images/default.jpg';

    // Add availability badge (should be "Disponible" for all cars on this page)
    const availabilityBadge = createAvailabilityBadge(car.basic_details?.Availability);

    card.innerHTML = `
      <div class="relative">
        <img src="${imageUrl}" alt="${car.title}" loading="lazy" class="rounded-xl mb-3 w-full h-[40rem] lg:h-48 object-cover">
        ${availabilityBadge}
      </div>
      <h3 class="text-[4.2rem] lg:text-2xl font-bold mb-4 text-center">${car.title}</h3>
      <div class="flex flex-wrap gap-2 mb-[4.2rem] lg:mb-[2.4rem]">
        ${userTagsClean.map(tag => `<span class="bg-blue-100 text-blue-700 text-[2.1rem] lg:text-sm px-6 lg:px-3 py-2 lg:py-2 rounded-md">${tag}</span>`).join('')}

      </div>
      <p class="text-red-600 text-[4.2rem] lg:text-2xl font-semibold mb-4 text-center">
        ${car.price} ${window.getCurrentLanguage && window.getCurrentLanguage() === 'ar' ? 'دج' : 'DA'}
      </p>
      <div class="flex justify-center">
        <a href="details.html?id=${car.id}" class="bg-blue-600 text-white text-center py-3 px-80 lg:px-8 rounded-full text-[3rem] lg:text-lg font-semibold hover:bg-blue-700 transition" onclick="savePageState()">
          ${window.getTranslation ? window.getTranslation('view-more') : 'Voir Plus'}
        </a>
      </div>
    `;

    return card;
  }

  function createAvailabilityBadge(availability) {
    if (!availability) return '';
    
    const isAvailable = availability.toLowerCase() === 'disponible';
    const badgeClass = isAvailable 
      ? 'bg-green-500 text-white' 
      : 'bg-gray-500 text-white';
    
    const badgeText = isAvailable 
      ? (window.getTranslation ? window.getTranslation('available') || 'Disponible' : 'Disponible')
      : availability;
    
    return `
      <div class="absolute top-2 right-2 ${badgeClass} px-3 py-1 rounded-full text-[1.5rem] lg:text-xs font-semibold shadow-md">
        ${badgeText}
      </div>
    `;
  }

  function updateLoadMoreButton() {
    const totalShown = currentPage * CARS_PER_PAGE;
    const hasMore = totalShown < allCars.length;
    
    let loadMoreBtn = document.getElementById('load-more-btn');
    
    if (hasMore) {
      if (!loadMoreBtn) {
        // Create load more button if it doesn't exist
        loadMoreBtn = document.createElement('div');
        loadMoreBtn.id = 'load-more-btn';
        loadMoreBtn.className = 'text-center mt-8';
        loadMoreBtn.innerHTML = `
          <button onclick="loadMoreCars()" class="bg-blue-600 text-white px-8 py-3 rounded-full text-[2rem] lg:text-lg font-semibold hover:bg-blue-700 transition">
            ${window.getTranslation ? window.getTranslation('load-more') || 'Charger Plus' : 'Charger Plus'}
          </button>
        `;
        document.getElementById('card-container').parentNode.appendChild(loadMoreBtn);
      }
      loadMoreBtn.style.display = 'block';
    } else {
      if (loadMoreBtn) {
        loadMoreBtn.style.display = 'none';
      }
    }
  }

  function loadMoreCars() {
    currentPage++;
    renderCars(false); // false means don't clear existing cards
    savePageState(); // Save state after loading more cars
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

  // Clear sessionStorage when leaving the page (optional)
  window.addEventListener('beforeunload', () => {
    // Uncomment the line below if you want to clear storage when leaving the page
    // sessionStorage.removeItem(STORAGE_KEY);
  });

  // Make functions globally accessible
  window.loadMoreCars = loadMoreCars;
  window.savePageState = savePageState;
});
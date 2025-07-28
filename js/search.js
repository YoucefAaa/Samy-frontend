// Enhanced search.js with better messaging and navigation preservation
document.addEventListener("DOMContentLoaded", () => {
  // Search-related variables
  let searchTimeout = null;
  let currentSearchQuery = '';
  let isSearchActive = false;
  let highlightedIndex = -1;
  
  // Get current page availability from URL or default logic
  function getCurrentPageAvailability() {
    const currentPage = window.location.pathname;
    if (currentPage.includes('sur-commande') || currentPage.includes('surcommande')) {
      return 'sur commande';
    } else if (currentPage.includes('disponible')) {
      return 'Disponible';
    }
    // Default fallback - you can adjust this based on your page structure
    return 'Disponible';
  }

  // Store search state in sessionStorage for navigation preservation
  function saveSearchState() {
  if (isSearchActive && currentSearchQuery) {
    const availability = getCurrentPageAvailability();
    sessionStorage.setItem(`searchState_${availability}`, JSON.stringify({
      query: currentSearchQuery,
      availability: availability,
      isActive: true,
      timestamp: Date.now()
    }));
  }
}

  // Restore search state when returning from details page
  function restoreSearchState() {
  const availability = getCurrentPageAvailability();
  const savedState = sessionStorage.getItem(`searchState_${availability}`);
  if (savedState) {
    try {
      const state = JSON.parse(savedState);
      // Only restore if it's recent (within 30 minutes)
      if (Date.now() - state.timestamp < 30 * 60 * 1000) {
        const searchInput = document.getElementById('search-input');
        if (searchInput && state.query) {
          searchInput.value = state.query;
          currentSearchQuery = state.query;
          isSearchActive = state.isActive;
          toggleClearButton(true);
          // Perform the search after a short delay to ensure DOM is ready
          setTimeout(() => {
            performSearch();
          }, 100);
        }
      } else {
        // Clear old state
        sessionStorage.removeItem(`searchState_${availability}`);
      }
    } catch (e) {
      console.error('Error restoring search state:', e);
      sessionStorage.removeItem(`searchState_${availability}`);
    }
  }
}

  // Initialize search functionality
  function initializeSearch() {
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const clearButton = document.getElementById('clear-search');
    const dropdown = document.getElementById('autocomplete-dropdown');

    if (!searchInput || !searchButton) {
      console.warn('Search elements not found');
      return;
    }

    // Restore previous search state if any
    restoreSearchState();

    // Search input event listeners
    searchInput.addEventListener('input', handleSearchInput);
    searchInput.addEventListener('keydown', handleKeydown);
    searchInput.addEventListener('focus', handleInputFocus);
    searchInput.addEventListener('blur', handleInputBlur);

    // Search button click
    searchButton.addEventListener('click', performSearch);

    // Clear search button
    if (clearButton) {
      clearButton.addEventListener('click', clearSearch);
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.relative')) {
        hideAutocomplete();
      }
    });
  }

  // Handle search input changes
  function handleSearchInput(e) {
    const query = e.target.value.trim();
    
    // Show/hide clear button
    toggleClearButton(query.length > 0);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Debounce autocomplete requests
    if (query.length >= 2) {
      searchTimeout = setTimeout(() => {
        fetchAutocomplete(query);
      }, 300);
    } else {
      hideAutocomplete();
    }
  }

  // Handle keyboard navigation
  function handleKeydown(e) {
    const dropdown = document.getElementById('autocomplete-dropdown');
    const items = dropdown.querySelectorAll('.autocomplete-item');
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        highlightedIndex = Math.min(highlightedIndex + 1, items.length - 1);
        updateHighlight(items);
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        highlightedIndex = Math.max(highlightedIndex - 1, -1);
        updateHighlight(items);
        break;
        
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && items[highlightedIndex]) {
          selectSuggestion(items[highlightedIndex].textContent);
        } else {
          performSearch();
        }
        break;
        
      case 'Escape':
        hideAutocomplete();
        document.getElementById('search-input').blur();
        break;
    }
  }

  // Handle input focus
  function handleInputFocus() {
    const query = document.getElementById('search-input').value.trim();
    if (query.length >= 2) {
      fetchAutocomplete(query);
    }
  }

  // Handle input blur (with delay to allow clicks)
  function handleInputBlur() {
    setTimeout(() => {
      hideAutocomplete();
    }, 200);
  }

  // Fetch autocomplete suggestions
  async function fetchAutocomplete(query) {
    const availability = getCurrentPageAvailability();
    
    try {
      const response = await fetch(`https://samy-auto.onrender.com/api/cars/autocomplete/?q=${encodeURIComponent(query)}&availability=${encodeURIComponent(availability)}`);
      
      if (!response.ok) throw new Error('Autocomplete request failed');
      
      const suggestions = await response.json();
      displayAutocomplete(suggestions, query);
      
    } catch (error) {
      console.error('Autocomplete error:', error);
      hideAutocomplete();
    }
  }

  // Display autocomplete suggestions
  function displayAutocomplete(suggestions, query) {
    const dropdown = document.getElementById('autocomplete-dropdown');
    
    if (suggestions.length === 0) {
      hideAutocomplete();
      return;
    }
    
    // Create suggestion items
    const suggestionItems = suggestions.map(suggestion => {
      const highlighted = highlightMatch(suggestion, query);
      return `<div class="autocomplete-item" data-value="${suggestion}">${highlighted}</div>`;
    }).join('');
    
    dropdown.innerHTML = suggestionItems;
    
    // Add click listeners to suggestions
    dropdown.querySelectorAll('.autocomplete-item').forEach(item => {
      item.addEventListener('click', () => {
        selectSuggestion(item.dataset.value);
      });
    });
    
    // Show dropdown
    dropdown.classList.remove('hidden');
    highlightedIndex = -1;
  }

  // Highlight matching text in suggestions
  function highlightMatch(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="match">$1</span>');
  }

  // Update keyboard highlight
  function updateHighlight(items) {
    items.forEach((item, index) => {
      if (index === highlightedIndex) {
        item.classList.add('highlighted');
      } else {
        item.classList.remove('highlighted');
      }
    });
  }

  // Select a suggestion
  function selectSuggestion(suggestion) {
    const searchInput = document.getElementById('search-input');
    searchInput.value = suggestion;
    hideAutocomplete();
    performSearch();
  }

  // Hide autocomplete dropdown
  function hideAutocomplete() {
    const dropdown = document.getElementById('autocomplete-dropdown');
    dropdown.classList.add('hidden');
    highlightedIndex = -1;
  }

 
function toggleClearButton(show) {
  const clearButton = document.getElementById('clear-search');
  if (clearButton) {
    if (show) {
      clearButton.classList.remove('hidden');
      // Add RTL positioning
      if (document.documentElement.getAttribute('dir') === 'rtl') {
        clearButton.classList.add('mr-2'); // or whatever spacing you need
      } else {
        clearButton.classList.add('ml-2');
      }
    } else {
      clearButton.classList.add('hidden');
    }
  }
}

  // Perform search
  async function performSearch() {
    const searchInput = document.getElementById('search-input');
    const query = searchInput.value.trim();
    
    hideAutocomplete();
    
    if (query.length === 0) {
      clearSearch();
      return;
    }
    
    currentSearchQuery = query;
    isSearchActive = true;
    
    // Save search state for navigation
    saveSearchState();
    
    // Show enhanced search status
    const availability = getCurrentPageAvailability();
    const availabilityText = availability === 'sur commande' ? 
      (window.getTranslation ? window.getTranslation('sur-commande') || 'Sur Commande' : 'Sur Commande') :
      (window.getTranslation ? window.getTranslation('disponible') || 'Disponible' : 'Disponible');
    
    showSearchStatus(`
      <div class="flex items-center gap-2">
        <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>${window.getTranslation ? window.getTranslation('searching-in') || 'Recherche dans' : 'Recherche dans'} <strong>"${availabilityText}"</strong> ${window.getTranslation ? window.getTranslation('for') || 'pour' : 'pour'} "<strong>${query}</strong>"...</span>
      </div>
    `, 'loading');
    
    // Show loading - use existing function or create our own
    if (typeof showLoading === 'function') {
      showLoading(true);
    } else {
      toggleLoadingState(true);
    }
    
    try {
      const response = await fetch(`https://samy-auto.onrender.com/api/cars/search/?q=${encodeURIComponent(query)}&availability=${encodeURIComponent(availability)}`);
      
      if (!response.ok) throw new Error('Search request failed');
      
      const results = await response.json();
      displaySearchResults(results, query);
      
    } catch (error) {
      console.error('Search error:', error);
      showSearchError();
    } finally {
      if (typeof showLoading === 'function') {
        showLoading(false);
      } else {
        toggleLoadingState(false);
      }
    }
  }

  // Display search results
  function displaySearchResults(results, query) {
    const container = document.getElementById('card-container');
    
    // Clear container
    container.innerHTML = '';
    
    // Hide load more button if it exists
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.style.display = 'none';
    }
    
    // Show back button
    showBackButton();
    
    if (results.length === 0) {
      showNoSearchResults(query);
      const availability = getCurrentPageAvailability();
      const availabilityText = availability === 'sur commande' ? 
        (window.getTranslation ? window.getTranslation('sur-commande') || 'Sur Commande' : 'Sur Commande') :
        (window.getTranslation ? window.getTranslation('disponible') || 'Disponible' : 'Disponible');
      
      showSearchStatus(`
        <div class="flex items-center gap-2 text-orange-600">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
          <span>${window.getTranslation ? window.getTranslation('no-results-status') || 'Aucun résultat trouvé pour' : 'Aucun résultat trouvé pour'} "<strong>${query}</strong>" ${window.getTranslation ? window.getTranslation('in-category') || 'dans' : 'dans'} <strong>${availabilityText}</strong></span>
        </div>
      `, 'no-results');
      return;
    }
    
    // Show results
    if (typeof hideNoResults === 'function') {
      hideNoResults();
    }
    
    const resultsText = results.length === 1 ? 
      (window.getTranslation ? window.getTranslation('result') || 'résultat' : 'résultat') :
      (window.getTranslation ? window.getTranslation('results') || 'résultats' : 'résultats');
    
    showSearchStatus(`
      <div class="flex items-center gap-2 text-green-600">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        <span><strong>${results.length}</strong> ${resultsText} ${window.getTranslation ? window.getTranslation('found-for') || 'trouvé(s) pour' : 'trouvé(s) pour'} "<strong>${query}</strong>"</span>
      </div>
    `, 'success');
    
    // Render car cards - use existing function if available
    results.forEach(car => {
      let card;
      if (typeof createCarCard === 'function') {
        card = createCarCard(car);
      } else {
        card = createSearchCarCard(car);
      }
      container.appendChild(card);
    });
  }

  // Fallback function to create car cards if createCarCard doesn't exist
  function createSearchCarCard(car) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-2xl shadow p-6 hover:shadow-2xl transition duration-300';

    const language = window.getCurrentLanguage ? window.getCurrentLanguage() : 'fr';
    const userTags = language === 'ar' ? car.tags_ar : car.tags_fr;
    const userTagsClean = (userTags && userTags.length > 0) ? userTags : [];
    
    const imageUrl = car.images.length > 0 
      ? `https://samy-auto.onrender.com${car.images[0]}` 
      : 'images/default.jpg';

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
        <a href="details.html?id=${car.id}" class="bg-blue-600 text-white text-center py-3 px-80 lg:px-8 rounded-full text-[3rem] lg:text-lg font-semibold hover:bg-blue-700 transition">
          ${window.getTranslation ? window.getTranslation('view-more') : 'Voir Plus'}
        </a>
      </div>
    `;

    return card;
  }

  // Create availability badge
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

  // Show search status message - Enhanced with better styling
  function showSearchStatus(message, type = 'info') {
    const statusElement = document.getElementById('search-status');
    if (!statusElement) return;
    
    const colors = {
      loading: 'text-blue-600 bg-blue-50 border-blue-200',
      success: 'text-green-600 bg-green-50 border-green-200',
      error: 'text-red-600 bg-red-50 border-red-200',
      'no-results': 'text-orange-600 bg-orange-50 border-orange-200'
    };
    
    statusElement.className = `mt-3 text-[1.8rem] lg:text-sm px-4 py-2 rounded-lg border ${colors[type] || 'text-gray-600 bg-gray-50 border-gray-200'}`;
    statusElement.innerHTML = message;
    statusElement.classList.remove('hidden');
  }

  // Hide search status
  function hideSearchStatus() {
    const statusElement = document.getElementById('search-status');
    if (statusElement) {
      statusElement.classList.add('hidden');
    }
  }

  // Clear search
  function clearSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.value = '';
    currentSearchQuery = '';
    isSearchActive = false;
    
    // Clear saved search state
    sessionStorage.removeItem('searchState');
    
    toggleClearButton(false);
    hideAutocomplete();
    hideSearchStatus();
    hideBackButton();
    
    // Reload original cars - try multiple methods
    if (typeof loadSurCommandeCars === 'function') {
      loadSurCommandeCars();
    } else if (typeof loadCars === 'function') {
      loadCars();
    } else if (typeof window.loadSurCommandeCars === 'function') {
      window.loadSurCommandeCars();
    } else {
      // Fallback: reload page
      location.reload();
    }
  }

  // Show back button
  function showBackButton() {
    let backButton = document.getElementById('search-back-button');
    
    if (!backButton) {
      // Create the back button
      backButton = document.createElement('div');
      backButton.id = 'search-back-button';
      backButton.className = 'mt-3 text-center';
      backButton.innerHTML = `
        <button onclick="window.clearSearch()" class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-full text-[2rem] lg:text-sm font-semibold transition-colors duration-200 flex items-center gap-2 mx-auto">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
          </svg>
          <span data-translate="back-to-all">${window.getTranslation ? window.getTranslation('back-to-all') || 'Voir toutes les voitures' : 'Voir toutes les voitures'}</span>
        </button>
      `;
      
      // Insert after the search container
      const searchContainer = document.querySelector('.bg-white.shadow-sm.border-b');
      if (searchContainer) {
        searchContainer.parentNode.insertBefore(backButton, searchContainer.nextSibling);
      }
    }
    
    backButton.style.display = 'block';
  }

  // Hide back button  
  function hideBackButton() {
    const backButton = document.getElementById('search-back-button');
    if (backButton) {
      backButton.style.display = 'none';
    }
  }

  // Custom loading toggle function
  function toggleLoadingState(show) {
    const container = document.getElementById('card-container');
    
    if (show) {
      container.innerHTML = `
        <div class="col-span-full flex justify-center items-center py-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600 text-[2rem] lg:text-base">${window.getTranslation ? window.getTranslation('searching-please-wait') || 'Recherche en cours, veuillez patienter...' : 'Recherche en cours, veuillez patienter...'}</p>
          </div>
        </div>
      `;
    }
    // Don't clear when hiding - let displaySearchResults handle it
  }

  // Enhanced no search results message
  function showNoSearchResults(query) {
    const container = document.getElementById('card-container');
    const availability = getCurrentPageAvailability();
    const availabilityText = availability === 'sur commande' ? 
      (window.getTranslation ? window.getTranslation('sur-commande') || 'Sur Commande' : 'Sur Commande') :
      (window.getTranslation ? window.getTranslation('disponible') || 'Disponible' : 'Disponible');
    
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <div class="bg-white rounded-2xl shadow-lg p-8 lg:p-6 max-w-lg mx-auto">
          <div class="text-gray-400 mb-6">
            <svg class="w-20 h-20 lg:w-16 lg:h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <h3 class="text-[3rem] lg:text-xl font-bold text-gray-700 mb-3">
            ${window.getTranslation ? window.getTranslation('no-results-title') || 'Aucun résultat trouvé' : 'Aucun résultat trouvé'}
          </h3>
          <div class="text-[2.2rem] lg:text-base text-gray-600 mb-6 space-y-2">
            <p>
              ${window.getTranslation ? window.getTranslation('no-results-for-query') || 'Aucune voiture ne correspond à' : 'Aucune voiture ne correspond à'} 
              <span class="font-semibold text-blue-600">"${query}"</span>
            </p>
            <p class="text-[2rem] lg:text-sm">
              ${window.getTranslation ? window.getTranslation('in-category') || 'dans la catégorie' : 'dans la catégorie'} 
              <span class="font-semibold text-blue-600">${availabilityText}</span>
            </p>
          </div>
          
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-[2rem] lg:text-sm text-blue-700">
            <div class="flex items-start gap-2">
              <svg class="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <p class="font-medium mb-1">${window.getTranslation ? window.getTranslation('search-suggestions-title') || 'Suggestions :' : 'Suggestions :'}</p>
                <ul class="space-y-1 text-[1.8rem] lg:text-xs">
                  <li>• ${window.getTranslation ? window.getTranslation('check-spelling') || 'Vérifiez l\'orthographe' : 'Vérifiez l\'orthographe'}</li>
                  <li>• ${window.getTranslation ? window.getTranslation('try-different-words') || 'Essayez des mots différents' : 'Essayez des mots différents'}</li>
                  <li>• ${window.getTranslation ? window.getTranslation('try-general-terms') || 'Utilisez des termes plus généraux' : 'Utilisez des termes plus généraux'}</li>
                  <li>• ${window.getTranslation ? window.getTranslation('check-other-category') || 'Consultez l\'autre catégorie' : 'Consultez l\'autre catégorie'}</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div class="flex flex-col gap-3">
            <button onclick="window.clearSearch()" class="bg-blue-600 text-white px-6 py-3 rounded-full text-[2rem] lg:text-sm font-semibold hover:bg-blue-700 transition">
              ${window.getTranslation ? window.getTranslation('see-all-cars') || 'Voir toutes les voitures' : 'Voir toutes les voitures'}
            </button>
            <a href="${availability === 'sur commande' ? 'cars-available.html' : 'cars-sur-commande.html'}" class="text-blue-600 hover:text-blue-700 font-medium text-[2rem] lg:text-sm transition">
              ${availability === 'sur commande' 
                ? (window.getTranslation ? window.getTranslation('check-available') || 'Voir les voitures disponibles' : 'Voir les voitures disponibles')
                : (window.getTranslation ? window.getTranslation('check-sur-commande') || 'Voir les voitures sur commande' : 'Voir les voitures sur commande')}
              →
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // Enhanced search error message
  function showSearchError() {
    showSearchStatus(`
      <div class="flex items-center gap-2">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>${window.getTranslation ? window.getTranslation('search-error') || 'Erreur lors de la recherche. Veuillez réessayer.' : 'Erreur lors de la recherche. Veuillez réessayer.'}</span>
        <button onclick="window.performSearch()" class="ml-2 text-blue-600 hover:text-blue-700 font-medium underline">
          ${window.getTranslation ? window.getTranslation('retry') || 'Réessayer' : 'Réessayer'}
        </button>
      </div>
    `, 'error');
  }

  // Make functions globally available
  window.clearSearch = clearSearch;
  window.performSearch = performSearch;
  window.saveSearchState = saveSearchState;

  // Initialize search when DOM is ready
  setTimeout(initializeSearch, 100);
});
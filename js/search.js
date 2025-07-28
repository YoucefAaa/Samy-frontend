// Add this to a new file: js/search.js
// Or integrate into your existing renderSurCommandeCars.js

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

  // Toggle clear button visibility
  function toggleClearButton(show) {
    const clearButton = document.getElementById('clear-search');
    if (clearButton) {
      if (show) {
        clearButton.classList.remove('hidden');
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
    
    // Show search status
    showSearchStatus(`Recherche de "${query}"...`, 'loading');
    
    // Show loading
    showLoading(true);
    
    const availability = getCurrentPageAvailability();
    
    try {
      const response = await fetch(`https://samy-auto.onrender.com/api/cars/search/?q=${encodeURIComponent(query)}&availability=${encodeURIComponent(availability)}`);
      
      if (!response.ok) throw new Error('Search request failed');
      
      const results = await response.json();
      displaySearchResults(results, query);
      
    } catch (error) {
      console.error('Search error:', error);
      showSearchError();
    } finally {
      showLoading(false);
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
    
    if (results.length === 0) {
      showNoSearchResults(query);
      showSearchStatus(`Aucun résultat pour "${query}"`, 'no-results');
      return;
    }
    
    // Show results
    hideNoResults();
    showSearchStatus(`${results.length} résultat${results.length > 1 ? 's' : ''} pour "${query}"`, 'success');
    
    // Render car cards (reuse existing function)
    results.forEach(car => {
      const card = createCarCard(car);
      container.appendChild(card);
    });
  }

  // Show search status message
  function showSearchStatus(message, type = 'info') {
    const statusElement = document.getElementById('search-status');
    if (!statusElement) return;
    
    const colors = {
      loading: 'text-blue-600',
      success: 'text-green-600',
      error: 'text-red-600',
      'no-results': 'text-gray-600'
    };
    
    statusElement.className = `mt-3 text-[1.8rem] lg:text-sm ${colors[type] || 'text-gray-600'}`;
    statusElement.textContent = message;
    statusElement.classList.remove('hidden');
    
    if (type === 'loading') {
      statusElement.classList.add('search-loading');
    } else {
      statusElement.classList.remove('search-loading');
    }
  }

  // Hide search status
  function hideSearchStatus() {
    const statusElement = document.getElementById('search-status');
    if (statusElement) {
      statusElement.classList.add('hidden');
    }
  }

  // Show no search results message
  function showNoSearchResults(query) {
    const container = document.getElementById('card-container');
    container.innerHTML = `
      <div class="col-span-full text-center py-12">
        <div class="bg-white rounded-2xl shadow-lg p-8 lg:p-6 max-w-md mx-auto">
          <div class="text-gray-400 mb-4">
            <svg class="w-16 h-16 lg:w-12 lg:h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <h3 class="text-[2.5rem] lg:text-xl font-semibold text-gray-600 mb-2">Aucun résultat trouvé</h3>
          <p class="text-[2rem] lg:text-sm text-gray-500 mb-4">Aucune voiture ne correspond à "${query}"</p>
          <button onclick="clearSearch()" class="bg-blue-600 text-white px-6 py-2 rounded-full text-[2rem] lg:text-sm font-semibold hover:bg-blue-700 transition">
            Voir toutes les voitures
          </button>
        </div>
      </div>
    `;
  }

  // Show search error
  function showSearchError() {
    showSearchStatus('Erreur lors de la recherche. Veuillez réessayer.', 'error');
  }

  // Clear search
  function clearSearch() {
    const searchInput = document.getElementById('search-input');
    searchInput.value = '';
    currentSearchQuery = '';
    isSearchActive = false;
    
    toggleClearButton(false);
    hideAutocomplete();
    hideSearchStatus();
    
    // Reload original cars
    if (typeof loadSurCommandeCars === 'function') {
      loadSurCommandeCars();
    } else if (typeof loadCars === 'function') {
      loadCars();
    } else {
      // Fallback: reload page
      location.reload();
    }
  }

  // Make functions globally available
  window.clearSearch = clearSearch;
  window.performSearch = performSearch;

  // Initialize search when DOM is ready
  setTimeout(initializeSearch, 100);
});
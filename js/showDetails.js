document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const carId = urlParams.get('id');

  if (!carId) {
    console.error("❌ No car ID provided in URL");
    document.getElementById('car-details').innerHTML = `
      <p class="text-center text-red-500">
        ${window.getTranslation ? window.getTranslation('car-not-found') : 'Car ID not found in URL'}
      </p>`;
    return;
  }

  // Enhanced translation helper function
  function translateValue(value, context = null) {
    if (!value) return value;
    
    const currentLang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'fr';
    
    // Handle exact matches first
    if (window.getDetailTranslation) {
      const detailTranslation = window.getDetailTranslation(value);
      if (detailTranslation && detailTranslation !== value) {
        return detailTranslation;
      }
    }
    
    // Try general translation
    if (window.getTranslation) {
      const generalTranslation = window.getTranslation(value);
      if (generalTranslation && generalTranslation !== value) {
        return generalTranslation;
      }
      
      // Try lowercase version
      const lowerTranslation = window.getTranslation(value.toLowerCase());
      if (lowerTranslation && lowerTranslation !== value.toLowerCase()) {
        return lowerTranslation;
      }
    }
    
    // Fallback to translateValue function from language.js
    if (window.translateValue) {
      return window.translateValue(value, context);
    }
    
    return value;
  }

  // Enhanced key translation function
  function translateKey(key) {
    if (!key) return key;
    
    // Direct translation lookup
    if (window.getDetailTranslation) {
      const translated = window.getDetailTranslation(key);
      if (translated && translated !== key) {
        return translated;
      }
    }
    
    // Try with common field mappings
    const fieldMappings = {
      'Etat': 'etat',
      'Année': 'annee', 
      'Finition': 'finition',
      'Couleurs': 'couleurs',
      'Energie': 'energie',
      'Motor': 'motor',
      'Power': 'power',
      'Cylindre': 'cylindre',
      'Boite': 'boite',
      'ABS': 'abs'
    };
    
    const mappedKey = fieldMappings[key] || key;
    if (window.getTranslation) {
      const translated = window.getTranslation(mappedKey);
      if (translated && translated !== mappedKey) {
        return translated;
      }
    }
    
    return key;
  }

  // Function to fetch random cars
  async function fetchRandomCars(currentCarId) {
    try {
      const response = await fetch('https://samy-auto.onrender.com/api/cars/');
      if (!response.ok) throw new Error('Failed to fetch cars');
      const allCars = await response.json();
      
      // Filter out current car and get random 2 cars
      const otherCars = allCars.filter(car => car.id !== currentCarId);
      const shuffled = otherCars.sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 2);
    } catch (error) {
      console.error('Error fetching random cars:', error);
      return [];
    }
  }

  // Main fetch for car details
  Promise.all([
    fetch(`https://samy-auto.onrender.com/api/cars/${carId}/`),
    fetchRandomCars(carId)
  ])
    .then(async ([carResponse, randomCars]) => {
      if (!carResponse.ok) throw new Error('Car not found');
      const car = await carResponse.json();
      
      const container = document.getElementById('car-details');
      const currentLang = window.getCurrentLanguage ? window.getCurrentLanguage() : 'fr';
      const isRTL = currentLang === 'ar';

      const phoneNumbers = [
        { number: "0563 05 35 87" },
        { number: "0563 05 35 88" },
        { number: "0554 96 06 69" },
        { number: "0770 60 50 40" }
      ];

      // Handle empty images array with a proper placeholder
      const carImages = car.images && car.images.length > 0 ? car.images : ['data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y3ZjdmNyIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMThweCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlIEF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+'];

      // Display tags from both basic + technical with proper translation
      const displayTags = [
        car.basic_details?.Année,
        car.basic_details?.Etat,
        car.technical_specs?.Energie,
        car.technical_specs?.Motor,
        car.technical_specs?.Power
      ].filter(Boolean);

      // Translate those tags properly
      const translatedTags = displayTags.map(tag => translateValue(tag));

      // Translate Basic Details with both key and value translation
      const basicDetails = {};
      Object.entries(car.basic_details || {}).forEach(([key, val]) => {
        if (val && val !== "Pas Disponible") {
          const translatedKey = translateKey(key);
          const translatedValue = translateValue(val);
          basicDetails[translatedKey] = translatedValue;
        }
      });

      // Translate Technical Specs with both key and value translation
      const technicalSpecs = {};
      Object.entries(car.technical_specs || {}).forEach(([key, val]) => {
        if (val && val !== "Pas Disponible") {
          const translatedKey = translateKey(key);
          const translatedValue = translateValue(val);
          technicalSpecs[translatedKey] = translatedValue;
        }
      });

      // Pick description based on language
      const description = currentLang === 'ar'
        ? (car.description_ar || car.description)
        : car.description;

      container.innerHTML = `
        <div class="max-w-4xl mx-auto" ${isRTL ? 'dir="rtl"' : ''}>
          <!-- Image Carousel -->
          <div class="relative mb-6">
            <div class="carousel-container relative overflow-hidden rounded-xl">
              <div class="carousel-track flex transition-transform duration-500 ease-in-out" id="carousel-track">
                ${carImages.map((img, index) => `
                  <img src="https://samy-auto.onrender.com${img}" alt="${car.title}" class="carousel-slide w-full h-auto lg:h-96 object-cover flex-shrink-0">
                `).join('')}
              </div>
            </div>
            
            <!-- Carousel Controls (only show if more than 1 image) -->
            ${carImages.length > 1 ? `
              <button id="prev-btn" class="absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${isRTL ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}"></path>
                </svg>
              </button>
              <button id="next-btn" class="absolute ${isRTL ? 'left-4' : 'right-4'} top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${isRTL ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'}"></path>
                </svg>
              </button>
              
              <!-- Carousel Indicators -->
              <div class="flex justify-center mt-4 space-x-2">
                ${carImages.map((_, index) => `
                  <button class="carousel-indicator w-3 h-3 rounded-full transition ${index === 0 ? 'bg-blue-600' : 'bg-gray-300'}" data-slide="${index}"></button>
                `).join('')}
              </div>
            ` : ''}
          </div>

          <!-- Car Name -->
          <h1 class="text-[6.5rem] lg:text-4xl font-bold text-center mb-4">${car.title_ar && isRTL ? car.title_ar : car.title}</h1>
          
          <!-- Price -->
          <p class="text-red-600 text-[5rem] lg:text-3xl font-bold text-center mb-8">${car.price} ${isRTL ? 'دج' : 'DA'}</p>

          <!-- FIRST TABLE - Basic Details -->
          <div class="bg-white rounded-xl shadow-lg p-6 lg:p-6 mb-8">
            <h3 class="text-[3rem] lg:text-xl font-bold mb-4">${window.getTranslation ? window.getTranslation('information') : 'Information:'}</h3>
            <div class="grid grid-cols-1 gap-4">
              ${Object.entries(basicDetails).map(([key, value]) => `
                <div class="flex justify-between items-center py-4 lg:py-2 border-b border-gray-200 last:border-b-0">
                  <span class="text-gray-600 font-medium text-[2.5rem] lg:text-base">${key}</span>
                  <span class="text-gray-800 font-semibold text-center flex-1 text-[2.5rem] lg:text-base">${value}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- SECOND TABLE - Technical Specs -->
          <div class="bg-white rounded-xl shadow-lg p-6 lg:p-6 mb-8">
            <h3 class="text-[3rem] lg:text-xl font-bold mb-4">${window.getTranslation ? window.getTranslation('technical_specs') : 'Spécifications techniques:'}</h3>
            <div class="grid grid-cols-1 gap-4">
              ${Object.entries(technicalSpecs).map(([key, value]) => `
                <div class="flex justify-between items-center py-4 lg:py-2 border-b border-gray-200 last:border-b-0">
                  <span class="text-gray-600 font-medium text-[2.5rem] lg:text-base">${key}</span>
                  <span class="text-gray-800 font-semibold text-center flex-1 text-[2.5rem] lg:text-base">${value}</span>
                </div>
              `).join('')}
            </div>
            
          </div>

          <!-- Description -->
          <div class="bg-white rounded-xl shadow-lg p-6 lg:p-6 mb-8">
            <h2 class="text-[3rem] lg:text-xl font-bold mb-4">${window.getTranslation ? window.getTranslation('description') : 'Description:'}</h2>
            <p class="text-gray-700 leading-relaxed text-[2.2rem] lg:text-base">${description || 'No description available'}</p>
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 mb-8">
            <button id="location-btn" class="flex-1 bg-green-600 text-white py-6 lg:py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition flex items-center justify-center gap-2 text-[2.5rem] lg:text-base">
              <svg class="w-8 h-8 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              ${window.getTranslation ? window.getTranslation('location-btn') : 'Localisation'}
            </button>
            <button id="phone-btn" class="flex-1 bg-blue-600 text-white py-6 lg:py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 text-[2.5rem] lg:text-base">
              <svg class="w-8 h-8 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              ${window.getTranslation ? window.getTranslation('call-btn') : 'Appeler'}
            </button>
          </div>

          <!-- Hidden Phone Section -->
          <div id="phone-section" class="hidden bg-white rounded-xl shadow-lg p-6 lg:p-6 mb-8">
            <h3 class="text-[2.8rem] lg:text-lg font-bold mb-4">${window.getTranslation ? window.getTranslation('phone-numbers') : 'Numéros de téléphone:'}</h3>
            <div class="space-y-3">
              ${phoneNumbers.map(phone => `
                <div class="flex items-center justify-between p-6 lg:p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p class="text-gray-800 font-medium text-[2.5rem] lg:text-base">${phone.number}</p>
                  </div>
                  <div class="flex gap-2">
                    <button class="call-btn bg-green-600 text-white px-6 py-3 lg:px-3 lg:py-1 rounded text-[2rem] lg:text-sm hover:bg-green-700 transition" data-number="${phone.number}">
                      ${window.getTranslation ? window.getTranslation('call') : 'Appeler'}
                    </button>
                    <button class="copy-btn bg-gray-600 text-white px-6 py-3 lg:px-3 lg:py-1 rounded text-[2rem] lg:text-sm hover:bg-gray-700 transition" data-number="${phone.number}">
                      ${window.getTranslation ? window.getTranslation('copy') : 'Copier'}
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Random Cars Suggestions -->
          ${randomCars.length > 0 ? `
          <div class="mb-8">
            <h2 class="text-[4rem] lg:text-2xl font-bold mb-6 text-center">${window.getTranslation ? window.getTranslation('other-cars') : 'Autres voitures disponibles'}</h2>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              ${randomCars.map(randomCar => {
                const randomCarDisplayTags = [
                  randomCar.basic_details?.Année,
                  randomCar.basic_details?.Etat,
                  randomCar.technical_specs?.Energie,
                  randomCar.technical_specs?.Motor,
                  randomCar.technical_specs?.Power
                ].filter(Boolean);
                
                // Properly translate random car tags
                const randomCarTags = randomCarDisplayTags.map(tag => translateValue(tag));
                
                const randomCarImage = randomCar.images && randomCar.images.length > 0 ? randomCar.images[0] : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y3ZjdmNyIvPgogIDx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMThweCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlIEF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+';
                
                return `
                  <div class="bg-white rounded-2xl shadow p-6 hover:shadow-2xl transition duration-300">
                    <img src="https://samy-auto.onrender.com${randomCarImage}" alt="${randomCar.title}" class="rounded-xl mb-3 w-full h-[40rem] lg:h-48 object-cover">
                    <h3 class="text-[4.2rem] lg:text-2xl font-bold mb-4 text-center">${randomCar.title_ar && isRTL ? randomCar.title_ar : randomCar.title}</h3>
                    <div class="flex flex-wrap gap-2 mb-[4.2rem] lg:mb-[2.4rem]">
                      ${randomCarTags.map(tag => `<span class="bg-blue-100 text-blue-700 text-[2.1rem] lg:text-sm px-6 lg:px-3 py-2 lg:py-2 rounded-md">${tag}</span>`).join('')}
                    </div>
                    <p class="text-red-600 text-[4.2rem] lg:text-2xl font-semibold mb-4 text-center">${randomCar.price} ${isRTL ? 'دج' : 'DA'}</p>
                    <div class="flex justify-center">
                      <a href="details.html?id=${randomCar.id}" class="bg-blue-600 text-white text-center py-3 px-80 lg:px-8 rounded-full text-[3rem] lg:text-lg font-semibold hover:bg-blue-700 transition">
                        ${window.getTranslation ? window.getTranslation('view-more') : 'Voir Plus'}
                      </a>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          ` : ''}

          <!-- Back Button -->
          <div class="text-center">
            <a href="index.html" class="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-[2.5rem] lg:text-base">
              <svg class="w-8 h-8 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${isRTL ? 'M14 5l-7 7 7 7' : 'M10 19l-7-7m0 0l7-7m-7 7h18'}"></path>
              </svg>
              ${window.getTranslation ? window.getTranslation('back-to-list') : 'Retour à la liste'}
            </a>
          </div>
        </div>
      `;

      // Initialize carousel functionality only if there are multiple images
      if (carImages.length > 1) {
        initializeCarousel(carImages.length, isRTL);
      }
      
      // Phone section toggle
      document.getElementById('phone-btn').addEventListener('click', () => {
        const phoneSection = document.getElementById('phone-section');
        phoneSection.classList.toggle('hidden');
      });

      // Location button
      document.getElementById('location-btn').addEventListener('click', () => {
        window.open('https://maps.app.goo.gl/QunQmeik6mh7fxY19', '_blank');
      });

      // Phone buttons functionality
      document.querySelectorAll('.call-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const number = btn.dataset.number;
          window.location.href = `tel:+213${number.replace(/\s+/g, '')}`;
        });
      });

      document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const number = btn.dataset.number;
          navigator.clipboard.writeText(number).then(() => {
            btn.textContent = window.getTranslation ? window.getTranslation('copied') : 'Copié!';
            setTimeout(() => {
              btn.textContent = window.getTranslation ? window.getTranslation('copy') : 'Copier';
            }, 2000);
          });
        });
      });
    })
    .catch(error => {
      console.error('Error loading car details:', error);
      document.getElementById('car-details').innerHTML = `<p class="text-center text-red-500">${window.getTranslation ? window.getTranslation('loading-error') : 'Erreur lors du chargement'}</p>`;
    });
});

function initializeCarousel(imageCount, isRTL = false) {
  let currentSlide = 0;
  const track = document.getElementById('carousel-track');
  const indicators = document.querySelectorAll('.carousel-indicator');
  
  // Auto-slide functionality
  let autoSlideInterval = setInterval(() => {
    currentSlide = (currentSlide + 1) % imageCount;
    updateCarousel();
  }, 3000);

  // Manual controls
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      clearInterval(autoSlideInterval);
      currentSlide = isRTL
        ? (currentSlide + 1) % imageCount
        : (currentSlide - 1 + imageCount) % imageCount;
      updateCarousel();
      restartAutoSlide();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      clearInterval(autoSlideInterval);
      currentSlide = isRTL
        ? (currentSlide - 1 + imageCount) % imageCount
        : (currentSlide + 1) % imageCount;
      updateCarousel();
      restartAutoSlide();
    });
  }

  // Indicator clicks
  indicators.forEach((indicator, index) => {
    indicator.addEventListener('click', () => {
      clearInterval(autoSlideInterval);
      currentSlide = index;
      updateCarousel();
      restartAutoSlide();
    });
  });

  function updateCarousel() {
    if (track) {
      track.style.transform = isRTL
        ? `translateX(${currentSlide * 100}%)`
        : `translateX(-${currentSlide * 100}%)`;
    }
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('bg-blue-600', index === currentSlide);
      indicator.classList.toggle('bg-gray-300', index !== currentSlide);
    });
  }

  function restartAutoSlide() {
    autoSlideInterval = setInterval(() => {
      currentSlide = (currentSlide + 1) % imageCount;
      updateCarousel();
    }, 3000);
  }
  
}
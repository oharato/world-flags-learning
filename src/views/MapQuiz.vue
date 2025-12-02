<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from '../composables/useTranslation';
import { useCountriesStore } from '../store/countries';

const { t } = useTranslation();
const countriesStore = useCountriesStore();

const mapContainer = ref<HTMLDivElement | null>(null);
// Use 'any' for Leaflet map to avoid complex type issues with the library
const map = ref<any>(null);
const geoJsonLayer = ref<any>(null);
const bordersLayer = ref<any>(null);
const geoJsonData = ref<any>(null);
const selectedCountryName = ref<string>('');
const isDataLoading = ref(true);
const loadError = ref<string | null>(null);

// Quiz options (for demo, we show 4 countries as radio button choices)
const quizOptions = ref<string[]>([]);
const targetCountryName = ref<string>('');
const feedbackMessage = ref<string>('');
const feedbackType = ref<'correct' | 'incorrect' | ''>('');

// Country name mapping (English names from GeoJSON to our country data)
const geoJsonCountryNames = ref<string[]>([]);

onMounted(async () => {
  await countriesStore.fetchCountries(true);
  await loadGeoJsonData();
  initializeMap();
  generateQuiz();
});

// Cleanup map instance on component unmount to prevent memory leaks
onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
  geoJsonLayer.value = null;
  bordersLayer.value = null;
});

const loadGeoJsonData = async () => {
  try {
    isDataLoading.value = true;
    const response = await fetch('/countries.geojson');
    if (!response.ok) {
      throw new Error('Failed to load GeoJSON data');
    }
    const data = await response.json();
    geoJsonData.value = data;

    // Extract country names from GeoJSON
    geoJsonCountryNames.value = data.features
      .map((f: any) => f.properties?.name)
      .filter((name: string | undefined): name is string => !!name);

    isDataLoading.value = false;
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unknown error';
    isDataLoading.value = false;
  }
};

const initializeMap = () => {
  if (!mapContainer.value) return;

  // Initialize the map with world view
  map.value = L.map(mapContainer.value).setView([20, 0], 2);

  // Use Stadia Alidade Smooth (no labels) - shows only land/water with no state boundaries
  L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 20,
  }).addTo(map.value);

  // Draw all country borders from GeoJSON with darker lines (no state boundaries)
  if (geoJsonData.value) {
    bordersLayer.value = L.geoJSON(geoJsonData.value, {
      style: () => ({
        color: '#888888',
        weight: 1.5,
        fillColor: 'transparent',
        fillOpacity: 0,
      }),
    }).addTo(map.value);
  }
};

const generateQuiz = () => {
  if (!geoJsonCountryNames.value.length) return;

  // Pick a random target country
  const randomIndex = Math.floor(Math.random() * geoJsonCountryNames.value.length);
  const pickedCountry = geoJsonCountryNames.value[randomIndex];
  if (!pickedCountry) return;
  targetCountryName.value = pickedCountry;

  // Generate 3 wrong options
  const wrongOptions: string[] = [];
  const availableNames = geoJsonCountryNames.value.filter((name) => name !== targetCountryName.value);

  while (wrongOptions.length < 3 && availableNames.length > 0) {
    const idx = Math.floor(Math.random() * availableNames.length);
    const wrongOption = availableNames[idx];
    if (wrongOption) {
      wrongOptions.push(wrongOption);
    }
    availableNames.splice(idx, 1);
  }

  // Shuffle options including the correct answer
  quizOptions.value = [...wrongOptions, targetCountryName.value].sort(() => Math.random() - 0.5);

  // Reset state
  selectedCountryName.value = '';
  feedbackMessage.value = '';
  feedbackType.value = '';
};

const focusOnCountry = (countryName: string) => {
  if (!map.value || !geoJsonData.value) return;

  // Remove existing GeoJSON layer
  if (geoJsonLayer.value) {
    map.value.removeLayer(geoJsonLayer.value);
  }

  // Add GeoJSON layer with styling
  // Use transparent borders to let the base map's smooth borders show through
  // Only apply fill color to highlight countries
  geoJsonLayer.value = L.geoJSON(geoJsonData.value, {
    style: (feature: any) => {
      if (feature?.properties?.name === countryName) {
        // Target country: light red fill with no border (let base map borders show)
        return {
          color: 'transparent',
          weight: 0,
          fillColor: '#ff6b6b',
          fillOpacity: 0.4,
        };
      }
      // Other countries: completely transparent (no fill, no border)
      return {
        color: 'transparent',
        weight: 0,
        fillColor: 'transparent',
        fillOpacity: 0,
      };
    },
    onEachFeature: (feature: any, layer: any) => {
      // Add tooltip for all countries
      if (feature.properties?.name) {
        layer.bindTooltip(feature.properties.name, {
          permanent: false,
          sticky: true,
        });
      }

      // Add hover effect for non-target countries
      // Use only fill color (no border) to match the smooth base map borders
      layer.on({
        mouseover: (e: any) => {
          const targetLayer = e.target;
          if (feature.properties?.name !== countryName) {
            targetLayer.setStyle({
              weight: 0,
              color: 'transparent',
              fillColor: '#b8b8b8',
              fillOpacity: 0.4,
            });
            targetLayer.bringToFront();
          }
        },
        mouseout: (e: any) => {
          if (feature.properties?.name !== countryName && geoJsonLayer.value) {
            geoJsonLayer.value.resetStyle(e.target);
          }
        },
      });
    },
  }).addTo(map.value);

  // Find the target country and zoom to it
  const targetFeature = geoJsonData.value.features.find((f: any) => f.properties?.name === countryName);

  if (targetFeature && geoJsonLayer.value) {
    // Create a temporary GeoJSON layer for the target country to get bounds
    const targetLayer = L.geoJSON(targetFeature);
    const bounds = targetLayer.getBounds();
    // Use larger padding to show surrounding countries
    map.value.fitBounds(bounds, { padding: [100, 100] });
  }
};

const handleOptionChange = () => {
  if (selectedCountryName.value) {
    focusOnCountry(selectedCountryName.value);
  }
};

const checkAnswer = () => {
  if (selectedCountryName.value === targetCountryName.value) {
    feedbackMessage.value = t.value.mapQuiz.correct;
    feedbackType.value = 'correct';
  } else {
    feedbackMessage.value = `${t.value.mapQuiz.incorrect} ${targetCountryName.value}`;
    feedbackType.value = 'incorrect';
  }
};

const nextQuestion = () => {
  generateQuiz();
  // Reset map view
  if (map.value) {
    map.value.setView([20, 0], 2);
    if (geoJsonLayer.value) {
      map.value.removeLayer(geoJsonLayer.value);
    }
  }
};

// Watch for option changes to update the map
watch(selectedCountryName, handleOptionChange);
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <div class="container mx-auto p-4 flex-shrink-0">
      <div class="w-full max-w-4xl mx-auto">
        <router-link to="/" class="text-blue-500 hover:underline">{{ t.common.backToHome }}</router-link>
        <h2 class="text-3xl font-bold my-6 text-center">{{ t.mapQuiz.title }}</h2>
        <p class="text-center text-gray-600 mb-4">{{ t.mapQuiz.description }}</p>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isDataLoading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p>{{ t.mapQuiz.loading }}</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="loadError" class="flex-1 flex items-center justify-center">
      <div class="text-center text-red-500">
        <p>{{ loadError }}</p>
      </div>
    </div>

    <!-- Quiz Content -->
    <div v-else class="flex-1 flex flex-col overflow-hidden">
      <div class="w-full max-w-4xl mx-auto px-4 flex-shrink-0">
        <!-- Quiz Panel -->
        <div class="bg-white p-4 rounded-lg shadow mb-4">
          <h3 class="text-xl font-semibold mb-4 text-center">{{ t.mapQuiz.question }}</h3>
          
          <!-- Radio Button Options -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <label 
              v-for="option in quizOptions" 
              :key="option"
              class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              :class="{ 
                'border-blue-500 bg-blue-50': selectedCountryName === option,
                'border-gray-300': selectedCountryName !== option
              }"
            >
              <input 
                type="radio" 
                :value="option" 
                v-model="selectedCountryName"
                class="mr-3"
              >
              <span>{{ option }}</span>
            </label>
          </div>

          <!-- Feedback -->
          <div v-if="feedbackMessage" class="text-center mb-4">
            <p 
              class="text-lg font-semibold"
              :class="{
                'text-green-600': feedbackType === 'correct',
                'text-red-600': feedbackType === 'incorrect'
              }"
            >
              {{ feedbackMessage }}
            </p>
          </div>

          <!-- Action Buttons -->
          <div class="flex justify-center gap-4">
            <button 
              v-if="!feedbackMessage && selectedCountryName"
              @click="checkAnswer"
              class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded"
            >
              {{ t.mapQuiz.submit }}
            </button>
            <button 
              v-if="feedbackMessage"
              @click="nextQuestion"
              class="bg-green-700 hover:bg-green-800 text-white font-bold py-2 px-6 rounded"
            >
              {{ t.mapQuiz.next }}
            </button>
          </div>
        </div>
      </div>

      <!-- Map Container -->
      <div class="flex-1 px-4 pb-4">
        <div 
          ref="mapContainer" 
          class="w-full h-full rounded-lg shadow border border-gray-300"
          style="min-height: 400px;"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure Leaflet map renders properly */
:deep(.leaflet-container) {
  height: 100%;
  width: 100%;
  border-radius: 0.5rem;
}
</style>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from '../composables/useTranslation';

const { t } = useTranslation();

const currentIndex = ref(0);
const isFlipped = ref(false);
const disableTransition = ref(false);
const studyMode = ref<'map-to-name' | 'name-to-map'>('map-to-name');
const isLoading = ref(true);
const loadError = ref<string | null>(null);

const geoJsonData = ref<any>(null);
const geoJsonCountryNames = ref<string[]>([]);

const mapContainerFront = ref<HTMLDivElement | null>(null);
const mapContainerBack = ref<HTMLDivElement | null>(null);
const map = ref<any>(null);

onMounted(async () => {
  try {
    const response = await fetch('/countries.geojson');
    if (!response.ok) {
      throw new Error('Failed to load GeoJSON data');
    }
    const data = await response.json();
    geoJsonData.value = data;

    geoJsonCountryNames.value = data.features
      .map((f: any) => f.properties?.name)
      .filter((name: string | undefined): name is string => !!name)
      .sort();

    isLoading.value = false;

    setTimeout(() => {
      initMap();
    }, 100);
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unknown error';
    isLoading.value = false;
  }

  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});

onBeforeUnmount(() => {
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
});

const currentCountryName = computed(() => {
  if (geoJsonCountryNames.value.length === 0) return null;
  return geoJsonCountryNames.value[currentIndex.value];
});

watch(currentIndex, () => {
  if (map.value && currentCountryName.value) {
    updateMapForCountry(currentCountryName.value);
  }
});

watch(studyMode, () => {
  isFlipped.value = false;
  // Reinitialize map when mode changes
  if (map.value) {
    map.value.remove();
    map.value = null;
  }
  setTimeout(() => {
    initMap();
  }, 100);
});

const initMap = () => {
  // Use the appropriate container based on study mode
  const container = studyMode.value === 'map-to-name' ? mapContainerFront.value : mapContainerBack.value;
  if (!container) return;

  map.value = L.map(container, {
    zoomControl: true,
    attributionControl: true,
  }).setView([20, 0], 2);

  // Use CartoDB Positron (no labels)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(map.value);

  // Draw all country borders
  L.geoJSON(geoJsonData.value, {
    style: () => ({
      color: '#888888',
      weight: 1.5,
      fillColor: 'transparent',
      fillOpacity: 0,
    }),
    onEachFeature: (feature: any, layer: any) => {
      // Add tooltip for all countries in study mode
      if (feature.properties?.name) {
        layer.bindTooltip(feature.properties.name, {
          permanent: false,
          sticky: true,
        });
      }
    },
  }).addTo(map.value);

  if (currentCountryName.value) {
    updateMapForCountry(currentCountryName.value);
  }
};

const updateMapForCountry = (countryName: string) => {
  if (!map.value || !geoJsonData.value) return;

  // Remove existing highlight layer
  map.value.eachLayer((layer: any) => {
    if (layer.options?.isHighlight) {
      map.value.removeLayer(layer);
    }
  });

  // Find and highlight the country
  const targetFeature = geoJsonData.value.features.find((f: any) => f.properties?.name === countryName);

  if (targetFeature) {
    L.geoJSON(targetFeature, {
      style: () => ({
        color: 'transparent',
        weight: 0,
        fillColor: '#ff6b6b',
        fillOpacity: 0.5,
      }),
      isHighlight: true,
    } as any).addTo(map.value);

    // Zoom to the country
    const targetLayer = L.geoJSON(targetFeature);
    const bounds = targetLayer.getBounds();
    map.value.fitBounds(bounds, { padding: [50, 50] });
  }
};

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.code === 'ArrowLeft') {
    prevCountry();
  } else if (event.code === 'ArrowRight') {
    nextCountry();
  } else if (event.code === 'Space') {
    event.preventDefault();
    isFlipped.value = !isFlipped.value;
  }
};

const nextCountry = () => {
  if (geoJsonCountryNames.value.length === 0) return;

  if (currentIndex.value < geoJsonCountryNames.value.length - 1) {
    currentIndex.value++;
  } else {
    currentIndex.value = 0;
  }

  if (isFlipped.value) {
    disableTransition.value = true;
    isFlipped.value = false;
    setTimeout(() => {
      disableTransition.value = false;
    }, 0);
  }
};

const prevCountry = () => {
  if (geoJsonCountryNames.value.length === 0) return;

  if (currentIndex.value > 0) {
    currentIndex.value--;
  } else {
    currentIndex.value = geoJsonCountryNames.value.length - 1;
  }

  if (isFlipped.value) {
    disableTransition.value = true;
    isFlipped.value = false;
    setTimeout(() => {
      disableTransition.value = false;
    }, 0);
  }
};

const toggleFlip = () => {
  isFlipped.value = !isFlipped.value;
};

const goToCountry = (index: number) => {
  isFlipped.value = false;
  currentIndex.value = index;
};
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <div class="container mx-auto p-4 flex-shrink-0">
      <div class="w-full max-w-2xl mx-auto">
        <router-link to="/" class="text-blue-500 hover:underline">{{ t.common.backToHome }}</router-link>
        <h2 class="text-3xl font-bold my-6 text-center">{{ t.mapQuiz.studyTitle }}</h2>

        <!-- Settings -->
        <div class="mb-4 flex justify-center">
          <div>
            <label for="studyMode" class="mr-2">{{ t.study.quizMode }}:</label>
            <select
              id="studyMode"
              v-model="studyMode"
              class="p-2 border rounded-md"
            >
              <option value="map-to-name">{{ t.mapQuiz.mapToName }}</option>
              <option value="name-to-map">{{ t.mapQuiz.nameToMap }}</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p>{{ t.mapQuiz.loading }}</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="flex-1 flex items-center justify-center">
      <div class="text-center text-red-500">
        <p>{{ loadError }}</p>
      </div>
    </div>

    <!-- Content -->
    <div v-else-if="currentCountryName" class="flex-1 flex flex-col overflow-hidden">
      <div class="w-full max-w-2xl mx-auto flex-shrink-0 px-4">
        <div class="perspective-1000">
          <div
            class="relative w-full h-96 transform-style-3d cursor-pointer"
            :class="[
              { 'rotate-y-180': isFlipped },
              disableTransition ? '' : 'transition-transform duration-700'
            ]"
            @click="toggleFlip"
          >
            <!-- Card Front -->
            <div class="absolute w-full h-full backface-hidden border-2 border-gray-300 rounded-lg shadow-lg bg-gray-100 overflow-hidden">
              <!-- Map to Name: show map on front -->
              <div v-if="studyMode === 'map-to-name'" ref="mapContainerFront" class="w-full h-full"></div>
              <!-- Name to Map: show name on front -->
              <div v-else class="w-full h-full flex items-center justify-center">
                <h3 class="text-4xl font-bold text-center px-4">{{ currentCountryName }}</h3>
              </div>
            </div>

            <!-- Card Back -->
            <div class="absolute w-full h-full backface-hidden rotate-y-180 border-2 border-gray-300 rounded-lg shadow-lg bg-gray-100 overflow-hidden">
              <!-- Map to Name: show name on back -->
              <div v-if="studyMode === 'map-to-name'" class="w-full h-full flex items-center justify-center">
                <h3 class="text-4xl font-bold text-center px-4">{{ currentCountryName }}</h3>
              </div>
              <!-- Name to Map: show map on back -->
              <div v-else ref="mapContainerBack" class="w-full h-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="w-full max-w-2xl mx-auto px-4 flex-shrink-0">
        <div class="flex justify-between items-center mb-4 mt-4">
          <button
            @click="prevCountry"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {{ t.study.prev }}
          </button>
          <span class="text-lg font-semibold">
            {{ currentIndex + 1 }} / {{ geoJsonCountryNames.length }}
          </span>
          <button
            @click="nextCountry"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            {{ t.study.next }}
          </button>
        </div>
        <p class="text-sm text-gray-500 text-center mt-2">
          {{ t.study.keyboardHint }}
        </p>
      </div>

      <!-- Country List -->
      <div class="flex-1 overflow-y-auto px-4 mt-4 pb-4">
        <div class="w-full max-w-2xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          <div
            v-for="(countryName, index) in geoJsonCountryNames"
            :key="countryName"
            @click="goToCountry(index)"
            :class="{
              'border-4 border-blue-500': index === currentIndex,
              'border-4 border-transparent': index !== currentIndex,
            }"
            class="cursor-pointer rounded overflow-hidden hover:shadow-lg transition-shadow bg-gray-100 flex items-center justify-center p-2 box-border"
          >
            <span class="text-xs sm:text-sm font-medium text-center">
              {{ countryName }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}

.transform-style-3d {
  transform-style: preserve-3d;
}

.rotate-y-180 {
  transform: rotateY(180deg);
}

.backface-hidden {
  backface-visibility: hidden;
}

:deep(.leaflet-container) {
  height: 100%;
  width: 100%;
}
</style>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import AppButton from '../components/AppButton.vue';
import { useTranslation } from '../composables/useTranslation';

interface AnswerRecord {
  correct: boolean;
  selected: string;
  correctAnswer: string;
  selectedDisplay: string;
  correctDisplay: string;
}

const isValidAnswerRecord = (obj: unknown): obj is AnswerRecord => {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof (obj as AnswerRecord).correct === 'boolean' &&
    typeof (obj as AnswerRecord).selected === 'string' &&
    typeof (obj as AnswerRecord).correctAnswer === 'string' &&
    typeof (obj as AnswerRecord).selectedDisplay === 'string' &&
    typeof (obj as AnswerRecord).correctDisplay === 'string'
  );
};

const route = useRoute();
const router = useRouter();
const { t } = useTranslation();

const correctCount = computed(() => parseInt(route.query.correct as string, 10) || 0);
const totalCount = computed(() => parseInt(route.query.total as string, 10) || 0);
const timeSeconds = computed(() => parseInt(route.query.time as string, 10) || 0);
const quizFormat = computed(() => (route.query.format as string) || 'map-to-name');

const answers = ref<AnswerRecord[]>([]);
const geoJsonData = ref<GeoJSON.FeatureCollection | null>(null);
const maps: L.Map[] = [];
const mapsReady = ref(false);

onMounted(async () => {
  // Load answers from sessionStorage with validation
  const storedAnswers = sessionStorage.getItem('mapQuizAnswers');
  if (storedAnswers) {
    try {
      const parsed = JSON.parse(storedAnswers);
      if (Array.isArray(parsed) && parsed.every(isValidAnswerRecord)) {
        answers.value = parsed;
      }
    } catch {
      // Invalid JSON, ignore
    }
    sessionStorage.removeItem('mapQuizAnswers');
  }

  // Load GeoJSON data for maps
  try {
    const geoResponse = await fetch('/countries.geojson');
    if (geoResponse.ok) {
      geoJsonData.value = await geoResponse.json();
      // Wait for DOM to be ready, then initialize maps
      await nextTick();
      setTimeout(() => {
        mapsReady.value = true;
      }, 100);
    }
  } catch (error) {
    console.warn('Failed to load GeoJSON data:', error);
  }
});

onBeforeUnmount(() => {
  // Clean up maps
  for (const map of maps) {
    if (map) {
      try {
        map.remove();
      } catch {
        // Ignore cleanup errors
      }
    }
  }
  maps.length = 0;
});

const initMap = (container: HTMLElement, countryName: string) => {
  if (!geoJsonData.value || !container) return;

  // Check if container already has a map
  if (container.querySelector('.leaflet-container')) return;

  try {
    const map = L.map(container, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    }).setView([20, 0], 2);

    maps.push(map);

    // Add tile layer (no labels)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map);

    // Draw all country borders
    L.geoJSON(geoJsonData.value, {
      style: () => ({
        color: '#888888',
        weight: 1,
        fillColor: 'transparent',
        fillOpacity: 0,
      }),
    }).addTo(map);

    // Find and highlight the target country
    const targetFeature = geoJsonData.value.features.find((f) => f.properties?.name === countryName);

    if (targetFeature) {
      const highlightLayer = L.geoJSON(targetFeature, {
        style: () => ({
          color: 'transparent',
          weight: 0,
          fillColor: '#ff6b6b',
          fillOpacity: 0.5,
        }),
      }).addTo(map);

      // Zoom to the country
      const bounds = highlightLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [10, 10] });
      }
    }

    // Force map to recalculate size
    setTimeout(() => {
      map.invalidateSize();
    }, 50);
  } catch (error) {
    console.warn('Failed to initialize map:', error);
  }
};

const accuracy = computed(() => {
  if (totalCount.value === 0) return 0;
  return Math.round((correctCount.value / totalCount.value) * 100);
});

const formatLabel = computed(() => {
  return quizFormat.value === 'map-to-name' ? t.value.mapQuiz.mapToName : t.value.mapQuiz.nameToMap;
});

const goHome = () => {
  router.push('/');
};

const tryAgain = () => {
  router.push('/map-quiz');
};
</script>

<template>
  <div class="container mx-auto p-4 max-w-2xl">
    <h2 class="text-3xl font-bold my-6 text-center">{{ t.mapQuiz.resultTitle }}</h2>

    <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
      <div class="text-center mb-6">
        <div class="text-6xl font-bold text-blue-600 mb-2">{{ accuracy }}%</div>
        <p class="text-gray-600">{{ t.mapQuiz.accuracy }}</p>
      </div>

      <div class="space-y-4">
        <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
          <span class="text-gray-600">{{ t.mapQuiz.quizFormat }}</span>
          <span class="font-semibold">{{ formatLabel }}</span>
        </div>

        <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
          <span class="text-gray-600">{{ t.quizResult.correctAnswers }}</span>
          <span class="font-semibold">{{ correctCount }} / {{ totalCount }}</span>
        </div>

        <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
          <span class="text-gray-600">{{ t.quizResult.time }}</span>
          <span class="font-semibold">{{ timeSeconds }}{{ t.quizResult.seconds }}</span>
        </div>
      </div>
    </div>

    <!-- Answer History with Maps -->
    <div v-if="answers.length > 0" class="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 class="text-xl font-bold mb-4">{{ t.mapQuiz.answerHistory }}</h3>
      <div class="space-y-4">
        <div
          v-for="(answer, index) in answers"
          :key="index"
          class="p-4 rounded-lg border-l-4"
          :class="{
            'bg-green-50 border-green-500': answer.correct,
            'bg-red-50 border-red-500': !answer.correct,
          }"
        >
          <div class="flex items-start gap-4">
            <!-- Mini Map -->
            <div
              v-if="mapsReady && geoJsonData"
              :ref="(el) => { if (el) initMap(el as HTMLElement, answer.correctAnswer); }"
              class="w-32 h-24 rounded border border-gray-300 flex-shrink-0 bg-gray-100"
            ></div>
            <div v-else class="w-32 h-24 rounded border border-gray-300 flex-shrink-0 bg-gray-100 flex items-center justify-center">
              <span class="text-gray-400 text-xs">Loading...</span>
            </div>

            <!-- Answer Details -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-2">
                <span class="font-semibold text-gray-700">{{ index + 1 }}.</span>
                <span
                  class="text-sm px-2 py-0.5 rounded"
                  :class="{
                    'bg-green-200 text-green-800': answer.correct,
                    'bg-red-200 text-red-800': !answer.correct,
                  }"
                >
                  {{ answer.correct ? t.mapQuiz.correctLabel : t.mapQuiz.incorrectLabel }}
                </span>
              </div>
              <div class="text-sm text-gray-600 space-y-1">
                <div>
                  <span class="font-medium">{{ t.mapQuiz.yourAnswer }}:</span>
                  <span
                    class="ml-1"
                    :class="{ 'text-green-700 font-semibold': answer.correct, 'text-red-700': !answer.correct }"
                  >
                    {{ answer.selectedDisplay }}
                  </span>
                </div>
                <div v-if="!answer.correct">
                  <span class="font-medium">{{ t.mapQuiz.correctAnswerLabel }}:</span>
                  <span class="ml-1 text-green-700 font-semibold">{{ answer.correctDisplay }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="space-y-3">
      <AppButton @click="tryAgain" variant="primary" size="lg" full-width>
        {{ t.mapQuiz.tryAgain }}
      </AppButton>

      <AppButton @click="goHome" variant="secondary" size="lg" full-width>
        {{ t.quizResult.backToTop }}
      </AppButton>
    </div>
  </div>
</template>

<style scoped>
:deep(.leaflet-container) {
  height: 100%;
  width: 100%;
  background: #f0f0f0;
}
</style>

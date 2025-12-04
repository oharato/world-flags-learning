<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from '../composables/useTranslation';
import { useCountryNameMap } from '../composables/useCountryNameMap';
import AppButton from '../components/AppButton.vue';

const route = useRoute();
const router = useRouter();
const { t } = useTranslation();
const { loadCountryNameMap, getLocalizedName } = useCountryNameMap();

// Quiz settings from query params
const quizFormat = computed(() => (route.query.format as string) || 'map-to-name');
const numberOfQuestions = computed(() => parseInt(route.query.questions as string, 10) || 10);

// State
const isLoading = ref(true);
const loadError = ref<string | null>(null);
const geoJsonData = ref<any>(null);
const geoJsonCountryNames = ref<string[]>([]);

// Quiz state
const currentQuestionIndex = ref(0);
const questions = ref<any[]>([]);
const selectedAnswer = ref<string>('');
const answers = ref<
  { correct: boolean; selected: string; correctAnswer: string; selectedDisplay: string; correctDisplay: string }[]
>([]);
const startTime = ref(0);
const elapsedTime = ref(0);
let timer: number;

// Map refs for name-to-map mode
const mapContainers = ref<HTMLDivElement[]>([]);
const maps = ref<any[]>([]);

// Single map ref for map-to-name mode
const mainMapContainer = ref<HTMLDivElement | null>(null);
const mainMap = ref<any>(null);

onMounted(async () => {
  try {
    // Load GeoJSON data
    const geoResponse = await fetch('/countries.geojson');
    if (!geoResponse.ok) {
      throw new Error('Failed to load GeoJSON data');
    }
    const data = await geoResponse.json();
    geoJsonData.value = data;

    geoJsonCountryNames.value = data.features
      .map((f: any) => f.properties?.name)
      .filter((name: string | undefined): name is string => !!name);

    // Load localized country names
    await loadCountryNameMap(geoJsonCountryNames.value);

    generateQuestions();
    isLoading.value = false;
    startTime.value = Date.now();

    timer = setInterval(() => {
      elapsedTime.value = Math.floor((Date.now() - startTime.value) / 1000);
    }, 1000);

    // Initialize map after DOM is ready
    setTimeout(() => {
      if (quizFormat.value === 'map-to-name') {
        initMainMap();
      } else {
        initOptionMaps();
      }
    }, 100);
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unknown error';
    isLoading.value = false;
  }
});

onBeforeUnmount(() => {
  clearInterval(timer);
  if (mainMap.value) {
    mainMap.value.remove();
  }
  maps.value.forEach((m) => {
    if (m) m.remove();
  });
});

const generateQuestions = () => {
  const allCountries = [...geoJsonCountryNames.value];
  const shuffledForQuestions = [...allCountries].sort(() => Math.random() - 0.5);
  const questionCount = Math.min(numberOfQuestions.value, shuffledForQuestions.length);

  for (let i = 0; i < questionCount; i++) {
    const correctAnswer = shuffledForQuestions[i];
    // Get other countries excluding the correct answer
    const otherCountries = allCountries.filter((c) => c !== correctAnswer);
    // Shuffle the other countries and pick 3 random ones for wrong options
    const shuffledOthers = [...otherCountries].sort(() => Math.random() - 0.5);
    const wrongOptions = shuffledOthers.slice(0, 3);
    // Combine and shuffle all options
    const options = [...wrongOptions, correctAnswer].sort(() => Math.random() - 0.5);

    questions.value.push({
      correctAnswer,
      options,
    });
  }
};

const currentQuestion = computed(() => questions.value[currentQuestionIndex.value]);

const initMainMap = () => {
  if (!mainMapContainer.value || !currentQuestion.value) return;

  if (mainMap.value) {
    mainMap.value.remove();
  }

  mainMap.value = L.map(mainMapContainer.value, {
    zoomControl: true,
    attributionControl: true,
  }).setView([20, 0], 2);

  // Use CartoDB Positron (no labels) - clean map without any text
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20,
  }).addTo(mainMap.value);

  // Draw all country borders
  L.geoJSON(geoJsonData.value, {
    style: () => ({
      color: '#888888',
      weight: 1.5,
      fillColor: 'transparent',
      fillOpacity: 0,
    }),
  }).addTo(mainMap.value);

  // Highlight the correct country with red fill
  const targetFeature = geoJsonData.value.features.find(
    (f: any) => f.properties?.name === currentQuestion.value.correctAnswer
  );

  if (targetFeature) {
    L.geoJSON(targetFeature, {
      style: () => ({
        color: 'transparent',
        weight: 0,
        fillColor: '#ff6b6b',
        fillOpacity: 0.5,
      }),
    }).addTo(mainMap.value);

    // Zoom to the country
    const targetLayer = L.geoJSON(targetFeature);
    const bounds = targetLayer.getBounds();
    mainMap.value.fitBounds(bounds, { padding: [50, 50] });
  }
};

const initOptionMaps = () => {
  if (!currentQuestion.value) return;

  // Clear existing maps
  maps.value.forEach((m) => {
    if (m) m.remove();
  });
  maps.value = [];

  setTimeout(() => {
    currentQuestion.value.options.forEach((countryName: string, index: number) => {
      const container = mapContainers.value[index];
      if (!container) return;

      const map = L.map(container, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      }).setView([20, 0], 2);

      // Use CartoDB Positron (no labels)
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

      // Highlight this option's country
      const targetFeature = geoJsonData.value.features.find((f: any) => f.properties?.name === countryName);

      if (targetFeature) {
        L.geoJSON(targetFeature, {
          style: () => ({
            color: 'transparent',
            weight: 0,
            fillColor: '#ff6b6b',
            fillOpacity: 0.5,
          }),
        }).addTo(map);

        // Zoom to the country
        const targetLayer = L.geoJSON(targetFeature);
        const bounds = targetLayer.getBounds();
        map.fitBounds(bounds, { padding: [20, 20] });
      }

      maps.value[index] = map;
    });
  }, 50);
};

const selectAnswer = (answer: string) => {
  selectedAnswer.value = answer;
};

const submitAnswer = () => {
  if (!selectedAnswer.value || !currentQuestion.value) return;

  answers.value.push({
    correct: selectedAnswer.value === currentQuestion.value.correctAnswer,
    selected: selectedAnswer.value,
    correctAnswer: currentQuestion.value.correctAnswer,
    selectedDisplay: getLocalizedName(selectedAnswer.value),
    correctDisplay: getLocalizedName(currentQuestion.value.correctAnswer),
  });

  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
    selectedAnswer.value = '';

    setTimeout(() => {
      if (quizFormat.value === 'map-to-name') {
        initMainMap();
      } else {
        initOptionMaps();
      }
    }, 100);
  } else {
    // Quiz finished
    clearInterval(timer);
    // Store answers in sessionStorage to pass to result page
    sessionStorage.setItem('mapQuizAnswers', JSON.stringify(answers.value));
    router.push({
      path: '/map-quiz/result',
      query: {
        correct: answers.value.filter((a) => a.correct).length.toString(),
        total: questions.value.length.toString(),
        time: elapsedTime.value.toString(),
        format: quizFormat.value,
      },
    });
  }
};

const setMapContainerRef = (el: any, index: number) => {
  if (el) {
    mapContainers.value[index] = el;
  }
};
</script>

<template>
  <div class="container mx-auto p-4 max-w-4xl">
    <!-- Loading -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
        <p>{{ t.mapQuiz.loading }}</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="loadError" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center text-red-500">
        <p>{{ loadError }}</p>
      </div>
    </div>

    <!-- Quiz -->
    <div v-else-if="currentQuestion">
      <div class="flex justify-between items-center mb-4">
        <div class="text-xl font-bold">
          {{ t.quizPlay.question }} {{ currentQuestionIndex + 1 }} / {{ questions.length }}
        </div>
        <div class="text-xl font-bold">
          {{ t.quizPlay.elapsedTime }}: {{ elapsedTime }}{{ t.quizPlay.seconds }}
        </div>
      </div>

      <!-- Map to Name Mode -->
      <div v-if="quizFormat === 'map-to-name'">
        <div class="mb-4 border-2 border-gray-300 rounded-lg overflow-hidden" style="height: 350px;">
          <div ref="mainMapContainer" class="w-full h-full"></div>
        </div>

        <h3 class="text-xl font-semibold mb-4 text-center">{{ t.mapQuiz.selectCountryName }}</h3>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <button
            v-for="option in currentQuestion.options"
            :key="option"
            @click="selectAnswer(option)"
            class="p-4 border-2 rounded-lg text-lg font-medium transition-colors"
            :class="{
              'border-blue-500 bg-blue-50': selectedAnswer === option,
              'border-gray-300 hover:bg-gray-50': selectedAnswer !== option,
            }"
          >
            {{ getLocalizedName(option) }}
          </button>
        </div>
      </div>

      <!-- Name to Map Mode -->
      <div v-else>
        <div class="text-center mb-4 p-6 bg-gray-100 rounded-lg">
          <h3 class="text-3xl font-bold">{{ getLocalizedName(currentQuestion.correctAnswer) }}</h3>
        </div>

        <h3 class="text-xl font-semibold mb-4 text-center">{{ t.mapQuiz.selectCorrectMap }}</h3>

        <div class="grid grid-cols-2 gap-4 mb-4">
          <button
            v-for="(option, index) in currentQuestion.options"
            :key="option"
            @click="selectAnswer(option)"
            class="border-2 rounded-lg overflow-hidden transition-colors"
            :class="{
              'border-blue-500 ring-2 ring-blue-500': selectedAnswer === option,
              'border-gray-300 hover:border-gray-400': selectedAnswer !== option,
            }"
            style="height: 200px;"
          >
            <div :ref="(el) => setMapContainerRef(el, index)" class="w-full h-full"></div>
          </button>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="flex justify-center">
        <AppButton
          @click="submitAnswer"
          variant="primary"
          size="lg"
          :disabled="!selectedAnswer"
        >
          {{ t.mapQuiz.submit }}
        </AppButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.leaflet-container) {
  height: 100%;
  width: 100%;
}
</style>

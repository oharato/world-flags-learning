<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppButton from '../components/AppButton.vue';
import { useTranslation } from '../composables/useTranslation';

const router = useRouter();
const { t } = useTranslation();

const quizFormat = ref<'map-to-name' | 'name-to-map'>('map-to-name');
const numberOfQuestions = ref(10);
const isLoading = ref(true);
const geoJsonData = ref<any>(null);
const loadError = ref<string | null>(null);

onMounted(async () => {
  try {
    const response = await fetch('/countries.geojson');
    if (!response.ok) {
      throw new Error('Failed to load GeoJSON data');
    }
    geoJsonData.value = await response.json();
    isLoading.value = false;
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Unknown error';
    isLoading.value = false;
  }
});

const startQuiz = () => {
  router.push({
    path: '/map-quiz/play',
    query: {
      format: quizFormat.value,
      questions: numberOfQuestions.value.toString(),
    },
  });
};
</script>

<template>
  <div class="container mx-auto p-4 max-w-lg">
    <router-link to="/" class="text-blue-500 hover:underline">{{ t.common.backToHome }}</router-link>
    <h2 class="text-3xl font-bold my-6 text-center">{{ t.mapQuiz.setupTitle }}</h2>

    <form @submit.prevent="startQuiz" class="space-y-6">
      <div>
        <label class="block text-lg font-medium text-gray-700 mb-2">{{ t.mapQuiz.quizFormat }}</label>
        <div class="space-y-2">
          <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            :class="{ 'border-blue-500 bg-blue-50': quizFormat === 'map-to-name' }">
            <input type="radio" value="map-to-name" v-model="quizFormat" class="mr-3" />
            <span>{{ t.mapQuiz.mapToName }}</span>
          </label>
          <label class="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
            :class="{ 'border-blue-500 bg-blue-50': quizFormat === 'name-to-map' }">
            <input type="radio" value="name-to-map" v-model="quizFormat" class="mr-3" />
            <span>{{ t.mapQuiz.nameToMap }}</span>
          </label>
        </div>
      </div>

      <div>
        <label for="numQuestions" class="block text-sm font-medium text-gray-700 mb-1">{{ t.quizSetup.numberOfQuestions }}</label>
        <select
          id="numQuestions"
          v-model.number="numberOfQuestions"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option :value="5">{{ t.quizSetup.questions5 }}</option>
          <option :value="10">{{ t.quizSetup.questions10 }}</option>
          <option :value="30">{{ t.quizSetup.questions30 }}</option>
          <option :value="999">{{ t.quizSetup.questionsAll }}</option>
        </select>
      </div>

      <div>
        <AppButton
          type="submit"
          variant="secondary"
          size="lg"
          full-width
          :disabled="isLoading || !!loadError"
        >
          <span v-if="isLoading">{{ t.quizSetup.preparingData }}</span>
          <span v-else-if="loadError">{{ t.quizSetup.error }}</span>
          <span v-else>{{ t.quizSetup.start }}</span>
        </AppButton>
      </div>
    </form>
  </div>
</template>

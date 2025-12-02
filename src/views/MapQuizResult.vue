<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppButton from '../components/AppButton.vue';
import { useTranslation } from '../composables/useTranslation';

const route = useRoute();
const router = useRouter();
const { t } = useTranslation();

const correctCount = computed(() => parseInt(route.query.correct as string, 10) || 0);
const totalCount = computed(() => parseInt(route.query.total as string, 10) || 0);
const timeSeconds = computed(() => parseInt(route.query.time as string, 10) || 0);
const quizFormat = computed(() => (route.query.format as string) || 'map-to-name');

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
  <div class="container mx-auto p-4 max-w-lg">
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

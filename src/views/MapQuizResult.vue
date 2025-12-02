<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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

onMounted(() => {
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
});

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

    <!-- Answer History -->
    <div v-if="answers.length > 0" class="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h3 class="text-xl font-bold mb-4">{{ t.mapQuiz.answerHistory }}</h3>
      <div class="space-y-3">
        <div
          v-for="(answer, index) in answers"
          :key="index"
          class="p-3 rounded border-l-4"
          :class="{
            'bg-green-50 border-green-500': answer.correct,
            'bg-red-50 border-red-500': !answer.correct,
          }"
        >
          <div class="flex items-center gap-2 mb-1">
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
          <div class="text-sm text-gray-600">
            <div>
              <span class="font-medium">{{ t.mapQuiz.yourAnswer }}:</span>
              <span :class="{ 'text-green-700': answer.correct, 'text-red-700': !answer.correct }">
                {{ answer.selectedDisplay }}
              </span>
            </div>
            <div v-if="!answer.correct">
              <span class="font-medium">{{ t.mapQuiz.correctAnswerLabel }}:</span>
              <span class="text-green-700">{{ answer.correctDisplay }}</span>
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

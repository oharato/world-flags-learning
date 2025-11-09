<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useQuizStore } from '../store/quiz';
import { useRankingStore } from '../store/ranking';
import { useCountriesStore } from '../store/countries';

const router = useRouter();
const quizStore = useQuizStore();
const rankingStore = useRankingStore();
const countriesStore = useCountriesStore(); // countriesStoreを初期化

onMounted(() => {
  if (quizStore.endTime === 0) {
    // クイズが終了していないのにこの画面に来た場合はリダイレクト
    router.push('/quiz');
    return;
  }
  // 選択した地域とクイズ形式でランキングにスコアを登録
  rankingStore.submitScore(quizStore.nickname, quizStore.finalScore, quizStore.quizRegion, quizStore.quizFormat);
});

const goToRanking = () => {
  // クイズ設定をURLパラメータとしてランキング画面に渡す
  router.push({
    path: '/ranking',
    query: {
      region: quizStore.quizRegion,
      format: quizStore.quizFormat,
      type: 'daily'
    }
  });
};

const goToHome = () => {
  router.push('/');
};

// 回答履歴から選択肢のCountryオブジェクトを取得するヘルパー
const getCountryById = (id: string) => {
  return countriesStore.countries.find(c => c.id === id);
};

// クイズ形式の表示名を取得
const getQuizFormatLabel = (format: string) => {
  return format === 'flag-to-name' ? '国旗 → 国名' : '国名 → 国旗';
};

// 地域の表示名を取得
const getRegionLabel = (region: string) => {
  const regionMap: Record<string, string> = {
    'all': '全世界',
    'Africa': 'アフリカ',
    'Asia': 'アジア',
    'Europe': 'ヨーロッパ',
    'North America': '北アメリカ',
    'South America': '南アメリカ',
    'Oceania': 'オセアニア',
  };
  return regionMap[region] || region;
};
</script>

<template>
  <div class="container mx-auto p-4 max-w-3xl text-center">
    <h2 class="text-4xl font-bold my-8">結果発表</h2>

    <!-- クイズ設定表示 -->
    <div class="mb-6 p-4 bg-gray-50 border border-gray-300 rounded-lg">
      <h3 class="text-xl font-bold mb-3">クイズ設定</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div class="text-gray-600">ニックネーム</div>
          <div class="font-semibold">{{ quizStore.nickname }}</div>
        </div>
        <div>
          <div class="text-gray-600">クイズ形式</div>
          <div class="font-semibold">{{ getQuizFormatLabel(quizStore.quizFormat) }}</div>
        </div>
        <div>
          <div class="text-gray-600">出題範囲</div>
          <div class="font-semibold">{{ getRegionLabel(quizStore.quizRegion) }}</div>
        </div>
        <div>
          <div class="text-gray-600">問題数</div>
          <div class="font-semibold">{{ quizStore.questions.length }}問</div>
        </div>
      </div>
    </div>

    <div class="space-y-6 bg-white p-8 border-2 border-gray-300 rounded-lg shadow-lg">
      <div class="text-2xl">
        正解数: <span class="font-bold text-3xl">{{ quizStore.correctAnswers }} / {{ quizStore.questions.length }}</span> 問
      </div>
      <div class="text-2xl">
        タイム: <span class="font-bold text-3xl">{{ quizStore.totalTime.toFixed(2) }}</span> 秒
      </div>
      <div class="text-3xl font-bold text-indigo-600">
        スコア: <span class="text-5xl">{{ quizStore.finalScore }}</span> pt
      </div>
    </div>

    <div class="mt-10 text-left">
      <h3 class="text-2xl font-bold mb-4">回答詳細</h3>
      <div class="space-y-6">
        <div v-for="(record, index) in quizStore.answerHistory" :key="index" class="p-4 border rounded-lg shadow-sm" :class="{ 'bg-green-50': record.isCorrect, 'bg-red-50': !record.isCorrect }">
          <p class="font-bold text-lg mb-2">問題 {{ index + 1 }}</p>
          <div class="flex items-center mb-2">
            <span class="inline-block w-28 text-right mr-2">問題:</span>
            <img v-if="record.question.questionType === 'flag-to-name'" :src="record.question.correctAnswer.flag_image_url" :alt="record.question.correctAnswer.name" class="h-12 w-auto object-contain border mr-2">
            <span v-else class="font-semibold">{{ record.question.correctAnswer.name }}</span>
          </div>
          <div class="flex items-center mb-2">
            <span class="inline-block w-28 text-right mr-2">あなたの回答:</span>
            <template v-if="record.question.questionType === 'flag-to-name'">
              <span :class="{ 'text-green-700 font-bold': record.isCorrect, 'text-red-700 font-bold': !record.isCorrect }">
                {{ getCountryById(record.selectedAnswerId)?.name || '不明' }}
              </span>
            </template>
            <template v-else>
              <img :src="getCountryById(record.selectedAnswerId)?.flag_image_url || ''" :alt="getCountryById(record.selectedAnswerId)?.name || '不明'" class="h-12 w-auto object-contain border mr-2" :class="{ 'border-green-500': record.isCorrect, 'border-red-500': !record.isCorrect }">
            </template>
          </div>
          <div v-if="!record.isCorrect" class="flex items-center">
            <span class="inline-block w-28 text-right mr-2">正解:</span>
            <template v-if="record.question.questionType === 'flag-to-name'">
              <span class="text-green-700 font-bold">{{ record.question.correctAnswer.name }}</span>
            </template>
            <template v-else>
              <img :src="record.question.correctAnswer.flag_image_url" :alt="record.question.correctAnswer.name" class="h-12 w-auto object-contain border border-green-500 mr-2">
            </template>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-10 space-y-4">
      <button @click="goToRanking" class="w-full max-w-sm mx-auto bg-purple-500 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg text-lg">
        ランキングを見る
      </button>
      <button @click="goToHome" class="w-full max-w-sm mx-auto bg-gray-500 hover:bg-gray-700 text-white font-bold py-3 px-4 rounded-lg text-lg">
        トップに戻る
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useQuizStore, type QuizFormat, type QuizRegion } from '../store/quiz';
import { useCountriesStore } from '../store/countries';
import type { Language } from '../store/countries'; // Language型をインポート

const router = useRouter();
const quizStore = useQuizStore();
const countriesStore = useCountriesStore();

// localStorageからニックネームを読み込む
const NICKNAME_STORAGE_KEY = 'quiz_nickname';
const savedNickname = localStorage.getItem(NICKNAME_STORAGE_KEY);
const nickname = ref(savedNickname || quizStore.nickname);
const quizFormat = ref<QuizFormat>(quizStore.quizFormat);
const quizRegion = ref<QuizRegion>(quizStore.quizRegion);
const numberOfQuestions = ref(quizStore.numberOfQuestions); // 問題数を追加

// 大陸名の多言語マッピング（英語→表示名）
const continentNames: Record<Language, Record<string, string>> = {
  ja: {
    'Africa': 'アフリカ',
    'アフリカ': 'アフリカ',
    'Asia': 'アジア',
    'アジア': 'アジア',
    'Europe': 'ヨーロッパ',
    'ヨーロッパ': 'ヨーロッパ',
    'North America': '北アメリカ',
    '北アメリカ': '北アメリカ',
    'South America': '南アメリカ',
    '南アメリカ': '南アメリカ',
    'Oceania': 'オセアニア',
    'オセアニア': 'オセアニア',
    'Antarctica': '南極',
    '南極': '南極',
    'all': '全世界',
  },
  en: {
    'Africa': 'Africa',
    'アフリカ': 'Africa',
    'Asia': 'Asia',
    'アジア': 'Asia',
    'Europe': 'Europe',
    'ヨーロッパ': 'Europe',
    'North America': 'North America',
    '北アメリカ': 'North America',
    'South America': 'South America',
    '南アメリカ': 'South America',
    'Oceania': 'Oceania',
    'オセアニア': 'Oceania',
    'Antarctica': 'Antarctica',
    '南極': 'Antarctica',
    'all': 'All World',
  },
};

// 大陸の正規化マップ（英語版に統一）
const normalizeContinentMap: Record<string, string> = {
  'Africa': 'Africa',
  'アフリカ': 'Africa',
  'Asia': 'Asia',
  'アジア': 'Asia',
  'Europe': 'Europe',
  'ヨーロッパ': 'Europe',
  'North America': 'North America',
  '北アメリカ': 'North America',
  'South America': 'South America',
  '南アメリカ': 'South America',
  'Oceania': 'Oceania',
  'オセアニア': 'Oceania',
  'Antarctica': 'Antarctica',
  '南極': 'Antarctica',
};

// 国データがないとクイズが始められないので、ここで読み込んでおく
onMounted(() => {
  countriesStore.fetchCountries();
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

// キーボードショートカット: Ctrl+Enter でクイズ開始
const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    startQuiz();
  }
};

// 利用可能な大陸のリストを計算（重複を除去して正規化）
const availableContinents = computed(() => {
  const continents = new Set<string>();
  countriesStore.countries.forEach(country => {
    if (country.continent && country.continent !== 'N/A') {
      // 大陸名を正規化（英語版または日本語版どちらでも同じキーにマップ）
      const normalized = normalizeContinentMap[country.continent] || country.continent;
      continents.add(normalized);
    }
  });
  return Array.from(continents).sort();
});

// 表示用の大陸名を取得するヘルパー
const getDisplayContinentName = (continent: string) => {
  return continentNames[countriesStore.currentLanguage][continent] || continent;
};

// ニックネームのバリデーション
const validateNickname = (name: string): { valid: boolean; error?: string } => {
  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'ニックネームを入力してください。' };
  }
  
  if (trimmed.length > 20) {
    return { valid: false, error: 'ニックネームは20文字以内で入力してください。' };
  }
  
  // 危険な文字をチェック（HTMLタグ、スクリプトインジェクション対策）
  if (/<|>|&lt;|&gt;|<script|javascript:|on\w+=/i.test(trimmed)) {
    return { valid: false, error: 'ニックネームに使用できない文字が含まれています。' };
  }
  
  // 制御文字をチェック
  if (/[\x00-\x1F\x7F-\x9F]/.test(trimmed)) {
    return { valid: false, error: 'ニックネームに使用できない文字が含まれています。' };
  }
  
  return { valid: true };
};

const startQuiz = () => {
  const validation = validateNickname(nickname.value);
  
  if (!validation.valid) {
    alert(validation.error);
    return;
  }
  
  // ニックネームをトリミングして保存
  const sanitizedNickname = nickname.value.trim();
  localStorage.setItem(NICKNAME_STORAGE_KEY, sanitizedNickname);
  quizStore.setupQuiz(sanitizedNickname, quizFormat.value, quizRegion.value, numberOfQuestions.value);
  router.push('/quiz/play');
};
</script>

<template>
  <div class="container mx-auto p-4 max-w-lg">
    <router-link to="/" class="text-blue-500 hover:underline">&lt; トップページに戻る</router-link>
    <h2 class="text-3xl font-bold my-6 text-center">クイズ設定</h2>

    <form @submit.prevent="startQuiz" class="space-y-6">
      <div>
        <label for="nickname" class="block text-lg font-medium text-gray-700">ニックネーム（最大20文字）</label>
        <input
          type="text"
          id="nickname"
          v-model="nickname"
          maxlength="20"
          class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="ニックネームを入力"
        />
      </div>

      <div>
        <label class="block text-lg font-medium text-gray-700">クイズ形式</label>
        <div class="mt-2 space-y-2">
          <label class="inline-flex items-center">
            <input type="radio" class="form-radio" name="quizFormat" value="flag-to-name" v-model="quizFormat">
            <span class="ml-2">国旗を見て国名を選ぶ</span>
          </label>
          <br>
          <label class="inline-flex items-center">
            <input type="radio" class="form-radio" name="quizFormat" value="name-to-flag" v-model="quizFormat">
            <span class="ml-2">国名を見て国旗を選ぶ</span>
          </label>
        </div>
      </div>

      <div>
        <label for="region" class="block text-lg font-medium text-gray-700">出題範囲</label>
        <select
          id="region"
          v-model="quizRegion"
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="all">{{ getDisplayContinentName('all') }}</option>
          <option v-for="continent in availableContinents" :key="continent" :value="continent">
            {{ getDisplayContinentName(continent) }}
          </option>
        </select>
      </div>

      <div>
        <label for="numQuestions" class="block text-lg font-medium text-gray-700">問題数</label>
        <select
          id="numQuestions"
          v-model.number="numberOfQuestions"
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option :value="5">5問</option>
          <option :value="10">10問</option>
          <option :value="30">30問</option>
          <option :value="999">すべて</option>
        </select>
      </div>

      <div>
        <button
          type="submit"
          :disabled="countriesStore.loading || !!countriesStore.error || countriesStore.countries.length === 0"
          class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
        >
          <span v-if="countriesStore.loading">データ準備中...</span>
          <span v-else-if="countriesStore.error">エラー発生</span>
          <span v-else-if="countriesStore.countries.length === 0">データなし</span>
          <span v-else>スタート</span>
        </button>
        <p class="mt-2 text-sm text-gray-500 text-center">ヒント: Ctrl+Enter でクイズ開始</p>
      </div>
    </form>
  </div>
</template>

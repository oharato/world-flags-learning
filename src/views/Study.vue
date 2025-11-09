<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'; // watchをインポート
import { useCountriesStore } from '../store/countries';
import type { Country } from '../store/countries'; // Country型をインポート

const countriesStore = useCountriesStore();

const currentIndex = ref(0);
const isFlipped = ref(false);
const selectedRegion = ref('all'); // 選択された地域を保持

onMounted(() => {
  countriesStore.fetchCountries(true); // 強制的に再読み込みする
  // キーボードイベントリスナーを追加
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  // コンポーネントがアンマウントされたときにイベントリスナーを削除
  window.removeEventListener('keydown', handleKeyDown);
});

const handleKeyDown = (event: KeyboardEvent) => {
  if (event.code === 'ArrowLeft') {
    prevCountry();
  } else if (event.code === 'ArrowRight') {
    nextCountry();
  } else if (event.code === 'Space') {
    event.preventDefault(); // スペースキーによるスクロールを防ぐ
    isFlipped.value = !isFlipped.value;
  }
};

// 利用可能な大陸のリストを計算 (QuizSetup.vue と同様)
const availableContinents = computed(() => {
  const continents = new Set<string>();
  countriesStore.countries.forEach(country => {
    if (country.continent && country.continent !== 'N/A') {
      continents.add(country.continent);
    }
  });
  return Array.from(continents).sort();
});

// 選択された地域に基づいて国をフィルタリング
const filteredCountries = computed<Country[]>(() => {
  if (selectedRegion.value === 'all') {
    return countriesStore.countries;
  }
  return countriesStore.countries.filter(country => country.continent === selectedRegion.value);
});

// フィルタリングされた国リストの現在の国
const currentCountry = computed(() => {
  if (filteredCountries.value.length === 0) {
    return null;
  }
  return filteredCountries.value[currentIndex.value];
});

// selectedRegionが変更されたらcurrentIndexをリセット
watch(selectedRegion, () => {
  currentIndex.value = 0;
  isFlipped.value = false; // 地域が変わったらカードを表面に戻す
});

const nextCountry = () => {
  if (filteredCountries.value.length === 0) return;
  if (currentIndex.value < filteredCountries.value.length - 1) {
    currentIndex.value++;
  } else {
    currentIndex.value = 0; // ループさせる
  }
};

const prevCountry = () => {
  if (filteredCountries.value.length === 0) return;
  if (currentIndex.value > 0) {
    currentIndex.value--;
  } else {
    currentIndex.value = filteredCountries.value.length - 1; // ループさせる
  }
};

const formatCapital = (capital: string | string[]) => {
  if (Array.isArray(capital)) {
    return capital[0];
  }
  return capital;
};
</script>

<template>
  <div class="container mx-auto p-4 flex flex-col items-center">
    <div class="w-full max-w-2xl">
      <router-link to="/" class="text-blue-500 hover:underline">&lt; トップページに戻る</router-link>
      <h2 class="text-3xl font-bold my-6 text-center">学習モード</h2>

      <!-- 大陸選択ドロップダウンを追加 -->
      <div class="mb-4 text-right">
        <label for="studyRegion" class="mr-2">出題範囲:</label>
        <select
          id="studyRegion"
          v-model="selectedRegion"
          class="p-2 border rounded-md"
        >
          <option value="all">全世界</option>
          <option v-for="continent in availableContinents" :key="continent" :value="continent">
            {{ continent }}
          </option>
        </select>
      </div>
    </div>

    <div v-if="countriesStore.loading" class="text-center py-10">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
      <p>データを読み込み中...</p>
    </div>

    <div v-else-if="countriesStore.error" class="text-center py-10 text-red-500">
      <p>データの読み込みに失敗しました: {{ countriesStore.error }}</p>
      <button @click="countriesStore.fetchCountries(true)" class="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
        再試行
      </button>
    </div>

    <div v-else-if="currentCountry" class="w-full max-w-2xl">
      <div class="perspective-1000">
        <div 
          class="relative w-full h-96 transition-transform duration-700 transform-style-3d"
          :class="{ 'rotate-y-180': isFlipped }"
          @click="isFlipped = !isFlipped"
        >
          <!-- Card Front -->
          <div class="absolute w-full h-full backface-hidden border-2 border-gray-300 rounded-lg shadow-lg flex items-center justify-center p-4 bg-white">
            <img :src="currentCountry.flag_image_url" :alt="`${currentCountry.name}の国旗`" class="max-w-full max-h-full object-contain" loading="eager" fetchpriority="high">
          </div>
          <!-- Card Back -->
          <div class="absolute w-full h-full backface-hidden rotate-y-180 border-2 border-gray-300 rounded-lg shadow-lg p-6 bg-gray-100 relative flex flex-col">
            <h3 class="text-2xl font-bold mb-2">{{ currentCountry.name }}</h3>
            <p><strong>首都:</strong> {{ formatCapital(currentCountry.capital) }}</p>
            <p><strong>大陸:</strong> {{ currentCountry.continent }}</p>
            <div v-if="currentCountry.map_image_url" class="absolute top-4 right-4 w-24 h-auto border border-gray-300 bg-white p-1 shadow-md">
              <img :src="currentCountry.map_image_url" :alt="`${currentCountry.name}の地図`" class="max-w-full max-h-full object-contain" loading="eager">
            </div>
            <hr class="my-4">
            <h4 class="font-bold mt-4">概要</h4>
            <p class="text-sm line-clamp-3" @click.stop :title="currentCountry.summary">{{ currentCountry.summary }}</p>
            <h4 class="font-bold mt-4">国旗の由来</h4>
            <p class="text-sm line-clamp-3" @click.stop :title="currentCountry.description || '情報がありません'">{{ currentCountry.description || '情報がありません' }}</p>
          </div>
        </div>
      </div>

      <div class="flex justify-between mt-8">
        <button @click.stop="prevCountry" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded">
          &lt; 前へ
        </button>
        <button @click.stop="nextCountry" class="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded">
          次へ &gt;
        </button>
      </div>
       <div class="text-center mt-4 text-gray-600">
        {{ currentIndex + 1 }} / {{ filteredCountries.length }}
      </div>
    </div>
    <div v-else class="text-center">
      <p>国データが見つかりません。</p>
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
.backface-hidden {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.rotate-y-180 {
  transform: rotateY(180deg);
}
</style>

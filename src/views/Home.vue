<script setup lang="ts">
import { useCountriesStore, type Language } from '../store/countries';
import { ref, watch } from 'vue';

const countriesStore = useCountriesStore();
const selectedLanguage = ref<Language>(countriesStore.currentLanguage);

watch(selectedLanguage, (newLang) => {
  countriesStore.setLanguage(newLang);
});
</script>

<template>
  <div class="container mx-auto p-4 text-center">
    <div class="flex justify-end mb-4">
      <select v-model="selectedLanguage" class="p-2 border rounded">
        <option value="ja">日本語</option>
        <option value="en">English</option>
      </select>
    </div>

    <h1 class="text-4xl font-bold my-8">国旗学習アプリ</h1>
    <div class="space-y-4">
      <router-link to="/quiz" class="block w-full max-w-sm mx-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        クイズに挑戦する
      </router-link>
      <router-link to="/study" class="block w-full max-w-sm mx-auto bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
        国旗を学習する
      </router-link>
      <router-link to="/ranking" class="block w-full max-w-sm mx-auto bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded">
        ランキングを見る
      </router-link>
    </div>
  </div>
</template>
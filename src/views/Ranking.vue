<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRankingStore, type RankingType, type QuizFormat } from '../store/ranking';

const route = useRoute();
const router = useRouter();
const rankingStore = useRankingStore();

// URLパラメータから初期値を取得、なければストアまたはデフォルト値を使用
const selectedRegion = ref((route.query.region as string) || rankingStore.currentRegion || 'all');
const selectedType = ref<RankingType>((route.query.type as RankingType) || rankingStore.currentType || 'daily');
const selectedFormat = ref<QuizFormat>((route.query.format as QuizFormat) || rankingStore.currentFormat || 'flag-to-name');

// 大陸リスト
const regions = [
  { value: 'all', label: '全世界' },
  { value: 'Africa', label: 'アフリカ' },
  { value: 'Asia', label: 'アジア' },
  { value: 'Europe', label: 'ヨーロッパ' },
  { value: 'North America', label: '北アメリカ' },
  { value: 'South America', label: '南アメリカ' },
  { value: 'Oceania', label: 'オセアニア' },
];

onMounted(() => {
  rankingStore.fetchRanking(selectedRegion.value, selectedType.value, selectedFormat.value);
});

// 画面を離れるときに自分のランク情報をクリアする
onUnmounted(() => {
  rankingStore.myRank = null;
});

// 地域、表示タイプ、形式が変わったらランキングを再取得してURLも更新
watch([selectedRegion, selectedType, selectedFormat], () => {
  rankingStore.fetchRanking(selectedRegion.value, selectedType.value, selectedFormat.value);
  
  // URLパラメータを更新（履歴には残さない）
  router.replace({
    path: '/ranking',
    query: {
      region: selectedRegion.value,
      type: selectedType.value,
      format: selectedFormat.value
    }
  });
});

// 日時をフォーマット
const formatDateTime = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
</script>

<template>
  <div class="container mx-auto p-4 max-w-4xl">
    <router-link to="/" class="text-blue-500 hover:underline">&lt; トップページに戻る</router-link>
    <h2 class="text-3xl font-bold my-6 text-center">ランキング</h2>

    <!-- 地域選択、表示タイプ選択、形式選択 -->
    <div class="flex flex-col md:flex-row gap-4 mb-6 bg-white p-4 rounded-lg shadow">
      <div class="flex-1">
        <label for="region" class="block text-sm font-medium text-gray-700 mb-1">地域</label>
        <select
          id="region"
          v-model="selectedRegion"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option v-for="region in regions" :key="region.value" :value="region.value">
            {{ region.label }}
          </option>
        </select>
      </div>
      <div class="flex-1">
        <label for="type" class="block text-sm font-medium text-gray-700 mb-1">表示</label>
        <select
          id="type"
          v-model="selectedType"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="daily">今日のランキング</option>
          <option value="all_time">歴代トップ5</option>
        </select>
      </div>
      <div class="flex-1">
        <label for="format" class="block text-sm font-medium text-gray-700 mb-1">クイズ形式</label>
        <select
          id="format"
          v-model="selectedFormat"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="flag-to-name">国旗 → 国名</option>
          <option value="name-to-flag">国名 → 国旗</option>
        </select>
      </div>
    </div>

    <div v-if="rankingStore.loading" class="text-center">
      <p>ランキングを読み込み中...</p>
    </div>
    <div v-else-if="rankingStore.error" class="text-center text-red-500">
      <p>{{ rankingStore.error }}</p>
    </div>
    <div v-else-if="rankingStore.ranking.length > 0" class="overflow-x-auto">
      <table class="min-w-full bg-white border border-gray-300">
        <thead class="bg-gray-100">
          <tr>
            <th class="py-3 px-6 text-left text-lg font-medium text-gray-600">順位</th>
            <th class="py-3 px-6 text-left text-lg font-medium text-gray-600">ニックネーム</th>
            <th class="py-3 px-6 text-left text-lg font-medium text-gray-600">スコア</th>
            <th class="py-3 px-6 text-left text-lg font-medium text-gray-600">登録日時</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="item in rankingStore.ranking"
            :key="item.rank"
            class="border-b"
            :class="{ 'bg-yellow-200': rankingStore.myRank && rankingStore.myRank.nickname === item.nickname && rankingStore.myRank.score === item.score }"
          >
            <td class="py-4 px-6 text-xl font-bold">
              <span v-if="item.rank === 1">🥇</span>
              <span v-else-if="item.rank === 2">🥈</span>
              <span v-else-if="item.rank === 3">🥉</span>
              <span v-else>{{ item.rank }}</span>
            </td>
            <td class="py-4 px-6 text-lg">{{ item.nickname }}</td>
            <td class="py-4 px-6 text-lg font-semibold">{{ item.score }} pt</td>
            <td class="py-4 px-6 text-sm text-gray-600">{{ formatDateTime(item.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else class="text-center">
      <p>まだランキングデータがありません。</p>
    </div>
  </div>
</template>

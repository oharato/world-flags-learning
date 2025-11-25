<script setup lang="ts">
import { useTranslation } from '../composables/useTranslation';

const { t } = useTranslation();

// Privacy policy last updated date - update this when the policy changes
const PRIVACY_POLICY_LAST_UPDATED = '2025-06-09';
</script>

<template>
  <div class="container mx-auto p-4 max-w-4xl">
    <router-link to="/" class="text-blue-500 hover:underline">{{ t.common.backToHome }}</router-link>
    <h1 class="text-3xl font-bold my-6 text-center">{{ t.privacyPolicy.title }}</h1>

    <div class="bg-white rounded-lg shadow p-6 space-y-6">
      <!-- 最終更新日 -->
      <p class="text-sm text-gray-500 text-right">{{ t.privacyPolicy.lastUpdated }}: {{ PRIVACY_POLICY_LAST_UPDATED }}</p>

      <!-- はじめに -->
      <section>
        <h2 class="text-xl font-semibold mb-3 border-b border-gray-200 pb-2">{{ t.privacyPolicy.introductionTitle }}</h2>
        <p class="text-gray-700 leading-relaxed">{{ t.privacyPolicy.introductionText }}</p>
      </section>

      <!-- 収集する情報 -->
      <section>
        <h2 class="text-xl font-semibold mb-3 border-b border-gray-200 pb-2">{{ t.privacyPolicy.dataCollectedTitle }}</h2>
        <p class="text-gray-700 mb-3">{{ t.privacyPolicy.dataCollectedIntro }}</p>
        <ul class="list-disc list-inside text-gray-700 space-y-2 ml-4">
          <li>{{ t.privacyPolicy.dataItem1 }}</li>
          <li>{{ t.privacyPolicy.dataItem2 }}</li>
          <li>{{ t.privacyPolicy.dataItem3 }}</li>
          <li>{{ t.privacyPolicy.dataItem4 }}</li>
          <li>{{ t.privacyPolicy.dataItem5 }}</li>
        </ul>
      </section>

      <!-- 情報の利用目的 -->
      <section>
        <h2 class="text-xl font-semibold mb-3 border-b border-gray-200 pb-2">{{ t.privacyPolicy.purposeTitle }}</h2>
        <p class="text-gray-700 mb-3">{{ t.privacyPolicy.purposeIntro }}</p>
        <ul class="list-disc list-inside text-gray-700 space-y-2 ml-4">
          <li>{{ t.privacyPolicy.purposeItem1 }}</li>
          <li>{{ t.privacyPolicy.purposeItem2 }}</li>
          <li>{{ t.privacyPolicy.purposeItem3 }}</li>
        </ul>
      </section>

      <!-- アナリティクス -->
      <section>
        <h2 class="text-xl font-semibold mb-3 border-b border-gray-200 pb-2">{{ t.privacyPolicy.analyticsTitle }}</h2>
        <p class="text-gray-700 leading-relaxed">{{ t.privacyPolicy.analyticsText }}</p>
      </section>

      <!-- Cookieについて -->
      <section>
        <h2 class="text-xl font-semibold mb-3 border-b border-gray-200 pb-2">{{ t.privacyPolicy.cookiesTitle }}</h2>
        <p class="text-gray-700 leading-relaxed">{{ t.privacyPolicy.cookiesText }}</p>
      </section>

      <!-- データの保存 -->
      <section>
        <h2 class="text-xl font-semibold mb-3 border-b border-gray-200 pb-2">{{ t.privacyPolicy.dataStorageTitle }}</h2>
        <p class="text-gray-700 leading-relaxed">{{ t.privacyPolicy.dataStorageText }}</p>
      </section>

      <!-- 第三者への提供 -->
      <section>
        <h2 class="text-xl font-semibold mb-3 border-b border-gray-200 pb-2">{{ t.privacyPolicy.thirdPartyTitle }}</h2>
        <p class="text-gray-700 leading-relaxed">{{ t.privacyPolicy.thirdPartyText }}</p>
      </section>

      <!-- お問い合わせ -->
      <section>
        <h2 class="text-xl font-semibold mb-3 border-b border-gray-200 pb-2">{{ t.privacyPolicy.contactTitle }}</h2>
        <p class="text-gray-700 leading-relaxed">{{ t.privacyPolicy.contactText }}</p>
      </section>
    </div>
  </div>
</template>

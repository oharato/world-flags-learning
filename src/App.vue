<script setup lang="ts">
import { useTranslation } from './composables/useTranslation';

const { t } = useTranslation();
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <main class="flex-grow">
      <router-view />
    </main>
    <footer class="py-4 text-center text-sm text-gray-500">
      <router-link to="/privacy-policy" class="hover:underline">
        {{ t.footer.privacyPolicy }}
      </router-link>
    </footer>
  </div>
</template>

<style scoped>
</style>

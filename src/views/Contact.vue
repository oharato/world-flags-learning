<script setup lang="ts">
import { ref } from 'vue';
import AppButton from '../components/AppButton.vue';
import LanguageSelector from '../components/LanguageSelector.vue';
import { useTranslation } from '../composables/useTranslation';

const { t } = useTranslation();

const name = ref('');
const email = ref('');
const message = ref('');
const isSubmitting = ref(false);
const submitStatus = ref<'idle' | 'success' | 'error'>('idle');
const errorMessage = ref('');

// Formspree endpoint - configure via environment variable VITE_FORMSPREE_ID
// See docs/12_contact_form.md for setup instructions
const FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_ID || '';
const FORMSPREE_ENDPOINT = `https://formspree.io/f/${FORMSPREE_ID}`;

const validateForm = (): { valid: boolean; error?: string } => {
  if (!name.value.trim()) {
    return { valid: false, error: t.value.contact.nameRequired };
  }
  if (!email.value.trim()) {
    return { valid: false, error: t.value.contact.emailRequired };
  }
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.value.trim())) {
    return { valid: false, error: t.value.contact.emailInvalid };
  }
  if (!message.value.trim()) {
    return { valid: false, error: t.value.contact.messageRequired };
  }
  return { valid: true };
};

const handleSubmit = async () => {
  const validation = validateForm();
  if (!validation.valid) {
    errorMessage.value = validation.error || '';
    return;
  }

  // Check if Formspree is configured
  if (!FORMSPREE_ID) {
    errorMessage.value = t.value.contact.submitError;
    return;
  }

  errorMessage.value = '';
  isSubmitting.value = true;
  submitStatus.value = 'idle';

  try {
    const formData = new FormData();
    formData.append('name', name.value.trim());
    formData.append('email', email.value.trim());
    formData.append('message', message.value.trim());

    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.ok) {
      submitStatus.value = 'success';
      name.value = '';
      email.value = '';
      message.value = '';
    } else {
      submitStatus.value = 'error';
      errorMessage.value = t.value.contact.submitError;
    }
  } catch (error) {
    submitStatus.value = 'error';
    errorMessage.value = t.value.contact.submitError;
    // Log error for debugging (will be stripped in production by build tools if needed)
    if (import.meta.env.DEV) {
      console.error('Form submission error:', error);
    }
  } finally {
    isSubmitting.value = false;
  }
};

const clearError = () => {
  if (errorMessage.value) {
    errorMessage.value = '';
  }
};
</script>

<template>
  <div class="container mx-auto p-4 max-w-lg">
    <div class="flex justify-between items-center mb-4">
      <router-link to="/" class="text-blue-500 hover:underline">{{ t.common.backToHome }}</router-link>
      <LanguageSelector />
    </div>

    <h2 class="text-3xl font-bold my-6 text-center">{{ t.contact.title }}</h2>
    <p class="text-gray-600 text-center mb-6">{{ t.contact.description }}</p>

    <!-- Success message -->
    <div v-if="submitStatus === 'success'" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
      <p class="font-bold">{{ t.contact.successTitle }}</p>
      <p>{{ t.contact.successMessage }}</p>
    </div>

    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Honeypot field for spam protection (hidden from users) -->
      <input type="text" name="_gotcha" style="display: none" tabindex="-1" autocomplete="off" />

      <div>
        <label for="name" class="block text-lg font-medium text-gray-700">{{ t.contact.name }}</label>
        <input
          type="text"
          id="name"
          v-model="name"
          @input="clearError"
          maxlength="100"
          class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          :placeholder="t.contact.namePlaceholder"
        />
      </div>

      <div>
        <label for="email" class="block text-lg font-medium text-gray-700">{{ t.contact.email }}</label>
        <input
          type="email"
          id="email"
          v-model="email"
          @input="clearError"
          maxlength="254"
          class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          :placeholder="t.contact.emailPlaceholder"
        />
      </div>

      <div>
        <label for="message" class="block text-lg font-medium text-gray-700">{{ t.contact.message }}</label>
        <textarea
          id="message"
          v-model="message"
          @input="clearError"
          maxlength="5000"
          rows="6"
          class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          :placeholder="t.contact.messagePlaceholder"
        ></textarea>
      </div>

      <p v-if="errorMessage" class="text-sm text-red-600">
        {{ errorMessage }}
      </p>

      <div>
        <AppButton
          type="submit"
          variant="primary"
          size="lg"
          full-width
          :disabled="isSubmitting"
        >
          <span v-if="isSubmitting">{{ t.contact.submitting }}</span>
          <span v-else>{{ t.contact.submit }}</span>
        </AppButton>
      </div>
    </form>
  </div>
</template>

import { createPinia } from 'pinia';
import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

// グローバルエラーハンドラー（Vueコンポーネント内のエラー）
app.config.errorHandler = (err, instance, info) => {
  const errorData = {
    type: 'vue-error',
    timestamp: new Date().toISOString(),
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
    component: instance?.$options?.name || 'Unknown',
    info,
    url: window.location.href,
    userAgent: navigator.userAgent,
  };
  console.error('[Vue Error]', JSON.stringify(errorData));
};

// グローバルエラーハンドラー（未キャッチのJavaScriptエラー）
window.addEventListener('error', (event) => {
  const errorData = {
    type: 'js-error',
    timestamp: new Date().toISOString(),
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    url: window.location.href,
    userAgent: navigator.userAgent,
  };
  console.error('[JS Error]', JSON.stringify(errorData));
});

// Promiseの未処理エラー
window.addEventListener('unhandledrejection', (event) => {
  const errorData = {
    type: 'promise-error',
    timestamp: new Date().toISOString(),
    message: event.reason instanceof Error ? event.reason.message : String(event.reason),
    stack: event.reason instanceof Error ? event.reason.stack : undefined,
    url: window.location.href,
    userAgent: navigator.userAgent,
  };
  console.error('[Promise Error]', JSON.stringify(errorData));
});

app.mount('#app');

// Service Worker登録
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => {
      // Service Worker registration failed silently
    });
  });
}

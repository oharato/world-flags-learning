import { createRouter, createWebHistory } from 'vue-router';
import Home from '../views/Home.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/quiz',
    name: 'QuizSetup',
    component: () => import('../views/QuizSetup.vue'),
  },
  {
    path: '/quiz/play',
    name: 'QuizPlay',
    component: () => import('../views/QuizPlay.vue'),
  },
  {
    path: '/quiz/result',
    name: 'QuizResult',
    component: () => import('../views/QuizResult.vue'),
  },
  {
    path: '/ranking',
    name: 'Ranking',
    component: () => import('../views/Ranking.vue'),
  },
  {
    path: '/study',
    name: 'Study',
    component: () => import('../views/Study.vue'),
  },
  {
    path: '/map-quiz',
    name: 'MapQuizSetup',
    component: () => import('../views/MapQuizSetup.vue'),
  },
  {
    path: '/map-quiz/play',
    name: 'MapQuizPlay',
    component: () => import('../views/MapQuizPlay.vue'),
  },
  {
    path: '/map-quiz/result',
    name: 'MapQuizResult',
    component: () => import('../views/MapQuizResult.vue'),
  },
  {
    path: '/map-study',
    name: 'MapStudy',
    component: () => import('../views/MapStudy.vue'),
  },
  {
    path: '/contact',
    name: 'Contact',
    component: () => import('../views/Contact.vue'),
  },
  {
    path: '/privacy-policy',
    name: 'PrivacyPolicy',
    component: () => import('../views/PrivacyPolicy.vue'),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useCountriesStore } from '../countries';
import { useQuizStore } from '../quiz';

describe('Quiz Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe('初期状態', () => {
    it('デフォルト値が正しく設定されている', () => {
      const store = useQuizStore();

      expect(store.nickname).toBe('Guest');
      expect(store.quizFormat).toBe('flag-to-name');
      expect(store.quizRegion).toBe('all');
      expect(store.numberOfQuestions).toBe(5);
      expect(store.questions).toEqual([]);
      expect(store.currentQuestionIndex).toBe(0);
      expect(store.correctAnswers).toBe(0);
    });
  });

  describe('setupQuiz', () => {
    it('クイズ設定を正しく保存する', () => {
      const store = useQuizStore();
      const countriesStore = useCountriesStore();

      countriesStore.countries = [
        {
          id: '1',
          name: '日本',
          capital: '東京',
          continent: 'アジア',
          flag_image_url: '',
          map_image_url: '',
          description: '',
          summary: '',
        },
        {
          id: '2',
          name: 'アメリカ',
          capital: 'ワシントンD.C.',
          continent: '北アメリカ',
          flag_image_url: '',
          map_image_url: '',
          description: '',
          summary: '',
        },
        {
          id: '3',
          name: 'フランス',
          capital: 'パリ',
          continent: 'ヨーロッパ',
          flag_image_url: '',
          map_image_url: '',
          description: '',
          summary: '',
        },
      ];

      store.setupQuiz('TestUser', 'name-to-flag', 'all', 5);

      expect(store.nickname).toBe('TestUser');
      expect(store.quizFormat).toBe('name-to-flag');
      expect(store.quizRegion).toBe('all');
      expect(store.numberOfQuestions).toBe(5);
    });
  });

  describe('generateQuestions', () => {
    it('指定された問題数の問題を生成する', () => {
      const store = useQuizStore();
      const countriesStore = useCountriesStore();

      countriesStore.countries = Array.from({ length: 50 }, (_, i) => ({
        id: String(i + 1),
        name: `国${i + 1}`,
        capital: `首都${i + 1}`,
        continent: 'アジア',
        flag_image_url: '',
        map_image_url: '',
        description: '',
        summary: '',
      }));

      store.setupQuiz('Test', 'flag-to-name', 'all', 10);

      expect(store.questions).toHaveLength(10);
      store.questions.forEach((question) => {
        expect(question.options).toHaveLength(4);
        expect(question.options).toContain(question.correctAnswer);
      });
    });

    it('地域でフィルタリングされた問題を生成する', () => {
      const store = useQuizStore();
      const countriesStore = useCountriesStore();

      countriesStore.countries = [
        {
          id: '1',
          name: '日本',
          capital: '東京',
          continent: 'アジア',
          flag_image_url: '',
          map_image_url: '',
          description: '',
          summary: '',
        },
        {
          id: '2',
          name: '中国',
          capital: '北京',
          continent: 'アジア',
          flag_image_url: '',
          map_image_url: '',
          description: '',
          summary: '',
        },
        {
          id: '3',
          name: 'アメリカ',
          capital: 'ワシントンD.C.',
          continent: 'North America',
          flag_image_url: '',
          map_image_url: '',
          description: '',
          summary: '',
        },
      ];

      store.setupQuiz('Test', 'flag-to-name', 'Asia', 5);

      store.questions.forEach((question) => {
        const normalizedContinent =
          question.correctAnswer.continent === 'アジア' ? 'Asia' : question.correctAnswer.continent;
        expect(normalizedContinent).toBe('Asia');
      });
    });

    it('「すべて」を選択した場合、利用可能な全ての国で問題を生成する', () => {
      const store = useQuizStore();
      const countriesStore = useCountriesStore();

      countriesStore.countries = Array.from({ length: 10 }, (_, i) => ({
        id: String(i + 1),
        name: `国${i + 1}`,
        capital: `首都${i + 1}`,
        continent: 'アジア',
        flag_image_url: '',
        map_image_url: '',
        description: '',
        summary: '',
      }));

      store.setupQuiz('Test', 'flag-to-name', 'all', 999);

      expect(store.questions).toHaveLength(10);
    });
  });

  describe('startQuiz', () => {
    it('クイズ開始時に状態をリセットする', () => {
      const store = useQuizStore();

      store.correctAnswers = 5;
      store.currentQuestionIndex = 3;

      store.startQuiz();

      expect(store.correctAnswers).toBe(0);
      expect(store.currentQuestionIndex).toBe(0);
      expect(store.startTime).toBeGreaterThan(0);
      expect(store.endTime).toBe(0);
    });
  });

  describe('answerQuestion', () => {
    beforeEach(() => {
      const store = useQuizStore();
      const countriesStore = useCountriesStore();

      countriesStore.countries = Array.from({ length: 20 }, (_, i) => ({
        id: String(i + 1),
        name: `国${i + 1}`,
        capital: `首都${i + 1}`,
        continent: 'アジア',
        flag_image_url: '',
        map_image_url: '',
        description: '',
        summary: '',
      }));

      store.setupQuiz('Test', 'flag-to-name', 'all', 5);
      store.startQuiz();
    });

    it('正解時に正解数が増加する', () => {
      const store = useQuizStore();
      const correctId = store.questions[0]!.correctAnswer.id;

      store.answerQuestion(correctId);

      expect(store.correctAnswers).toBe(1);
      expect(store.answerHistory).toHaveLength(1);
      expect(store.answerHistory[0]!.isCorrect).toBe(true);
    });

    it('不正解時に正解数が増加しない', () => {
      const store = useQuizStore();
      const wrongId = store.questions[0]!.options.find((o) => o.id !== store.questions[0]!.correctAnswer.id)!.id;

      store.answerQuestion(wrongId);

      expect(store.correctAnswers).toBe(0);
      expect(store.answerHistory).toHaveLength(1);
      expect(store.answerHistory[0]!.isCorrect).toBe(false);
    });

    it('全問回答後にクイズが終了する', () => {
      const store = useQuizStore();

      for (let i = 0; i < store.questions.length; i++) {
        store.answerQuestion(store.questions[store.currentQuestionIndex]!.correctAnswer.id);
      }

      expect(store.endTime).toBeGreaterThan(0);
    });
  });

  describe('ゲッター', () => {
    it('totalTimeが正しく計算される', () => {
      const store = useQuizStore();

      store.startTime = Date.now() - 5000; // 5秒前
      store.endTime = Date.now();

      expect(store.totalTime).toBeGreaterThanOrEqual(4.9);
      expect(store.totalTime).toBeLessThanOrEqual(5.1);
    });

    it('finalScoreが正しく計算される', () => {
      const store = useQuizStore();

      store.correctAnswers = 10;
      store.startTime = Date.now() - 30000; // 30秒前
      store.endTime = Date.now();

      const expectedScore = 10 * 1000 - 30 * 10;
      expect(store.finalScore).toBeGreaterThanOrEqual(expectedScore - 10);
      expect(store.finalScore).toBeLessThanOrEqual(expectedScore + 10);
    });
  });
});

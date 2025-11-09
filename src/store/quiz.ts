import { defineStore } from 'pinia';
import { useCountriesStore, type Country } from './countries';

export type QuizFormat = 'flag-to-name' | 'name-to-flag';
// QuizRegionの型定義を拡張
export type QuizRegion = 'all' | 'Africa' | 'Asia' | 'Europe' | 'North America' | 'South America' | 'Oceania';

// 問題の型定義
export interface Question {
  correctAnswer: Country;
  options: Country[];
  questionType: QuizFormat;
}

// 回答履歴の型定義
export interface AnswerRecord {
  question: Question;
  selectedAnswerId: string;
  isCorrect: boolean;
}

export const useQuizStore = defineStore('quiz', {
  state: () => ({
    nickname: 'Guest',
    quizFormat: 'flag-to-name' as QuizFormat,
    quizRegion: 'all' as QuizRegion,
    numberOfQuestions: 5, // 問題数を追加
    questions: [] as Question[],
    currentQuestionIndex: 0,
    correctAnswers: 0,
    startTime: 0,
    endTime: 0,
    answerHistory: [] as AnswerRecord[], // 回答履歴を追加
  }),
  actions: {
    generateQuestions() {
      const countriesStore = useCountriesStore();
      if (countriesStore.countries.length === 0) {
        console.error('Country data is not loaded.');
        return;
      }

      // 大陸名の正規化マップ（日本語/英語 → 英語に統一）
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

      // 選択された地域に基づいて国をフィルタリング
      const filteredCountries = this.quizRegion === 'all'
        ? countriesStore.countries
        : countriesStore.countries.filter(country => {
            const normalizedContinent = normalizeContinentMap[country.continent] || country.continent;
            return normalizedContinent === this.quizRegion;
          });

      // 実際の問題数を決定（「すべて」が選択された場合は利用可能な全ての国）
      const actualNumberOfQuestions = this.numberOfQuestions >= 999
        ? filteredCountries.length
        : Math.min(this.numberOfQuestions, filteredCountries.length);

      if (filteredCountries.length < this.numberOfQuestions && this.numberOfQuestions < 999) {
        console.warn(`Not enough countries in ${this.quizRegion} for ${this.numberOfQuestions} questions. Using all available countries (${filteredCountries.length}).`);
      }

      // フィルタリングされた国からランダムに問題数分を選択
      const selectedCountriesForQuiz = [...filteredCountries].sort(() => 0.5 - Math.random()).slice(0, actualNumberOfQuestions);

      this.questions = selectedCountriesForQuiz.map(correctCountry => {
        // 選択肢もフィルタリングされた国の中から選ぶ
        const otherOptions = [...filteredCountries]
          .filter(c => c.id !== correctCountry.id)
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        const options = [...otherOptions, correctCountry].sort(() => 0.5 - Math.random());
        return {
          correctAnswer: correctCountry,
          options: options,
          questionType: this.quizFormat,
        };
      });
    },
    setupQuiz(nickname: string, format: QuizFormat, region: QuizRegion, numQuestions: number) {
      this.nickname = nickname;
      this.quizFormat = format;
      this.quizRegion = region;
      this.numberOfQuestions = numQuestions;
      this.generateQuestions();
      this.answerHistory = []; // クイズ設定時に履歴をリセット
    },
    startQuiz() {
      this.correctAnswers = 0;
      this.currentQuestionIndex = 0;
      this.startTime = Date.now();
      this.endTime = 0;
    },
    answerQuestion(selectedCountryId: string) {
      const currentQuestion = this.questions[this.currentQuestionIndex];
      if (!currentQuestion) {
        console.error('No current question available');
        return;
      }
      
      const isCorrect = selectedCountryId === currentQuestion.correctAnswer.id;

      this.answerHistory.push({
        question: currentQuestion,
        selectedAnswerId: selectedCountryId,
        isCorrect: isCorrect,
      });

      if (isCorrect) {
        this.correctAnswers++;
      }

      if (this.currentQuestionIndex < this.questions.length - 1) {
        this.currentQuestionIndex++;
      } else {
        this.endQuiz();
      }
    },
    endQuiz() {
      this.endTime = Date.now();
    },
  },
  getters: {
    totalTime: (state) => {
      if (state.startTime === 0 || state.endTime === 0) {
        return 0;
      }
      return (state.endTime - state.startTime) / 1000; // 秒単位
    },
    finalScore: (state) => {
      if (state.startTime === 0 || state.endTime === 0) return 0;
      const time = (state.endTime - state.startTime) / 1000;
      // スコア = (正解数 * 1000) - (回答時間[秒] * 10)
      return Math.max(0, (state.correctAnswers * 1000) - (Math.round(time) * 10));
    },
    currentQuestion: (state): Question | null => {
        if (state.questions.length === 0) return null;
        return state.questions[state.currentQuestionIndex] ?? null;
    }
  },
});

import { defineStore } from 'pinia';

export interface Rank {
  rank: number;
  nickname: string;
  score: number;
  created_at: string;
}

export type RankingType = 'daily' | 'all_time';
export type QuizFormat = 'flag-to-name' | 'name-to-flag';

export const useRankingStore = defineStore('ranking', {
  state: () => ({
    ranking: [] as Rank[],
    myRank: null as Rank | null,
    loading: false,
    error: null as string | null,
    currentRegion: 'all' as string,
    currentType: 'daily' as RankingType,
    currentFormat: 'flag-to-name' as QuizFormat,
  }),
  actions: {
    async fetchRanking(region: string = 'all', type: RankingType = 'daily', format: QuizFormat = 'flag-to-name') {
      this.loading = true;
      this.error = null;
      this.currentRegion = region;
      this.currentType = type;
      this.currentFormat = format;
      try {
        const response = await fetch(`/api/ranking?region=${region}&type=${type}&format=${format}`);
        if (!response.ok) {
          throw new Error('ランキングの取得に失敗しました。');
        }
        const data = await response.json();
        this.ranking = data.ranking;
      } catch (e: any) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
    async submitScore(
      nickname: string,
      score: number,
      region: string = 'all',
      format: QuizFormat = 'flag-to-name',
      validationParams?: { correctAnswers: number; timeInSeconds: number; numberOfQuestions: number }
    ) {
      this.loading = true;
      this.error = null;
      try {
        const body: any = { nickname, score, region, format };

        // Add validation parameters if provided
        if (validationParams) {
          body.correctAnswers = validationParams.correctAnswers;
          body.timeInSeconds = validationParams.timeInSeconds;
          body.numberOfQuestions = validationParams.numberOfQuestions;
        }

        const response = await fetch('/api/ranking', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'スコアの登録に失敗しました。');
        }
        const result = await response.json();
        this.myRank = result.data;
      } catch (e: any) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
  },
});

import { describe, expect, it } from 'vitest';
import { calculateMaxScore, calculateTheoreticalMax, validateScore } from '../utils/scoreValidation';

describe('Score Validation', () => {
  describe('calculateMaxScore', () => {
    it('正しいスコアを計算する', () => {
      expect(calculateMaxScore(10, 30)).toBe(9700);
      expect(calculateMaxScore(8, 50)).toBe(7500);
      expect(calculateMaxScore(0, 100)).toBe(0);
    });

    it('負のスコアにならない', () => {
      expect(calculateMaxScore(0, 1000)).toBe(0);
      expect(calculateMaxScore(1, 200)).toBe(0);
    });

    it('端数を丸める', () => {
      expect(calculateMaxScore(10, 30.5)).toBe(9690); // Math.round(30.5) = 31, 10*1000 - 31*10 = 9690
      expect(calculateMaxScore(10, 30.9)).toBe(9690); // Math.round(30.9) = 31, 10*1000 - 31*10 = 9690
    });
  });

  describe('calculateTheoreticalMax', () => {
    it('理論上の最大スコアを計算する', () => {
      expect(calculateTheoreticalMax(10)).toBe(10000);
      expect(calculateTheoreticalMax(5)).toBe(5000);
      expect(calculateTheoreticalMax(20)).toBe(20000);
    });
  });

  describe('validateScore', () => {
    it('正常なスコアを受け入れる', () => {
      const result = validateScore({
        score: 9700,
        correctAnswers: 10,
        timeInSeconds: 30,
        numberOfQuestions: 10,
      });
      expect(result.valid).toBe(true);
    });

    it('正解数が問題数を超える場合を拒否する', () => {
      const result = validateScore({
        score: 11000,
        correctAnswers: 11,
        timeInSeconds: 30,
        numberOfQuestions: 10,
      });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('正解数が不正です');
    });

    it('正解数が負の場合を拒否する', () => {
      const result = validateScore({
        score: 0,
        correctAnswers: -1,
        timeInSeconds: 30,
        numberOfQuestions: 10,
      });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('正解数が不正です');
    });

    it('回答時間が短すぎる場合を拒否する', () => {
      const result = validateScore({
        score: 10000,
        correctAnswers: 10,
        timeInSeconds: 1, // 10問なので最低5秒必要
        numberOfQuestions: 10,
      });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('回答時間が短すぎます');
    });

    it('回答時間が長すぎる場合を拒否する', () => {
      const result = validateScore({
        score: 0,
        correctAnswers: 10,
        timeInSeconds: 4000, // 10問なので最大3000秒
        numberOfQuestions: 10,
      });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('回答時間が長すぎます');
    });

    it('スコアが計算と一致しない場合を拒否する', () => {
      const result = validateScore({
        score: 10000, // 正しくは9700
        correctAnswers: 10,
        timeInSeconds: 30,
        numberOfQuestions: 10,
      });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('スコアが計算と一致しません');
    });

    it('スコアが理論上の最大値を超える場合を拒否する', () => {
      const result = validateScore({
        score: 11000,
        correctAnswers: 10,
        timeInSeconds: 10, // Set time to avoid "time too short" error
        numberOfQuestions: 10,
      });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('スコアが理論上の最大値を超えています');
    });

    it('スコアが負の場合を拒否する', () => {
      const result = validateScore({
        score: -100,
        correctAnswers: 0,
        timeInSeconds: 30,
        numberOfQuestions: 10,
      });
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('スコアが負の値です');
    });

    it('小さな誤差は許容する', () => {
      // 9700が正しいスコアだが、9750まで許容
      const result = validateScore({
        score: 9750,
        correctAnswers: 10,
        timeInSeconds: 30,
        numberOfQuestions: 10,
      });
      expect(result.valid).toBe(true);
    });

    it('最小時間（0.5秒/問）でのスコアを受け入れる', () => {
      const result = validateScore({
        score: 9950,
        correctAnswers: 10,
        timeInSeconds: 5, // 10問 * 0.5秒
        numberOfQuestions: 10,
      });
      expect(result.valid).toBe(true);
    });

    it('ゼロスコアを受け入れる', () => {
      const result = validateScore({
        score: 0,
        correctAnswers: 0,
        timeInSeconds: 100,
        numberOfQuestions: 10,
      });
      expect(result.valid).toBe(true);
    });
  });
});

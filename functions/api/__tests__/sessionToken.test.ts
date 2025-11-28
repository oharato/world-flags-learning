import { describe, expect, it } from 'vitest';
import { generateSessionToken, validateQuizCompletion, validateSessionToken } from '../utils/sessionToken';

describe('Session Token', () => {
  describe('generateSessionToken', () => {
    it('有効なセッショントークンを生成する', async () => {
      const token = await generateSessionToken({
        startTime: Date.now(),
        numberOfQuestions: 10,
        region: 'all',
        format: 'flag-to-name',
        questionIds: ['jpn', 'usa', 'fra', 'deu', 'gbr', 'ita', 'esp', 'chn', 'kor', 'bra'],
      });

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    it('異なるパラメータで異なるトークンを生成する', async () => {
      const baseParams = {
        startTime: Date.now(),
        numberOfQuestions: 10,
        region: 'all',
        format: 'flag-to-name' as const,
        questionIds: ['jpn', 'usa', 'fra', 'deu', 'gbr', 'ita', 'esp', 'chn', 'kor', 'bra'],
      };

      const token1 = await generateSessionToken(baseParams);
      const token2 = await generateSessionToken({ ...baseParams, region: 'Asia' });

      expect(token1).not.toBe(token2);
    });
  });

  describe('validateSessionToken', () => {
    it('有効なトークンを受け入れる', async () => {
      const payload = {
        startTime: Date.now(),
        numberOfQuestions: 10,
        region: 'all',
        format: 'flag-to-name' as const,
        questionIds: ['jpn', 'usa', 'fra', 'deu', 'gbr', 'ita', 'esp', 'chn', 'kor', 'bra'],
      };

      const token = await generateSessionToken(payload);
      const result = await validateSessionToken(token);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.payload.numberOfQuestions).toBe(10);
        expect(result.payload.region).toBe('all');
        expect(result.payload.format).toBe('flag-to-name');
      }
    });

    it('不正なトークン形式を拒否する', async () => {
      const result = await validateSessionToken('invalid-token');

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('無効');
      }
    });

    it('改ざんされたトークンを拒否する', async () => {
      const payload = {
        startTime: Date.now(),
        numberOfQuestions: 10,
        region: 'all',
        format: 'flag-to-name' as const,
        questionIds: ['jpn', 'usa', 'fra', 'deu', 'gbr', 'ita', 'esp', 'chn', 'kor', 'bra'],
      };

      const token = await generateSessionToken(payload);

      // Decode, modify, and re-encode without proper signature
      const decoded = JSON.parse(atob(token));
      decoded.numberOfQuestions = 999;
      const tamperedToken = btoa(JSON.stringify(decoded));

      const result = await validateSessionToken(tamperedToken);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('署名が無効');
      }
    });

    it('期限切れのトークンを拒否する', async () => {
      const payload = {
        startTime: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
        numberOfQuestions: 10,
        region: 'all',
        format: 'flag-to-name' as const,
        questionIds: ['jpn', 'usa', 'fra', 'deu', 'gbr', 'ita', 'esp', 'chn', 'kor', 'bra'],
      };

      const token = await generateSessionToken(payload);
      const result = await validateSessionToken(token);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('有効期限');
      }
    });

    it('未来の開始時刻を持つトークンを拒否する', async () => {
      const payload = {
        startTime: Date.now() + 60000, // 1 minute in the future
        numberOfQuestions: 10,
        region: 'all',
        format: 'flag-to-name' as const,
        questionIds: ['jpn', 'usa', 'fra', 'deu', 'gbr', 'ita', 'esp', 'chn', 'kor', 'bra'],
      };

      const token = await generateSessionToken(payload);
      const result = await validateSessionToken(token);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('開始時刻が不正');
      }
    });
  });

  describe('validateQuizCompletion', () => {
    it('正常なクイズ完了を受け入れる', async () => {
      const questionIds = ['jpn', 'usa', 'fra', 'deu', 'gbr'];
      const payload = {
        startTime: Date.now() - 30000, // 30 seconds ago
        numberOfQuestions: 5,
        region: 'all',
        format: 'flag-to-name' as const,
        questionIds,
      };

      const token = await generateSessionToken(payload);

      const result = await validateQuizCompletion({
        sessionToken: token,
        correctAnswers: 4,
        timeInSeconds: 25,
        answeredQuestionIds: questionIds,
      });

      expect(result.valid).toBe(true);
    });

    it('回答数が一致しない場合を拒否する', async () => {
      const questionIds = ['jpn', 'usa', 'fra', 'deu', 'gbr'];
      const payload = {
        startTime: Date.now() - 30000,
        numberOfQuestions: 5,
        region: 'all',
        format: 'flag-to-name' as const,
        questionIds,
      };

      const token = await generateSessionToken(payload);

      const result = await validateQuizCompletion({
        sessionToken: token,
        correctAnswers: 3,
        timeInSeconds: 25,
        answeredQuestionIds: ['jpn', 'usa', 'fra'], // Only 3 answers
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('回答数が一致しません');
      }
    });

    it('元の問題セットにない問題への回答を拒否する', async () => {
      const originalQuestionIds = ['jpn', 'usa', 'fra', 'deu', 'gbr'];
      const payload = {
        startTime: Date.now() - 30000,
        numberOfQuestions: 5,
        region: 'all',
        format: 'flag-to-name' as const,
        questionIds: originalQuestionIds,
      };

      const token = await generateSessionToken(payload);

      const result = await validateQuizCompletion({
        sessionToken: token,
        correctAnswers: 4,
        timeInSeconds: 25,
        answeredQuestionIds: ['jpn', 'usa', 'fra', 'deu', 'chn'], // 'chn' is not in original set
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('元の問題セットに含まれていません');
      }
    });

    it('正解数が問題数を超える場合を拒否する', async () => {
      const questionIds = ['jpn', 'usa', 'fra', 'deu', 'gbr'];
      const payload = {
        startTime: Date.now() - 30000,
        numberOfQuestions: 5,
        region: 'all',
        format: 'flag-to-name' as const,
        questionIds,
      };

      const token = await generateSessionToken(payload);

      const result = await validateQuizCompletion({
        sessionToken: token,
        correctAnswers: 10, // More than 5 questions
        timeInSeconds: 25,
        answeredQuestionIds: questionIds,
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('正解数が問題数を超えています');
      }
    });

    it('回答時間が短すぎる場合を拒否する', async () => {
      const questionIds = ['jpn', 'usa', 'fra', 'deu', 'gbr'];
      const payload = {
        startTime: Date.now() - 30000,
        numberOfQuestions: 5,
        region: 'all',
        format: 'flag-to-name' as const,
        questionIds,
      };

      const token = await generateSessionToken(payload);

      const result = await validateQuizCompletion({
        sessionToken: token,
        correctAnswers: 4,
        timeInSeconds: 1, // Only 1 second for 5 questions
        answeredQuestionIds: questionIds,
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('回答時間が短すぎます');
      }
    });

    it('報告時間がセッション開始からの経過時間を超える場合を拒否する', async () => {
      const questionIds = ['jpn', 'usa', 'fra', 'deu', 'gbr'];
      const payload = {
        startTime: Date.now() - 10000, // 10 seconds ago
        numberOfQuestions: 5,
        region: 'all',
        format: 'flag-to-name' as const,
        questionIds,
      };

      const token = await generateSessionToken(payload);

      const result = await validateQuizCompletion({
        sessionToken: token,
        correctAnswers: 4,
        timeInSeconds: 60, // Claims 60 seconds but only 10 elapsed
        answeredQuestionIds: questionIds,
      });

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toContain('経過時間を超えています');
      }
    });
  });
});

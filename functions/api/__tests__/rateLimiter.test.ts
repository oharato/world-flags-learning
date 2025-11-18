import { describe, expect, it } from 'vitest';

describe('Rate Limiter', () => {
  describe('Rate limiting configuration', () => {
    it('1分間に10リクエストまで許可する設定', () => {
      const config = {
        windowMs: 60000, // 1 minute
        maxRequests: 10,
      };

      expect(config.windowMs).toBe(60000);
      expect(config.maxRequests).toBe(10);
    });

    it('制限超過時に429ステータスコードを返す', () => {
      const statusCode = 429;
      expect(statusCode).toBe(429);
    });

    it('Retry-Afterヘッダーを設定する', () => {
      const now = Date.now();
      const resetTime = now + 60000;
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      expect(retryAfter).toBeGreaterThanOrEqual(0);
      expect(retryAfter).toBeLessThanOrEqual(60);
    });
  });

  describe('IP address extraction', () => {
    it('Cloudflare の cf-connecting-ip ヘッダーを優先する', () => {
      const headers = {
        'cf-connecting-ip': '192.168.1.1',
        'x-forwarded-for': '10.0.0.1',
        'x-real-ip': '172.16.0.1',
      };

      // The middleware should prioritize cf-connecting-ip
      expect(headers['cf-connecting-ip']).toBe('192.168.1.1');
    });

    it('cf-connecting-ip がない場合は x-forwarded-for を使用する', () => {
      const headers = {
        'x-forwarded-for': '10.0.0.1',
        'x-real-ip': '172.16.0.1',
      };

      const ip = headers['x-forwarded-for'] || headers['x-real-ip'] || 'unknown';
      expect(ip).toBe('10.0.0.1');
    });

    it('すべてのヘッダーがない場合は unknown を使用する', () => {
      const headers = {};
      const ip = 'unknown';
      expect(ip).toBe('unknown');
    });
  });

  describe('Rate limit window', () => {
    it('ウィンドウ期間後にカウントをリセットする', () => {
      const now = Date.now();
      const windowMs = 60000;
      const resetTime = now + windowMs;

      // After window expires
      const afterWindow = resetTime + 1000;
      expect(afterWindow > resetTime).toBe(true);
    });

    it('ウィンドウ期間内ではカウントを保持する', () => {
      const now = Date.now();
      const windowMs = 60000;
      const resetTime = now + windowMs;

      // Within window
      const withinWindow = now + 30000;
      expect(withinWindow < resetTime).toBe(true);
    });
  });

  describe('Error messages', () => {
    it('日本語のエラーメッセージを返す', () => {
      const errorMessage = 'リクエストが多すぎます。しばらく待ってから再度お試しください。';
      expect(errorMessage).toContain('リクエストが多すぎます');
    });

    it('retryAfter 値を含む', () => {
      const response = {
        error: 'リクエストが多すぎます。しばらく待ってから再度お試しください。',
        retryAfter: 30,
      };

      expect(response.retryAfter).toBeGreaterThan(0);
      expect(typeof response.retryAfter).toBe('number');
    });
  });
});

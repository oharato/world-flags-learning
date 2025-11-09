import { describe, it, expect } from 'vitest';

// ニックネームバリデーション関数（QuizSetup.vueから抽出）
export const validateNickname = (name: string): { valid: boolean; error?: string } => {
  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'ニックネームを入力してください。' };
  }
  
  if (trimmed.length > 20) {
    return { valid: false, error: 'ニックネームは20文字以内で入力してください。' };
  }
  
  // 危険な文字をチェック（HTMLタグ、スクリプトインジェクション対策）
  if (/<|>|&lt;|&gt;|<script|javascript:|on\w+=/i.test(trimmed)) {
    return { valid: false, error: 'ニックネームに使用できない文字が含まれています。' };
  }
  
  // 制御文字をチェック
  if (/[\x00-\x1F\x7F-\x9F]/.test(trimmed)) {
    return { valid: false, error: 'ニックネームに使用できない文字が含まれています。' };
  }
  
  return { valid: true };
};

describe('Nickname Validation', () => {
  describe('validateNickname', () => {
    it('正常なニックネームを受け入れる', () => {
      const result = validateNickname('TestUser');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('日本語のニックネームを受け入れる', () => {
      const result = validateNickname('テストユーザー');
      expect(result.valid).toBe(true);
    });

    it('20文字のニックネームを受け入れる', () => {
      const result = validateNickname('12345678901234567890');
      expect(result.valid).toBe(true);
    });

    it('空文字列を拒否する', () => {
      const result = validateNickname('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('ニックネームを入力してください。');
    });

    it('空白のみの文字列を拒否する', () => {
      const result = validateNickname('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('ニックネームを入力してください。');
    });

    it('21文字以上のニックネームを拒否する', () => {
      const result = validateNickname('123456789012345678901');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('ニックネームは20文字以内で入力してください。');
    });

    it('HTMLタグを含むニックネームを拒否する', () => {
      const result = validateNickname('<img src=x>');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('ニックネームに使用できない文字が含まれています。');
    });

    it('<を含むニックネームを拒否する', () => {
      const result = validateNickname('user<123');
      expect(result.valid).toBe(false);
    });

    it('>を含むニックネームを拒否する', () => {
      const result = validateNickname('user>123');
      expect(result.valid).toBe(false);
    });

    it('javascript:を含むニックネームを拒否する', () => {
      const result = validateNickname('javascript:alert(1)');
      expect(result.valid).toBe(false);
    });

    it('イベントハンドラーを含むニックネームを拒否する', () => {
      const result = validateNickname('user onclick=alert(1)');
      expect(result.valid).toBe(false);
    });

    it('制御文字を含むニックネームを拒否する', () => {
      const result = validateNickname('user\x00name');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('ニックネームに使用できない文字が含まれています。');
    });

    it('前後の空白をトリミングする', () => {
      const result = validateNickname('  TestUser  ');
      expect(result.valid).toBe(true);
    });

    it('特殊文字（アンダースコア、ハイフン）を含むニックネームを受け入れる', () => {
      const result1 = validateNickname('test_user');
      const result2 = validateNickname('test-user');
      
      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
    });

    it('数字のみのニックネームを受け入れる', () => {
      const result = validateNickname('12345');
      expect(result.valid).toBe(true);
    });

    it('絵文字を含むニックネームを受け入れる', () => {
      const result = validateNickname('User😀');
      expect(result.valid).toBe(true);
    });
  });
});

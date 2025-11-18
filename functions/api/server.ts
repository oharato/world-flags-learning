import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { rateLimiter } from './middleware/rateLimiter';
import { validateScore } from './utils/scoreValidation';

type Bindings = {
  DB: D1Database;
};

interface RankingRow {
  nickname: string;
  score: number;
  created_at: string;
}

interface ScoreRow {
  score: number;
}

interface RankRow {
  rank: number;
}

const app = new Hono<{ Bindings: Bindings }>();

// GET /api/ranking - ランキング取得
app.get('/api/ranking', async (c) => {
  try {
    const region = c.req.query('region') || 'all';
    const type = c.req.query('type') || 'daily'; // 'daily' or 'all_time'
    const format = c.req.query('format') || 'flag-to-name'; // 'flag-to-name' or 'name-to-flag'
    const limit = type === 'all_time' ? 5 : 100;

    let query: string;
    let params: (string | number)[];

    if (type === 'daily') {
      query = `SELECT nickname, score, created_at FROM ranking_daily 
               WHERE region = ? AND format = ? AND date = date('now', '+9 hours')
               ORDER BY score DESC, created_at ASC LIMIT ?`;
      params = [region, format, limit];
    } else {
      query = `SELECT nickname, score, created_at FROM ranking_all_time 
               WHERE region = ? AND format = ? 
               ORDER BY score DESC, created_at ASC LIMIT ?`;
      params = [region, format, limit];
    }

    const result = await c.env.DB.prepare(query)
      .bind(...params)
      .all<RankingRow>();
    const results = result.results || [];

    // rankプロパティを追加
    const ranking = results.map((row, index) => ({
      rank: index + 1,
      nickname: row.nickname,
      score: row.score,
      created_at: row.created_at,
    }));

    return c.json({ ranking });
  } catch (e: any) {
    console.error('Ranking fetch error:', e);
    return c.json({ error: 'ランキングの取得に失敗しました。', details: e.message }, 500);
  }
});

// POST /api/ranking - スコア登録
const scoreSchema = z.object({
  nickname: z
    .string()
    .min(1, 'ニックネームは必須です')
    .max(20, 'ニックネームは20文字以内で入力してください')
    .trim()
    .refine(
      (val) => !/[<>]|&lt;|&gt;|<script|javascript:|on\w+=/i.test(val),
      'ニックネームに使用できない文字が含まれています'
    )
    .refine((val) => !/[\x00-\x1F\x7F-\x9F]/.test(val), 'ニックネームに制御文字を含めることはできません'),
  score: z.number().int().min(0).max(1000000, 'スコアが不正です'),
  region: z.string().default('all'),
  format: z.enum(['flag-to-name', 'name-to-flag']).default('flag-to-name'),
  // Add validation parameters to prevent score tampering
  correctAnswers: z.number().int().min(0),
  timeInSeconds: z.number().min(0),
  numberOfQuestions: z.number().int().min(1).max(1000),
});

app.post(
  '/api/ranking',
  rateLimiter({ windowMs: 60000, maxRequests: 10 }), // 10 requests per minute per IP
  zValidator('json', scoreSchema),
  async (c) => {
    const { nickname, score, region, format, correctAnswers, timeInSeconds, numberOfQuestions } = c.req.valid('json');

    // ニックネームをサニタイズ（追加の安全対策）
    const sanitizedNickname = nickname.trim().substring(0, 20);

    // Validate score to prevent tampering
    const validation = validateScore({
      score,
      correctAnswers,
      timeInSeconds,
      numberOfQuestions,
    });

    if (!validation.valid) {
      return c.json(
        {
          error: `不正なスコアが検出されました: ${validation.reason}`,
        },
        400
      );
    }

    try {
      const now = new Date().toISOString();

      // 日次ランキングに登録（各挑戦ごとに記録）
      // date('now', '+9 hours')でJST（日本標準時）の日付を使用
      await c.env.DB.prepare(
        `INSERT INTO ranking_daily (nickname, score, region, format, date, created_at) 
       VALUES (?, ?, ?, ?, date('now', '+9 hours'), ?)`
      )
        .bind(sanitizedNickname, score, region, format, now)
        .run();

      // 全期間ランキングの処理
      // 1. 現在の全期間ランキングを取得
      const { results: currentTop } = await c.env.DB.prepare(
        `SELECT score FROM ranking_all_time WHERE region = ? AND format = ? ORDER BY score DESC LIMIT 5`
      )
        .bind(region, format)
        .all<ScoreRow>();

      // 2. 5位未満か、5位より高いスコアの場合は登録
      const fifthScore = currentTop[currentTop.length - 1]?.score ?? 0;
      if (currentTop.length < 5 || score > fifthScore) {
        await c.env.DB.prepare(
          `INSERT INTO ranking_all_time (nickname, score, region, format, created_at) VALUES (?, ?, ?, ?, ?)`
        )
          .bind(sanitizedNickname, score, region, format, now)
          .run();

        // 3. 上位5件だけを残して古いレコードを削除
        await c.env.DB.prepare(
          `DELETE FROM ranking_all_time 
         WHERE region = ? AND format = ? AND id NOT IN (
           SELECT id FROM ranking_all_time 
           WHERE region = ? AND format = ? 
           ORDER BY score DESC, created_at ASC LIMIT 5
         )`
        )
          .bind(region, format, region, format)
          .run();
      }

      // 登録後の日次ランキング順位を取得
      const rankResult = await c.env.DB.prepare(
        `SELECT COUNT(*) as rank FROM ranking_daily 
       WHERE region = ? AND format = ? AND date = date('now', '+9 hours') AND (score > ? OR (score = ? AND created_at < ?))`
      )
        .bind(region, format, score, score, now)
        .first<RankRow>();

      const rank = (rankResult?.rank ?? 0) + 1;

      return c.json(
        {
          data: {
            rank,
            nickname: sanitizedNickname,
            score,
          },
          message: 'スコアが正常に登録されました。',
        },
        201
      );
    } catch (e: any) {
      console.error('Score submission error:', e);
      return c.json({ error: 'スコアの登録に失敗しました。', details: e.message }, 500);
    }
  }
);

export default app;

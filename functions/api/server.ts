import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';
import { rateLimiter } from './middleware/rateLimiter';
import { validateScore } from './utils/scoreValidation';
import { generateSessionToken, validateQuizCompletion } from './utils/sessionToken';

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

// ログ出力用のユーティリティ関数
interface AccessLogData {
  timestamp: string;
  method: string;
  path: string;
  ip: string;
  country: string;
  userAgent: string;
  statusCode: number;
  responseTimeMs: number;
}

interface ErrorLogData {
  timestamp: string;
  method: string;
  path: string;
  ip: string;
  country: string;
  userAgent: string;
  statusCode: number;
  errorMessage: string;
  stackTrace?: string;
}

function getClientInfo(c: { req: { raw: Request } }) {
  const cfProperties = (c.req.raw as RequestWithCf).cf;
  return {
    ip: c.req.raw.headers.get('cf-connecting-ip') || c.req.raw.headers.get('x-forwarded-for') || 'unknown',
    country: cfProperties?.country || 'unknown',
    userAgent: c.req.raw.headers.get('user-agent') || 'unknown',
  };
}

function logAccess(data: AccessLogData) {
  console.log(
    JSON.stringify({
      type: 'access',
      ...data,
    })
  );
}

function logError(data: ErrorLogData) {
  console.error(
    JSON.stringify({
      type: 'error',
      ...data,
    })
  );
}

// Cloudflare Workers の Request 拡張型
interface RequestWithCf extends Request {
  cf?: {
    country?: string;
    city?: string;
    continent?: string;
    region?: string;
    timezone?: string;
  };
}

const app = new Hono<{ Bindings: Bindings }>();

// アクセスログ・エラーログ用ミドルウェア
app.use('*', async (c, next) => {
  const startTime = Date.now();
  const { ip, country, userAgent } = getClientInfo(c);
  const method = c.req.method;
  const path = new URL(c.req.url).pathname;

  try {
    await next();

    // アクセスログを記録
    const responseTimeMs = Date.now() - startTime;
    logAccess({
      timestamp: new Date().toISOString(),
      method,
      path,
      ip,
      country,
      userAgent,
      statusCode: c.res.status,
      responseTimeMs,
    });
  } catch (error) {
    // エラーログを記録
    const responseTimeMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    const stackTrace = error instanceof Error ? error.stack : undefined;

    logError({
      timestamp: new Date().toISOString(),
      method,
      path,
      ip,
      country,
      userAgent,
      statusCode: 500,
      errorMessage,
      stackTrace,
    });

    throw error;
  }
});

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
  } catch (e: unknown) {
    console.error('Ranking fetch error:', e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: 'ランキングの取得に失敗しました。', details: errorMessage }, 500);
  }
});

// POST /api/quiz/start - クイズセッション開始
const quizStartSchema = z.object({
  numberOfQuestions: z.number().int().min(1).max(1000),
  region: z.string().default('all'),
  format: z.enum(['flag-to-name', 'name-to-flag']).default('flag-to-name'),
  questionIds: z.array(z.string()).min(1),
});

app.post('/api/quiz/start', zValidator('json', quizStartSchema), async (c) => {
  try {
    const { numberOfQuestions, region, format, questionIds } = c.req.valid('json');

    // Validate that questionIds length matches numberOfQuestions
    if (questionIds.length !== numberOfQuestions) {
      return c.json(
        {
          error: '問題数とquestionIdsの数が一致しません',
        },
        400
      );
    }

    // Generate session token
    const sessionToken = await generateSessionToken({
      startTime: Date.now(),
      numberOfQuestions,
      region,
      format,
      questionIds,
    });

    return c.json({
      sessionToken,
      message: 'クイズセッションを開始しました',
    });
  } catch (e: unknown) {
    console.error('Quiz start error:', e);
    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return c.json({ error: 'クイズセッションの開始に失敗しました', details: errorMessage }, 500);
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
  // Session token for quiz flow verification
  sessionToken: z.string().min(1, 'セッショントークンは必須です'),
  answeredQuestionIds: z.array(z.string()).min(1),
});

app.post(
  '/api/ranking',
  rateLimiter({ windowMs: 60000, maxRequests: 10 }), // 10 requests per minute per IP
  zValidator('json', scoreSchema),
  async (c) => {
    const {
      nickname,
      score,
      region,
      format,
      correctAnswers,
      timeInSeconds,
      numberOfQuestions,
      sessionToken,
      answeredQuestionIds,
    } = c.req.valid('json');

    // ニックネームをサニタイズ（追加の安全対策）
    const sanitizedNickname = nickname.trim().substring(0, 20);

    // Validate session token and quiz completion
    const sessionValidation = await validateQuizCompletion({
      sessionToken,
      correctAnswers,
      timeInSeconds,
      answeredQuestionIds,
    });

    if (!sessionValidation.valid) {
      return c.json(
        {
          error: `セッション検証エラー: ${sessionValidation.reason}`,
        },
        400
      );
    }

    // Verify region and format match the session token
    const { payload } = sessionValidation;
    if (payload.region !== region || payload.format !== format) {
      return c.json(
        {
          error: 'クイズ設定がセッションと一致しません',
        },
        400
      );
    }

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
    } catch (e: unknown) {
      console.error('Score submission error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      return c.json({ error: 'スコアの登録に失敗しました。', details: errorMessage }, 500);
    }
  }
);

export default app;

/**
 * Quiz Session Token utilities
 * Generates and validates tokens to ensure quiz flow integrity
 */

// Simple HMAC-like signature using Web Crypto API compatible with Cloudflare Workers
async function createSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const message = encoder.encode(data);

  const key = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

  const signature = await crypto.subtle.sign('HMAC', key, message);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifySignature(data: string, signature: string, secret: string): Promise<boolean> {
  const expectedSignature = await createSignature(data, secret);
  return expectedSignature === signature;
}

export interface SessionTokenPayload {
  startTime: number; // Unix timestamp when quiz started
  numberOfQuestions: number;
  region: string;
  format: string;
  questionIds: string[]; // IDs of questions to verify answers
}

export interface SessionTokenData extends SessionTokenPayload {
  signature: string;
}

// Secret key for signing tokens (in production, this should be an environment variable)
const TOKEN_SECRET = 'quiz-session-secret-key-2024';

/**
 * Generate a session token for a new quiz
 */
export async function generateSessionToken(payload: SessionTokenPayload): Promise<string> {
  const dataString = JSON.stringify({
    startTime: payload.startTime,
    numberOfQuestions: payload.numberOfQuestions,
    region: payload.region,
    format: payload.format,
    questionIds: payload.questionIds,
  });

  const signature = await createSignature(dataString, TOKEN_SECRET);

  const tokenData: SessionTokenData = {
    ...payload,
    signature,
  };

  // Encode as base64 for safe transmission
  const tokenString = JSON.stringify(tokenData);
  return btoa(tokenString);
}

/**
 * Validate and decode a session token
 */
export async function validateSessionToken(
  token: string
): Promise<{ valid: true; payload: SessionTokenPayload } | { valid: false; reason: string }> {
  try {
    // Decode from base64
    const tokenString = atob(token);
    const tokenData: SessionTokenData = JSON.parse(tokenString);

    // Verify required fields exist
    if (
      !tokenData.startTime ||
      !tokenData.numberOfQuestions ||
      !tokenData.region ||
      !tokenData.format ||
      !tokenData.questionIds ||
      !tokenData.signature
    ) {
      return { valid: false, reason: 'セッショントークンが不完全です' };
    }

    // Reconstruct data string for signature verification
    const dataString = JSON.stringify({
      startTime: tokenData.startTime,
      numberOfQuestions: tokenData.numberOfQuestions,
      region: tokenData.region,
      format: tokenData.format,
      questionIds: tokenData.questionIds,
    });

    // Verify signature
    const isValidSignature = await verifySignature(dataString, tokenData.signature, TOKEN_SECRET);
    if (!isValidSignature) {
      return { valid: false, reason: 'セッショントークンの署名が無効です' };
    }

    // Check if token is not too old (max 1 hour)
    const now = Date.now();
    const tokenAge = now - tokenData.startTime;
    const maxAge = 60 * 60 * 1000; // 1 hour in milliseconds
    if (tokenAge > maxAge) {
      return { valid: false, reason: 'セッショントークンの有効期限が切れています' };
    }

    // Check if token is not from the future (with 5 second tolerance for clock skew)
    if (tokenData.startTime > now + 5000) {
      return { valid: false, reason: 'セッショントークンの開始時刻が不正です' };
    }

    return {
      valid: true,
      payload: {
        startTime: tokenData.startTime,
        numberOfQuestions: tokenData.numberOfQuestions,
        region: tokenData.region,
        format: tokenData.format,
        questionIds: tokenData.questionIds,
      },
    };
  } catch {
    return { valid: false, reason: 'セッショントークンの形式が無効です' };
  }
}

/**
 * Validate quiz completion against session token
 */
export interface QuizCompletionValidation {
  sessionToken: string;
  correctAnswers: number;
  timeInSeconds: number;
  answeredQuestionIds: string[];
}

export async function validateQuizCompletion(
  validation: QuizCompletionValidation
): Promise<{ valid: true; payload: SessionTokenPayload } | { valid: false; reason: string }> {
  // First validate the session token
  const tokenResult = await validateSessionToken(validation.sessionToken);
  if (!tokenResult.valid) {
    return tokenResult;
  }

  const { payload } = tokenResult;

  // Verify the number of answered questions matches
  if (validation.answeredQuestionIds.length !== payload.numberOfQuestions) {
    return {
      valid: false,
      reason: `回答数が一致しません (期待: ${payload.numberOfQuestions}, 実際: ${validation.answeredQuestionIds.length})`,
    };
  }

  // Verify all answered questions are in the original question set
  const originalQuestionSet = new Set(payload.questionIds);
  for (const answeredId of validation.answeredQuestionIds) {
    if (!originalQuestionSet.has(answeredId)) {
      return {
        valid: false,
        reason: '回答した問題が元の問題セットに含まれていません',
      };
    }
  }

  // Verify correct answers don't exceed total questions
  if (validation.correctAnswers > payload.numberOfQuestions) {
    return {
      valid: false,
      reason: '正解数が問題数を超えています',
    };
  }

  // Verify time is reasonable (minimum 0.5 seconds per question)
  const minTime = payload.numberOfQuestions * 0.5;
  if (validation.timeInSeconds < minTime) {
    return {
      valid: false,
      reason: '回答時間が短すぎます',
    };
  }

  // Verify time doesn't exceed the actual elapsed time from token
  const now = Date.now();
  const elapsedFromToken = (now - payload.startTime) / 1000;
  // Allow some tolerance (5 seconds) for network latency
  if (validation.timeInSeconds > elapsedFromToken + 5) {
    return {
      valid: false,
      reason: '報告された回答時間がセッション開始からの経過時間を超えています',
    };
  }

  return { valid: true, payload };
}

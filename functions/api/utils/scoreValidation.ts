/**
 * Score validation utilities
 * Validates quiz scores to prevent fraudulent submissions
 */

export interface ScoreValidationParams {
  score: number;
  correctAnswers: number;
  timeInSeconds: number;
  numberOfQuestions: number;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Calculate the maximum possible score for a quiz
 */
export function calculateMaxScore(correctAnswers: number, timeInSeconds: number): number {
  return Math.max(0, correctAnswers * 1000 - Math.round(timeInSeconds) * 10);
}

/**
 * Calculate the theoretical maximum score (all correct, instant answer)
 */
export function calculateTheoreticalMax(numberOfQuestions: number): number {
  return numberOfQuestions * 1000;
}

/**
 * Validate if a score is possible given the constraints
 */
export function validateScore(params: ScoreValidationParams): ValidationResult {
  const { score, correctAnswers, timeInSeconds, numberOfQuestions } = params;

  // Check if correctAnswers is within valid range
  if (correctAnswers < 0 || correctAnswers > numberOfQuestions) {
    return {
      valid: false,
      reason: '正解数が不正です',
    };
  }

  // Check if time is reasonable (minimum 0.5 seconds per question for human reaction)
  const minTime = numberOfQuestions * 0.5;
  if (timeInSeconds < minTime) {
    return {
      valid: false,
      reason: '回答時間が短すぎます',
    };
  }

  // Check if time is not too long (maximum 5 minutes per question)
  const maxTime = numberOfQuestions * 300;
  if (timeInSeconds > maxTime) {
    return {
      valid: false,
      reason: '回答時間が長すぎます',
    };
  }

  // Check if score is negative
  if (score < 0) {
    return {
      valid: false,
      reason: 'スコアが負の値です',
    };
  }

  // Check if score is within theoretical bounds
  const theoreticalMax = calculateTheoreticalMax(numberOfQuestions);
  if (score > theoreticalMax) {
    return {
      valid: false,
      reason: 'スコアが理論上の最大値を超えています',
    };
  }

  // Calculate expected score
  const expectedScore = calculateMaxScore(correctAnswers, timeInSeconds);

  // Allow small tolerance (±100 points) for floating point precision
  const tolerance = 100;
  if (Math.abs(score - expectedScore) > tolerance) {
    return {
      valid: false,
      reason: 'スコアが計算と一致しません',
    };
  }

  return { valid: true };
}

/**
 * Extract score validation parameters from quiz state
 * This would be calculated on the frontend and sent to the backend
 */
export function extractValidationParams(quizState: {
  correctAnswers: number;
  startTime: number;
  endTime: number;
  numberOfQuestions: number;
}): ScoreValidationParams {
  const timeInSeconds = (quizState.endTime - quizState.startTime) / 1000;
  const score = calculateMaxScore(quizState.correctAnswers, timeInSeconds);

  return {
    score,
    correctAnswers: quizState.correctAnswers,
    timeInSeconds,
    numberOfQuestions: quizState.numberOfQuestions,
  };
}

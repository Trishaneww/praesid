export const CLASSIFIER_MODEL_ID = 'claude-haiku-4-5';
export const EVAL_JUDGE_MODEL_ID = 'claude-sonnet-5';

// Haiku 4.5 list price, USD per million tokens. cacheRead ≈ 0.1x input, cacheWrite ≈ 1.25x.
export const CLASSIFIER_PRICE_USD_PER_MTOK = { input: 1, output: 5 };

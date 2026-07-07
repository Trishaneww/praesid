import Anthropic from '@anthropic-ai/sdk';
import { CLASSIFIER_PRICE_USD_PER_MTOK } from '../../constants/anthropic';

export interface TokenUsage {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
}

export const EMPTY_USAGE: TokenUsage = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
};

export const usageFromMessage = (message: Anthropic.Message): TokenUsage => ({
  input: message.usage.input_tokens,
  output: message.usage.output_tokens,
  cacheRead: message.usage.cache_read_input_tokens ?? 0,
  cacheWrite: message.usage.cache_creation_input_tokens ?? 0,
});

export const addUsage = (a: TokenUsage, b: TokenUsage): TokenUsage => ({
  input: a.input + b.input,
  output: a.output + b.output,
  cacheRead: a.cacheRead + b.cacheRead,
  cacheWrite: a.cacheWrite + b.cacheWrite,
});

export const estimateCostUsd = (usage: TokenUsage): number => {
  const { input, output } = CLASSIFIER_PRICE_USD_PER_MTOK;
  const billableInput =
    usage.input + usage.cacheRead * 0.1 + usage.cacheWrite * 1.25;
  return (billableInput * input + usage.output * output) / 1_000_000;
};

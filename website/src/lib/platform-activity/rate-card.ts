import type { PlatformModelUsage } from "./types";

type ModelRate = {
  inputPerMillion: number;
  outputPerMillion: number;
};

type RateCard = {
  version: string;
  models: Record<string, ModelRate>;
};

export type ModelCost = {
  rateCardVersion?: string;
  costUsd?: number;
};

export function calculateModelCost(model: string, usage: PlatformModelUsage): ModelCost {
  const raw = process.env.PLATFORM_MODEL_RATE_CARD_JSON;
  if (!raw) return {};

  let card: RateCard;
  try {
    card = JSON.parse(raw) as RateCard;
  } catch {
    throw new Error("PLATFORM_MODEL_RATE_CARD_JSON is invalid JSON.");
  }

  const rate = card.models?.[model];
  if (!card.version || !rate) return { rateCardVersion: card.version };
  if (usage.inputTokens === undefined && usage.outputTokens === undefined) {
    return { rateCardVersion: card.version };
  }

  const inputTokens = usage.inputTokens ?? 0;
  const outputTokens = usage.outputTokens ?? 0;
  const costUsd =
    (inputTokens / 1_000_000) * rate.inputPerMillion +
    (outputTokens / 1_000_000) * rate.outputPerMillion;

  return { rateCardVersion: card.version, costUsd };
}

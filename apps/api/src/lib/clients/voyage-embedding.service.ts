import { Injectable } from '@nestjs/common';
import { EmbeddingClient, EmbeddingInputType } from './embedding-client';
import { chunkItems } from '../collections';
import {
  EMBEDDING_DIMENSION,
  EMBEDDING_MODEL_ID,
  VOYAGE_EMBED_BATCH_SIZE,
} from '../../constants/embeddings';

const VOYAGE_EMBEDDINGS_URL = 'https://api.voyageai.com/v1/embeddings';
const RATE_LIMIT_MAX_RETRIES = 5;
const RATE_LIMIT_RETRY_DELAY_MS = 25_000;

interface VoyageEmbeddingsResponse {
  data: { index: number; embedding: number[] }[];
}

const waitMilliseconds = (durationMs: number) =>
  new Promise((resolve) => setTimeout(resolve, durationMs));

@Injectable()
export class VoyageEmbeddingService implements EmbeddingClient {
  async embedText(
    texts: string[],
    inputType: EmbeddingInputType,
  ): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const batch of chunkItems(texts, VOYAGE_EMBED_BATCH_SIZE)) {
      embeddings.push(...(await this.embedBatch(batch, inputType)));
    }
    return embeddings;
  }

  private async embedBatch(
    texts: string[],
    inputType: EmbeddingInputType,
  ): Promise<number[][]> {
    for (let attempt = 0; ; attempt++) {
      const response = await fetch(VOYAGE_EMBEDDINGS_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL_ID,
          input: texts,
          input_type: inputType,
          output_dimension: EMBEDDING_DIMENSION,
        }),
      });
      if (response.status === 429 && attempt < RATE_LIMIT_MAX_RETRIES) {
        console.warn(
          `Voyage rate limit hit — retrying in ${RATE_LIMIT_RETRY_DELAY_MS / 1000}s (attempt ${attempt + 1}/${RATE_LIMIT_MAX_RETRIES})`,
        );
        await waitMilliseconds(RATE_LIMIT_RETRY_DELAY_MS);
        continue;
      }
      if (!response.ok) {
        throw new Error(
          `Voyage embeddings request failed (${response.status}): ${await response.text()}`,
        );
      }
      const payload = (await response.json()) as VoyageEmbeddingsResponse;
      return payload.data
        .sort((first, second) => first.index - second.index)
        .map((item) => item.embedding);
    }
  }
}

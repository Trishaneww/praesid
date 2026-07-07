export const EMBEDDING_CLIENT = 'EMBEDDING_CLIENT';

// Retrieval-tuned models embed corpus documents and search queries differently,
// so every caller must say which side of the search it is on.
export type EmbeddingInputType = 'document' | 'query';

export interface EmbeddingClient {
  embedText(
    texts: string[],
    inputType: EmbeddingInputType,
  ): Promise<number[][]>;
}

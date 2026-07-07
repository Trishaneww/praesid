import Anthropic from '@anthropic-ai/sdk';

export const parseStructuredResponse = <T>(message: Anthropic.Message): T => {
  const textBlock = message.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text',
  );
  if (!textBlock) {
    throw new Error('Anthropic response contained no text block to parse');
  }
  return JSON.parse(textBlock.text) as T;
};

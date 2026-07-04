import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AnthropicService {
  readonly client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

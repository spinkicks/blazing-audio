import Anthropic from '@anthropic-ai/sdk';
import { HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

/**
 * The Claude API key. It is stored as a Firebase secret (never in the client
 * bundle and never in source). Set it later with:
 *   firebase functions:secrets:set ANTHROPIC_API_KEY
 * Until it is set, every AI callable fails closed with a clear message.
 */
export const anthropicApiKey = defineSecret('ANTHROPIC_API_KEY');

/**
 * Pinned model id. The exact production model is chosen when the key is
 * provisioned; override without a code change via the CLAUDE_MODEL env var.
 */
export const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-3-5-sonnet-latest';

function getClient(): Anthropic {
  const apiKey = anthropicApiKey.value();
  if (!apiKey) {
    throw new HttpsError(
      'failed-precondition',
      'The AI assistant is not configured yet. An administrator needs to set the ANTHROPIC_API_KEY secret.',
    );
  }
  return new Anthropic({ apiKey });
}

export interface AskClaudeOptions {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

/** Sends one user message and returns the concatenated text of the reply. */
export async function askClaude(opts: AskClaudeOptions): Promise<string> {
  const client = getClient();
  let message;
  try {
    message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.5,
      system: opts.system,
      messages: [{ role: 'user', content: opts.user }],
    });
  } catch (err) {
    console.error('Claude request failed', err);
    throw new HttpsError('internal', 'The AI assistant could not be reached. Please try again.');
  }

  const text = message.content
    .map((block) => (block.type === 'text' ? block.text : ''))
    .join('\n')
    .trim();

  if (!text) {
    throw new HttpsError('internal', 'The AI assistant returned an empty response.');
  }
  return text;
}

/**
 * Pulls the first JSON value out of a model response, tolerating accidental
 * markdown code fences or stray prose around it.
 */
export function parseJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;

  const candidates = [body.indexOf('{'), body.indexOf('[')].filter((i) => i >= 0);
  const start = candidates.length ? Math.min(...candidates) : -1;
  const end = Math.max(body.lastIndexOf('}'), body.lastIndexOf(']'));

  if (start === -1 || end === -1 || end < start) {
    throw new HttpsError('internal', 'The AI assistant returned data in an unexpected format.');
  }
  try {
    return JSON.parse(body.slice(start, end + 1)) as T;
  } catch {
    throw new HttpsError('internal', 'The AI assistant returned data that could not be read.');
  }
}

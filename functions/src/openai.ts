import OpenAI from 'openai';
import { HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

/**
 * The OpenAI API key. It is stored as a Firebase secret (never in the client
 * bundle and never in source). Set it with:
 *   firebase functions:secrets:set OPENAI_API_KEY
 * Until it is set, every AI callable fails closed with a clear message.
 */
export const openAiApiKey = defineSecret('OPENAI_API_KEY');

/**
 * Pinned model id. Override without a code change via the OPENAI_MODEL env var.
 * Defaults to a cost-effective model that supports JSON response format.
 */
export const OPENAI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

function getClient(): OpenAI {
  const apiKey = openAiApiKey.value();
  if (!apiKey) {
    throw new HttpsError(
      'failed-precondition',
      'The AI assistant is not configured yet. An administrator needs to set the OPENAI_API_KEY secret.',
    );
  }
  return new OpenAI({ apiKey });
}

export interface AskModelOptions {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  /** Ask the model for a strict JSON object (uses OpenAI's JSON response mode). */
  json?: boolean;
}

/** Sends a system + user message and returns the assistant's reply text. */
export async function askModel(opts: AskModelOptions): Promise<string> {
  const client = getClient();
  let completion;
  try {
    completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      max_tokens: opts.maxTokens ?? 1024,
      temperature: opts.temperature ?? 0.5,
      messages: [
        { role: 'system', content: opts.system },
        { role: 'user', content: opts.user },
      ],
      ...(opts.json ? { response_format: { type: 'json_object' as const } } : {}),
    });
  } catch (err) {
    console.error('OpenAI request failed', err);
    throw new HttpsError('internal', 'The AI assistant could not be reached. Please try again.');
  }

  const text = completion.choices[0]?.message?.content?.trim() ?? '';
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

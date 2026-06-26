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

/**
 * A strict JSON Schema for OpenAI Structured Outputs. When supplied, the model
 * is constrained to return JSON that exactly matches this schema (no missing
 * fields, no stray prose), which removes a whole class of "the model returned
 * something we could not parse" failures.
 */
export interface JsonSchemaSpec {
  name: string;
  schema: Record<string, unknown>;
}

export interface AskModelOptions {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  /** Ask the model for a JSON object (loose JSON mode). */
  json?: boolean;
  /** Ask the model for JSON matching this exact schema (Structured Outputs). */
  schema?: JsonSchemaSpec;
}

type ResponseFormat =
  | { type: 'json_object' }
  | {
      type: 'json_schema';
      json_schema: { name: string; strict: true; schema: Record<string, unknown> };
    };

/** Sends a system + user message and returns the assistant's reply text. */
export async function askModel(opts: AskModelOptions): Promise<string> {
  const client = getClient();

  let responseFormat: ResponseFormat | undefined;
  if (opts.schema) {
    responseFormat = {
      type: 'json_schema',
      json_schema: { name: opts.schema.name, strict: true, schema: opts.schema.schema },
    };
  } else if (opts.json) {
    responseFormat = { type: 'json_object' };
  }

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
      ...(responseFormat ? { response_format: responseFormat } : {}),
    });
  } catch (err) {
    console.error('OpenAI request failed', err);
    throw new HttpsError('internal', 'The AI assistant could not be reached. Please try again.');
  }

  const choice = completion.choices[0];
  if (choice?.message?.refusal) {
    console.error('OpenAI refused the request', choice.message.refusal);
    throw new HttpsError('internal', 'The AI assistant could not help with that request.');
  }
  if (choice?.finish_reason === 'length') {
    // The reply was cut off mid-JSON; treat as a soft failure so the caller can retry.
    console.error('OpenAI response truncated (hit max_tokens)');
    throw new HttpsError('internal', 'The AI assistant ran out of room. Please try again.');
  }

  const text = choice?.message?.content?.trim() ?? '';
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

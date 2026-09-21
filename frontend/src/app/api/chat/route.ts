import { NextResponse } from 'next/server';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-oss-120b';
const MAX_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 1200;

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const systemPrompt = `You are the warm, conversational Umutungo property guide for Rwanda.
Talk like a helpful local property advisor, not like a form or a scripted chatbot. Acknowledge what the person just said, keep the conversation flowing, and ask one useful follow-up question at a time. Use natural language and vary your wording. If someone says they want a home near the U.S. Embassy, understand that they likely mean the Kacyiru area of Kigali and ask about budget, bedrooms, and whether they want furnished or unfurnished.
Help people explore homes, apartments, land, and commercial spaces; understand buying and renting; compare property details; learn about Kigali neighbourhoods; and list a property.
Use only information provided in the conversation or general guidance. Do not invent live listings, availability, prices, legal advice, or contact details. If the user asks for current inventory, explain that you can help narrow the search and direct them to the Umutungo listings or a verified agent.
Keep replies short but human, usually 2 to 4 sentences. Reply in the same language as the user when possible, including English, French, Kinyarwanda, or Swahili.`;

function isValidMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Record<string, unknown>;
  return (message.role === 'user' || message.role === 'assistant')
    && typeof message.content === 'string'
    && message.content.trim().length > 0;
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;

  if (!apiKey || apiKey === 'null') {
    return NextResponse.json({ error: 'Groq is not configured.' }, { status: 503 });
  }

  try {
    const body = await request.json() as { messages?: unknown };
    const messages = Array.isArray(body.messages)
      ? body.messages.filter(isValidMessage).slice(-MAX_MESSAGES).map((message) => ({
        role: message.role,
        content: message.content.trim().slice(0, MAX_MESSAGE_LENGTH),
      }))
      : [];

    if (!messages.length || messages[messages.length - 1].role !== 'user') {
      return NextResponse.json({ error: 'Please send a message.' }, { status: 400 });
    }

    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        temperature: 0.5,
        max_tokens: 450,
        reasoning_effort: 'low',
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Groq could not answer right now.' }, { status: 502 });
    }

    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const message = data.choices?.[0]?.message?.content?.trim();

    if (!message) {
      return NextResponse.json({ error: 'Groq returned an empty response.' }, { status: 502 });
    }

    return NextResponse.json({ message });
  } catch {
    return NextResponse.json({ error: 'The chat service is unavailable right now.' }, { status: 500 });
  }
}

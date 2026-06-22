import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/ai/chat
 * Proxies messages to the Anthropic API (claude-sonnet-4-6).
 * Requires ANTHROPIC_API_KEY in environment variables.
 *
 * Body: { messages: { role: 'user'|'assistant', content: string }[], systemPrompt: string }
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY is not configured. Add it to your .env file to enable the AI assistant.' },
      { status: 503 }
    );
  }

  try {
    const { messages, systemPrompt } = await req.json();

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message || 'Anthropic API error' }, { status: response.status });
    }

    const content = data.content?.[0]?.text || '';
    return NextResponse.json({ content });
  } catch (err: any) {
    console.error('AI chat error:', err);
    return NextResponse.json({ error: 'Failed to reach AI service' }, { status: 500 });
  }
}

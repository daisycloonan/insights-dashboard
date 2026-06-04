import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { theme, reviews } = await req.json();

  const relevantReviews = reviews
    .slice(0, 15)
    .map((r: { productName: string; brand: string; rating: number; transcript: string }) =>
      `[${r.productName} by ${r.brand}, rating ${r.rating}/5]: ${r.transcript.slice(0, 300)}`
    )
    .join('\n---\n');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are a senior consumer insights analyst for a beverage brand intelligence platform.

Based on the reviews below about the theme "${theme}", write ONE concise insight sentence (max 30 words) that:
- Describes the overall consumer consensus on this theme
- Names specific brands or products where the signal is strongest
- Highlights any tension or nuance (e.g. loved by some, divisive for others)
- Sounds like a commercial insight, not a data summary

Reviews:
${relevantReviews}

Respond with only the insight sentence. No preamble, no quotes around the sentence.`,
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  const data = await response.json();
  const text = data.content?.[0]?.text?.trim() ?? '';
  return NextResponse.json({ summary: text });
}
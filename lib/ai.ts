export async function openAIText(input: string) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY is not configured');
  const model = process.env.OPENAI_MODEL || 'gpt-5.6-luna';
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model, input }),
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.error?.message || 'AI request failed');
  const text = typeof data.output_text === 'string' ? data.output_text : (data.output || []).flatMap((x:any)=>x.content||[]).map((x:any)=>x.text||'').join('');
  return { text, model };
}

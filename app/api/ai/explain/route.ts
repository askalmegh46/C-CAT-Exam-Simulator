import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openAIText } from '@/lib/ai';
import { sameOrigin, rateLimit, rateLimitResponse } from '@/lib/security';
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({error:'Invalid request origin'},{status:403});
  const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown';
  if(!rateLimit(`ai-explain:${ip}`,20,60_000).ok) return rateLimitResponse();
  const s=await createClient(); const {data:{user}}=await s.auth.getUser(); if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
  const body=await request.json().catch(()=>({}));
  const qid=String(body.questionId||''); const selected=Number(body.selectedAnswer); if(!qid||![0,1,2,3].includes(selected))return NextResponse.json({error:'Invalid payload'},{status:400});
  const {data:q,error}=await s.from('questions').select('id,topic,difficulty,question,options,correct_answer,explanation').eq('id',qid).single();
  if(error||!q)return NextResponse.json({error:'Question not found'},{status:404});
  const prompt=`You are a C-CAT preparation tutor. Explain this practice question step-by-step for a BE Computer Science student. The student chose option ${String.fromCharCode(65+selected)}. Question: ${q.question}\nOptions: ${(q.options as string[]).map((x,i)=>`${String.fromCharCode(65+i)}. ${x}`).join(' | ')}\nCorrect option: ${String.fromCharCode(65+q.correct_answer)}\nTopic: ${q.topic}\nDifficulty: ${q.difficulty}\nExisting explanation (use as reference, do not contradict it): ${q.explanation}\nGive: (1) why the chosen answer is right/wrong, (2) the concept, (3) a short memory trick, (4) one exam tip. Do not invent facts.`;
  try { const ai=await openAIText(prompt); return NextResponse.json({explanation:ai.text,model:ai.model}); } catch(e:any){ return NextResponse.json({error:e.message},{status:503}); }
}

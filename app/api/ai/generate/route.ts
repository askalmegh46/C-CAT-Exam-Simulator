import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { openAIText } from '@/lib/ai';
import { sameOrigin, rateLimit, rateLimitResponse } from '@/lib/security';
function parseJSON(text:string){let clean=text.trim().replace(/^```json\s*/,'').replace(/^```\s*/,'').replace(/```$/,'').trim();const start=clean.indexOf('['),end=clean.lastIndexOf(']');if(start>=0&&end>start)clean=clean.slice(start,end+1);return JSON.parse(clean)}
export async function POST(request:Request){
 if(!sameOrigin(request))return NextResponse.json({error:'Invalid request origin'},{status:403});
 const ip=request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'unknown'; if(!rateLimit(`ai-generate:${ip}`,8,60_000).ok)return rateLimitResponse();
 const s=await createClient(); const {data:{user}}=await s.auth.getUser(); if(!user)return NextResponse.json({error:'Unauthorized'},{status:401});
 const body=await request.json().catch(()=>({})); const topic=String(body.topic||'').trim(); const difficulty=['Easy','Medium','Hard'].includes(body.difficulty)?body.difficulty:'Medium'; const count=Math.min(5,Math.max(1,Number(body.count)||3));
 if(!topic)return NextResponse.json({error:'Topic is required'},{status:400});
 const {data:attempts}=await s.from('exam_attempts').select('id').eq('user_id',user.id).order('created_at',{ascending:false}).limit(30); const ids=(attempts||[]).map(x=>x.id);
 const {data:weak}=ids.length?await s.from('attempt_answers').select('question_id,is_correct,questions!inner(topic)').in('attempt_id',ids):{data:[]};
 const relevant=(weak||[]).filter((x:any)=>x.questions?.topic===topic && x.is_correct===false).length;
 const prompt=`Generate ${count} ORIGINAL C-CAT practice MCQs for topic "${topic}" at ${difficulty} difficulty. The user has ${relevant} recent incorrect answers in this topic. Do not imitate or reproduce copyrighted source questions. Return ONLY valid JSON array, no markdown. Each item must have {"question":string,"options":[string,string,string,string],"correct_answer":0|1|2|3,"explanation":string}. Ensure one unambiguous correct answer and concise explanations. These are AI-generated practice questions, not official C-CAT questions.`;
 try{const ai=await openAIText(prompt);const items=parseJSON(ai.text);if(!Array.isArray(items)||!items.length)throw new Error('AI returned no questions');const rows=items.slice(0,count).map((x:any)=>({user_id:user.id,source_topic:topic,difficulty,question:String(x.question),options:x.options,correct_answer:Number(x.correct_answer),explanation:String(x.explanation),model:ai.model}));const {data,error}=await s.from('ai_generated_questions').insert(rows).select('id,source_topic,difficulty,question,options,correct_answer,explanation,created_at');if(error)throw new Error(error.message);return NextResponse.json({questions:data,model:ai.model});}catch(e:any){return NextResponse.json({error:e.message},{status:503});}
}

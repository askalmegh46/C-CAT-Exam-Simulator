import Nav from '@/components/Nav';
import ExamClient from './ExamClient';
export default async function Exam({searchParams}:{searchParams:Promise<{mode?:string}>}){
 const {mode='A'}=await searchParams;
 const safe=(mode==='B'||mode==='AB'?mode:'A') as 'A'|'B'|'AB';
 return <div className="shell"><Nav/><main className="container"><ExamClient mode={safe}/></main></div>
}

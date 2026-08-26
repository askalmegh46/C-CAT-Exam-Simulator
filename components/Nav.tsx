import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ThemeToggle from './ThemeToggle'
export default async function Nav(){
 const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser();
 return <nav className="nav"><div className="navin">
  <Link href="/dashboard" className="brand">C-CAT<span>LAB</span></Link>
  <div className="navlinks">
   <Link href="/dashboard">Dashboard</Link><Link href="/practice">Problems</Link><Link href="/mock">Mock Tests</Link>
   <Link href="/revision">Revision</Link><Link href="/analytics">Analytics</Link><Link href="/leaderboard">Leaderboard</Link><Link href="/ai-study">AI Study</Link><Link href="/sources">Sources</Link>
   {user&&<Link href="/admin/questions">Admin</Link>}
  </div>
  <div className="navright"><ThemeToggle/><span className="pill user-pill">{user?.email??'Guest'}</span></div>
 </div></nav>
}

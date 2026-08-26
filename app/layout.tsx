import './globals.css'
import ActivityHeartbeat from '@/components/ActivityHeartbeat'
export const metadata={title:'C-CAT Lab — Exam Simulator',description:'C-CAT preparation platform with Next.js and Supabase'}
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><ActivityHeartbeat/>{children}</body></html>}

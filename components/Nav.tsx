'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ThemeToggle from './ThemeToggle'

/**
 * Browser-safe navigation component.
 *
 * IMPORTANT: this component must never import `@/lib/supabase/server` because
 * Nav is also rendered from Client Components (for example the admin console).
 * The server Supabase client imports `next/headers`, which is server-only.
 */
export default function Nav() {
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setEmail(data.user?.email ?? null)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setEmail(session?.user?.email ?? null)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  return (
    <nav className="nav">
      <div className="navin">
        <Link href="/dashboard" className="brand">
          C-CAT<span>LAB</span>
        </Link>
        <div className="navlinks">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/practice">Problems</Link>
          <Link href="/mock">Mock Tests</Link>
          <Link href="/revision">Revision</Link>
          <Link href="/analytics">Analytics</Link>
          <Link href="/leaderboard">Leaderboard</Link>
          <Link href="/ai-study">AI Study</Link>
          <Link href="/sources">Sources</Link>
          {email && <Link href="/admin/questions">Admin</Link>}
        </div>
        <div className="navright">
          <ThemeToggle />
          <span className="pill user-pill">{email ?? 'Guest'}</span>
        </div>
      </div>
    </nav>
  )
}

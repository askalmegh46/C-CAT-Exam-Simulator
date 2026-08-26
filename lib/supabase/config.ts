/**
 * Centralized Supabase runtime configuration.
 *
 * IMPORTANT: NEXT_PUBLIC_SUPABASE_URL must be the project's API URL, e.g.
 * https://<project-ref>.supabase.co
 *
 * Do NOT use the Supabase dashboard URL:
 * https://supabase.com/dashboard/project/<project-ref>
 */
export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim()

  if (!url) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL. Set it to https://<project-ref>.supabase.co.'
    )
  }

  if (!key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Add the Supabase publishable key.'
    )
  }

  if (/supabase\.com\/dashboard\/project/i.test(url)) {
    throw new Error(
      'Invalid NEXT_PUBLIC_SUPABASE_URL: you used the Supabase Dashboard URL. Use https://<project-ref>.supabase.co instead.'
    )
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new Error(
      'Invalid NEXT_PUBLIC_SUPABASE_URL. Expected https://<project-ref>.supabase.co.'
    )
  }

  if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.supabase.co')) {
    throw new Error(
      'Invalid NEXT_PUBLIC_SUPABASE_URL. Expected https://<project-ref>.supabase.co.'
    )
  }

  return { url: parsed.origin, key }
}

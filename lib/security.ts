import { NextResponse } from 'next/server';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

/**
 * Lightweight per-instance limiter. Use a distributed limiter (e.g. Upstash)
 * for multi-instance production deployments; this layer still protects a
 * single instance from accidental request floods.
 */
export function rateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  current.count += 1;
  return { ok: current.count <= limit, remaining: Math.max(0, limit - current.count) };
}

export function rateLimitResponse() {
  return NextResponse.json(
    { error: 'Too many requests. Please slow down and try again.' },
    { status: 429, headers: { 'Retry-After': '60' } }
  );
}

/** Same-origin protection for state-changing browser requests. */
export function sameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true; // non-browser/server-to-server clients
  const host = request.headers.get('host');
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-DNS-Prefetch-Control': 'off',
    'Content-Security-Policy':
      "default-src 'self'; img-src 'self' data: blob: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://*.supabase.co wss://*.supabase.co; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  };
}

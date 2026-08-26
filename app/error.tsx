'use client';
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="container"><div className="card"><div className="eyebrow">APPLICATION ERROR</div><h1>Something went wrong</h1><p className="muted">The page could not be loaded. Your saved exam session remains server-backed.</p><button className="btn primary" onClick={() => reset()}>Try again</button></div></main>;
}

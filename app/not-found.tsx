import Link from 'next/link';
export default function NotFound(){return <main className="container"><div className="card"><div className="eyebrow">404</div><h1>Page not found</h1><p className="muted">Return to the C-CAT dashboard.</p><Link className="btn primary" href="/dashboard">Dashboard</Link></div></main>}

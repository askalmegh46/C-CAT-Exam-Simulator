# CORS / Supabase Auth Fix

The CORS/network failure shown in Chrome DevTools is caused by an incorrect
`NEXT_PUBLIC_SUPABASE_URL` if the request URL starts with:

`https://supabase.com/dashboard/project/<project-ref>/auth/v1/...`

That is the Supabase **Dashboard** host, not the project's API/Auth host.

## 1. Fix the environment variable

Use the project's API URL:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
```

You can find the Project URL in Supabase Dashboard -> Project Settings -> Data API.

Do not use:

```text
https://supabase.com/dashboard/project/<project-ref>
```

## 2. Configure Supabase Auth URLs

In Supabase Dashboard -> Authentication -> URL Configuration:

- Site URL (production): `https://c-cat-exam-simulator-l1r7.vercel.app`
- Redirect URL (production): `https://c-cat-exam-simulator-l1r7.vercel.app/auth/callback`
- Redirect URL (local): `http://localhost:3000/auth/callback`

If your Vercel project has a different production domain, use that exact domain instead.

For temporary Vercel preview deployments, you can add an appropriate preview URL/pattern in Supabase Auth URL Configuration rather than relying on an unconfigured origin.

## 3. Update Vercel environment variables

In Vercel -> Project -> Settings -> Environment Variables, update:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Apply them to the environments you use (Production, Preview, and Development as appropriate).

After changing a variable, redeploy the project. Next.js embeds `NEXT_PUBLIC_*`
values into the browser bundle at build time, so changing the Vercel variable
without a new deployment will not update an already-built client bundle.

## 4. Verify in Chrome DevTools

After redeploying, the signup request should look like:

```text
https://<project-ref>.supabase.co/auth/v1/signup
```

It should **not** look like:

```text
https://supabase.com/dashboard/project/<project-ref>/auth/v1/signup
```

The `redirect_to` value should point to your application's `/auth/callback` route.

## 5. No custom Next.js CORS header is required

Do not add `Access-Control-Allow-Origin: *` to this application to solve this
specific issue. The browser is contacting the wrong Supabase host; correcting
the project URL and Auth redirect configuration is the proper fix.

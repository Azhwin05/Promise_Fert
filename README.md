# Promise Fertility HMIS

Next.js app in `web/`, Supabase backend (schema applied via migrations on project `zptxewfmzcsbgjbbqbsl`).

## Run locally
```
cd web
npm install
npm run dev            # http://localhost:3000
npm run dev -- -H 0.0.0.0   # reach it from an iPad on the same Wi-Fi
```
`web/.env.local` needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable key only).

## First use
1. Open the app, choose "Create an account". The first account becomes the administrator.
2. Settings > Users: approve and assign roles to later sign-ups.
3. Add storage units (IVF Storage), drugs (Drug Formulary), and upload consent form files (Consent Forms).

## Deploy (Vercel)
```
cd web
npx vercel login
npx vercel --prod
```
Set the two environment variables above in the Vercel project, then add the Vercel URL to Supabase Auth > URL Configuration.
On the iPad: open the URL in Safari > Share > Add to Home Screen for a full-screen app.

See `docs/STATUS_AND_OPEN_ITEMS.md` for status and unresolved clinical questions.

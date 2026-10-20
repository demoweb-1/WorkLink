# WorkLink
React + TypeScript + Vite + Tailwind + Supabase.
Run: `npm install`, then `npm run dev`. Copy `.env.example` to `.env` first.
Supabase > Authentication > URL Configuration: add http://localhost:5173 and your deployed URL.
Deploy (Cloudflare Pages): build command `npm run build`, output `dist`, add the two env vars.
Never put a service_role key in frontend code.

# Knowledge Base

Knowledge Base is a personal app to quickly save and find notes, links, and images.
It supports Google sign-in, tagging, search, image uploads to Cloudflare R2, and sharing content directly into the app via PWA share target.

Built with Next.js, TypeScript, Supabase, and Cloudflare R2.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your local env file:

```bash
cp .env.example .env.local
```

3. Fill values in `.env.local` (Supabase + R2).

4. Run the app:

```bash
npm run dev
```

5. Open `http://localhost:3000`.

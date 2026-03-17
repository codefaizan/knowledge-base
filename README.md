# Knowledge Base

Knowledge Base is a personal app to quickly save and find notes, links, and images.
It supports Google sign-in, tagging, search, image uploads to Cloudflare R2, and sharing content directly into the app via PWA share target.

Built with Next.js, TypeScript, Supabase, and Cloudflare R2.

## Features

- **Quick capture:** Save plain text notes, links, or images from one simple input flow.
- **Google authentication:** Sign in securely with Supabase Auth and keep data tied to your account.
- **Smart organization:** Add tags to every item, then filter by tag to narrow results fast.
- **Search that feels useful:** Search across title/content/tags with relevance + recency-based ranking.
- **Image storage support:** Upload images to Cloudflare R2 and keep them linked to your saved items.
- **Share directly into the app:** On supported devices, use the system share sheet to send content straight to `/share` with fields prefilled.

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

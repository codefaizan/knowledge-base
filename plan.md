# Personal Knowledge Base — Implementation Plan

## Design Philosophy

- Prioritize simplicity over features
- Avoid unnecessary abstractions
- Keep the system easy to understand and maintain
- Optimize for keyboard-first workflows
- Every action should be fast (capture → tag → done)
- This is a personal tool, not a social or collaborative product
- Primary goal: speed of capture and retrieval, with as little friction and complexity as possible

## Context

Build a minimal, secure, fast web app for capturing and organizing personal knowledge (images, links, text).

**Tech stack**: Next.js (App Router) + Supabase (Auth, PostgreSQL) + Cloudflare R2 (image storage) + Tailwind CSS

---

## File Structure (13 files)

```
knowledge-base/
  .env.local                          # Supabase + R2 config (gitignored)
  supabase-schema.sql                 # SQL: items table + RLS policies (run once in Supabase dashboard)
  next.config.ts                      # Modify: increase API body size limit for image uploads
  src/
    lib/
      supabase.ts                     # Single Supabase client (public anon key, used everywhere)
      r2.ts                           # Server-side R2 S3-compatible client (API route only)
    components/
      auth-provider.tsx               # Auth context + useAuth() hook (onAuthStateChange)
      search-bar.tsx                  # Search input, "/" shortcut to focus
      capture-input.tsx               # Smart input: paste image/URL, type text, tags, Cmd+Enter
      item-card.tsx                   # Single item display (image/link/text), delete, tag chips
    hooks/
      use-items.ts                    # Types + fetch + search + filter + capture (central data layer)
    app/
      layout.tsx                      # Root layout with AuthProvider
      page.tsx                        # Main page: auth guard, tag filter, item grid, compose everything
      login/
        page.tsx                      # Login page with Google sign-in button (inlined)
      auth/
        callback/
          route.ts                    # GET: Supabase OAuth callback (exchanges code for session)
      api/
        upload/
          route.ts                    # POST: verify auth via anon client, upload image to R2
```

---

## Data Model

### PostgreSQL table: `items`

```sql
create table items (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('image', 'link', 'text')),
  title text not null default '',
  content text not null,
  tags text[] not null default '{}',
  user_id uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create index items_user_id_created_at on items(user_id, created_at desc);
```

### Row Level Security

```sql
alter table items enable row level security;

create policy "Users can read own items"
  on items for select using (auth.uid() = user_id);

create policy "Users can insert own items"
  on items for insert with check (auth.uid() = user_id);

create policy "Users can update own items"
  on items for update using (auth.uid() = user_id);

create policy "Users can delete own items"
  on items for delete using (auth.uid() = user_id);
```

### TypeScript types (defined in `use-items.ts`)

```typescript
type ItemType = "image" | "link" | "text";

interface Item {
  id: string;
  type: ItemType;
  title: string;
  content: string;       // R2 public URL | external URL | text
  tags: string[];
  user_id: string;
  created_at: string;    // ISO 8601 from PostgreSQL
}
```

---

## Implementation Steps

### Step 1: Project Scaffolding + Database
- `npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --no-import-alias --turbopack`
- `npm install @supabase/supabase-js @aws-sdk/client-s3`
- Create `.env.local` with:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client-safe)
  - `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
- Modify `next.config.ts` — increase API route body size limit to 10MB
- Create `supabase-schema.sql` — items table, index, RLS policies
- Developer runs SQL in Supabase dashboard before proceeding

### Step 2: Supabase Client + R2 Client
- Create `src/lib/supabase.ts` — single browser client using `NEXT_PUBLIC_*` env vars, used everywhere including API routes (with user's token passed to `auth.getUser(token)` for verification)
- Create `src/lib/r2.ts` — S3Client configured with R2 endpoint + credentials

### Step 3: Authentication
- Create `src/components/auth-provider.tsx` — React context wrapping `supabase.auth.onAuthStateChange()`, exposes `user`, `loading`, `signOut`
- Create `src/app/auth/callback/route.ts` — GET handler: exchanges OAuth `code` for session via `supabase.auth.exchangeCodeForSession(code)`
- Create `src/app/login/page.tsx` — centered login card with inlined Google sign-in button (calls `supabase.auth.signInWithOAuth({ provider: 'google' })`)
- Modify `src/app/layout.tsx` — wrap children in `<AuthProvider>`

### Step 4: Data Layer
- Create `src/hooks/use-items.ts` — central hook that contains:
  - `Item`, `NewItem`, `ItemType` type definitions
  - `isUrl()` helper (inline, URL constructor try/catch)
  - Supabase queries inlined: fetch, insert, delete, update tags
  - Client-side search via `Array.filter` on title/content/tags
  - Client-side tag filter
  - `capture()` function: auto-detects type (image/link/text), handles upload if image
  - Refetch after every mutation
- Create `src/app/api/upload/route.ts` — POST endpoint:
  1. Extract Bearer token from Authorization header
  2. Verify via `supabase.auth.getUser(token)` (anon key client, no service role needed)
  3. Validate file type (image/* only) and size (<10MB)
  4. Upload to R2 at `users/{user_id}/{timestamp}-{filename}`
  5. Return `{ url: R2_PUBLIC_URL/key }`

### Step 5: UI Components
- Create `src/components/search-bar.tsx` — controlled input, `/` keyboard shortcut, Escape to clear
- Create `src/components/capture-input.tsx` — paste handler (image detection, URL detection), textarea, tag input, Cmd+Enter submit, uploading indicator
- Create `src/components/item-card.tsx` — renders image thumbnail (plain `<img>`) / clickable link / text, tags as chips, hover-reveal delete, relative timestamp (via `Intl.RelativeTimeFormat`)

### Step 6: Main Page
- Create `src/app/page.tsx` — composes everything:
  - Auth guard (redirect to `/login` if no session)
  - Header with search bar + sign out button
  - Capture input
  - Tag filter (inlined: horizontal row of tag pills, click to toggle)
  - Item grid (inlined: responsive CSS grid, maps over filtered items → `<ItemCard>`)

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Single Supabase client (anon key only)** | `auth.getUser(token)` verifies JWTs without needing the service role key. One client, one fewer secret. |
| **Cloudflare R2 for images** (via API route) | No egress fees, S3-compatible. R2 credentials stay server-side; API route verifies JWT before uploading. |
| **Fetch-on-mount + refetch after mutation** | Simpler than Realtime subscriptions. Single user, no collaboration — no need for live updates. |
| **Client-side search** (`Array.filter`) | Sub-millisecond for thousands of items already in memory. No full-text search extension needed. |
| **Plain `<img>` tags** (not Next.js `<Image>`) | Avoids `remotePatterns` config. Screenshots don't need optimization. |
| **PostgreSQL `text[]` for tags** | Native array type, supports `@>` contains operator. No join table needed. |
| **Types and queries in `use-items.ts`** | One-liner Supabase calls don't warrant a separate file. Types live next to the code that uses them most. |
| **Inline tag filter and item grid in page.tsx** | Each is ~10 lines. Separate files add navigation overhead without reducing complexity. |

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `/` | Focus search bar |
| `Cmd+Enter` / `Ctrl+Enter` | Save current capture |
| `Escape` | Clear search / blur |
| Paste image | Auto-detect, upload, save |
| Paste URL | Auto-detect, save as link |

## UI Layout

```
+--------------------------------------------------+
| [/ Search...]                          [Sign out] |
+--------------------------------------------------+
| [Capture: paste image, URL, or type text...]      |
| [tags: comma-separated]         [Cmd+Enter: save] |
+--------------------------------------------------+
| [All] [tag1] [tag2] [tag3] ...                    |
+--------------------------------------------------+
| +--------+ +--------+ +--------+                  |
| | item 1 | | item 2 | | item 3 |                 |
| +--------+ +--------+ +--------+                  |
+--------------------------------------------------+
```

## Setup Requirements (manual, outside code)

1. Create Supabase project at supabase.com
2. Enable Auth > Providers > Google (provide Google OAuth client ID + secret)
3. Set the Supabase site URL and redirect URLs (e.g. `http://localhost:3000/auth/callback`)
4. Run `supabase-schema.sql` in the Supabase SQL Editor
5. Create Cloudflare R2 bucket, enable public access
6. Create R2 API token with Object Read & Write permissions
7. Fill `.env.local` with all config values

## Verification

1. `npm run dev` — app loads without errors
2. Navigate to `/login` — Google sign-in works
3. Redirects to `/` after login — main page shows
4. Type text + tags + Cmd+Enter — text item appears in grid
5. Paste a URL — link item appears
6. Paste a screenshot — image uploads to R2, thumbnail appears
7. Type in search bar — items filter instantly
8. Click a tag pill — filters by tag
9. Delete an item — disappears from grid
10. Sign out and sign in as different user — cannot see other user's items

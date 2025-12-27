# Supabase Setup for SyntheticaTunez

## 1. Database Schema

Run the SQL in `schema.sql` in your Supabase SQL Editor to create all required tables.

## 2. Edge Functions

### Deploy the generate-music function

The `generate-music` Edge Function proxies requests to the Replicate API to avoid CORS issues.

**Prerequisites:**
- Install Supabase CLI: `npm install -g supabase`
- Login: `supabase login`
- Link your project: `supabase link --project-ref vmjskjejkdxslnihrmzh`

**Deploy the function:**

```bash
# From the project root
supabase functions deploy generate-music
```

**Set the Replicate API secret:**

```bash
supabase secrets set REPLICATE_API_TOKEN=your_replicate_api_token_here
```

You can get your Replicate API token from: https://replicate.com/account/api-tokens

### Test the function locally (optional)

```bash
supabase functions serve generate-music --env-file .env.local
```

Create a `.env.local` file with:
```
REPLICATE_API_TOKEN=your_replicate_api_token_here
```

## 3. Environment Variables

Your React Native app needs these in `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://vmjskjejkdxslnihrmzh.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
```

Note: The Replicate API token is now stored securely in Supabase secrets, not in the client app.

## Function Endpoints

The Edge Function supports these actions:

| Action | Description |
|--------|-------------|
| `generate_music_ace` | Generate music with ACE-Step model |
| `generate_music_minimax` | Generate music with MiniMax model |
| `generate_cover_art` | Generate album cover art |
| `generate_complete` | Generate both music options + cover art (most efficient) |

### Example request:

```javascript
const response = await fetch('https://vmjskjejkdxslnihrmzh.supabase.co/functions/v1/generate-music', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_SUPABASE_ANON_KEY',
  },
  body: JSON.stringify({
    action: 'generate_complete',
    title: 'My Song',
    tags: 'pop, electronic, upbeat',
    prompt: 'Pop, Electronic, Upbeat',
    lyrics: '[verse]\nHello world...',
    genre: 'Pop',
    duration: 60,
  }),
});
```



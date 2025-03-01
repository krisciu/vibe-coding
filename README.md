# 🎭 Mood Mash: Chaotic Vibe Generator

Mood Mash is a fun, interactive web app that generates random "vibes" based on a Twitter/X handle. It's designed to be a lighthearted, shareable experience that creates unique aesthetic combinations that represent your digital mood.

## ✨ Features

- **Random Vibe Generation**: Get a unique combination of colors, fonts, quotes, and more
- **Twitter Handle Input**: Enter your Twitter/X handle to generate a custom vibe
- **Shareable Results**: Easily share your generated vibe on Twitter/X
- **Fun Animations**: Enjoy dynamic, chaotic animations that match your vibe
- **Music Suggestions**: Get a music recommendation that matches your vibe's energy
- **Vibe Leaderboard**: See and like the most popular vibes from other users

## 🚀 Quick Start

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 🗄️ Database Setup

This project uses Supabase for data storage. You need to set up the required table manually in your Supabase dashboard:

1. Log in to your Supabase dashboard
2. Select your project
3. Go to the SQL Editor
4. Run the following SQL:

```sql
-- Create the vibes table
CREATE TABLE IF NOT EXISTS public.vibes (
  id SERIAL PRIMARY KEY,
  twitter_handle TEXT NOT NULL,
  vibe_data JSONB NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on twitter_handle for faster lookups
CREATE INDEX IF NOT EXISTS idx_vibes_twitter_handle ON public.vibes(twitter_handle);
```

5. Update your `.env.local` file with your Supabase URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📱 Deployment

This project is designed to be easily deployable to Vercel with minimal configuration. Simply connect your GitHub repository to Vercel and deploy!

## 🧠 Future Enhancements

In future iterations, we plan to:
- Integrate with the Twitter/X API to generate vibes based on actual tweet content
- Add more vibe categories and aesthetic options
- Create a gallery of popular vibes
- Allow users to customize specific elements of their vibe

## 🎨 Vibe Coding Project

This project was created as a "vibe coding" experiment - focusing on creating something fun, chaotic, and shareable in a short amount of time. It's meant to be lighthearted and entertaining rather than solving a serious problem.

## 📄 License

MIT

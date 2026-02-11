# Songbird – AI Lyric Generator

Generate song lyrics from a topic or emotion. Sign up, log in, and save favorites.

**What the app does:** Songbird is a web app that uses AI to write song lyrics. You enter a topic or emotion (e.g. “bittersweet breakup” or “summer road trip”), pick a genre and optional mood, and the app generates full lyrics (verses, chorus, bridge). You must create an account and log in to save lyrics to your favorites; favorites are stored per user in the browser. You can export any generated lyrics as a `.txt` file. The front end is static HTML/CSS/JS; the backend can run as an Express server or as Netlify serverless functions, and lyric generation is powered by the OpenAI API.

## Deploy on Netlify

1. **Push your repo to GitHub** (or GitLab/Bitbucket).

2. **In [Netlify](https://app.netlify.com):**
   - **Add new site** → **Import an existing project** → connect your repo.
   - **Build settings:** leave **Build command** empty; set **Publish directory** to `.` (or leave default; `netlify.toml` sets it).
   - Click **Deploy site**.

3. **Set environment variables** (Site settings → Environment variables):
   - `OPENAI_API_KEY` – your OpenAI API key (required for lyric generation).
   - `OPENAI_MODEL` – optional; default is `gpt-4.1-mini`.

4. **Redeploy** after adding env vars so the functions pick them up.

User accounts are stored persistently using **Netlify Blobs** (store name: `songbird-users`), so signups and logins work across visits and deploys.

### Local dev with Netlify

```bash
npm install -g netlify-cli
netlify dev
```

This serves the site and runs the functions locally. Set `OPENAI_API_KEY` in a `.env` file or in Netlify’s env for the dev server.

## Run locally with Express

```bash
npm install
npm start
```

Then open `index.html` via a static server (e.g. Live Server) and set the API base in the app to `http://localhost:3000`, or serve the folder from Express and use the same origin.

# Songbird – AI Lyric Generator

Generate song lyrics from a topic or emotion. Sign up, log in, and save favorites.

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

**Note:** On Netlify, signup/login user data is stored in serverless `/tmp` and is **ephemeral** (can be lost between requests). For persistent accounts, add a database (e.g. Netlify Identity, Supabase, or another provider) and update the `netlify/functions/signup.js` and `login.js` logic.

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

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";
import bcrypt from "bcryptjs";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
const USERS_FILE = join(DATA_DIR, "users.json");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readUsers() {
  ensureDataDir();
  if (!existsSync(USERS_FILE)) return [];
  try {
    const raw = readFileSync(USERS_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  ensureDataDir();
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "AI Lyric Generator API is running" });
});

app.post("/api/signup", async (req, res) => {
  try {
    const { email, password, name } = req.body || {};
    const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const trimmedPassword = typeof password === "string" ? password : "";
    const trimmedName = typeof name === "string" ? name.trim() : "";

    if (!trimmedEmail) {
      return res.status(400).json({ error: "Email is required." });
    }
    if (trimmedPassword.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const users = readUsers();
    if (users.some((u) => u.email === trimmedEmail)) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);
    const user = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      email: trimmedEmail,
      passwordHash: hashedPassword,
      name: trimmedName || trimmedEmail.split("@")[0],
      createdAt: new Date().toISOString(),
    };
    users.push(user);
    writeUsers(users);

    res.status(201).json({
      id: user.id,
      email: user.email,
      name: user.name,
      message: "Account created successfully.",
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const trimmedPassword = typeof password === "string" ? password : "";

    if (!trimmedEmail || !trimmedPassword) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const users = readUsers();
    const user = users.find((u) => u.email === trimmedEmail);
    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const match = await bcrypt.compare(trimmedPassword, user.passwordHash);
    if (!match) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      message: "Logged in successfully.",
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

app.post("/api/generate-lyrics", async (req, res) => {
  try {
    const { topic, genre, mood } = req.body || {};

    if (!topic || typeof topic !== "string") {
      return res.status(400).json({ error: "Missing or invalid 'topic' field" });
    }

    const safeGenre =
      typeof genre === "string" && genre.trim() ? genre.trim() : "any";
    const safeMood = typeof mood === "string" && mood.trim() ? mood.trim() : "";

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not set in the server environment."
      });
    }

    const moodLine = safeMood
      ? `Overall mood or vibe: "${safeMood}".`
      : "";

    const prompt = [
      `You are a highly creative professional songwriter.`,
      `Write complete song lyrics in the style of ${safeGenre} music.`,
      `Topic or emotion: "${topic}".`,
      moodLine,
      `Structure the song with verses, a chorus, and optionally a bridge.`,
      `Make it singable, coherent, and emotionally engaging.`,
      `Return only the lyrics, no explanations or comments.`
    ]
      .filter(Boolean)
      .join(" ");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        messages: [
          {
            role: "system",
            content: "You are an AI that writes high-quality song lyrics."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 600
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("OpenAI API error:", response.status, errorText);
      return res.status(502).json({
        error: "Failed to generate lyrics from AI service.",
        details: errorText || null,
        status: response.status
      });
    }

    const data = await response.json();
    const lyrics =
      data?.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn't generate lyrics right now.";

    res.json({
      topic,
      genre: safeGenre,
      mood: safeMood,
      lyrics
    });
  } catch (err) {
    console.error("Server error:", err);
    res
      .status(500)
      .json({ error: "Unexpected server error while generating lyrics." });
  }
});

app.listen(port, () => {
  console.log(`AI Lyric Generator API listening on http://localhost:${port}`);
});


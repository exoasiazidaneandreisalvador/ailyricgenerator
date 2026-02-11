const topicInput = document.getElementById("topic-input");
const genreSelect = document.getElementById("genre-select");
const moodSelect = document.getElementById("mood-select");
const generateBtn = document.getElementById("generate-btn");
const statusText = document.getElementById("status-text");
const lyricsOutput = document.getElementById("lyrics-output");
const saveFavoriteBtn = document.getElementById("save-favorite-btn");
const exportBtn = document.getElementById("export-btn");
const favoritesList = document.getElementById("favorites-list");
const favoritesEmpty = document.getElementById("favorites-empty");
const clearFavoritesBtn = document.getElementById("clear-favorites-btn");

const FAVORITES_KEY_PREFIX = "ai-lyric-generator-favorites-v1";
const USER_STORAGE_KEY = "songbird-user";

function getFavoritesStorageKey() {
  const user = getCurrentUser();
  return user && user.id ? `${FAVORITES_KEY_PREFIX}-${user.id}` : null;
}

let lastGeneratedContext = null;

function getCurrentUser() {
  if (!("localStorage" in window)) return null;
  const raw = localStorage.getItem(USER_STORAGE_KEY);
  if (!raw) return null;
  const user = safeParseJSON(raw, null);
  return user && (user.name || user.email) ? user : null;
}

function clearCurrentUser() {
  if ("localStorage" in window) localStorage.removeItem(USER_STORAGE_KEY);
}

function updateHeaderUser() {
  const container = document.getElementById("header-user");
  if (!container) return;
  const user = getCurrentUser();
  if (user) {
    const displayName = user.name || user.email || "User";
    container.innerHTML = `
      <span class="header-greeting">Hi, <strong>${escapeHtml(displayName)}</strong></span>
      <button type="button" class="btn ghost btn-small" id="header-logout-btn">Log out</button>
    `;
    document.getElementById("header-logout-btn").addEventListener("click", () => {
      clearCurrentUser();
      updateHeaderUser();
      renderFavorites();
      updateActionButtonsState();
      setStatus("You have been logged out.");
    });
  } else {
    container.innerHTML = `
      <a href="login.html" class="btn ghost">Log in</a>
      <a href="signup.html" class="btn primary">Sign up</a>
    `;
  }
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function setStatus(message) {
  statusText.textContent = message || "";
}

function setGenerating(isGenerating) {
  generateBtn.disabled = isGenerating;
  generateBtn.textContent = isGenerating ? "Generating..." : "Generate lyrics";

  if (isGenerating) {
    setStatus("Talking to the AI songwriter...");
  } else if (!lyricsOutput.textContent.trim()) {
    setStatus("");
  }
}

function updateActionButtonsState() {
  const user = getCurrentUser();
  const hasLyrics =
    !!lastGeneratedContext && !!lastGeneratedContext.lyrics?.trim();
  saveFavoriteBtn.disabled = !user || !hasLyrics;
  const saveWrap = document.getElementById("save-favorite-wrap");
  if (saveWrap) saveWrap.title = user ? "" : "Sign up / log in to save";
  exportBtn.disabled = !hasLyrics;
  updateFavoritesLoginNotice();
}

function updateFavoritesLoginNotice() {
  const emptyEl = document.getElementById("favorites-empty");
  if (!emptyEl) return;
  const user = getCurrentUser();
  emptyEl.textContent = user
    ? "No favorites yet. Generate some lyrics and click \"Save to favorites\"."
    : "Sign up or log in to save lyrics to favorites.";
}

function safeParseJSON(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function loadFavorites() {
  if (!("localStorage" in window)) return [];
  const key = getFavoritesStorageKey();
  if (!key) return [];
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  const parsed = safeParseJSON(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

function saveFavorites(favorites) {
  if (!("localStorage" in window)) return;
  const key = getFavoritesStorageKey();
  if (!key) return;
  localStorage.setItem(key, JSON.stringify(favorites));
}

function formatDate(timestamp) {
  try {
    const d = new Date(timestamp);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

function renderFavorites() {
  const favorites = loadFavorites();

  favoritesList.innerHTML = "";

  if (!favorites.length) {
    favoritesEmpty.style.display = "block";
    clearFavoritesBtn.disabled = true;
    return;
  }

  favoritesEmpty.style.display = "none";
  clearFavoritesBtn.disabled = false;

  favorites
    .slice()
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .forEach((fav) => {
      const li = document.createElement("li");
      li.className = "favorite-item";

      const main = document.createElement("div");
      main.className = "favorite-main";

      const title = document.createElement("div");
      title.className = "favorite-title";
      title.textContent = fav.topic || "Untitled idea";

      const meta = document.createElement("div");
      meta.className = "favorite-meta";
      const parts = [];
      if (fav.genre && fav.genre !== "any") {
        parts.push(fav.genre);
      }
      if (fav.mood) {
        parts.push(fav.mood);
      }
      if (fav.createdAt) {
        parts.push(formatDate(fav.createdAt));
      }
      meta.textContent = parts.join(" · ");

      main.appendChild(title);
      main.appendChild(meta);

      const actions = document.createElement("div");
      actions.className = "favorite-actions";

      const viewBtn = document.createElement("button");
      viewBtn.className = "btn tiny ghost";
      viewBtn.textContent = "View";
      viewBtn.addEventListener("click", () => {
        lastGeneratedContext = {
          topic: fav.topic,
          genre: fav.genre,
          mood: fav.mood,
          lyrics: fav.lyrics,
          createdAt: fav.createdAt
        };
        lyricsOutput.textContent = fav.lyrics || "";
        topicInput.value = fav.topic || "";
        if (fav.genre && genreSelect.querySelector(`option[value="${fav.genre}"]`)) {
          genreSelect.value = fav.genre;
        }
        if (fav.mood && moodSelect.querySelector(`option[value="${fav.mood}"]`)) {
          moodSelect.value = fav.mood;
        }
        updateActionButtonsState();
        setStatus("Loaded lyrics from favorites.");
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "btn tiny ghost";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => {
        const updated = loadFavorites().filter((item) => item.id !== fav.id);
        saveFavorites(updated);
        renderFavorites();
        if (lastGeneratedContext && lastGeneratedContext.id === fav.id) {
          lastGeneratedContext = null;
          lyricsOutput.textContent = "";
          updateActionButtonsState();
        }
      });

      actions.appendChild(viewBtn);
      actions.appendChild(deleteBtn);

      li.appendChild(main);
      li.appendChild(actions);
      favoritesList.appendChild(li);
    });
}

async function handleGenerateClick() {
  const topic = topicInput.value.trim();
  const genre = genreSelect.value;
  const mood = moodSelect.value;

  if (!topic) {
    setStatus("Please enter a topic or emotion first.");
    topicInput.focus();
    return;
  }

  setGenerating(true);
  lastGeneratedContext = null;
  updateActionButtonsState();

  try {
    const response = await fetch("/api/generate-lyrics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ topic, genre, mood })
    });

    if (!response.ok) {
      let errorMessage =
        "Something went wrong while generating lyrics. Please try again.";
      try {
        const errorData = await response.json();
        if (errorData?.error) {
          errorMessage = errorData.error;
          if (errorData.details) {
            errorMessage += " (" + String(errorData.details).slice(0, 180) + ")";
          }
        }
      } catch {
        // ignore JSON parse errors, keep default message
      }
      setStatus(errorMessage);
      return;
    }

    const data = await response.json();
    const lyrics = (data && data.lyrics) || "";

    if (!lyrics.trim()) {
      setStatus("The AI did not return any lyrics. Try again.");
      lyricsOutput.textContent = "";
      return;
    }

    lastGeneratedContext = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      topic,
      genre,
      mood,
      lyrics,
      createdAt: Date.now()
    };

    lyricsOutput.textContent = lyrics;
    updateActionButtonsState();
    setStatus("Lyrics generated. You can save or export them.");
  } catch (err) {
    console.error("Error generating lyrics:", err);
    setStatus("Network error while talking to the AI. Check the server and try again.");
  } finally {
    setGenerating(false);
  }
}

function handleSaveFavoriteClick() {
  if (!getCurrentUser()) {
    setStatus("Create an account or log in to save to favorites.");
    return;
  }
  if (!lastGeneratedContext || !lastGeneratedContext.lyrics?.trim()) {
    setStatus("Generate some lyrics before saving to favorites.");
    return;
  }

  const favorites = loadFavorites();
  const entry = {
    ...lastGeneratedContext,
    id:
      lastGeneratedContext.id ||
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
  };

  favorites.push(entry);
  saveFavorites(favorites);
  renderFavorites();
  setStatus("Saved lyrics to favorites on this device.");
}

function slugify(value) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "song";
}

function handleExportClick() {
  if (!lastGeneratedContext || !lastGeneratedContext.lyrics?.trim()) {
    setStatus("Generate some lyrics before exporting.");
    return;
  }

  const { lyrics, topic, genre } = lastGeneratedContext;
  const safeTopic = slugify(topic);
  const safeGenre = slugify(genre || "any");
  const now = new Date()
    .toISOString()
    .replace(/[:.]/g, "-")
    .replace("T", "_")
    .replace("Z", "");

  const filename = `lyrics-${safeGenre}-${safeTopic}-${now}.txt`;

  const blob = new Blob([lyrics], {
    type: "text/plain;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  setStatus(`Exported lyrics as ${filename}`);
}

function handleClearFavoritesClick() {
  const favorites = loadFavorites();
  if (!favorites.length) {
    setStatus("No favorites to clear.");
    return;
  }

  const confirmed = window.confirm(
    "Clear all saved favorite lyrics from this device?"
  );
  if (!confirmed) return;

  saveFavorites([]);
  renderFavorites();
  setStatus("Cleared all favorites on this device.");
}

function init() {
  updateHeaderUser();
  renderFavorites();
  updateActionButtonsState();
  setStatus("");

  generateBtn.addEventListener("click", handleGenerateClick);
  saveFavoriteBtn.addEventListener("click", handleSaveFavoriteClick);
  exportBtn.addEventListener("click", handleExportClick);
  clearFavoritesBtn.addEventListener("click", handleClearFavoritesClick);

  topicInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      handleGenerateClick();
    }
  });
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  init();
} else {
  document.addEventListener("DOMContentLoaded", init);
}


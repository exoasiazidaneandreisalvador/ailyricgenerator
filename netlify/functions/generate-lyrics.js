function jsonResponse(statusCode, data) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
    },
    body: JSON.stringify(data),
  };
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" }, body: "" };
  }
  if (event.httpMethod !== "POST") {
    return jsonResponse(405, { error: "Method not allowed" });
  }

  try {
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body || {};
    const { topic, genre, mood } = body;

    if (!topic || typeof topic !== "string") {
      return jsonResponse(400, { error: "Missing or invalid 'topic' field" });
    }

    const safeGenre = typeof genre === "string" && genre.trim() ? genre.trim() : "any";
    const safeMood = typeof mood === "string" && mood.trim() ? mood.trim() : "";

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return jsonResponse(500, { error: "OPENAI_API_KEY is not set in the server environment." });
    }

    const moodLine = safeMood ? `Overall mood or vibe: "${safeMood}".` : "";
    const prompt = [
      "You are a highly creative professional songwriter.",
      `Write complete song lyrics in the style of ${safeGenre} music.`,
      `Topic or emotion: "${topic}".`,
      moodLine,
      "Structure the song with verses, a chorus, and optionally a bridge.",
      "Make it singable, coherent, and emotionally engaging.",
      "Return only the lyrics, no explanations or comments.",
    ]
      .filter(Boolean)
      .join(" ");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        messages: [
          { role: "system", content: "You are an AI that writes high-quality song lyrics." },
          { role: "user", content: prompt },
        ],
        temperature: 0.9,
        max_tokens: 600,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("OpenAI API error:", response.status, errorText);
      return jsonResponse(502, {
        error: "Failed to generate lyrics from AI service.",
        details: errorText || null,
        status: response.status,
      });
    }

    const data = await response.json();
    const lyrics =
      data?.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't generate lyrics right now.";

    return jsonResponse(200, {
      topic,
      genre: safeGenre,
      mood: safeMood,
      lyrics,
    });
  } catch (err) {
    console.error("Server error:", err);
    return jsonResponse(500, { error: "Unexpected server error while generating lyrics." });
  }
};

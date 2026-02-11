const bcrypt = require("bcryptjs");
const { getStore } = require("@netlify/blobs");

const STORE_NAME = "songbird-users";
const USERS_KEY = "users";

async function readUsers(store) {
  try {
    const data = await store.get(USERS_KEY, { type: "json" });
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error("readUsers", e);
    return [];
  }
}

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
    const store = getStore(STORE_NAME);
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body || {};
    const { email, password } = body;
    const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const trimmedPassword = typeof password === "string" ? password : "";

    if (!trimmedEmail || !trimmedPassword) {
      return jsonResponse(400, { error: "Email and password are required." });
    }

    const users = await readUsers(store);
    const user = users.find((u) => u.email === trimmedEmail);
    if (!user || !user.passwordHash) {
      return jsonResponse(401, { error: "Invalid email or password." });
    }

    const match = await bcrypt.compare(trimmedPassword, user.passwordHash);
    if (!match) {
      return jsonResponse(401, { error: "Invalid email or password." });
    }

    return jsonResponse(200, {
      id: user.id,
      email: user.email,
      name: user.name,
      message: "Logged in successfully.",
    });
  } catch (err) {
    console.error("Login error:", err);
    return jsonResponse(500, { error: "Something went wrong. Please try again." });
  }
};

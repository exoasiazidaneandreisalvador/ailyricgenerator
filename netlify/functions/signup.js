const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const USERS_FILE = path.join("/tmp", "users.json");

function readUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, "utf8");
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.error("readUsers", e);
  }
  return [];
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
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
    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body || {};
    const { email, password, name } = body;
    const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const trimmedPassword = typeof password === "string" ? password : "";
    const trimmedName = typeof name === "string" ? name.trim() : "";

    if (!trimmedEmail) {
      return jsonResponse(400, { error: "Email is required." });
    }
    if (trimmedPassword.length < 8) {
      return jsonResponse(400, { error: "Password must be at least 8 characters." });
    }

    const users = readUsers();
    if (users.some((u) => u.email === trimmedEmail)) {
      return jsonResponse(409, { error: "An account with this email already exists." });
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

    return jsonResponse(201, {
      id: user.id,
      email: user.email,
      name: user.name,
      message: "Account created successfully.",
    });
  } catch (err) {
    console.error("Signup error:", err);
    return jsonResponse(500, { error: "Something went wrong. Please try again." });
  }
};

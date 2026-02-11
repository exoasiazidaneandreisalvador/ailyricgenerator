const form = document.getElementById("login-form");
const emailInput = document.getElementById("login-email");
const passwordInput = document.getElementById("login-password");
const emailError = document.getElementById("login-email-error");
const passwordError = document.getElementById("login-password-error");
const formError = document.getElementById("login-form-error");
const submitBtn = document.getElementById("login-submit");

const API_BASE = ""; // relative URLs for Netlify

function clearErrors() {
  emailError.textContent = "";
  passwordError.textContent = "";
  formError.textContent = "";
  emailInput.classList.remove("invalid");
  passwordInput.classList.remove("invalid");
}

function setSubmitting(submitting) {
  submitBtn.disabled = submitting;
  submitBtn.textContent = submitting ? "Logging in…" : "Log in";
}

function validate() {
  clearErrors();
  let valid = true;

  const email = emailInput.value.trim();
  if (!email) {
    emailError.textContent = "Email is required.";
    emailInput.classList.add("invalid");
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailError.textContent = "Please enter a valid email.";
    emailInput.classList.add("invalid");
    valid = false;
  }

  if (!passwordInput.value) {
    passwordError.textContent = "Password is required.";
    passwordInput.classList.add("invalid");
    valid = false;
  }

  return valid;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  formError.textContent = "";

  if (!validate()) {
    formError.textContent = "Please fix the errors above.";
    return;
  }

  setSubmitting(true);

  try {
    const response = await fetch(`${API_BASE || ""}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailInput.value.trim().toLowerCase(),
        password: passwordInput.value,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      formError.textContent = data.error || "Log in failed. Please try again.";
      return;
    }

    const user = { id: data.id, email: data.email, name: data.name };
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("songbird-user", JSON.stringify(user));
    }
    formError.textContent = "Logged in! Redirecting…";
    formError.style.color = "#81c784";
    setTimeout(() => {
      window.location.href = "index.html";
    }, 800);
  } catch (err) {
    console.error("Login error:", err);
    formError.textContent = "Network error. Make sure the server is running and try again.";
  } finally {
    setSubmitting(false);
  }
});

emailInput.addEventListener("input", () => {
  emailError.textContent = "";
  emailInput.classList.remove("invalid");
});
passwordInput.addEventListener("input", () => {
  passwordError.textContent = "";
  passwordInput.classList.remove("invalid");
});

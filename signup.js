const form = document.getElementById("signup-form");
const emailInput = document.getElementById("signup-email");
const passwordInput = document.getElementById("signup-password");
const confirmInput = document.getElementById("signup-confirm");
const emailError = document.getElementById("signup-email-error");
const passwordError = document.getElementById("signup-password-error");
const confirmError = document.getElementById("signup-confirm-error");
const formError = document.getElementById("signup-form-error");
const submitBtn = document.getElementById("signup-submit");

const API_BASE = ""; // relative URLs for Netlify; use "/api" from same origin

function clearErrors() {
  emailError.textContent = "";
  passwordError.textContent = "";
  confirmError.textContent = "";
  formError.textContent = "";
  emailInput.classList.remove("invalid");
  passwordInput.classList.remove("invalid");
  confirmInput.classList.remove("invalid");
}

function showFieldError(element, message) {
  element.classList.add("invalid");
  return message;
}

function setSubmitting(submitting) {
  submitBtn.disabled = submitting;
  submitBtn.textContent = submitting ? "Creating account…" : "Create account";
}

function validate() {
  clearErrors();
  let valid = true;

  const email = emailInput.value.trim();
  if (!email) {
    emailError.textContent = showFieldError(emailInput, "Email is required.");
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    emailError.textContent = showFieldError(emailInput, "Please enter a valid email.");
    valid = false;
  }

  const password = passwordInput.value;
  if (password.length < 8) {
    passwordError.textContent = showFieldError(
      passwordInput,
      "Password must be at least 8 characters."
    );
    valid = false;
  }

  if (password !== confirmInput.value) {
    confirmError.textContent = showFieldError(confirmInput, "Passwords do not match.");
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
    const response = await fetch(`${API_BASE || ""}/api/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: emailInput.value.trim().toLowerCase(),
        password: passwordInput.value,
        name: document.getElementById("signup-name").value.trim() || undefined,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      formError.textContent = data.error || "Sign up failed. Please try again.";
      if (response.status === 409) {
        emailError.textContent = data.error || "";
        emailInput.classList.add("invalid");
      }
      return;
    }

    formError.textContent = "";
    form.reset();
    const user = { id: data.id, email: data.email, name: data.name };
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("songbird-user", JSON.stringify(user));
    }
    formError.textContent = "Account created! Redirecting…";
    formError.style.color = "#81c784";
    setTimeout(() => {
      window.location.href = "index.html";
    }, 1200);
  } catch (err) {
    console.error("Signup error:", err);
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
confirmInput.addEventListener("input", () => {
  confirmError.textContent = "";
  confirmInput.classList.remove("invalid");
});

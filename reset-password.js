function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

function setResetMessage(message, type = "error") {
  const el = document.getElementById("resetFormMessage");
  if (!el) return;

  el.textContent = message;
  el.className = `form-message ${type === "success" ? "success" : ""}`.trim();
}

function clearResetMessage() {
  const el = document.getElementById("resetFormMessage");
  if (!el) return;

  el.textContent = "";
  el.className = "form-message";
}

function setResetLoading(isLoading) {
  const btn = document.getElementById("resetSubmitBtn");
  const text = document.getElementById("resetSubmitBtnText");

  if (!btn || !text) return;

  btn.disabled = isLoading;
  btn.classList.toggle("is-loading", isLoading);
  text.textContent = isLoading ? "Bezig..." : "Wachtwoord opslaan";
}

async function ensureRecoverySession() {
  const hash = window.location.hash;

  if (!hash.includes("type=recovery")) {
    setResetMessage("Ongeldige of verlopen resetlink.");
    return false;
  }

  const hashParams = new URLSearchParams(hash.substring(1));
  const access_token = hashParams.get("access_token");
  const refresh_token = hashParams.get("refresh_token");

  if (!access_token || !refresh_token) {
    setResetMessage("Resetgegevens ontbreken in de link.");
    return false;
  }

  const { error } = await window.supabaseClient.auth.setSession({
    access_token,
    refresh_token
  });

  if (error) {
    setResetMessage("Resetlink is ongeldig of verlopen.");
    return false;
  }

  return true;
}

function setupResetForm() {
  const form = document.getElementById("resetPasswordForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearResetMessage();

    const newPassword = document.getElementById("newPassword")?.value.trim();
    const confirmPassword = document.getElementById("confirmPassword")?.value.trim();

    if (!newPassword || !confirmPassword) {
      setResetMessage("Vul beide velden in.");
      return;
    }

    if (newPassword.length < 8) {
      setResetMessage("Je wachtwoord moet minimaal 8 tekens hebben.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetMessage("De wachtwoorden komen niet overeen.");
      return;
    }

    try {
      setResetLoading(true);

      const { error } = await window.supabaseClient.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setResetMessage("Wachtwoord succesvol opgeslagen.", "success");
      showToast("Wachtwoord succesvol gewijzigd.", "success");

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1200);
    } catch (error) {
      console.error("Reset password error:", error);
      setResetMessage(error.message || "Wachtwoord wijzigen mislukt.");
      showToast("Wachtwoord wijzigen mislukt.", "error");
    } finally {
      setResetLoading(false);
    }
  });
}

async function initResetPasswordPage() {
  const ok = await ensureRecoverySession();
  if (!ok) return;

  setupResetForm();
}

document.addEventListener("DOMContentLoaded", initResetPasswordPage);
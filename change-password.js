let currentUser = null;

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

function setFormMessage(message, type = "error") {
  const el = document.getElementById("changePasswordMessage");
  if (!el) return;

  el.textContent = message;
  el.className = `form-message ${type === "success" ? "success" : ""}`.trim();
}

function setLoading(isLoading) {
  const btn = document.getElementById("changePasswordSubmitBtn");
  const text = document.getElementById("changePasswordSubmitText");

  if (!btn || !text) return;

  btn.disabled = isLoading;
  btn.classList.toggle("is-loading", isLoading);
  text.textContent = isLoading ? "Bezig..." : "Wachtwoord opslaan";
}

async function requireForcedPasswordChange() {
  const {
    data: { user },
    error: userError
  } = await window.supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.href = "login.html?role=admin";
    return null;
  }

  const { data: profile, error: profileError } = await window.supabaseClient
    .from("profiles")
    .select("id, role, must_change_password")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    window.location.href = "login.html?role=admin";
    return null;
  }

  if (profile.role !== "admin") {
    window.location.href = "teacher-dashboard.html";
    return null;
  }

  if (!profile.must_change_password) {
    window.location.href = "admin-dashboard.html";
    return null;
  }

  currentUser = user;
  return { user, profile };
}

function setupPasswordChangeForm() {
  const form = document.getElementById("changePasswordForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const newPassword = document.getElementById("newPassword")?.value.trim();
    const confirmPassword = document.getElementById("confirmPassword")?.value.trim();

    setFormMessage("");

    if (!newPassword || !confirmPassword) {
      setFormMessage("Vul beide velden in.");
      return;
    }

    if (newPassword.length < 8) {
      setFormMessage("Je wachtwoord moet minimaal 8 tekens hebben.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormMessage("De wachtwoorden komen niet overeen.");
      return;
    }

    try {
      setLoading(true);

      const { error: authError } = await window.supabaseClient.auth.updateUser({
        password: newPassword
      });

      if (authError) throw authError;

      const { error: profileError } = await window.supabaseClient
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", currentUser.id);

      if (profileError) throw profileError;

      setFormMessage("Wachtwoord succesvol gewijzigd. Je wordt doorgestuurd.", "success");
      showToast("Wachtwoord succesvol gewijzigd.", "success");

      setTimeout(() => {
        window.location.href = "admin-dashboard.html";
      }, 900);
    } catch (error) {
      console.error("Forced password change error:", error);
      setFormMessage(error.message || "Wachtwoord wijzigen mislukt.");
      showToast("Wachtwoord wijzigen mislukt.", "error");
    } finally {
      setLoading(false);
    }
  });
}

async function initChangePasswordPage() {
  const access = await requireForcedPasswordChange();
  if (!access) return;

  setupPasswordChangeForm();
}

document.addEventListener("DOMContentLoaded", initChangePasswordPage);

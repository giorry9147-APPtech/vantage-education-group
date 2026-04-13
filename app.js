const translations = {
  nl: {
    nav_login: "Inloggen",
    hero_title: "Lesportaal voor leerkrachten",
    hero_subtitle: "Download lessen per vak, bekijk notities en werk vanuit één centrale omgeving.",

    teacher_card_title: "Inloggen als leerkracht",
    teacher_btn: "Inloggen als leerkracht",
    teacher_feature_1: "Veilige toegang voor leerkrachten",
    teacher_feature_2: "Download lessen eenvoudig per vak",
    teacher_feature_3: "Notities van de admin zichtbaar",

    admin_card_title: "Inloggen als admin",
    admin_btn: "Inloggen als admin",
    admin_feature_1: "Veilige toegang voor admins",
    admin_feature_2: "Lessen per vak georganiseerd",
    admin_feature_3: "PDF's direct downloadbaar",

    how_title: "Hoe werkt het?",
    step1_title: "Log in",
    step1_text: "Meld je aan als leerkracht of admin.",
    step2_title: "Kies vak of categorie",
    step2_text: "Bekijk beschikbare lessen per vak of klas.",
    step3_title: "Download de les-PDF",
    step3_text: "Download de les inclusief notitie.",

    footer_feature_1: "✔ Veilige toegang voor leerkrachten",
    footer_feature_2: "✔ PDF’s direct downloadbaar",
    footer_feature_3: "✔ Lessen per vak georganiseerd",
    footer_feature_4: "✔ Notities van admin zichtbaar",
    privacy: "Privacybeleid",
    terms: "Algemene voorwaarden",

    back_home: "Terug naar home",
    back_home_text: "← Terug naar home",
    teacher_role: "Leerkracht",
    admin_role: "Admin",
    email_label: "E-mailadres",
    password_label: "Wachtwoord",
    remember_me: "Onthoud mij",
    forgot_password: "Wachtwoord vergeten?",
    login_btn_main: "Inloggen",
    login_info_title: "Wat kun je hier doen?",

    login_title_teacher: "Inloggen als leerkracht",
    login_subtitle_teacher: "Log in om lessen te downloaden, notities te bekijken en per vak te werken.",
    login_teacher_feature_1: "Lessen bekijken per vak",
    login_teacher_feature_2: "PDF’s downloaden",
    login_teacher_feature_3: "Notities van de admin lezen",

    login_title_admin: "Inloggen als admin",
    login_subtitle_admin: "Log in om lessen te uploaden, categorieën te beheren en notities toe te voegen.",
    login_admin_feature_1: "Nieuwe lessen uploaden",
    login_admin_feature_2: "Vakken en categorieën beheren",
    login_admin_feature_3: "Korte notities toevoegen"
  },

  en: {
    nav_login: "Login",
    hero_title: "Lesson portal for teachers",
    hero_subtitle: "Download lessons by subject, read notes, and work from one central environment.",

    teacher_card_title: "Login as teacher",
    teacher_btn: "Login as teacher",
    teacher_feature_1: "Secure access for teachers",
    teacher_feature_2: "Download lessons easily by subject",
    teacher_feature_3: "Notes from the admin are visible",

    admin_card_title: "Login as admin",
    admin_btn: "Login as admin",
    admin_feature_1: "Secure access for admins",
    admin_feature_2: "Lessons organized by subject",
    admin_feature_3: "PDFs directly downloadable",

    how_title: "How does it work?",
    step1_title: "Log in",
    step1_text: "Sign in as teacher or admin.",
    step2_title: "Choose subject or category",
    step2_text: "View available lessons by subject or class.",
    step3_title: "Download the lesson PDF",
    step3_text: "Download the lesson including the note.",

    footer_feature_1: "✔ Secure access for teachers",
    footer_feature_2: "✔ PDFs directly downloadable",
    footer_feature_3: "✔ Lessons organized by subject",
    footer_feature_4: "✔ Notes from admin visible",
    privacy: "Privacy policy",
    terms: "Terms and conditions",

    back_home: "Back to home",
    back_home_text: "← Back to home",
    teacher_role: "Teacher",
    admin_role: "Admin",
    email_label: "Email address",
    password_label: "Password",
    remember_me: "Remember me",
    forgot_password: "Forgot password?",
    login_btn_main: "Login",
    login_info_title: "What can you do here?",

    login_title_teacher: "Login as teacher",
    login_subtitle_teacher: "Log in to download lessons, read notes and work by subject.",
    login_teacher_feature_1: "View lessons by subject",
    login_teacher_feature_2: "Download PDFs",
    login_teacher_feature_3: "Read notes from the admin",

    login_title_admin: "Login as admin",
    login_subtitle_admin: "Log in to upload lessons, manage categories and add notes.",
    login_admin_feature_1: "Upload new lessons",
    login_admin_feature_2: "Manage subjects and categories",
    login_admin_feature_3: "Add short notes"
  }
};

const defaultLanguage = localStorage.getItem("siteLanguage") || "nl";
const urlParams = new URLSearchParams(window.location.search);
let currentRole = urlParams.get("role") || localStorage.getItem("selectedRole") || "teacher";

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
  const formMessage = document.getElementById("formMessage");
  if (!formMessage) return;

  formMessage.textContent = message;
  formMessage.className = `form-message ${type === "success" ? "success" : ""}`.trim();
}

function clearFormMessage() {
  const formMessage = document.getElementById("formMessage");
  if (!formMessage) return;

  formMessage.textContent = "";
  formMessage.className = "form-message";
}

function setLoginLoading(isLoading) {
  const submitBtn = document.getElementById("submitBtn");
  const submitBtnText = document.getElementById("submitBtnText");
  const currentLanguage = localStorage.getItem("siteLanguage") || "nl";

  if (!submitBtn || !submitBtnText) return;

  submitBtn.disabled = isLoading;
  submitBtn.classList.toggle("is-loading", isLoading);

  if (isLoading) {
    submitBtnText.textContent = currentLanguage === "nl" ? "Bezig met inloggen..." : "Signing in...";
  } else {
    submitBtnText.textContent = translations[currentLanguage].login_btn_main;
  }
}

function applyTranslations(language) {
  const dict = translations[language];
  document.documentElement.lang = language;

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    if (dict[key]) {
      element.textContent = dict[key];
    }
  });

  const langNl = document.getElementById("langLabelNl");
  const langEn = document.getElementById("langLabelEn");

  if (langNl && langEn) {
    if (language === "nl") {
      langNl.classList.add("lang-alt");
      langEn.classList.remove("lang-alt");
    } else {
      langEn.classList.add("lang-alt");
      langNl.classList.remove("lang-alt");
    }
  }

  if (document.body.dataset.page === "login") {
    updateLoginRoleContent(language, currentRole);
    setLoginLoading(false);
  }
}

function updateLoginRoleContent(language, role) {
  const dict = translations[language];

  const roleBadge = document.getElementById("roleBadge");
  const loginTitle = document.getElementById("loginTitle");
  const loginSubtitle = document.getElementById("loginSubtitle");
  const featureList = document.getElementById("roleFeatureList");
  const teacherRoleBtn = document.getElementById("teacherRoleBtn");
  const adminRoleBtn = document.getElementById("adminRoleBtn");

  if (!roleBadge || !loginTitle || !loginSubtitle || !featureList) return;

  if (role === "admin") {
    roleBadge.textContent = dict.admin_role;
    loginTitle.textContent = dict.login_title_admin;
    loginSubtitle.textContent = dict.login_subtitle_admin;
    featureList.innerHTML = `
      <li>${dict.login_admin_feature_1}</li>
      <li>${dict.login_admin_feature_2}</li>
      <li>${dict.login_admin_feature_3}</li>
    `;
    teacherRoleBtn?.classList.remove("active");
    adminRoleBtn?.classList.add("active");
  } else {
    roleBadge.textContent = dict.teacher_role;
    loginTitle.textContent = dict.login_title_teacher;
    loginSubtitle.textContent = dict.login_subtitle_teacher;
    featureList.innerHTML = `
      <li>${dict.login_teacher_feature_1}</li>
      <li>${dict.login_teacher_feature_2}</li>
      <li>${dict.login_teacher_feature_3}</li>
    `;
    teacherRoleBtn?.classList.add("active");
    adminRoleBtn?.classList.remove("active");
  }
}

function toggleLanguage() {
  const currentLanguage = localStorage.getItem("siteLanguage") || "nl";
  const nextLanguage = currentLanguage === "nl" ? "en" : "nl";
  localStorage.setItem("siteLanguage", nextLanguage);
  applyTranslations(nextLanguage);
}

function setupRoleButtons() {
  const teacherRoleBtn = document.getElementById("teacherRoleBtn");
  const adminRoleBtn = document.getElementById("adminRoleBtn");

  teacherRoleBtn?.addEventListener("click", () => {
    currentRole = "teacher";
    localStorage.setItem("selectedRole", currentRole);
    updateLoginRoleContent(localStorage.getItem("siteLanguage") || "nl", currentRole);
    history.replaceState({}, "", "login.html?role=teacher");
  });

  adminRoleBtn?.addEventListener("click", () => {
    currentRole = "admin";
    localStorage.setItem("selectedRole", currentRole);
    updateLoginRoleContent(localStorage.getItem("siteLanguage") || "nl", currentRole);
    history.replaceState({}, "", "login.html?role=admin");
  });
}

function getFriendlyAuthError(message, language) {
  const isDutch = language === "nl";

  if (!message) {
    return isDutch ? "Inloggen mislukt." : "Login failed.";
  }

  const lower = message.toLowerCase();

  if (lower.includes("invalid login credentials")) {
    return isDutch
      ? "Onjuist e-mailadres of wachtwoord."
      : "Incorrect email address or password.";
  }

  if (lower.includes("email not confirmed")) {
    return isDutch
      ? "Je e-mailadres is nog niet bevestigd."
      : "Your email address has not been confirmed yet.";
  }

  if (lower.includes("failed to fetch")) {
    return isDutch
      ? "Netwerkfout. Controleer je internetverbinding."
      : "Network error. Check your internet connection.";
  }

  return isDutch ? "Inloggen mislukt. Probeer opnieuw." : "Login failed. Please try again.";
}

async function redirectIfAlreadyLoggedIn() {
  if (!window.supabaseClient || document.body.dataset.page !== "login") return;

  const {
    data: { user }
  } = await window.supabaseClient.auth.getUser();

  if (!user) return;

  const { data: profile } = await window.supabaseClient
    .from("profiles")
    .select("role, must_change_password, school_id")
    .eq("id", user.id)
    .single();

  if (!profile) return;

  if (profile.role === "admin" || profile.role === "superadmin") {
    if (profile.must_change_password) {
      window.location.href = "change-password.html";
    } else {
      window.location.href = "admin-dashboard.html";
    }
  } else {
    window.location.href = "teacher-dashboard.html";
  }
}

function setupRememberMe() {
  const emailInput = document.getElementById("email");
  const rememberCheckbox = document.querySelector('.remember-row input[type="checkbox"]');
  const rememberedEmail = localStorage.getItem("rememberedEmail");

  if (emailInput && rememberedEmail) {
    emailInput.value = rememberedEmail;
    if (rememberCheckbox) rememberCheckbox.checked = true;
  }
}

function setupLoginForm() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value.trim();
    const rememberCheckbox = document.querySelector('.remember-row input[type="checkbox"]');
    const language = localStorage.getItem("siteLanguage") || "nl";
    const selectedRole = localStorage.getItem("selectedRole") || currentRole || "teacher";

    clearFormMessage();

    if (!email || !password) {
      const message =
        language === "nl"
          ? "Vul eerst e-mail en wachtwoord in."
          : "Please enter your email and password first.";
      setFormMessage(message);
      return;
    }

    try {
      setLoginLoading(true);

      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      const user = data.user;
      if (!user) throw new Error("Geen gebruiker gevonden na login.");

      const { data: profile, error: profileError } = await window.supabaseClient
        .from("profiles")
        .select("role, full_name, must_change_password, school_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;
      if (!profile) throw new Error("Geen profiel gevonden voor deze gebruiker.");

      if (rememberCheckbox?.checked) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      if (selectedRole !== profile.role) {
        if (profile.role === "teacher") {
          showToast(
            language === "nl"
              ? "Je hebt een normale leerkracht account."
              : "You have a regular teacher account.",
            "info"
          );
        } else if (profile.role === "admin") {
          showToast(
            language === "nl"
              ? "Je hebt een admin-account."
              : "You have an admin account.",
            "info"
          );
        }
      }

      setFormMessage(
        language === "nl" ? "Succesvol ingelogd." : "Successfully signed in.",
        "success"
      );

      setTimeout(() => {
        if (profile.role === "admin" || profile.role === "superadmin") {
          if (profile.must_change_password) {
            window.location.href = "change-password.html";
          } else {
            window.location.href = "admin-dashboard.html";
          }
        } else {
          window.location.href = "teacher-dashboard.html";
        }
      }, 700);
    } catch (error) {
      console.error("Login fout:", error);
      const friendlyMessage = getFriendlyAuthError(error.message, language);
      setFormMessage(friendlyMessage);
      showToast(friendlyMessage, "error");
    } finally {
      setLoginLoading(false);
    }
  });
}

function setupForgotPassword() {
  const forgotLink = document.querySelector(".forgot-link");
  if (!forgotLink) return;

  forgotLink.addEventListener("click", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const language = localStorage.getItem("siteLanguage") || "nl";

    clearFormMessage();

    if (!email) {
      const msg =
        language === "nl"
          ? "Vul eerst je e-mailadres in."
          : "Please enter your email address first.";
      setFormMessage(msg);
      showToast(msg, "error");
      return;
    }

    try {
      const redirectTo = `${window.location.origin}/reset-password.html`;

      const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo
      });

      if (error) throw error;

      const successMsg =
        language === "nl"
          ? "Reset e-mail verzonden. Controleer je inbox."
          : "Reset email sent. Check your inbox.";

      setFormMessage(successMsg, "success");
      showToast(successMsg, "success");
    } catch (error) {
      console.error("Forgot password error:", error);

      const msg =
        language === "nl"
          ? "Reset e-mail versturen mislukt."
          : "Failed to send reset email.";

      setFormMessage(msg);
      showToast(msg, "error");
    }
  });
}

function init() {
  const langToggle = document.getElementById("langToggle");
  langToggle?.addEventListener("click", toggleLanguage);

  localStorage.setItem("selectedRole", currentRole);

  applyTranslations(defaultLanguage);
  setupRoleButtons();
  setupRememberMe();
  setupLoginForm();
  setupForgotPassword();
  redirectIfAlreadyLoggedIn();
}

document.addEventListener("DOMContentLoaded", init);

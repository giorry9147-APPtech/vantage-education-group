const translations = {
  nl: {
    nav_login: "Inloggen",
    hero_title: "Lesportaal voor leerkrachten",
    hero_subtitle: "Download lessen per vak, bekijk notities en werk vanuit één centrale omgeving.",

    teacher_card_title: "Inloggen als leerkracht",
    teacher_btn: "Inloggen als leerkracht",
    teacher_feature_1: "Veilige toegang voor leerkrachten",
    teacher_feature_2: "Download lessen eenvoudig per vak",
    teacher_feature_3: "Notities van de hoofdleerkracht zichtbaar",

    admin_card_title: "Inloggen als hoofdleerkracht",
    admin_btn: "Inloggen als hoofdleerkracht",
    admin_feature_1: "Veilige toegang voor hoofdleerkrachten",
    admin_feature_2: "Lessen per vak georganiseerd",
    admin_feature_3: "PDF's direct downloadbaar",

    how_title: "Hoe werkt het?",
    step1_title: "Log in",
    step1_text: "Meld je aan als leerkracht of hoofdleerkracht.",
    step2_title: "Kies vak of categorie",
    step2_text: "Bekijk beschikbare lessen per vak of klas.",
    step3_title: "Download de les-PDF",
    step3_text: "Download de les inclusief notitie.",

    footer_feature_1: "✔ Veilige toegang voor leerkrachten",
    footer_feature_2: "✔ PDF’s direct downloadbaar",
    footer_feature_3: "✔ Lessen per vak georganiseerd",
    footer_feature_4: "✔ Notities van hoofdleerkracht zichtbaar",
    privacy: "Privacybeleid",
    terms: "Algemene voorwaarden",

    back_home: "Terug naar home",
    back_home_text: "← Terug naar home",
    teacher_role: "Leerkracht",
    admin_role: "Hoofdleerkracht",
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
    login_teacher_feature_3: "Notities van hoofdleerkracht lezen",

    login_title_admin: "Inloggen als hoofdleerkracht",
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
    teacher_feature_3: "Notes from the lead teacher are visible",

    admin_card_title: "Login as lead teacher",
    admin_btn: "Login as lead teacher",
    admin_feature_1: "Secure access for lead teachers",
    admin_feature_2: "Lessons organized by subject",
    admin_feature_3: "PDFs directly downloadable",

    how_title: "How does it work?",
    step1_title: "Log in",
    step1_text: "Sign in as teacher or lead teacher.",
    step2_title: "Choose subject or category",
    step2_text: "View available lessons by subject or class.",
    step3_title: "Download the lesson PDF",
    step3_text: "Download the lesson including the note.",

    footer_feature_1: "✔ Secure access for teachers",
    footer_feature_2: "✔ PDFs directly downloadable",
    footer_feature_3: "✔ Lessons organized by subject",
    footer_feature_4: "✔ Notes from lead teacher visible",
    privacy: "Privacy policy",
    terms: "Terms and conditions",

    back_home: "Back to home",
    back_home_text: "← Back to home",
    teacher_role: "Teacher",
    admin_role: "Lead teacher",
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
    login_teacher_feature_3: "Read notes from the lead teacher",

    login_title_admin: "Login as lead teacher",
    login_subtitle_admin: "Log in to upload lessons, manage categories and add notes.",
    login_admin_feature_1: "Upload new lessons",
    login_admin_feature_2: "Manage subjects and categories",
    login_admin_feature_3: "Add short notes"
  }
};

const defaultLanguage = localStorage.getItem("siteLanguage") || "nl";
const urlParams = new URLSearchParams(window.location.search);
let currentRole = urlParams.get("role") || "teacher";

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

  updateLoginRoleContent(language, currentRole);
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
    updateLoginRoleContent(localStorage.getItem("siteLanguage") || "nl", currentRole);
    history.replaceState({}, "", "login.html?role=teacher");
  });

  adminRoleBtn?.addEventListener("click", () => {
    currentRole = "admin";
    updateLoginRoleContent(localStorage.getItem("siteLanguage") || "nl", currentRole);
    history.replaceState({}, "", "login.html?role=admin");
  });
}

function setupLoginForm() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email")?.value.trim();
    const password = document.getElementById("password")?.value.trim();
    const submitBtn = document.getElementById("submitBtn");

    if (!email || !password) {
      alert("Vul eerst e-mail en wachtwoord in.");
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Bezig met inloggen...";

      const { data, error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        throw error;
      }

      const user = data.user;

      if (!user) {
        throw new Error("Geen gebruiker gevonden na login.");
      }

      const { data: profile, error: profileError } = await window.supabaseClient
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        throw new Error("Geen profiel gevonden voor deze gebruiker.");
      }

      if (profile.role === "admin") {
        window.location.href = "admin-dashboard.html";
      } else if (profile.role === "teacher") {
        window.location.href = "teacher-dashboard.html";
      } else {
        alert("Onbekende rol gevonden.");
      }
    } catch (error) {
      console.error("Login fout:", error);
      alert(error.message || "Inloggen mislukt.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Inloggen";
    }
  });
}

function init() {
  const langToggle = document.getElementById("langToggle");
  langToggle?.addEventListener("click", toggleLanguage);

  applyTranslations(defaultLanguage);
  setupRoleButtons();
  setupLoginForm();
}

document.addEventListener("DOMContentLoaded", init);
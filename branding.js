// branding.js — Laadt school-branding (naam, logo, kleuren) en past het toe op de pagina

let currentSchool = null;

const SCHOOL_COLUMNS = "id, name, slug, logo_url, domain, primary_color, secondary_color, accent_color";

// Laad branding op basis van school ID (na login)
async function loadSchoolBranding(schoolId) {
  if (!schoolId) return null;

  const { data, error } = await window.supabaseClient
    .from("schools")
    .select(SCHOOL_COLUMNS)
    .eq("id", schoolId)
    .single();

  if (error || !data) {
    console.warn("School branding laden mislukt:", error);
    return null;
  }

  currentSchool = data;
  applyBranding(data);
  return data;
}

// Laad branding op basis van huidig domein (vóór login)
async function loadSchoolBrandingByDomain() {
  const hostname = window.location.hostname;

  // Lokaal of standaard Vercel domein → default school
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return null;
  }

  const { data, error } = await window.supabaseClient
    .from("schools")
    .select(SCHOOL_COLUMNS)
    .eq("domain", hostname)
    .single();

  if (error || !data) {
    // Geen match = default school, geen branding override
    return null;
  }

  currentSchool = data;
  applyBranding(data, { skipLogo: true });
  return data;
}

function applyBranding(school, options = {}) {
  // Kleuren toepassen via CSS custom properties
  const root = document.documentElement;

  if (school.primary_color) {
    root.style.setProperty("--school-primary", school.primary_color);
    root.style.setProperty("--school-primary-dark", darkenColor(school.primary_color, 20));
  }

  if (school.secondary_color) {
    root.style.setProperty("--school-secondary", school.secondary_color);
  }

  if (school.accent_color) {
    root.style.setProperty("--school-accent", school.accent_color);
    root.style.setProperty("--school-accent-dark", darkenColor(school.accent_color, 20));
  }

  // Logo vervangen (sidebar + topbar + favicon) — alleen na login
  if (school.logo_url && !options.skipLogo) {
    document.querySelectorAll(".admin-logo, .logo").forEach((img) => {
      img.src = school.logo_url;
      img.alt = school.name + " logo";
    });

    const favicon = document.querySelector('link[rel="icon"]');
    if (favicon) {
      favicon.href = school.logo_url;
    }
  }

  // Schoolnaam in page title
  if (school.name) {
    const baseTitle = document.title.replace(/- .+$/, "").trim();
    document.title = baseTitle + " - " + school.name;

    // Theme color voor mobiel
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor && school.primary_color) {
      themeColor.content = school.primary_color;
    }
  }

  // Schoolnaam in eventuele branding-elementen
  document.querySelectorAll("[data-school-name]").forEach((el) => {
    el.textContent = school.name;
  });

  // Copyright footer
  document.querySelectorAll(".copyright").forEach((el) => {
    el.textContent = el.textContent.replace("Vantage Education Group", school.name);
  });
}

// Simpele helper: maakt een hex kleur donkerder
function darkenColor(hex, percent) {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }

  const r = Math.max(0, Math.round(parseInt(hex.substring(0, 2), 16) * (1 - percent / 100)));
  const g = Math.max(0, Math.round(parseInt(hex.substring(2, 4), 16) * (1 - percent / 100)));
  const b = Math.max(0, Math.round(parseInt(hex.substring(4, 6), 16) * (1 - percent / 100)));

  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("");
}

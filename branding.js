// branding.js — Laadt school-branding (naam, logo, kleuren) en past het toe op de pagina

let currentSchool = null;

async function loadSchoolBranding(schoolId) {
  if (!schoolId) return null;

  const { data, error } = await window.supabaseClient
    .from("schools")
    .select("id, name, slug, logo_url, primary_color, secondary_color, accent_color")
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

function applyBranding(school) {
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

  // Logo vervangen
  if (school.logo_url) {
    document.querySelectorAll(".admin-logo, .logo").forEach((img) => {
      img.src = school.logo_url;
      img.alt = school.name + " logo";
    });
  }

  // Schoolnaam in page title
  if (school.name) {
    const baseTitle = document.title.replace(/- .+$/, "").trim();
    document.title = baseTitle + " - " + school.name;
  }

  // Schoolnaam in eventuele branding-elementen
  document.querySelectorAll("[data-school-name]").forEach((el) => {
    el.textContent = school.name;
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

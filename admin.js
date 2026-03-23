let currentUser = null;
let currentProfile = null;
let subjectsCache = [];
let categoriesCache = [];
let lessonsCache = [];
let downloadLogsCache = [];

async function requireAdmin() {
  const {
    data: { user },
    error: userError
  } = await window.supabaseClient.auth.getUser();

  if (userError || !user) {
    window.location.href = "login.html";
    return null;
  }

  const { data: profile, error: profileError } = await window.supabaseClient
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    alert("Profiel niet gevonden.");
    window.location.href = "login.html";
    return null;
  }

  if (profile.role !== "admin") {
    window.location.href = "teacher-dashboard.html";
    return null;
  }

  currentUser = user;
  currentProfile = profile;

  const adminName = document.getElementById("adminName");
  if (adminName) {
    adminName.textContent = `Welkom, ${profile.full_name || "Admin"}`;
  }

  return { user, profile };
}

function setupTabs() {
  const navButtons = document.querySelectorAll(".admin-nav-link");
  const sections = document.querySelectorAll(".admin-tab-section");

  function activateTab(targetId) {
    navButtons.forEach((btn) => btn.classList.remove("active"));
    sections.forEach((section) => section.classList.remove("active"));

    const activeNav = document.querySelector(
      `.admin-nav-link[data-tab="${targetId}"]`
    );
    const activeSection = document.getElementById(targetId);

    activeNav?.classList.add("active");
    activeSection?.classList.add("active");

    if (window.innerWidth <= 1024 && activeSection) {
      activeSection.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }

  navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activateTab(button.dataset.tab);
    });
  });

  document.addEventListener("click", (event) => {
    const switchBtn = event.target.closest("[data-switch-tab]");
    if (!switchBtn) return;

    activateTab(switchBtn.dataset.switchTab);
  });
}

async function loadSubjects() {
  const { data, error } = await window.supabaseClient
    .from("subjects")
    .select("id, name, created_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("Fout bij ophalen vakken:", error);
    return;
  }

  subjectsCache = data || [];
  renderDashboardSubjects();
  renderSubjectsTree();
  populateSubjectSelect();
  updateCounts();
}

async function loadCategories() {
  const { data, error } = await window.supabaseClient
    .from("categories")
    .select(`
      id,
      name,
      subject_id,
      created_at,
      subjects (
        id,
        name
      )
    `)
    .order("name", { ascending: true });

  if (error) {
    console.error("Fout bij ophalen categorieën:", error);
    return;
  }

  categoriesCache = data || [];
  renderCategories();
  renderSubjectsTree();
  populateCategorySelect();
  updateCounts();
}

async function loadLessons() {
  const { data, error } = await window.supabaseClient
    .from("lessons")
    .select(`
      id,
      title,
      note,
      pdf_path,
      created_at,
      category_id,
      categories (
        id,
        name,
        subject_id,
        subjects (
          id,
          name
        )
      )
    `)
    .order("title", { ascending: true });

  if (error) {
    console.error("Fout bij ophalen lessen:", error);
    return;
  }

  lessonsCache = data || [];
  renderLessons();
  renderRecentLessons();
  renderSubjectsTree();
  updateCounts();
}

async function loadDownloadLogs() {
  const { data, error } = await window.supabaseClient
    .from("lesson_download_logs")
    .select("id, lesson_title, user_email, user_name, downloaded_at")
    .order("downloaded_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Fout bij ophalen downloadlogs:", error);
    return;
  }

  downloadLogsCache = data || [];
  renderDownloadLogs();
  updateCounts();
}

function renderDashboardSubjects() {
  const container = document.getElementById("dashboardSubjectsGrid");
  if (!container) return;

  if (subjectsCache.length === 0) {
    container.innerHTML = `<p class="empty-state">Nog geen vakken toegevoegd.</p>`;
    return;
  }

  container.innerHTML = subjectsCache
    .map((subject) => {
      const categoryCount = categoriesCache.filter(
        (category) => category.subject_id === subject.id
      ).length;

      const lessonCount = lessonsCache.filter(
        (lesson) => lesson.categories?.subject_id === subject.id
      ).length;

      return `
        <div class="subject-dashboard-card">
          <h4>${escapeHtml(subject.name)}</h4>
          <span class="list-meta">Categorieën: ${categoryCount}</span>
          <span class="list-meta">Lessen: ${lessonCount}</span>
          <span class="list-meta">Aangemaakt op: ${formatDateTime(subject.created_at)}</span>
        </div>
      `;
    })
    .join("");
}

function renderSubjectsTree() {
  const tree = document.getElementById("subjectsTree");
  if (!tree) return;

  if (subjectsCache.length === 0) {
    tree.innerHTML = `<p class="empty-state">Nog geen vakken toegevoegd.</p>`;
    return;
  }

  tree.innerHTML = subjectsCache
    .map((subject) => {
      const subjectCategories = categoriesCache
        .filter((category) => category.subject_id === subject.id)
        .sort((a, b) => a.name.localeCompare(b.name, "nl"));

      return `
        <div class="tree-subject">
          <div class="tree-row">
            <button
              class="tree-toggle"
              type="button"
              data-target="subject-${subject.id}"
              aria-expanded="false"
              aria-label="Toon of verberg categorieën van ${escapeHtml(subject.name)}"
            >
              ▶
            </button>

            <div class="tree-content">
              <strong>${escapeHtml(subject.name)}</strong>
              <span class="list-meta">Vak</span>
              <span class="list-meta">Aangemaakt op: ${formatDateTime(subject.created_at)}</span>
            </div>

            <div class="item-actions">
              <button
                class="delete-btn"
                data-type="subject"
                data-id="${subject.id}"
                data-name="${escapeHtml(subject.name)}"
                type="button"
              >
                Verwijderen
              </button>
            </div>
          </div>

          <div class="tree-children" id="subject-${subject.id}">
            ${
              subjectCategories.length === 0
                ? `<p class="empty-state small-empty">Nog geen categorieën.</p>`
                : subjectCategories
                    .map((category) => {
                      const categoryLessons = lessonsCache
                        .filter((lesson) => lesson.category_id === category.id)
                        .sort((a, b) => a.title.localeCompare(b.title, "nl"));

                      return `
                        <div class="tree-category">
                          <div class="tree-row tree-row-child">
                            <button
                              class="tree-toggle"
                              type="button"
                              data-target="category-${category.id}"
                              aria-expanded="false"
                              aria-label="Toon of verberg lessen van ${escapeHtml(category.name)}"
                            >
                              ▶
                            </button>

                            <div class="tree-content">
                              <strong>${escapeHtml(category.name)}</strong>
                              <span class="list-meta">Categorie</span>
                              <span class="list-meta">Aangemaakt op: ${formatDateTime(category.created_at)}</span>
                            </div>

                            <div class="item-actions">
                              <button
                                class="delete-btn"
                                data-type="category"
                                data-id="${category.id}"
                                data-name="${escapeHtml(category.name)}"
                                type="button"
                              >
                                Verwijderen
                              </button>
                            </div>
                          </div>

                          <div class="tree-children" id="category-${category.id}">
                            ${
                              categoryLessons.length === 0
                                ? `<p class="empty-state small-empty">Nog geen lessen.</p>`
                                : categoryLessons
                                    .map(
                                      (lesson) => `
                                        <div class="tree-lesson">
                                          <div class="tree-row tree-row-grandchild">
                                            <div class="tree-lesson-bullet">•</div>

                                            <div class="tree-content">
                                              <strong>${escapeHtml(lesson.title)}</strong>
                                              <span class="list-meta">Les</span>
                                              <span class="list-meta">PDF: ${lesson.pdf_path ? "Ja" : "Nee"}</span>
                                              <span class="list-meta">Geüpload op: ${formatDateTime(lesson.created_at)}</span>
                                              <span class="list-note">${escapeHtml(lesson.note || "Geen notitie")}</span>
                                            </div>

                                            <div class="item-actions">
                                              <button
                                                class="delete-btn"
                                                data-type="lesson"
                                                data-id="${lesson.id}"
                                                data-name="${escapeHtml(lesson.title)}"
                                                data-pdf-path="${lesson.pdf_path || ""}"
                                                type="button"
                                              >
                                                Verwijderen
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      `
                                    )
                                    .join("")
                            }
                          </div>
                        </div>
                      `;
                    })
                    .join("")
            }
          </div>
        </div>
      `;
    })
    .join("");
}

function renderCategories() {
  const categoriesList = document.getElementById("categoriesList");
  if (!categoriesList) return;

  if (categoriesCache.length === 0) {
    categoriesList.innerHTML = `<p class="empty-state">Nog geen categorieën toegevoegd.</p>`;
    return;
  }

  categoriesList.innerHTML = categoriesCache
    .map(
      (category) => `
        <div class="simple-list-item">
          <div class="item-main">
            <strong>${escapeHtml(category.name)}</strong>
            <span class="list-meta">Vak: ${escapeHtml(category.subjects?.name || "-")}</span>
            <span class="list-meta">Aangemaakt op: ${formatDateTime(category.created_at)}</span>
          </div>
          <div class="item-actions">
            <button
              class="delete-btn"
              data-type="category"
              data-id="${category.id}"
              data-name="${escapeHtml(category.name)}"
              type="button"
            >
              Verwijderen
            </button>
          </div>
        </div>
      `
    )
    .join("");
}

function renderLessons() {
  const lessonsList = document.getElementById("lessonsList");
  if (!lessonsList) return;

  if (lessonsCache.length === 0) {
    lessonsList.innerHTML = `<p class="empty-state">Nog geen lessen toegevoegd.</p>`;
    return;
  }

  lessonsList.innerHTML = lessonsCache
    .map((lesson) => {
      const subjectName = lesson.categories?.subjects?.name || "-";
      const categoryName = lesson.categories?.name || "-";

      return `
        <div class="simple-list-item">
          <div class="item-main">
            <strong>${escapeHtml(lesson.title)}</strong>
            <span class="list-meta">Vak: ${escapeHtml(subjectName)}</span>
            <span class="list-meta">Categorie: ${escapeHtml(categoryName)}</span>
            <span class="list-meta">PDF: ${lesson.pdf_path ? "Ja" : "Nee"}</span>
            <span class="list-meta">Geüpload op: ${formatDateTime(lesson.created_at)}</span>
            <span class="list-note">${escapeHtml(lesson.note || "Geen notitie")}</span>
          </div>
          <div class="item-actions">
            <button
              class="delete-btn"
              data-type="lesson"
              data-id="${lesson.id}"
              data-name="${escapeHtml(lesson.title)}"
              data-pdf-path="${lesson.pdf_path || ""}"
              type="button"
            >
              Verwijderen
            </button>
          </div>
        </div>
      `;
    })
    .join("");
}

function renderRecentLessons() {
  const recentLessonsList = document.getElementById("recentLessonsList");
  if (!recentLessonsList) return;

  if (lessonsCache.length === 0) {
    recentLessonsList.innerHTML = `<p class="empty-state">Nog geen recente lessen beschikbaar.</p>`;
    return;
  }

  const recent = [...lessonsCache]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  recentLessonsList.innerHTML = recent
    .map(
      (lesson) => `
        <div class="simple-list-item">
          <div class="item-main">
            <strong>${escapeHtml(lesson.title)}</strong>
            <span class="list-meta">Geüpload op: ${formatDateTime(lesson.created_at)}</span>
          </div>
        </div>
      `
    )
    .join("");
}

function populateSubjectSelect() {
  const select = document.getElementById("categorySubject");
  if (!select) return;

  select.innerHTML = `<option value="">Selecteer vak</option>`;

  subjectsCache.forEach((subject) => {
    const option = document.createElement("option");
    option.value = subject.id;
    option.textContent = subject.name;
    select.appendChild(option);
  });
}

function populateCategorySelect() {
  const select = document.getElementById("lessonCategory");
  if (!select) return;

  select.innerHTML = `<option value="">Selecteer categorie</option>`;

  categoriesCache.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = `${category.subjects?.name || "Vak"} - ${category.name}`;
    select.appendChild(option);
  });
}

function updateCounts() {
  const subjectsCount = document.getElementById("subjectsCount");
  const categoriesCount = document.getElementById("categoriesCount");
  const lessonsCount = document.getElementById("lessonsCount");
  const downloadsCount = document.getElementById("downloadsCount");

  if (subjectsCount) subjectsCount.textContent = subjectsCache.length;
  if (categoriesCount) categoriesCount.textContent = categoriesCache.length;
  if (lessonsCount) lessonsCount.textContent = lessonsCache.length;
  if (downloadsCount) downloadsCount.textContent = downloadLogsCache.length;
}

function renderDownloadLogs(searchTerm = "") {
  const list = document.getElementById("downloadsList");
  if (!list) return;

  const search = searchTerm.trim().toLowerCase();

  const filtered = downloadLogsCache.filter((item) => {
    if (!search) return true;

    const haystack = `${item.user_email || ""} ${item.user_name || ""} ${item.lesson_title || ""}`.toLowerCase();
    return haystack.includes(search);
  });

  if (filtered.length === 0) {
    list.innerHTML = `<p class="empty-state">Nog geen downloads gevonden.</p>`;
    return;
  }

  list.innerHTML = filtered
    .map((item) => {
      const userLabel = item.user_name
        ? `${escapeHtml(item.user_name)} (${escapeHtml(item.user_email || "geen e-mail")})`
        : escapeHtml(item.user_email || "Onbekende gebruiker");

      return `
        <div class="simple-list-item">
          <div class="item-main">
            <strong>${userLabel} heeft ${escapeHtml(item.lesson_title || "Onbekende les")}</strong>
            <span class="list-meta">Gedownload op: ${formatDateTime(item.downloaded_at)}</span>
          </div>
        </div>
      `;
    })
    .join("");
}

function setupDownloadSearch() {
  const input = document.getElementById("downloadSearchInput");
  if (!input) return;

  input.addEventListener("input", () => {
    renderDownloadLogs(input.value);
  });
}

function setupTreeToggles() {
  document.addEventListener("click", (event) => {
    const toggle = event.target.closest(".tree-toggle");
    if (!toggle) return;

    const targetId = toggle.dataset.target;
    const target = document.getElementById(targetId);
    if (!target) return;

    const isOpen = target.classList.contains("open");
    target.classList.toggle("open");
    toggle.textContent = isOpen ? "▶" : "▼";
    toggle.setAttribute("aria-expanded", String(!isOpen));
  });
}

function setupSubjectForm() {
  const subjectForm = document.getElementById("subjectForm");
  if (!subjectForm) return;

  subjectForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const subjectNameInput = document.getElementById("subjectName");
    const name = subjectNameInput.value.trim();

    if (!name) {
      alert("Vul een vaknaam in.");
      return;
    }

    const submitButton = subjectForm.querySelector('button[type="submit"]');

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Bezig...";
      }

      const { error } = await window.supabaseClient.from("subjects").insert({
        name,
        created_by: currentUser.id
      });

      if (error) {
        console.error(error);
        alert(error.message || "Vak toevoegen mislukt.");
        return;
      }

      subjectForm.reset();
      await refreshAllData();
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Vak toevoegen";
      }
    }
  });
}

function setupCategoryForm() {
  const categoryForm = document.getElementById("categoryForm");
  if (!categoryForm) return;

  categoryForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const subjectId = document.getElementById("categorySubject").value;
    const categoryName = document.getElementById("categoryName").value.trim();

    if (!subjectId || !categoryName) {
      alert("Kies eerst een vak en vul een categorienaam in.");
      return;
    }

    const submitButton = categoryForm.querySelector('button[type="submit"]');

    try {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Bezig...";
      }

      const { error } = await window.supabaseClient.from("categories").insert({
        subject_id: subjectId,
        name: categoryName,
        created_by: currentUser.id
      });

      if (error) {
        console.error(error);
        alert(error.message || "Categorie toevoegen mislukt.");
        return;
      }

      categoryForm.reset();
      await refreshAllData();
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Categorie toevoegen";
      }
    }
  });
}

function setupLessonForm() {
  const lessonForm = document.getElementById("lessonForm");
  if (!lessonForm) return;

  lessonForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const categoryId = document.getElementById("lessonCategory").value;
    const title = document.getElementById("lessonTitle").value.trim();
    const note = document.getElementById("lessonNote").value.trim();
    const pdfInput = document.getElementById("lessonPdf");
    const submitBtn = document.getElementById("lessonSubmitBtn");
    const file = pdfInput?.files?.[0];

    if (!categoryId || !title) {
      alert("Kies eerst een categorie en vul een lestitel in.");
      return;
    }

    if (!file) {
      alert("Kies eerst een PDF-bestand.");
      return;
    }

    if (file.type !== "application/pdf") {
      alert("Alleen PDF-bestanden zijn toegestaan.");
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Bezig met uploaden...";

      const safeFileName = file.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9.\-_]/g, "");

      const filePath = `${categoryId}/${Date.now()}-${safeFileName}`;

      const { error: uploadError } = await window.supabaseClient.storage
        .from("lessons")
        .upload(filePath, file, {
          upsert: false,
          contentType: "application/pdf"
        });

      if (uploadError) throw uploadError;

      const { error: insertError } = await window.supabaseClient
        .from("lessons")
        .insert({
          category_id: categoryId,
          title,
          note,
          pdf_path: filePath,
          created_by: currentUser.id
        });

      if (insertError) throw insertError;

      lessonForm.reset();
      await refreshAllData();
      alert("Les en PDF succesvol opgeslagen.");
    } catch (error) {
      console.error("Upload fout:", error);
      alert(error.message || "Uploaden mislukt.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Les + PDF opslaan";
    }
  });
}

function setupDeleteActions() {
  document.addEventListener("click", async (event) => {
    const deleteBtn = event.target.closest(".delete-btn");
    if (!deleteBtn) return;

    const type = deleteBtn.dataset.type;
    const id = deleteBtn.dataset.id;
    const name = deleteBtn.dataset.name;
    const pdfPath = deleteBtn.dataset.pdfPath || "";

    let confirmText = `Weet je zeker dat je "${name}" wilt verwijderen?`;

    if (type === "subject") {
      confirmText += "\n\nDit kan ook gekoppelde categorieën en lessen verwijderen.";
    }

    if (type === "category") {
      confirmText += "\n\nDit kan ook gekoppelde lessen verwijderen.";
    }

    if (!confirm(confirmText)) return;

    try {
      deleteBtn.disabled = true;
      deleteBtn.textContent = "Bezig...";

      if (type === "lesson") {
        if (pdfPath) {
          const { error: storageError } = await window.supabaseClient.storage
            .from("lessons")
            .remove([pdfPath]);

          if (storageError) {
            console.warn("PDF verwijderen uit storage mislukt:", storageError);
          }
        }

        const { error } = await window.supabaseClient
          .from("lessons")
          .delete()
          .eq("id", id);

        if (error) throw error;
      }

      if (type === "category") {
        const { error } = await window.supabaseClient
          .from("categories")
          .delete()
          .eq("id", id);

        if (error) throw error;
      }

      if (type === "subject") {
        const { error } = await window.supabaseClient
          .from("subjects")
          .delete()
          .eq("id", id);

        if (error) throw error;
      }

      await refreshAllData();
    } catch (error) {
      console.error("Verwijderen mislukt:", error);
      alert(error.message || "Verwijderen mislukt.");
    } finally {
      deleteBtn.disabled = false;
      deleteBtn.textContent = "Verwijderen";
    }
  });
}

function setCreateUserMessage(message, type = "error") {
  const el = document.getElementById("createUserMessage");
  if (!el) return;

  el.textContent = message;
  el.className = `form-message ${type === "success" ? "success" : ""}`.trim();
}

function setCreateUserLoading(isLoading) {
  const btn = document.getElementById("createUserSubmitBtn");
  if (!btn) return;

  btn.disabled = isLoading;
  btn.textContent = isLoading ? "Bezig..." : "Gebruiker aanmaken";
}

function setupCreateUserForm() {
  const form = document.getElementById("createUserForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("createUserEmail")?.value.trim();
    const fullName = document.getElementById("createUserFullName")?.value.trim();
    const role = document.getElementById("createUserRole")?.value;
    const sendResetEmail = document.getElementById("createUserResetEmail")?.checked ?? true;

    setCreateUserMessage("");

    if (!email) {
      setCreateUserMessage("Vul een geldig e-mailadres in.");
      return;
    }

    if (!["teacher", "admin"].includes(role)) {
      setCreateUserMessage("Ongeldige rol geselecteerd.");
      return;
    }

    try {
      setCreateUserLoading(true);

      const {
        data: { session },
        error: sessionError
      } = await window.supabaseClient.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("Geen geldige admin-sessie gevonden. Log opnieuw in.");
      }

      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          email,
          fullName,
          role,
          sendResetEmail
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "Gebruiker aanmaken mislukt.");
      }

      form.reset();
      const roleLabel = role === "admin" ? "admin" : "leerkracht";
      const resetText = sendResetEmail
        ? "Resetmail is verzonden."
        : "Geen resetmail verstuurd.";

      setCreateUserMessage(
        `Gebruiker aangemaakt als ${roleLabel}. ${resetText}`,
        "success"
      );
    } catch (error) {
      console.error("Create user error:", error);
      setCreateUserMessage(error.message || "Gebruiker aanmaken mislukt.");
    } finally {
      setCreateUserLoading(false);
    }
  });
}

function setupLogout() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (!logoutBtn) return;

  logoutBtn.addEventListener("click", async () => {
    logoutBtn.disabled = true;
    logoutBtn.textContent = "Bezig...";

    try {
      await window.supabaseClient.auth.signOut();
      window.location.href = "login.html";
    } catch (error) {
      console.error("Uitloggen mislukt:", error);
      alert("Uitloggen mislukt.");
      logoutBtn.disabled = false;
      logoutBtn.textContent = "Uitloggen";
    }
  });
}

async function refreshAllData() {
  await loadSubjects();
  await loadCategories();
  await loadLessons();
  await loadDownloadLogs();
}

function formatDateTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("nl-NL", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function initAdminDashboard() {
  const adminAccess = await requireAdmin();
  if (!adminAccess) return;

  setupTabs();
  setupTreeToggles();
  setupLogout();
  setupSubjectForm();
  setupCategoryForm();
  setupLessonForm();
  setupCreateUserForm();
  setupDownloadSearch();
  setupDeleteActions();

  await refreshAllData();
}

document.addEventListener("DOMContentLoaded", initAdminDashboard);
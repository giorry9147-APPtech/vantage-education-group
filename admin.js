let currentUser = null;
let currentProfile = null;
let subjectsCache = [];
let categoriesCache = [];
let lessonsCache = [];
let downloadLogsCache = [];
let profilesCache = {};
let selectedAdminSubjectId = null;
let selectedAdminCategoryId = null;

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
    .select("id, full_name, role, must_change_password")
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

  if (profile.must_change_password) {
    window.location.href = "change-password.html";
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

async function loadProfiles() {
  const { data, error } = await window.supabaseClient
    .from("profiles")
    .select("id, full_name");

  if (error) {
    console.error("Fout bij ophalen profielen:", error);
    return;
  }

  profilesCache = {};
  (data || []).forEach((profile) => {
    profilesCache[profile.id] = profile.full_name || "Onbekend";
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
                                              <span class="list-meta">Geüpload door: ${escapeHtml(profilesCache[lesson.created_by] || "Onbekend")}</span>
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
            <span class="list-meta">Geüpload door: ${escapeHtml(profilesCache[lesson.created_by] || "Onbekend")}</span>
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
            <span class="list-meta">Geüpload door: ${escapeHtml(profilesCache[lesson.created_by] || "Onbekend")}</span>
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

function setCreateAdminMessage(message, type = "error") {
  const messageEl = document.getElementById("createAdminMessage");
  if (!messageEl) return;

  messageEl.textContent = message;
  messageEl.className = `form-message ${type === "success" ? "success" : ""}`.trim();
}

function setCreateAdminLoading(isLoading) {
  const submitBtn = document.getElementById("createAdminSubmitBtn");
  if (!submitBtn) return;

  submitBtn.disabled = isLoading;
  submitBtn.textContent = isLoading ? "Bezig met aanmaken..." : "Admin aanmaken";
}

function setupCreateAdminForm() {
  const form = document.getElementById("createAdminForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const fullName = document.getElementById("newAdminFullName")?.value.trim();
    const email = document.getElementById("newAdminEmail")?.value.trim().toLowerCase();

    setCreateAdminMessage("");

    if (!fullName || !email) {
      setCreateAdminMessage("Vul alle velden in.");
      return;
    }

    try {
      setCreateAdminLoading(true);

      const {
        data: { session },
        error: sessionError
      } = await window.supabaseClient.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error("Je sessie is verlopen. Log opnieuw in.");
      }

      const response = await fetch("/api/admin/create-admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          fullName,
          email
        })
      });

      let payload = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (!response.ok) {
        throw new Error(payload?.error || "Admin aanmaken mislukt.");
      }

      form.reset();
      setCreateAdminMessage(
        "Admin account aangemaakt. Een wachtwoord-instelvlink is verzonden naar " + email + ".",
        "success"
      );
      await refreshAllData();
    } catch (error) {
      console.error("Create admin error:", error);
      setCreateAdminMessage(error.message || "Admin aanmaken mislukt.");
    } finally {
      setCreateAdminLoading(false);
    }
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

function renderAdminFilesSubjectsGrid() {
  const container = document.getElementById("adminFilesSubjectsGrid");
  if (!container) return;

  if (subjectsCache.length === 0) {
    container.innerHTML = `<p class="empty-state">Nog geen vakken beschikbaar.</p>`;
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
        <button
          class="teacher-subject-btn admin-files-subject-btn"
          data-subject-id="${subject.id}"
          type="button"
        >
          <span class="teacher-subject-btn-title">${escapeHtml(subject.name)}</span>
          <span class="list-meta">Categorieën: ${categoryCount}</span>
          <span class="list-meta">Lessen: ${lessonCount}</span>
        </button>
      `;
    })
    .join("");
}

function renderAdminFilesSubjectDetails(subjectId) {
  const subject = subjectsCache.find((item) => item.id === subjectId);
  const categoriesPanel = document.getElementById("adminFilesCategoriesPanel");
  const lessonsPanel = document.getElementById("adminFilesLessonsPanel");
  const title = document.getElementById("adminFilesSubjectTitle");
  const subtitle = document.getElementById("adminFilesSubjectSubtitle");

  if (!categoriesPanel || !lessonsPanel || !title || !subtitle) return;

  if (!subject) {
    title.textContent = "Nog geen vak gekozen";
    subtitle.textContent = "Klik op een vak om categorieën en lessen te bekijken.";
    categoriesPanel.innerHTML = "";
    lessonsPanel.innerHTML = "";
    return;
  }

  title.textContent = subject.name;
  subtitle.textContent = "Kies een categorie om de lessen te bekijken.";

  const subjectCategories = categoriesCache
    .filter((category) => category.subject_id === subjectId)
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));

  if (subjectCategories.length === 0) {
    categoriesPanel.innerHTML = `<p class="empty-state">Geen categorieën beschikbaar.</p>`;
    lessonsPanel.innerHTML = `<p class="empty-state">Geen lessen beschikbaar.</p>`;
    return;
  }

  categoriesPanel.innerHTML = subjectCategories
    .map(
      (category) => `
        <button class="teacher-category-btn admin-files-category-btn" data-category-id="${category.id}" type="button">
          ${escapeHtml(category.name)}
        </button>
      `
    )
    .join("");

  lessonsPanel.innerHTML = `<p class="empty-state">Kies een categorie om lessen te zien.</p>`;
}

function renderAdminFilesLessonsForCategory(categoryId) {
  const lessonsPanel = document.getElementById("adminFilesLessonsPanel");
  if (!lessonsPanel) return;

  const lessons = lessonsCache
    .filter((lesson) => lesson.category_id === categoryId)
    .sort((a, b) => a.title.localeCompare(b.title, "nl"));

  if (lessons.length === 0) {
    lessonsPanel.innerHTML = `<p class="empty-state">Geen lessen in deze categorie.</p>`;
    return;
  }

  lessonsPanel.innerHTML = lessons
    .map(
      (lesson) => `
        <div class="teacher-lesson-card">
          <strong>${escapeHtml(lesson.title)}</strong>
          <span class="list-meta">Geüpload op: ${formatDateTime(lesson.created_at)}</span>
          <span class="list-meta">Geüpload door: ${escapeHtml(profilesCache[lesson.created_by] || "Onbekend")}</span>
          <span class="list-note">${escapeHtml(lesson.note || "Geen notitie")}</span>
          ${
            lesson.pdf_path
              ? `<button class="download-btn" type="button" data-lesson-id="${lesson.id}" data-lesson-title="${escapeHtml(lesson.title)}" data-pdf-path="${lesson.pdf_path}" data-file-name="${escapeHtml(lesson.title)}.pdf">Download PDF</button>`
              : `<span class="list-meta">Geen PDF beschikbaar</span>`
          }
        </div>
      `
    )
    .join("");
}

function renderAdminFilesTab() {
  renderAdminFilesSubjectsGrid();
  if (selectedAdminSubjectId) {
    renderAdminFilesSubjectDetails(selectedAdminSubjectId);
  }
  if (selectedAdminCategoryId) {
    renderAdminFilesLessonsForCategory(selectedAdminCategoryId);
  }
}

function setupAdminFilesBrowsing() {
  document.addEventListener("click", (event) => {
    const subjectBtn = event.target.closest(".admin-files-subject-btn");
    if (subjectBtn) {
      const subjectId = subjectBtn.dataset.subjectId;
      selectedAdminSubjectId = subjectId;
      selectedAdminCategoryId = null;
      document
        .querySelectorAll(".admin-files-subject-btn")
        .forEach((item) => item.classList.remove("active"));
      subjectBtn.classList.add("active");
      renderAdminFilesSubjectDetails(subjectId);
      return;
    }

    const categoryBtn = event.target.closest(".admin-files-category-btn");
    if (categoryBtn) {
      const categoryId = categoryBtn.dataset.categoryId;
      selectedAdminCategoryId = categoryId;
      document
        .querySelectorAll(".admin-files-category-btn")
        .forEach((item) => item.classList.remove("active"));
      categoryBtn.classList.add("active");
      renderAdminFilesLessonsForCategory(categoryId);
      return;
    }
  });
}

function setupAdminDownloadButtons() {
  document.addEventListener("click", async (event) => {
    const btn = event.target.closest(".download-btn");
    if (!btn) return;

    const pdfPath = btn.dataset.pdfPath;
    const lessonId = btn.dataset.lessonId;
    const lessonTitle = btn.dataset.lessonTitle || "Onbekende les";
    if (!pdfPath) return;

    try {
      btn.disabled = true;
      btn.textContent = "Bezig...";

      const { data, error } = await window.supabaseClient.storage
        .from("lessons")
        .createSignedUrl(pdfPath, 60);

      if (error) throw error;

      if (!data?.signedUrl) {
        throw new Error("Downloadlink kon niet worden aangemaakt.");
      }

      const { error: logError } = await window.supabaseClient
        .from("lesson_download_logs")
        .insert({
          lesson_id: lessonId || null,
          lesson_title: lessonTitle,
          pdf_path: pdfPath,
          user_id: currentUser?.id || null,
          user_email: currentUser?.email || null,
          user_name: currentProfile?.full_name || null
        });

      if (logError) {
        console.warn("Downloadlog opslaan mislukt:", logError);
      }

      const link = document.createElement("a");
      link.href = data.signedUrl;
      link.download = btn.dataset.fileName || `${lessonTitle}.pdf`;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download fout:", error);
      alert(error.message || "Download mislukt.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Download PDF";
    }
  });
}

async function refreshAllData() {
  await loadProfiles();
  await loadSubjects();
  await loadCategories();
  await loadLessons();
  await loadDownloadLogs();
  renderAdminFilesTab();
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
  setupCreateAdminForm();
  setupSubjectForm();
  setupCategoryForm();
  setupLessonForm();
  setupDownloadSearch();
  setupDeleteActions();
  setupAdminFilesBrowsing();
  setupAdminDownloadButtons();

  await refreshAllData();
}

document.addEventListener("DOMContentLoaded", initAdminDashboard);
let teacherUser = null;
let teacherProfile = null;
let teacherSubjects = [];
let teacherCategories = [];
let teacherLessons = [];
let selectedSubjectId = null;
let selectedCategoryId = null;

async function requireTeacher() {
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

  if (profile.role !== "teacher") {
    window.location.href = "admin-dashboard.html";
    return null;
  }

  teacherUser = user;
  teacherProfile = profile;

  const teacherName = document.getElementById("teacherName");
  if (teacherName) {
    teacherName.textContent = `Welkom, ${profile.full_name || "Leerkracht"}`;
  }

  return { user, profile };
}

function setupTeacherTabs() {
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
}

async function loadTeacherSubjects() {
  const { data, error } = await window.supabaseClient
    .from("subjects")
    .select("id, name, created_at")
    .order("name", { ascending: true });

  if (error) {
    console.error("Fout bij ophalen vakken:", error);
    return;
  }

  teacherSubjects = data || [];
  renderTeacherSubjectsGrid();
  renderTeacherSubjectsTree();
  updateTeacherCounts();
}

async function loadTeacherCategories() {
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

  teacherCategories = data || [];
  renderTeacherSubjectsTree();
  updateTeacherCounts();

  if (selectedSubjectId) {
    renderTeacherSubjectDetails(selectedSubjectId);
  }
}

async function loadTeacherLessons() {
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

  teacherLessons = data || [];
  renderTeacherSubjectsTree();
  updateTeacherCounts();

  if (selectedSubjectId) {
    renderTeacherSubjectDetails(selectedSubjectId);
  }

  if (selectedCategoryId) {
    renderTeacherLessonsForCategory(selectedCategoryId);
  }
}

function updateTeacherCounts() {
  const subjectsCount = document.getElementById("teacherSubjectsCount");
  const categoriesCount = document.getElementById("teacherCategoriesCount");
  const lessonsCount = document.getElementById("teacherLessonsCount");

  if (subjectsCount) subjectsCount.textContent = teacherSubjects.length;
  if (categoriesCount) categoriesCount.textContent = teacherCategories.length;
  if (lessonsCount) lessonsCount.textContent = teacherLessons.length;
}

function renderTeacherSubjectsGrid() {
  const container = document.getElementById("teacherSubjectsGrid");
  if (!container) return;

  if (teacherSubjects.length === 0) {
    container.innerHTML = `<p class="empty-state">Nog geen vakken beschikbaar.</p>`;
    return;
  }

  container.innerHTML = teacherSubjects
    .map((subject) => {
      const categoryCount = teacherCategories.filter(
        (category) => category.subject_id === subject.id
      ).length;

      const lessonCount = teacherLessons.filter(
        (lesson) => lesson.categories?.subject_id === subject.id
      ).length;

      return `
        <button
          class="teacher-subject-btn"
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

  highlightActiveSubjectButton();
}

function renderTeacherSubjectsTree() {
  const tree = document.getElementById("teacherSubjectsTree");
  if (!tree) return;

  if (teacherSubjects.length === 0) {
    tree.innerHTML = `<p class="empty-state">Nog geen vakken beschikbaar.</p>`;
    return;
  }

  tree.innerHTML = teacherSubjects
    .map((subject) => {
      const subjectCategories = teacherCategories
        .filter((category) => category.subject_id === subject.id)
        .sort((a, b) => a.name.localeCompare(b.name, "nl"));

      return `
        <div class="tree-subject">
          <div class="tree-row">
            <button
              class="tree-toggle"
              type="button"
              data-target="teacher-subject-${subject.id}"
              aria-expanded="false"
              aria-label="Toon of verberg categorieën van ${escapeHtml(subject.name)}"
            >
              ▶
            </button>

            <div class="tree-content">
              <strong>${escapeHtml(subject.name)}</strong>
              <span class="list-meta">Vak</span>
            </div>
          </div>

          <div class="tree-children" id="teacher-subject-${subject.id}">
            ${
              subjectCategories.length === 0
                ? `<p class="empty-state small-empty">Nog geen categorieën.</p>`
                : subjectCategories
                    .map((category) => {
                      const categoryLessons = teacherLessons
                        .filter((lesson) => lesson.category_id === category.id)
                        .sort((a, b) => a.title.localeCompare(b.title, "nl"));

                      return `
                        <div class="tree-category">
                          <div class="tree-row tree-row-child">
                            <button
                              class="tree-toggle"
                              type="button"
                              data-target="teacher-category-${category.id}"
                              aria-expanded="false"
                              aria-label="Toon of verberg lessen van ${escapeHtml(category.name)}"
                            >
                              ▶
                            </button>

                            <div class="tree-content">
                              <strong>${escapeHtml(category.name)}</strong>
                              <span class="list-meta">Categorie</span>
                            </div>
                          </div>

                          <div class="tree-children" id="teacher-category-${category.id}">
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
                                              <span class="list-meta">Geüpload op: ${formatDateTime(lesson.created_at)}</span>
                                              <span class="list-note">${escapeHtml(lesson.note || "Geen notitie")}</span>
                                              ${
                                                lesson.pdf_path
                                                  ? `<button class="download-btn" type="button" data-lesson-id="${lesson.id}" data-lesson-title="${escapeHtml(lesson.title)}" data-pdf-path="${lesson.pdf_path}" data-file-name="${escapeHtml(
                                                      lesson.title
                                                    )}.pdf">Download PDF</button>`
                                                  : `<span class="list-meta">Geen PDF beschikbaar</span>`
                                              }
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

function setupTeacherSubjectButtons() {
  document.addEventListener("click", (event) => {
    const btn = event.target.closest(".teacher-subject-btn");
    if (!btn) return;

    const subjectId = btn.dataset.subjectId;
    selectedSubjectId = subjectId;
    selectedCategoryId = null;

    document
      .querySelectorAll(".teacher-subject-btn")
      .forEach((item) => item.classList.remove("active"));

    btn.classList.add("active");

    renderTeacherSubjectDetails(subjectId);

    const lessonsPanel = document.getElementById("teacherLessonsPanel");
    if (window.innerWidth <= 760 && lessonsPanel) {
      lessonsPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });
}

function renderTeacherSubjectDetails(subjectId) {
  const subject = teacherSubjects.find((item) => item.id === subjectId);
  const categoriesPanel = document.getElementById("teacherCategoriesPanel");
  const lessonsPanel = document.getElementById("teacherLessonsPanel");
  const title = document.getElementById("selectedSubjectTitle");
  const subtitle = document.getElementById("selectedSubjectSubtitle");

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

  const subjectCategories = teacherCategories
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
        <button class="teacher-category-btn" data-category-id="${category.id}" type="button">
          ${escapeHtml(category.name)}
        </button>
      `
    )
    .join("");

  lessonsPanel.innerHTML = `<p class="empty-state">Kies een categorie om lessen te zien.</p>`;

  highlightActiveCategoryButton();
}

function setupTeacherCategoryButtons() {
  document.addEventListener("click", (event) => {
    const btn = event.target.closest(".teacher-category-btn");
    if (!btn) return;

    const categoryId = btn.dataset.categoryId;
    selectedCategoryId = categoryId;

    document
      .querySelectorAll(".teacher-category-btn")
      .forEach((item) => item.classList.remove("active"));

    btn.classList.add("active");

    renderTeacherLessonsForCategory(categoryId);

    const lessonsPanel = document.getElementById("teacherLessonsPanel");
    if (window.innerWidth <= 760 && lessonsPanel) {
      lessonsPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  });
}

function renderTeacherLessonsForCategory(categoryId) {
  const lessonsPanel = document.getElementById("teacherLessonsPanel");
  if (!lessonsPanel) return;

  const lessons = teacherLessons
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
          <span class="list-note">${escapeHtml(lesson.note || "Geen notitie")}</span>
          ${
            lesson.pdf_path
              ? `<button class="download-btn" type="button" data-lesson-id="${lesson.id}" data-lesson-title="${escapeHtml(lesson.title)}" data-pdf-path="${lesson.pdf_path}" data-file-name="${escapeHtml(
                  lesson.title
                )}.pdf">Download PDF</button>`
              : `<span class="list-meta">Geen PDF beschikbaar</span>`
          }
        </div>
      `
    )
    .join("");
}

function setupTeacherTreeToggles() {
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

function setupDownloadButtons() {
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
          user_id: teacherUser?.id || null,
          user_email: teacherUser?.email || null,
          user_name: teacherProfile?.full_name || null
        });

      if (logError) {
        console.warn("Downloadlog opslaan mislukt:", logError);
      }

      window.open(data.signedUrl, "_blank");
    } catch (error) {
      console.error("Download fout:", error);
      alert(error.message || "Download mislukt.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Download PDF";
    }
  });
}

function setupTeacherLogout() {
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

function highlightActiveSubjectButton() {
  if (!selectedSubjectId) return;

  document.querySelectorAll(".teacher-subject-btn").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.subjectId === selectedSubjectId
    );
  });
}

function highlightActiveCategoryButton() {
  if (!selectedCategoryId) return;

  document.querySelectorAll(".teacher-category-btn").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.categoryId === selectedCategoryId
    );
  });
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

async function refreshTeacherData() {
  await loadTeacherSubjects();
  await loadTeacherCategories();
  await loadTeacherLessons();
}

async function initTeacherDashboard() {
  const teacherAccess = await requireTeacher();
  if (!teacherAccess) return;

  setupTeacherTabs();
  setupTeacherTreeToggles();
  setupTeacherSubjectButtons();
  setupTeacherCategoryButtons();
  setupDownloadButtons();
  setupTeacherLogout();

  await refreshTeacherData();
}

document.addEventListener("DOMContentLoaded", initTeacherDashboard);
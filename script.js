const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
// Login alias only: Supabase still verifies the existing account's password.
const ADMIN_EMAIL = "rus11999944@gmail.com";
const loginButton = document.querySelector("#login-button");
const authMessage = document.querySelector("#auth-message");

const authSection =
  document.querySelector("#auth-section");

const appContent =
  document.querySelector("#app-content");

const adminTabs = Array.from(document.querySelectorAll('.admin-tabs [role="tab"]'));

function selectAdminTab(selectedTab) {
  const achievementsPanel = document.querySelector("#achievements-panel");
  if (achievementsPanel && !achievementsPanel.hidden) saveAchievementFormDraft();
  adminTabs.forEach(function (tab) {
    const selected = tab === selectedTab;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;
  });
  if (selectedTab.getAttribute("aria-controls") === "achievements-panel") {
    restoreAchievementFormDraft();
  }
}

adminTabs.forEach(function (tab, index) {
  tab.addEventListener("click", function () { selectAdminTab(tab); });
  tab.addEventListener("keydown", function (event) {
    let nextIndex;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % adminTabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index + adminTabs.length - 1) % adminTabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = adminTabs.length - 1;
    if (nextIndex === undefined) return;
    event.preventDefault();
    selectAdminTab(adminTabs[nextIndex]);
    adminTabs[nextIndex].focus();
  });
});

const currentUserEmail =
  document.querySelector("#current-user-email");

const logoutButton =
  document.querySelector("#logout-button");

const createScreenButton =
  document.querySelector("#create-screen-button");

const screenUrl =
  document.querySelector("#screen-url");

const newsTitle = document.querySelector("#news-title");
const newsType = document.querySelector("#news-type");
const newsBody = document.querySelector("#news-body");
const newsImage = document.querySelector("#news-image");
const newsImageField = document.querySelector("#news-image-field");
const newsLink = document.querySelector("#news-link");
const newsQrText = document.querySelector("#news-qr-text");
const newsActiveDays = document.querySelector("#news-active-days");
const cancelNewsEditButton = document.querySelector("#cancel-news-edit-button");
const addNewsButton = document.querySelector("#add-news-button");
const loadNewsButton = document.querySelector("#load-news-button");
const newsMessage = document.querySelector("#news-message");
const newsList = document.querySelector("#news-list");
const achievementForm = document.querySelector("#achievement-form");
const saveAchievementButton = document.querySelector("#save-achievement-button");
const achievementMessage = document.querySelector("#achievement-message");
const loadAchievementsButton = document.querySelector("#load-achievements-button");
const finishAchievementsButton = document.querySelector("#finish-achievements-button");
const achievementExportMessage = document.querySelector("#achievement-export-message");
const achievementExportPanel = document.querySelector("#achievement-export-panel");
const achievementExportDetails = document.querySelector("#achievement-export-details");
const achievementExportSummary = document.querySelector("#achievement-export-summary");
const copyLastAchievementButton = document.querySelector("#copy-last-achievement-button");
const cancelAchievementEditButton = document.querySelector("#cancel-achievement-edit-button");
const achievementsList = document.querySelector("#achievements-list");
const studentsExcelFile = document.querySelector("#students-excel-file");
const uploadStudentsButton = document.querySelector("#upload-students-button");
const studentsUploadMessage = document.querySelector("#students-upload-message");
const studentForm = document.querySelector("#student-form");
const studentMessage = document.querySelector("#student-message");
const loadStudentsButton = document.querySelector("#load-students-button");
const studentsList = document.querySelector("#students-list");
const teachersExcelFile = document.querySelector("#teachers-excel-file");
const uploadTeachersButton = document.querySelector("#upload-teachers-button");
const teachersUploadMessage = document.querySelector("#teachers-upload-message");
const teacherForm = document.querySelector("#teacher-form");
const teacherMessage = document.querySelector("#teacher-message");
const loadTeachersButton = document.querySelector("#load-teachers-button");
const teachersList = document.querySelector("#teachers-list");
const achievementLastName = document.querySelector("#achievement-last-name");
const achievementFirstName = document.querySelector("#achievement-first-name");
const achievementClass = document.querySelector("#achievement-class");
const achievementLastNames = document.querySelector("#achievement-last-names");
const achievementFirstNames = document.querySelector("#achievement-first-names");
const achievementSupervisor = document.querySelector("#achievement-supervisor");
const achievementSupervisors = document.querySelector("#achievement-supervisors");
const achievementEventName = document.querySelector("#achievement-event-name");
const achievementEventNames = document.querySelector("#achievement-event-names");
const achievementOrder = document.querySelector("#achievement-order");
const achievementOrdersMenu = document.querySelector("#achievement-orders");
const eventsExcelFile = document.querySelector("#events-excel-file");
const uploadEventsButton = document.querySelector("#upload-events-button");
const eventManagerMessage = document.querySelector("#event-manager-message");
const achievementSubject = document.querySelector("#achievement-subject");
const achievementSubjectNames = document.querySelector("#achievement-subject-names");
const achievementLevel = document.querySelector("#achievement-level");
const achievementStage = document.querySelector("#achievement-stage");
const achievementType = document.querySelector("#achievement-type");
const achievementTypesMenu = document.querySelector("#achievement-types");
const achievementResult = document.querySelector("#achievement-result");
const achievementResultsMenu = document.querySelector("#achievement-results");
const achievementCountry = document.querySelector("#achievement-country");
const achievementCountriesMenu = document.querySelector("#achievement-countries");
const achievementCity = document.querySelector("#achievement-city");
const achievementCitiesMenu = document.querySelector("#achievement-cities");
const achievementOrganizers = document.querySelector("#achievement-organizers");
const achievementOrganizersMenu = document.querySelector("#achievement-organizers-list");
const achievementStartDate = document.querySelector("#achievement-date");
const achievementEndDate = document.querySelector("#achievement-end-date");

let achievementStudents = [];
let selectedAchievementStudent = null;
let achievementTeachers = [];
let selectedAchievementSupervisor = null;
let achievementEvents = [];
let selectedAchievementEvent = null;
let achievementOrders = [];
let selectedAchievementOrder = null;
let achievementSubjects = [];
let selectedAchievementSubject = null;
let achievementTypes = [];
let selectedAchievementType = null;
let achievementResults = [];
let selectedAchievementResult = null;
let achievementFormDraft = null;
let editingAchievementId = null;
const achievementCountryReference = {
  input: achievementCountry,
  menu: achievementCountriesMenu,
  table: "achievement_countries",
  label: "Страна",
  items: [],
  selected: null
};
const achievementCityReference = {
  input: achievementCity,
  menu: achievementCitiesMenu,
  table: "achievement_cities",
  label: "Город",
  items: [],
  selected: null
};
const achievementOrganizerReference = {
  input: achievementOrganizers,
  menu: achievementOrganizersMenu,
  table: "achievement_organizers",
  label: "Организатор",
  items: [],
  selected: null
};

function saveAchievementFormDraft() {
  if (!achievementForm) return;
  achievementFormDraft = {};
  achievementForm.querySelectorAll("input:not([type='file']), select, textarea").forEach(function (field) {
    if (field.id) achievementFormDraft[field.id] = field.value;
  });
}

function restoreAchievementFormDraft() {
  if (!achievementForm || !achievementFormDraft) return;
  Object.entries(achievementFormDraft).forEach(function ([id, value]) {
    const field = document.getElementById(id);
    if (field) field.value = value;
  });
  syncAchievementStageOptions();
  syncAchievementDateRange();
  chooseAchievementStudent();
  chooseAchievementEvent();
  chooseAchievementOrder();
  chooseAchievementSubject();
  chooseAchievementType();
  chooseAchievementResult();
  chooseAchievementSupervisor();
  chooseLocationReference(achievementCountryReference);
  chooseLocationReference(achievementCityReference);
  chooseLocationReference(achievementOrganizerReference);
}

achievementForm.addEventListener("input", saveAchievementFormDraft);
achievementForm.addEventListener("change", saveAchievementFormDraft);

const defaultAchievementSubjectNames = [
  "Әліппе",
  "Ана тілі",
  "Әдебиеттік оқу",
  "Казахский язык",
  "Казахская литература",
  "Казахский язык и литература",
  "Русский язык",
  "Русская литература",
  "Русский язык и литература",
  "Английский язык",
  "Иностранный язык",
  "Математика",
  "Алгебра",
  "Геометрия",
  "Естествознание",
  "Физика",
  "Химия",
  "Биология",
  "География",
  "Познание мира",
  "История Казахстана",
  "Всемирная история",
  "Основы права",
  "Цифровая грамотность и искусственный интеллект",
  "Информатика и искусственный интеллект",
  "Художественный труд",
  "Музыка",
  "Физическая культура",
  "Начальная военная и технологическая подготовка"
];

const defaultAchievementTypeNames = [
  "Олимпиада",
  "Конкурс",
  "Турнир",
  "Ярмарка",
  "Благотворительное мероприятие",
  "Хакатон",
  "Вручение"
];

const defaultAchievementResultNames = [
  "1 место",
  "2 место",
  "3 место",
  "Почётная грамота",
  "Абсолютный чемпион",
  "Сертификат",
  "Благодарственное письмо"
];

const achievementScopeOrder = [
  "Школьный",
  "Районный",
  "Городской",
  "Республиканский",
  "Международный"
];

function syncAchievementStageOptions() {
  const levelRank = achievementScopeOrder.indexOf(achievementLevel.value);
  achievementStage.disabled = levelRank < 0;
  achievementStage.options[0].textContent = levelRank < 0
    ? "Сначала выберите уровень"
    : "Не выбрано";

  Array.from(achievementStage.options).forEach(function (option) {
    if (!option.value) return;
    option.disabled = achievementScopeOrder.indexOf(option.value) > levelRank;
  });

  if (achievementStage.selectedOptions[0]?.disabled) achievementStage.value = "";
}

achievementLevel.addEventListener("change", syncAchievementStageOptions);
syncAchievementStageOptions();

function syncAchievementDateRange() {
  achievementEndDate.min = achievementStartDate.value;
  if (
    achievementStartDate.value &&
    achievementEndDate.value &&
    achievementEndDate.value < achievementStartDate.value
  ) {
    achievementEndDate.value = achievementStartDate.value;
  }
}

achievementStartDate.addEventListener("change", syncAchievementDateRange);
syncAchievementDateRange();

let editingNewsId = null;
let editingNewsImagePaths = [];

function updateNewsTypeFields() {
  const isAnnouncement = newsType.value === "announcement";
  newsImageField.hidden = isAnnouncement;
  if (isAnnouncement) newsImage.value = "";
  newsLink.required = isAnnouncement;
}

newsType.addEventListener("change", updateNewsTypeFields);

function getNewsImageUrl(imagePath) {
  return supabaseClient.storage
    .from("news-images")
    .getPublicUrl(imagePath).data.publicUrl;
}

function getNewsImagePaths(item) {
  if (Array.isArray(item.image_paths) && item.image_paths.length) {
    return item.image_paths.filter(Boolean);
  }
  return item.image_path ? [item.image_path] : [];
}

function resetNewsForm() {
  editingNewsId = null;
  editingNewsImagePaths = [];
  newsType.value = "story";
  newsTitle.value = "";
  newsBody.value = "";
  newsImage.value = "";
  newsLink.value = "";
  newsQrText.value = "";
  newsActiveDays.value = "7";
  addNewsButton.textContent = "Опубликовать";
  cancelNewsEditButton.hidden = true;
  updateNewsTypeFields();
}

cancelNewsEditButton.addEventListener("click", function () {
  resetNewsForm();
  newsMessage.textContent = "Редактирование отменено";
});

function updateAuthView(session) {
  const isLoggedIn = Boolean(session);

  authSection.hidden = isLoggedIn;
  appContent.hidden = !isLoggedIn;

  if (isLoggedIn) {
    currentUserEmail.textContent =
      session.user.email === ADMIN_EMAIL ? "admin" : "Вы вошли в аккаунт";
    loadNewsButton.click();
    loadAchievementsButton.click();
    loadStudentsButton.click();
    loadTeachersButton.click();
    loadAchievementEvents();
    loadAchievementOrders();
    loadAchievementSubjects();
    loadAchievementTypes();
    loadAchievementResults();
    loadLocationReference(achievementCountryReference);
    loadLocationReference(achievementCityReference);
    loadLocationReference(achievementOrganizerReference);
  } else {
    currentUserEmail.textContent = "";
    screenUrl.hidden = true;
    screenUrl.textContent = "";
  }
}

loginButton.addEventListener("click", async function () {
  const login = emailInput.value.trim().toLowerCase();
  const password = passwordInput.value;

  if (login === "" || password === "") {
    authMessage.textContent = "Введите логин и пароль";
    return;
  }

  if (login !== "admin") {
    authMessage.textContent = "Неверный логин или пароль";
    return;
  }

  authMessage.textContent = "Выполняется вход...";

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: password
    });

  if (error) {
    authMessage.textContent = "Ошибка: " + error.message;
    return;
  }

  authMessage.textContent =
    "Вы вошли как admin";
    updateAuthView(data.session);
});

logoutButton.addEventListener(
  "click",
  async function () {
    const { error } =
      await supabaseClient.auth.signOut();

    if (error) {
      alert(
        "Ошибка выхода: " +
        error.message
      );
      return;
    }

    emailInput.value = "";
    passwordInput.value = "";
    authMessage.textContent = "";

    updateAuthView(null);
  }
);


function formatDateForDatabase(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

createScreenButton.addEventListener(
  "click",
  async function () {
    const { data: sessionData } =
      await supabaseClient.auth.getSession();

    if (!sessionData.session) {
      alert("Сначала войдите в аккаунт");
      return;
    }

    const userId = sessionData.session.user.id;

    let { data: existingScreen, error: selectError } =
      await supabaseClient
        .from("screens")
        .select("access_token")
        .eq("user_id", userId)
        .maybeSingle();

    if (selectError) {
      alert(
        "Ошибка получения экрана: " +
        selectError.message
      );
      return;
    }

    if (!existingScreen) {
      const { data: newScreen, error: insertError } =
        await supabaseClient
          .from("screens")
          .insert({
            user_id: userId
          })
          .select("access_token")
          .single();

      if (insertError) {
        alert(
          "Ошибка создания экрана: " +
          insertError.message
        );
        return;
      }

      existingScreen = newScreen;
    }

   const screenPageUrl =
  new URL("screen.html", window.location.href);

screenPageUrl.searchParams.set(
  "key",
  existingScreen.access_token
);

const link = screenPageUrl.toString();

    screenUrl.href = link;
    screenUrl.textContent = link;
    screenUrl.hidden = false;
  }
);


function sortPeopleByUpcomingBirthday(people, today = new Date()) {
  const todayOrder = (today.getMonth() + 1) * 100 + today.getDate();

  function birthdayOrder(person) {
    // Год рождения не влияет на порядок ежегодных дней рождения.
    const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(person.birth_date || "");
    if (!parts) return Infinity;
    const month = Number(parts[2]);
    const day = Number(parts[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return Infinity;
    const order = month * 100 + day;
    return order < todayOrder ? order + 10000 : order;
  }

  return [...people].sort((a, b) =>
    birthdayOrder(a) - birthdayOrder(b) ||
    ((a.last_name || "") + (a.first_name || "") + (a.full_name || ""))
      .localeCompare((b.last_name || "") + (b.first_name || "") + (b.full_name || ""), "ru")
  );
}

loadNewsButton.addEventListener("click", async function () {
  newsList.textContent = "Загрузка...";
  const { data: news, error } = await supabaseClient
    .from("news")
    .select("id, title, body, image_path, image_paths, link_url, qr_text, expires_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    newsList.textContent = "Ошибка: " + error.message;
    return;
  }

  newsList.replaceChildren();
  if (news.length === 0) {
    newsList.textContent = "Публикаций пока нет";
    return;
  }

  news.forEach(function (item) {
    const row = document.createElement("article");
    row.classList.add("news-row");

    const imagePaths = getNewsImagePaths(item);
    let preview;
    if (imagePaths.length) {
      preview = document.createElement("img");
      preview.src = getNewsImageUrl(imagePaths[0]);
      preview.alt = "";
      preview.loading = "lazy";
    } else {
      preview = document.createElement("div");
      preview.classList.add("news-row-placeholder");
      preview.textContent = "ОБЪЯВЛЕНИЕ";
    }

    const content = document.createElement("div");
    content.classList.add("news-row-content");
    const title = document.createElement("strong");
    title.textContent = item.title;
    const body = document.createElement("span");
    body.textContent = item.body;
    content.append(title, body);
    if (imagePaths.length > 1) {
      const count = document.createElement("span");
      count.classList.add("news-image-count");
      count.textContent = "Фотографий: " + imagePaths.length;
      content.append(count);
    }
    if (item.link_url) {
      const link = document.createElement("span");
      link.classList.add("news-link-preview");
      link.textContent = "QR-ссылка: " + item.link_url;
      content.append(link);
    }
    if (item.qr_text) {
      const qrText = document.createElement("span");
      qrText.textContent = "Подпись QR: " + item.qr_text;
      content.append(qrText);
    }
    if (item.expires_at) {
      const expiration = document.createElement("span");
      const expirationDate = new Date(item.expires_at);
      const isExpired = expirationDate.getTime() <= Date.now();
      expiration.textContent = isExpired
        ? "Срок показа завершён"
        : "Активно до: " + expirationDate.toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short" });
      content.append(expiration);
    }

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "Редактировать";
    editButton.addEventListener("click", function () {
      editingNewsId = item.id;
      editingNewsImagePaths = imagePaths;
      newsType.value = imagePaths.length ? "story" : "announcement";
      updateNewsTypeFields();
      newsTitle.value = item.title || "";
      newsBody.value = item.body || "";
      newsImage.value = "";
      newsLink.value = item.link_url || "";
      newsQrText.value = item.qr_text || "";
      const remainingDays = item.expires_at
        ? Math.max(1, Math.ceil((new Date(item.expires_at).getTime() - Date.now()) / (24 * 60 * 60 * 1000)))
        : 7;
      newsActiveDays.value = String(Math.min(365, remainingDays));
      addNewsButton.textContent = "Сохранить изменения";
      cancelNewsEditButton.hidden = false;
      newsMessage.textContent = "Редактируется публикация «" + item.title + "»";
      newsTitle.scrollIntoView({ behavior: "smooth", block: "center" });
      newsTitle.focus({ preventScroll: true });
    });

    const deleteButton = document.createElement("button");
    deleteButton.classList.add("delete-button");
    deleteButton.textContent = "Удалить";
    deleteButton.addEventListener("click", async function () {
      if (!confirm("Удалить публикацию «" + item.title + "»?")) return;
      deleteButton.disabled = true;

      const { error: deleteError } = await supabaseClient
        .from("news").delete().eq("id", item.id);
      if (deleteError) {
        alert("Ошибка удаления: " + deleteError.message);
        deleteButton.disabled = false;
        return;
      }

      const { error: imageError } = await supabaseClient.storage
        .from("news-images").remove(imagePaths);
      if (imageError) {
        console.warn("Не удалось удалить файл новости", imageError.message);
      }
      row.remove();
      if (editingNewsId === item.id) resetNewsForm();
      if (!newsList.children.length) newsList.textContent = "Публикаций пока нет";
    });

    const actions = document.createElement("div");
    actions.classList.add("news-actions");
    actions.append(editButton, deleteButton);
    row.append(preview, content, actions);
    newsList.append(row);
  });
});

addNewsButton.addEventListener("click", async function () {
  const title = newsTitle.value.trim();
  const isAnnouncement = newsType.value === "announcement";
  const body = newsBody.value.trim();
  const files = Array.from(newsImage.files);
  const linkUrl = newsLink.value.trim();
  const qrText = newsQrText.value.trim();
  const activeDays = Number(newsActiveDays.value);

  if (!title || !body) {
    newsMessage.textContent = "Заполните заголовок и текст";
    return;
  }

  if (!isAnnouncement && !files.length && !editingNewsImagePaths.length) {
    newsMessage.textContent = "Для материала выберите хотя бы одну фотографию";
    return;
  }

  if (isAnnouncement && !linkUrl) {
    newsMessage.textContent = "Для объявления укажите ссылку для QR-кода";
    return;
  }

  if (files.length > 8) {
    newsMessage.textContent = "Для одной публикации можно выбрать не больше 8 фотографий";
    return;
  }

  if (linkUrl) {
    try {
      const parsedUrl = new URL(linkUrl);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) throw new Error();
    } catch {
      newsMessage.textContent = "Введите полную ссылку, начинающуюся с https://";
      return;
    }
  }

  if (qrText && !linkUrl) {
    newsMessage.textContent = "Для подписи QR-кода сначала укажите ссылку";
    return;
  }

  if (!Number.isInteger(activeDays) || activeDays < 1 || activeDays > 365) {
    newsMessage.textContent = "Укажите срок показа от 1 до 365 дней";
    return;
  }

  const allowedTypes = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  };
  if (files.some(file => !allowedTypes[file.type])) {
    newsMessage.textContent = "Можно загрузить только JPG, PNG или WebP";
    return;
  }
  if (files.some(file => file.size > 8 * 1024 * 1024)) {
    newsMessage.textContent = "Каждая фотография должна быть не больше 8 МБ";
    return;
  }

  const { data: sessionData } = await supabaseClient.auth.getSession();
  if (!sessionData.session) {
    newsMessage.textContent = "Сначала войдите в аккаунт";
    return;
  }

  addNewsButton.disabled = true;
  newsMessage.textContent = "Подготавливаем фотографии...";
  const userId = sessionData.session.user.id;
  const uploadedPaths = [];

  try {
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const imagePath = userId + "/" + crypto.randomUUID() + "." + allowedTypes[file.type];
      newsMessage.textContent = `Загружаем фотографию ${index + 1} из ${files.length}...`;
      const { error: uploadError } = await supabaseClient.storage
        .from("news-images")
        .upload(imagePath, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;
      uploadedPaths.push(imagePath);
    }

    newsMessage.textContent = editingNewsId ? "Сохраняем изменения..." : "Сохраняем публикацию...";
    const publicationData = {
      title: title,
      body: body,
      link_url: linkUrl || null,
      qr_text: qrText || null,
      expires_at: new Date(Date.now() + activeDays * 24 * 60 * 60 * 1000).toISOString()
    };

    if (isAnnouncement) {
      publicationData.image_path = null;
      publicationData.image_paths = [];
    } else if (uploadedPaths.length) {
      publicationData.image_path = uploadedPaths[0];
      publicationData.image_paths = uploadedPaths;
    }

    let saveError;
    if (editingNewsId) {
      const result = await supabaseClient
        .from("news")
        .update(publicationData)
        .eq("id", editingNewsId);
      saveError = result.error;
    } else {
      publicationData.user_id = userId;
      const result = await supabaseClient.from("news").insert(publicationData);
      saveError = result.error;
    }

    if (saveError) throw saveError;

    if (editingNewsId && (uploadedPaths.length || isAnnouncement) && editingNewsImagePaths.length) {
      const { error: oldImagesError } = await supabaseClient.storage
        .from("news-images")
        .remove(editingNewsImagePaths);
      if (oldImagesError) console.warn("Не удалось удалить старые фотографии", oldImagesError.message);
    }

    const wasEditing = Boolean(editingNewsId);
    resetNewsForm();
    newsMessage.textContent = wasEditing ? "Изменения сохранены" : "Публикация добавлена";
    loadNewsButton.click();
  } catch (error) {
    if (uploadedPaths.length) {
      await supabaseClient.storage.from("news-images").remove(uploadedPaths);
    }
    newsMessage.textContent = "Ошибка: " + error.message;
  } finally {
    addNewsButton.disabled = false;
  }
});

/* Старый общий список people сохранён в базе для совместимости,
   но больше не используется в интерфейсе. */
if (false) {
loadPeopleButton.addEventListener(
  "click",
  async function () {
    peopleList.textContent = "Загрузка...";

    const { data: people, error } =
      await supabaseClient
        .from("people")
        .select(
          "id, full_name, birth_date, position"
        )
        .order("full_name");

    if (error) {
      peopleList.textContent =
        "Ошибка: " + error.message;
      return;
    }

    peopleList.innerHTML = "";

    if (people.length === 0) {
      peopleList.textContent =
        "В списке пока никого нет";
      return;
    }

    const sortedPeople = sortPeopleByUpcomingBirthday(people);
    sortedPeople.forEach(function (person) {
      const row = document.createElement("div");
      row.classList.add("person-row");

      const information =
        document.createElement("div");

      const name = document.createElement("strong");
      name.textContent = person.full_name;

      const details = document.createElement("span");
      details.textContent =
        person.birth_date +
        " · " +
        (person.position || "Без класса или должности");

      
information.append(name, details);

const deleteButton =
  document.createElement("button");

deleteButton.textContent = "Удалить";
deleteButton.classList.add("delete-button");

deleteButton.addEventListener(
  "click",
  async function () {
    const confirmed = confirm(
      "Удалить запись: " +
      person.full_name +
      "?"
    );

    if (!confirmed) {
      return;
    }

    const { error: deleteError } =
      await supabaseClient
        .from("people")
        .delete()
        .eq("id", person.id);

    if (deleteError) {
      alert(
        "Ошибка удаления: " +
        deleteError.message
      );
      return;
    }

    row.remove();
  }
);

row.append(information, deleteButton);
peopleList.append(row);

    });
  }
);

let deleteAllIsArmed = false;
let deleteAllTimer;

deleteAllButton.addEventListener(
  "click",
  async function () {
  if (!deleteAllIsArmed) {
  deleteAllIsArmed = true;

  deleteAllButton.textContent =
    "Нажмите ещё раз для подтверждения";

  clearTimeout(deleteAllTimer);

  deleteAllTimer = setTimeout(function () {
    deleteAllIsArmed = false;
    deleteAllButton.textContent = "Удалить всех";
  }, 5000);

  return;
}

deleteAllIsArmed = false;
clearTimeout(deleteAllTimer);
deleteAllButton.textContent = "Удаляем...";
deleteAllButton.disabled = true;

    const { data: sessionData } =
      await supabaseClient.auth.getSession();

    if (!sessionData.session) {
      alert("Сначала войдите в аккаунт");
      return;
    }

    const userId = sessionData.session.user.id;

    const { error: deleteError } =
      await supabaseClient
        .from("people")
        .delete()
        .eq("user_id", userId);

    if (deleteError) {
      alert(
        "Ошибка удаления: " +
        deleteError.message
      );
      return;
    }

    peopleList.textContent =
      "Список полностью удалён";

    deleteAllButton.textContent = "Удалить всех";
deleteAllButton.disabled = false;
  }
);
}

async function getCurrentUserId(messageElement) {
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) {
    messageElement.textContent = "Сначала войдите в аккаунт";
    return null;
  }
  return data.session.user.id;
}

function createSchoolPersonRow(person, detail, tableName, reload) {
  const row = document.createElement("div");
  row.className = "person-row";
  const information = document.createElement("div");
  const name = document.createElement("strong");
  name.textContent = person.last_name + " " + person.first_name;
  const description = document.createElement("span");
  description.textContent = detail;
  information.append(name, description);

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button compact-button";
  deleteButton.textContent = "Удалить";
  deleteButton.addEventListener("click", async function () {
    if (!confirm("Удалить запись: " + name.textContent + "?")) return;
    deleteButton.disabled = true;
    const { error } = await supabaseClient.from(tableName).delete().eq("id", person.id);
    if (error) {
      alert("Ошибка удаления: " + error.message);
      deleteButton.disabled = false;
      return;
    }
    reload();
  });

  row.append(information, deleteButton);
  return row;
}

async function loadStudents() {
  studentsList.textContent = "Загрузка...";
  const { data, error } = await supabaseClient
    .from("students")
    .select("id,last_name,first_name,class_name,birth_date");
  if (error) {
    studentsList.textContent = "Ошибка: " + error.message;
    return;
  }
  achievementStudents = data;
  updateAchievementStudentSuggestions();
  if (!data.length) {
    studentsList.textContent = "Ученики пока не добавлены";
    return;
  }
  studentsList.replaceChildren(...sortPeopleByUpcomingBirthday(data).map(function (student) {
    return createSchoolPersonRow(
      student,
      student.class_name + " · " + formatBirthdayDate(student.birth_date),
      "students",
      loadStudents
    );
  }));
}

function updateAchievementStudentSuggestions() {
  if (document.activeElement === achievementLastName) showLastNameSuggestions();
  if (document.activeElement === achievementFirstName) showFirstNameSuggestions();
}

function closeSuggestionMenu(input, menu) {
  menu.hidden = true;
  menu.replaceChildren();
  input.setAttribute("aria-expanded", "false");
}

function renderSuggestionMenu(input, menu, items, onSelect, onDelete = null) {
  menu.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("span");
    empty.className = "student-suggestion-empty";
    empty.textContent = "Совпадений не найдено";
    menu.append(empty);
  } else {
    items.slice(0, 7).forEach(function (item) {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "student-suggestion-option";
      option.setAttribute("role", "option");
      const primary = document.createElement("strong");
      primary.textContent = item.label;
      option.append(primary);
      if (item.detail) {
        const detail = document.createElement("span");
        detail.textContent = item.detail;
        option.append(detail);
      }
      option.addEventListener("mousedown", event => event.preventDefault());
      option.addEventListener("click", function () {
        onSelect(item);
        closeSuggestionMenu(input, menu);
      });
      if (onDelete && item.id) {
        const row = document.createElement("span");
        row.className = "student-suggestion-row";
        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "suggestion-delete-button";
        deleteButton.textContent = "×";
        deleteButton.title = "Удалить из справочника";
        deleteButton.setAttribute("aria-label", "Удалить «" + item.label + "» из справочника");
        deleteButton.addEventListener("mousedown", event => event.preventDefault());
        deleteButton.addEventListener("click", function () { onDelete(item, deleteButton); });
        row.append(option, deleteButton);
        menu.append(row);
      } else {
        menu.append(option);
      }
    });
  }
  menu.hidden = false;
  input.setAttribute("aria-expanded", "true");
}

async function deleteAchievementReferenceItem(tableName, item, button, options) {
  if (!confirm("Удалить «" + item.name + "» из справочника?")) return;
  button.disabled = true;
  const { error } = await supabaseClient.from(tableName).delete().eq("id", item.id);
  if (error) {
    achievementMessage.textContent = "Не удалось удалить значение: " + error.message;
    button.disabled = false;
    return;
  }
  if (options.selected()?.id === item.id) options.clear();
  await options.reload();
  options.reopen();
  achievementMessage.textContent = options.label + " удалено из справочника";
}

function showLastNameSuggestions() {
  const query = achievementLastName.value.trim().toLocaleLowerCase("ru");
  const chosenFirstName = achievementFirstName.value.trim().toLocaleLowerCase("ru");
  const matches = achievementStudents
    .filter(student => !chosenFirstName || student.first_name.toLocaleLowerCase("ru") === chosenFirstName)
    .filter(student => student.last_name.toLocaleLowerCase("ru").includes(query))
    .sort((a, b) => a.last_name.localeCompare(b.last_name, "ru"));
  const items = [];
  const usedNames = new Set();
  matches.forEach(function (student) {
    const key = student.last_name.toLocaleLowerCase("ru");
    if (usedNames.has(key)) return;
    usedNames.add(key);
    items.push({
      label: student.last_name,
      detail: chosenFirstName ? student.class_name : "",
      student: chosenFirstName ? student : null
    });
  });
  renderSuggestionMenu(
    achievementLastName,
    achievementLastNames,
    items,
    item => {
      achievementLastName.value = item.label;
      if (item.student) {
        selectAchievementStudent(item.student);
      } else {
        chooseAchievementStudent();
        achievementFirstName.focus();
        showFirstNameSuggestions();
      }
    }
  );
}

function showFirstNameSuggestions() {
  const chosenLastName = achievementLastName.value.trim().toLocaleLowerCase("ru");
  const query = achievementFirstName.value.trim().toLocaleLowerCase("ru");
  const matches = achievementStudents
    .filter(student => !chosenLastName || student.last_name.toLocaleLowerCase("ru") === chosenLastName)
    .filter(student => student.first_name.toLocaleLowerCase("ru").includes(query))
    .sort((a, b) => a.first_name.localeCompare(b.first_name, "ru"));
  const items = [];
  const usedNames = new Set();
  matches.forEach(function (student) {
    const key = student.first_name.toLocaleLowerCase("ru");
    if (usedNames.has(key)) return;
    usedNames.add(key);
    items.push({
      label: student.first_name,
      detail: chosenLastName ? student.class_name : "",
      student: chosenLastName ? student : null
    });
  });
  renderSuggestionMenu(
    achievementFirstName,
    achievementFirstNames,
    items,
    item => {
      achievementFirstName.value = item.label;
      if (item.student) {
        selectAchievementStudent(item.student);
      } else {
        chooseAchievementStudent();
        achievementLastName.focus();
        showLastNameSuggestions();
      }
    }
  );
}

function selectAchievementStudent(student) {
  selectedAchievementStudent = student;
  achievementLastName.value = student.last_name;
  achievementFirstName.value = student.first_name;
  achievementClass.value = student.class_name;
}

function chooseAchievementStudent() {
  const lastName = achievementLastName.value.trim().toLocaleLowerCase("ru");
  const firstName = achievementFirstName.value.trim().toLocaleLowerCase("ru");
  selectedAchievementStudent = achievementStudents.find(function (student) {
    return student.last_name.toLocaleLowerCase("ru") === lastName &&
      student.first_name.toLocaleLowerCase("ru") === firstName;
  }) || null;
  achievementClass.value = selectedAchievementStudent ? selectedAchievementStudent.class_name : "";
}

function resetAchievementStudentSelection() {
  selectedAchievementStudent = null;
  achievementLastName.value = "";
  achievementFirstName.value = "";
  achievementLastName.placeholder = "Начните вводить фамилию";
  achievementFirstName.placeholder = "Начните вводить имя";
  closeSuggestionMenu(achievementLastName, achievementLastNames);
  closeSuggestionMenu(achievementFirstName, achievementFirstNames);
  achievementClass.value = "";
}

function handleAchievementStudentInput(input, showSuggestions) {
  selectedAchievementStudent = null;
  achievementClass.value = "";
  chooseAchievementStudent();
  showSuggestions();
}

achievementLastName.addEventListener("input", () => handleAchievementStudentInput(achievementLastName, showLastNameSuggestions));
achievementLastName.addEventListener("focus", showLastNameSuggestions);
achievementFirstName.addEventListener("input", () => handleAchievementStudentInput(achievementFirstName, showFirstNameSuggestions));
achievementFirstName.addEventListener("focus", showFirstNameSuggestions);

[achievementLastName, achievementFirstName].forEach(function (input) {
  input.addEventListener("keydown", function (event) {
    const menu = input === achievementLastName ? achievementLastNames : achievementFirstNames;
    if (event.key === "Escape") closeSuggestionMenu(input, menu);
    if (event.key === "ArrowDown" && !menu.hidden) {
      const firstOption = menu.querySelector("button");
      if (firstOption) {
        event.preventDefault();
        firstOption.focus();
      }
    }
  });
  input.addEventListener("blur", function () {
    setTimeout(() => closeSuggestionMenu(
      input,
      input === achievementLastName ? achievementLastNames : achievementFirstNames
    ), 120);
  });
});

async function loadTeachers() {
  teachersList.textContent = "Загрузка...";
  const { data, error } = await supabaseClient
    .from("teachers")
    .select("id,last_name,first_name,position,birth_date");
  if (error) {
    teachersList.textContent = "Ошибка: " + error.message;
    return;
  }
  achievementTeachers = data;
  if (document.activeElement === achievementSupervisor) showSupervisorSuggestions();
  if (!data.length) {
    teachersList.textContent = "Учителя пока не добавлены";
    return;
  }
  teachersList.replaceChildren(...sortPeopleByUpcomingBirthday(data).map(function (teacher) {
    return createSchoolPersonRow(
      teacher,
      teacher.position + " · " + formatBirthdayDate(teacher.birth_date),
      "teachers",
      loadTeachers
    );
  }));
}

function chooseAchievementSupervisor() {
  const value = achievementSupervisor.value.trim().toLocaleLowerCase("ru");
  selectedAchievementSupervisor = achievementTeachers.find(function (teacher) {
    const fullName = teacher.last_name + " " + teacher.first_name;
    const reverseName = teacher.first_name + " " + teacher.last_name;
    return fullName.toLocaleLowerCase("ru") === value ||
      reverseName.toLocaleLowerCase("ru") === value;
  }) || null;
}

function showSupervisorSuggestions() {
  const query = achievementSupervisor.value.trim().toLocaleLowerCase("ru");
  const matches = achievementTeachers
    .filter(function (teacher) {
      const fullName = teacher.last_name + " " + teacher.first_name;
      const reverseName = teacher.first_name + " " + teacher.last_name;
      return fullName.toLocaleLowerCase("ru").includes(query) ||
        reverseName.toLocaleLowerCase("ru").includes(query);
    })
    .sort(function (a, b) {
      return (a.last_name + " " + a.first_name).localeCompare(
        b.last_name + " " + b.first_name,
        "ru"
      );
    });

  renderSuggestionMenu(
    achievementSupervisor,
    achievementSupervisors,
    matches.map(function (teacher) {
      return {
        label: teacher.last_name + " " + teacher.first_name,
        detail: teacher.position,
        teacher: teacher
      };
    }),
    function (item) {
      selectedAchievementSupervisor = item.teacher;
      achievementSupervisor.value = item.label;
    }
  );
}

achievementSupervisor.addEventListener("input", function () {
  selectedAchievementSupervisor = null;
  showSupervisorSuggestions();
});
achievementSupervisor.addEventListener("focus", showSupervisorSuggestions);
achievementSupervisor.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closeSuggestionMenu(achievementSupervisor, achievementSupervisors);
  if (event.key === "ArrowDown" && !achievementSupervisors.hidden) {
    const firstOption = achievementSupervisors.querySelector("button");
    if (firstOption) {
      event.preventDefault();
      firstOption.focus();
    }
  }
});
achievementSupervisor.addEventListener("blur", function () {
  setTimeout(() => closeSuggestionMenu(achievementSupervisor, achievementSupervisors), 120);
});

function formatBirthdayDate(value) {
  if (!value) return "дата рождения не указана";
  return new Date(value + "T00:00:00").toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}

loadStudentsButton.addEventListener("click", loadStudents);
loadTeachersButton.addEventListener("click", loadTeachers);

studentForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const userId = await getCurrentUserId(studentMessage);
  if (!userId) return;
  const row = {
    user_id: userId,
    last_name: document.querySelector("#student-last-name").value.trim(),
    first_name: document.querySelector("#student-first-name").value.trim(),
    class_name: document.querySelector("#student-class").value.trim(),
    birth_date: document.querySelector("#student-birth-date").value
  };
  const button = document.querySelector("#add-student-button");
  button.disabled = true;
  studentMessage.textContent = "Сохраняем...";
  const { error } = await supabaseClient
    .from("students")
    .upsert(row, { onConflict: "user_id,last_name,first_name,class_name" });
  button.disabled = false;
  if (error) {
    studentMessage.textContent = "Ошибка: " + error.message;
    return;
  }
  studentForm.reset();
  studentMessage.textContent = "Ученик добавлен";
  loadStudents();
});

teacherForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const userId = await getCurrentUserId(teacherMessage);
  if (!userId) return;
  const row = {
    user_id: userId,
    last_name: document.querySelector("#teacher-last-name").value.trim(),
    first_name: document.querySelector("#teacher-first-name").value.trim(),
    position: document.querySelector("#teacher-position").value.trim(),
    birth_date: document.querySelector("#teacher-birth-date").value
  };
  const button = document.querySelector("#add-teacher-button");
  button.disabled = true;
  teacherMessage.textContent = "Сохраняем...";
  const { error } = await supabaseClient
    .from("teachers")
    .upsert(row, { onConflict: "user_id,last_name,first_name,position" });
  button.disabled = false;
  if (error) {
    teacherMessage.textContent = "Ошибка: " + error.message;
    return;
  }
  teacherForm.reset();
  teacherMessage.textContent = "Учитель добавлен";
  loadTeachers();
});

async function readExcelRows(file) {
  const workbook = XLSX.read(await file.arrayBuffer(), { cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: "" });
}

function excelRawValue(row, heading) {
  const key = Object.keys(row).find(function (item) {
    return item.trim().toLocaleLowerCase("ru") === heading.toLocaleLowerCase("ru");
  });
  return key ? row[key] : "";
}

function excelText(row, heading) {
  return String(excelRawValue(row, heading) || "").trim();
}

function excelDate(row, heading) {
  const value = excelRawValue(row, heading);
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateForDatabase(value);
  }
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return [parsed.y, String(parsed.m).padStart(2, "0"), String(parsed.d).padStart(2, "0")].join("-");
    }
  }
  const text = String(value || "").trim();
  const match = /^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{4})$/.exec(text);
  if (match) return [match[3], match[2].padStart(2, "0"), match[1].padStart(2, "0")].join("-");
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  return "";
}

async function uploadSchoolPeople(options) {
  const file = options.fileInput.files[0];
  if (!file) {
    options.message.textContent = "Сначала выберите Excel-файл";
    return;
  }
  const userId = await getCurrentUserId(options.message);
  if (!userId) return;
  options.button.disabled = true;
  options.message.textContent = "Читаем файл...";
  try {
    const excelRows = await readExcelRows(file);
    const rows = excelRows.map(function (row) {
      return options.mapRow(row, userId);
    }).filter(options.isValid);
    if (!rows.length) {
      options.message.textContent = "Подходящие строки не найдены. Проверьте названия столбцов.";
      return;
    }
    options.message.textContent = "Сохраняем записи...";
    const { error } = await supabaseClient
      .from(options.tableName)
      .upsert(rows, { onConflict: options.onConflict });
    if (error) throw error;
    options.fileInput.value = "";
    options.message.textContent = "Загружено записей: " + rows.length;
    options.reload();
  } catch (error) {
    options.message.textContent = "Ошибка: " + error.message;
  } finally {
    options.button.disabled = false;
  }
}

uploadStudentsButton.addEventListener("click", function () {
  uploadSchoolPeople({
    fileInput: studentsExcelFile,
    button: uploadStudentsButton,
    message: studentsUploadMessage,
    tableName: "students",
    onConflict: "user_id,last_name,first_name,class_name",
    mapRow: function (row, userId) {
      return {
        user_id: userId,
        last_name: excelText(row, "Фамилия"),
        first_name: excelText(row, "Имя"),
        class_name: excelText(row, "Класс"),
        birth_date: excelDate(row, "Дата рождения")
      };
    },
    isValid: row => Boolean(row.last_name && row.first_name && row.class_name && row.birth_date),
    reload: loadStudents
  });
});

uploadTeachersButton.addEventListener("click", function () {
  uploadSchoolPeople({
    fileInput: teachersExcelFile,
    button: uploadTeachersButton,
    message: teachersUploadMessage,
    tableName: "teachers",
    onConflict: "user_id,last_name,first_name,position",
    mapRow: function (row, userId) {
      return {
        user_id: userId,
        last_name: excelText(row, "Фамилия"),
        first_name: excelText(row, "Имя"),
        position: excelText(row, "Должность"),
        birth_date: excelDate(row, "Дата рождения")
      };
    },
    isValid: row => Boolean(row.last_name && row.first_name && row.position && row.birth_date),
    reload: loadTeachers
  });
});

async function loadAchievementEvents() {
  const { data, error } = await supabaseClient
    .from("achievement_events")
    .select("id,name")
    .order("name");
  if (error) {
    eventManagerMessage.textContent = "Ошибка загрузки мероприятий: " + error.message;
    return;
  }
  achievementEvents = data || [];
  if (document.activeElement === achievementEventName) showEventSuggestions();
}

function showEventSuggestions() {
  const query = achievementEventName.value.trim().toLocaleLowerCase("ru");
  const matches = achievementEvents
    .filter(item => item.name.toLocaleLowerCase("ru").includes(query))
    .slice(0, 7);
  renderSuggestionMenu(
    achievementEventName,
    achievementEventNames,
    matches.map(item => ({ id: item.id, label: item.name, event: item })),
    item => {
      achievementEventName.value = item.event.name;
      selectedAchievementEvent = item.event;
    },
    function (item, button) {
      deleteAchievementReferenceItem("achievement_events", item.event, button, {
        selected: () => selectedAchievementEvent,
        clear: function () {
          selectedAchievementEvent = null;
          achievementEventName.value = "";
        },
        reload: loadAchievementEvents,
        reopen: showEventSuggestions,
        label: "Мероприятие"
      });
    }
  );

  const value = achievementEventName.value.trim();
  const exactMatch = achievementEvents.some(function (item) {
    return item.name.toLocaleLowerCase("ru") === query;
  });
  if (value && !exactMatch) {
    const addOption = document.createElement("button");
    addOption.type = "button";
    addOption.className = "student-suggestion-option suggestion-add-option";
    addOption.textContent = "+ Добавить «" + value + "» в список";
    addOption.addEventListener("mousedown", event => event.preventDefault());
    addOption.addEventListener("click", () => addAchievementEvent(value, addOption));
    achievementEventNames.append(addOption);
  }
}

function chooseAchievementEvent() {
  const value = achievementEventName.value.trim().toLocaleLowerCase("ru");
  selectedAchievementEvent = achievementEvents.find(function (item) {
    return item.name.toLocaleLowerCase("ru") === value;
  }) || null;
}

achievementEventName.addEventListener("input", function () {
  chooseAchievementEvent();
  showEventSuggestions();
});
achievementEventName.addEventListener("focus", showEventSuggestions);
achievementEventName.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closeSuggestionMenu(achievementEventName, achievementEventNames);
  if (event.key === "ArrowDown" && !achievementEventNames.hidden) {
    const firstOption = achievementEventNames.querySelector("button");
    if (firstOption) {
      event.preventDefault();
      firstOption.focus();
    }
  }
});
achievementEventName.addEventListener("blur", function () {
  setTimeout(() => closeSuggestionMenu(achievementEventName, achievementEventNames), 120);
});

async function addAchievementEvent(name, button) {
  const userId = await getCurrentUserId(achievementMessage);
  if (!userId) return;
  button.disabled = true;
  achievementMessage.textContent = "Добавляем новое мероприятие...";
  const { error } = await supabaseClient
    .from("achievement_events")
    .upsert({ user_id: userId, name: name }, { onConflict: "user_id,name" });
  if (error) {
    achievementMessage.textContent = "Ошибка: " + error.message;
    button.disabled = false;
    return;
  }
  await loadAchievementEvents();
  achievementEventName.value = name;
  chooseAchievementEvent();
  closeSuggestionMenu(achievementEventName, achievementEventNames);
  achievementMessage.textContent = "Новое мероприятие добавлено в список";
}

uploadEventsButton.addEventListener("click", async function () {
  const file = eventsExcelFile.files[0];
  if (!file) {
    eventManagerMessage.textContent = "Сначала выберите Excel-файл";
    return;
  }
  const userId = await getCurrentUserId(eventManagerMessage);
  if (!userId) return;
  uploadEventsButton.disabled = true;
  eventManagerMessage.textContent = "Читаем список мероприятий...";
  try {
    const names = [...new Set((await readExcelRows(file))
      .map(row => excelText(row, "Наименование мероприятия"))
      .filter(Boolean))];
    const rows = names.map(name => ({ user_id: userId, name: name }));
    if (!rows.length) {
      eventManagerMessage.textContent = "Не найден столбец «Наименование мероприятия» или он пустой";
      return;
    }
    const { error } = await supabaseClient
      .from("achievement_events")
      .upsert(rows, { onConflict: "user_id,name" });
    if (error) throw error;
    eventsExcelFile.value = "";
    eventManagerMessage.textContent = "Загружено мероприятий: " + rows.length;
    loadAchievementEvents();
  } catch (error) {
    eventManagerMessage.textContent = "Ошибка: " + error.message;
  } finally {
    uploadEventsButton.disabled = false;
  }
});

async function loadAchievementOrders(selectedName = "") {
  const { data, error } = await supabaseClient
    .from("achievement_orders")
    .select("id,name")
    .order("name");
  if (error) {
    achievementOrders = [];
    return;
  }
  achievementOrders = data || [];
  if (selectedName) {
    achievementOrder.value = selectedName;
    chooseAchievementOrder();
  }
  if (document.activeElement === achievementOrder) showAchievementOrderSuggestions();
}

function chooseAchievementOrder() {
  const value = achievementOrder.value.trim().toLocaleLowerCase("ru");
  selectedAchievementOrder = achievementOrders.find(function (item) {
    return item.name.toLocaleLowerCase("ru") === value;
  }) || null;
}

function showAchievementOrderSuggestions() {
  const query = achievementOrder.value.trim().toLocaleLowerCase("ru");
  const matches = achievementOrders
    .filter(item => item.name.toLocaleLowerCase("ru").includes(query))
    .slice(0, 7);
  renderSuggestionMenu(
    achievementOrder,
    achievementOrdersMenu,
    matches.map(item => ({ id: item.id, label: item.name, order: item })),
    item => {
      achievementOrder.value = item.order.name;
      selectedAchievementOrder = item.order;
    },
    function (item, button) {
      deleteAchievementReferenceItem("achievement_orders", item.order, button, {
        selected: () => selectedAchievementOrder,
        clear: function () {
          selectedAchievementOrder = null;
          achievementOrder.value = "";
        },
        reload: loadAchievementOrders,
        reopen: showAchievementOrderSuggestions,
        label: "Приказ"
      });
    }
  );

  const value = achievementOrder.value.trim();
  const exactMatch = achievementOrders.some(function (item) {
    return item.name.toLocaleLowerCase("ru") === query;
  });
  if (value && !exactMatch) {
    const addOption = document.createElement("button");
    addOption.type = "button";
    addOption.className = "student-suggestion-option suggestion-add-option";
    addOption.textContent = "+ Добавить «" + value + "» в список";
    addOption.addEventListener("mousedown", event => event.preventDefault());
    addOption.addEventListener("click", () => addAchievementOrder(value, addOption));
    achievementOrdersMenu.append(addOption);
  }
}

async function addAchievementOrder(name, button) {
  const userId = await getCurrentUserId(achievementMessage);
  if (!userId) return;
  button.disabled = true;
  achievementMessage.textContent = "Добавляем новый приказ...";
  const { error } = await supabaseClient
    .from("achievement_orders")
    .upsert({ user_id: userId, name: name }, { onConflict: "user_id,name" });
  if (error) {
    achievementMessage.textContent = "Не удалось сохранить приказ. Сначала обновите таблицы Supabase.";
    button.disabled = false;
    return;
  }
  await loadAchievementOrders(name);
  closeSuggestionMenu(achievementOrder, achievementOrdersMenu);
  achievementMessage.textContent = "Новый приказ добавлен в список";
}

achievementOrder.addEventListener("input", function () {
  chooseAchievementOrder();
  showAchievementOrderSuggestions();
});
achievementOrder.addEventListener("focus", showAchievementOrderSuggestions);
achievementOrder.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closeSuggestionMenu(achievementOrder, achievementOrdersMenu);
  if (event.key === "ArrowDown" && !achievementOrdersMenu.hidden) {
    const firstOption = achievementOrdersMenu.querySelector("button");
    if (firstOption) {
      event.preventDefault();
      firstOption.focus();
    }
  }
});
achievementOrder.addEventListener("blur", function () {
  setTimeout(() => closeSuggestionMenu(achievementOrder, achievementOrdersMenu), 120);
});

async function loadAchievementSubjects(selectedName = "") {
  const { data: loadedSubjects, error } = await supabaseClient
    .from("achievement_subjects")
    .select("id,name")
    .order("name");

  let storedSubjects = error ? [] : (loadedSubjects || []);
  if (!error && !storedSubjects.length) {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const userId = sessionData.session?.user?.id;
    if (userId) {
      const { data: addedSubjects, error: seedError } = await supabaseClient
        .from("achievement_subjects")
        .upsert(
          defaultAchievementSubjectNames.map(name => ({ user_id: userId, name: name })),
          { onConflict: "user_id,name" }
        )
        .select("id,name");
      if (!seedError && addedSubjects) storedSubjects = addedSubjects;
    }
  }

  if (error) {
    achievementSubjects = defaultAchievementSubjectNames.map(function (name) {
      return { id: null, name: name, builtIn: true };
    });
  } else {
    achievementSubjects = storedSubjects;
  }
  achievementSubjects.sort((a, b) => a.name.localeCompare(b.name, "ru"));

  if (selectedName) {
    achievementSubject.value = selectedName;
    chooseAchievementSubject();
  }
  if (document.activeElement === achievementSubject) showSubjectSuggestions();
}

function showSubjectSuggestions() {
  const query = achievementSubject.value.trim().toLocaleLowerCase("ru");
  const matches = achievementSubjects
    .filter(item => item.name.toLocaleLowerCase("ru").includes(query))
    .slice(0, 7);
  renderSuggestionMenu(
    achievementSubject,
    achievementSubjectNames,
    matches.map(item => ({ id: item.id, label: item.name, subject: item })),
    item => {
      achievementSubject.value = item.subject.name;
      selectedAchievementSubject = item.subject;
    },
    function (item, button) {
      deleteAchievementReferenceItem("achievement_subjects", item.subject, button, {
        selected: () => selectedAchievementSubject,
        clear: function () {
          selectedAchievementSubject = null;
          achievementSubject.value = "";
        },
        reload: loadAchievementSubjects,
        reopen: showSubjectSuggestions,
        label: "Предмет"
      });
    }
  );

  const value = achievementSubject.value.trim();
  const exactMatch = achievementSubjects.some(function (item) {
    return item.name.toLocaleLowerCase("ru") === query;
  });
  if (value && !exactMatch) {
    const addOption = document.createElement("button");
    addOption.type = "button";
    addOption.className = "student-suggestion-option suggestion-add-option";
    addOption.textContent = "+ Добавить «" + value + "» в список";
    addOption.addEventListener("mousedown", event => event.preventDefault());
    addOption.addEventListener("click", function () {
      addAchievementSubject(value, addOption);
    });
    achievementSubjectNames.append(addOption);
  }
}

function chooseAchievementSubject() {
  const value = achievementSubject.value.trim().toLocaleLowerCase("ru");
  selectedAchievementSubject = achievementSubjects.find(function (item) {
    return item.name.toLocaleLowerCase("ru") === value;
  }) || null;
}

achievementSubject.addEventListener("input", function () {
  chooseAchievementSubject();
  showSubjectSuggestions();
});
achievementSubject.addEventListener("focus", showSubjectSuggestions);
achievementSubject.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closeSuggestionMenu(achievementSubject, achievementSubjectNames);
  if (event.key === "ArrowDown" && !achievementSubjectNames.hidden) {
    const firstOption = achievementSubjectNames.querySelector("button");
    if (firstOption) {
      event.preventDefault();
      firstOption.focus();
    }
  }
});
achievementSubject.addEventListener("blur", function () {
  setTimeout(() => closeSuggestionMenu(achievementSubject, achievementSubjectNames), 120);
});

async function addAchievementSubject(name, button) {
  const userId = await getCurrentUserId(achievementMessage);
  if (!userId) return;
  button.disabled = true;
  achievementMessage.textContent = "Добавляем новый предмет...";
  const { error } = await supabaseClient
    .from("achievement_subjects")
    .upsert({ user_id: userId, name: name }, { onConflict: "user_id,name" });
  if (error) {
    achievementMessage.textContent = "Не удалось сохранить предмет: " + error.message;
    button.disabled = false;
    return;
  }
  await loadAchievementSubjects(name);
  closeSuggestionMenu(achievementSubject, achievementSubjectNames);
  achievementMessage.textContent = "Новый предмет добавлен в список";
}

async function loadAchievementTypes(selectedName = "") {
  const { data: loadedTypes, error } = await supabaseClient
    .from("achievement_types")
    .select("id,name")
    .order("name");

  let customTypes = error ? [] : (loadedTypes || []);
  if (!error) {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const userId = sessionData.session?.user?.id;
    const missingNames = customTypes.length ? [] : defaultAchievementTypeNames;
    if (userId && missingNames.length) {
      const { data: addedTypes, error: seedError } = await supabaseClient
        .from("achievement_types")
        .upsert(
          missingNames.map(name => ({ user_id: userId, name: name })),
          { onConflict: "user_id,name" }
        )
        .select("id,name");
      if (!seedError && addedTypes) customTypes = customTypes.concat(addedTypes);
    }
  }
  const byName = new Map();
  if (error) {
    defaultAchievementTypeNames.forEach(function (name) {
      byName.set(name.toLocaleLowerCase("ru"), { id: null, name: name, builtIn: true });
    });
  }
  customTypes.forEach(function (item) {
    byName.set(item.name.toLocaleLowerCase("ru"), item);
  });
  achievementTypes = Array.from(byName.values()).sort(function (a, b) {
    return a.name.localeCompare(b.name, "ru");
  });

  if (selectedName) {
    achievementType.value = selectedName;
    chooseAchievementType();
  }
  if (document.activeElement === achievementType) showAchievementTypeSuggestions();
}

function chooseAchievementType() {
  const value = achievementType.value.trim().toLocaleLowerCase("ru");
  selectedAchievementType = achievementTypes.find(function (item) {
    return item.name.toLocaleLowerCase("ru") === value;
  }) || null;
}

function showAchievementTypeSuggestions() {
  const value = achievementType.value.trim();
  const query = value.toLocaleLowerCase("ru");
  const matches = achievementTypes
    .filter(item => item.name.toLocaleLowerCase("ru").includes(query))
    .slice(0, 7);

  renderSuggestionMenu(
    achievementType,
    achievementTypesMenu,
    matches.map(item => ({ id: item.id, label: item.name, type: item })),
    function (item) {
      achievementType.value = item.type.name;
      selectedAchievementType = item.type;
    },
    function (item, button) {
      deleteAchievementType(item.type, button);
    }
  );

  const exactMatch = achievementTypes.some(function (item) {
    return item.name.toLocaleLowerCase("ru") === query;
  });
  if (value && !exactMatch) {
    const addOption = document.createElement("button");
    addOption.type = "button";
    addOption.className = "student-suggestion-option suggestion-add-option";
    addOption.textContent = "+ Добавить «" + value + "» в список";
    addOption.addEventListener("mousedown", event => event.preventDefault());
    addOption.addEventListener("click", function () {
      addAchievementType(value, addOption);
    });
    achievementTypesMenu.append(addOption);
  }
}

async function addAchievementType(name, button) {
  const userId = await getCurrentUserId(achievementMessage);
  if (!userId) return;
  button.disabled = true;
  achievementMessage.textContent = "Добавляем новый вид достижения...";
  const { error } = await supabaseClient
    .from("achievement_types")
    .upsert({ user_id: userId, name: name }, { onConflict: "user_id,name" });

  if (error) {
    achievementMessage.textContent = "Не удалось сохранить новый вид. Сначала обновите таблицы Supabase.";
    button.disabled = false;
    return;
  }

  await loadAchievementTypes(name);
  closeSuggestionMenu(achievementType, achievementTypesMenu);
  achievementMessage.textContent = "Новый вид достижения добавлен в список";
}

async function deleteAchievementType(item, button) {
  if (!confirm("Удалить вид достижения «" + item.name + "» из справочника?")) return;
  button.disabled = true;
  const { error } = await supabaseClient.from("achievement_types").delete().eq("id", item.id);
  if (error) {
    achievementMessage.textContent = "Не удалось удалить вид достижения: " + error.message;
    button.disabled = false;
    return;
  }
  if (selectedAchievementType?.id === item.id) {
    selectedAchievementType = null;
    achievementType.value = "";
  }
  await loadAchievementTypes();
  showAchievementTypeSuggestions();
  achievementMessage.textContent = "Вид достижения удалён из списка";
}

achievementType.addEventListener("input", function () {
  chooseAchievementType();
  showAchievementTypeSuggestions();
});
achievementType.addEventListener("focus", showAchievementTypeSuggestions);
achievementType.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closeSuggestionMenu(achievementType, achievementTypesMenu);
  if (event.key === "ArrowDown" && !achievementTypesMenu.hidden) {
    const firstOption = achievementTypesMenu.querySelector("button");
    if (firstOption) {
      event.preventDefault();
      firstOption.focus();
    }
  }
});
achievementType.addEventListener("blur", function () {
  setTimeout(() => closeSuggestionMenu(achievementType, achievementTypesMenu), 120);
});

async function loadAchievementResults(selectedName = "") {
  const { data: loadedResults, error } = await supabaseClient
    .from("achievement_results")
    .select("id,name")
    .order("name");

  let customResults = error ? [] : (loadedResults || []);
  if (!error) {
    const { data: sessionData } = await supabaseClient.auth.getSession();
    const userId = sessionData.session?.user?.id;
    const missingNames = customResults.length ? [] : defaultAchievementResultNames;
    if (userId && missingNames.length) {
      const { data: addedResults, error: seedError } = await supabaseClient
        .from("achievement_results")
        .upsert(
          missingNames.map(name => ({ user_id: userId, name: name })),
          { onConflict: "user_id,name" }
        )
        .select("id,name");
      if (!seedError && addedResults) customResults = customResults.concat(addedResults);
    }
  }

  const byName = new Map();
  if (error) {
    defaultAchievementResultNames.forEach(function (name) {
      byName.set(name.toLocaleLowerCase("ru"), { id: null, name: name, builtIn: true });
    });
  }
  customResults.forEach(function (item) {
    byName.set(item.name.toLocaleLowerCase("ru"), item);
  });
  achievementResults = Array.from(byName.values()).sort(function (a, b) {
    return a.name.localeCompare(b.name, "ru", { numeric: true });
  });

  if (selectedName) {
    achievementResult.value = selectedName;
    chooseAchievementResult();
  }
  if (document.activeElement === achievementResult) showAchievementResultSuggestions();
}

function chooseAchievementResult() {
  const value = achievementResult.value.trim().toLocaleLowerCase("ru");
  selectedAchievementResult = achievementResults.find(function (item) {
    return item.name.toLocaleLowerCase("ru") === value;
  }) || null;
}

function showAchievementResultSuggestions() {
  const value = achievementResult.value.trim();
  const query = value.toLocaleLowerCase("ru");
  const matches = achievementResults
    .filter(item => item.name.toLocaleLowerCase("ru").includes(query))
    .slice(0, 7);

  renderSuggestionMenu(
    achievementResult,
    achievementResultsMenu,
    matches.map(item => ({ id: item.id, label: item.name, result: item })),
    function (item) {
      achievementResult.value = item.result.name;
      selectedAchievementResult = item.result;
    },
    function (item, button) {
      deleteAchievementResult(item.result, button);
    }
  );

  const exactMatch = achievementResults.some(function (item) {
    return item.name.toLocaleLowerCase("ru") === query;
  });
  if (value && !exactMatch) {
    const addOption = document.createElement("button");
    addOption.type = "button";
    addOption.className = "student-suggestion-option suggestion-add-option";
    addOption.textContent = "+ Добавить «" + value + "» в список";
    addOption.addEventListener("mousedown", event => event.preventDefault());
    addOption.addEventListener("click", function () {
      addAchievementResult(value, addOption);
    });
    achievementResultsMenu.append(addOption);
  }
}

async function addAchievementResult(name, button) {
  const userId = await getCurrentUserId(achievementMessage);
  if (!userId) return;
  button.disabled = true;
  achievementMessage.textContent = "Добавляем новый результат...";
  const { error } = await supabaseClient
    .from("achievement_results")
    .upsert({ user_id: userId, name: name }, { onConflict: "user_id,name" });

  if (error) {
    achievementMessage.textContent = "Не удалось сохранить новый результат. Сначала обновите таблицы Supabase.";
    button.disabled = false;
    return;
  }

  await loadAchievementResults(name);
  closeSuggestionMenu(achievementResult, achievementResultsMenu);
  achievementMessage.textContent = "Новый результат добавлен в список";
}

async function deleteAchievementResult(item, button) {
  if (!confirm("Удалить результат «" + item.name + "» из справочника?")) return;
  button.disabled = true;
  const { error } = await supabaseClient.from("achievement_results").delete().eq("id", item.id);
  if (error) {
    achievementMessage.textContent = "Не удалось удалить результат: " + error.message;
    button.disabled = false;
    return;
  }
  if (selectedAchievementResult?.id === item.id) {
    selectedAchievementResult = null;
    achievementResult.value = "";
  }
  await loadAchievementResults();
  showAchievementResultSuggestions();
  achievementMessage.textContent = "Результат удалён из списка";
}

achievementResult.addEventListener("input", function () {
  chooseAchievementResult();
  showAchievementResultSuggestions();
});
achievementResult.addEventListener("focus", showAchievementResultSuggestions);
achievementResult.addEventListener("keydown", function (event) {
  if (event.key === "Escape") closeSuggestionMenu(achievementResult, achievementResultsMenu);
  if (event.key === "ArrowDown" && !achievementResultsMenu.hidden) {
    const firstOption = achievementResultsMenu.querySelector("button");
    if (firstOption) {
      event.preventDefault();
      firstOption.focus();
    }
  }
});
achievementResult.addEventListener("blur", function () {
  setTimeout(() => closeSuggestionMenu(achievementResult, achievementResultsMenu), 120);
});

async function loadLocationReference(reference, selectedName = "") {
  const { data, error } = await supabaseClient.from(reference.table).select("id,name").order("name");
  reference.items = error ? [] : (data || []);
  if (selectedName) {
    reference.input.value = selectedName;
    chooseLocationReference(reference);
  }
  if (document.activeElement === reference.input) showLocationSuggestions(reference);
}

function chooseLocationReference(reference) {
  const value = reference.input.value.trim().toLocaleLowerCase("ru");
  reference.selected = reference.items.find(item => item.name.toLocaleLowerCase("ru") === value) || null;
}

function showLocationSuggestions(reference) {
  const value = reference.input.value.trim();
  const query = value.toLocaleLowerCase("ru");
  const matches = reference.items.filter(item => item.name.toLocaleLowerCase("ru").includes(query)).slice(0, 7);
  renderSuggestionMenu(
    reference.input,
    reference.menu,
    matches.map(item => ({ id: item.id, label: item.name, referenceItem: item })),
    function (item) {
      reference.input.value = item.referenceItem.name;
      reference.selected = item.referenceItem;
    },
    function (item, button) {
      deleteAchievementReferenceItem(reference.table, item.referenceItem, button, {
        selected: () => reference.selected,
        clear: function () {
          reference.selected = null;
          reference.input.value = "";
        },
        reload: () => loadLocationReference(reference),
        reopen: () => showLocationSuggestions(reference),
        label: reference.label
      });
    }
  );
  const exactMatch = reference.items.some(item => item.name.toLocaleLowerCase("ru") === query);
  if (value && !exactMatch) {
    const addOption = document.createElement("button");
    addOption.type = "button";
    addOption.className = "student-suggestion-option suggestion-add-option";
    addOption.textContent = "+ Добавить «" + value + "» в список";
    addOption.addEventListener("mousedown", event => event.preventDefault());
    addOption.addEventListener("click", () => addLocationReference(reference, value, addOption));
    reference.menu.append(addOption);
  }
}

async function addLocationReference(reference, name, button) {
  const userId = await getCurrentUserId(achievementMessage);
  if (!userId) return;
  button.disabled = true;
  achievementMessage.textContent = "Добавляем значение в справочник...";
  const { error } = await supabaseClient
    .from(reference.table)
    .upsert({ user_id: userId, name: name }, { onConflict: "user_id,name" });
  if (error) {
    achievementMessage.textContent = "Не удалось сохранить значение. Сначала обновите таблицы Supabase.";
    button.disabled = false;
    return;
  }
  await loadLocationReference(reference, name);
  closeSuggestionMenu(reference.input, reference.menu);
  achievementMessage.textContent = reference === achievementOrganizerReference
    ? ""
    : reference.label + " добавлен(а) в список";
}

[achievementCountryReference, achievementCityReference, achievementOrganizerReference].forEach(function (reference) {
  reference.input.addEventListener("input", function () {
    chooseLocationReference(reference);
    showLocationSuggestions(reference);
  });
  reference.input.addEventListener("focus", () => showLocationSuggestions(reference));
  reference.input.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeSuggestionMenu(reference.input, reference.menu);
    if (event.key === "ArrowDown" && !reference.menu.hidden) {
      const firstOption = reference.menu.querySelector("button");
      if (firstOption) {
        event.preventDefault();
        firstOption.focus();
      }
    }
  });
  reference.input.addEventListener("blur", function () {
    setTimeout(() => closeSuggestionMenu(reference.input, reference.menu), 120);
  });
});

const achievementColumns = [
  ["last_name", "Ф"],
  ["first_name", "И"],
  ["class_name", "Класс"],
  ["event_name", "Наименование мероприятия"],
  ["order_reference", "Приказ"],
  ["cost", "Стоимость, ₸"],
  ["subject", "Предмет"],
  ["achievement_level", "Уровень"],
  ["event_stage", "Этап"],
  ["project_name", "Вид достижения"],
  ["academic_type", "Academic / Non Academic"],
  ["event_format", "Формат"],
  ["result", "Место / результат"],
  ["supervisor_name", "ФИО руководителя"],
  ["organizers", "Организаторы"],
  ["event_date", "Начало"],
  ["event_end_date", "Окончание"],
  ["link_url", "Ссылка"],
  ["country", "Страна"],
  ["city", "Город"]
];

const achievementExportDatabaseName = "ayna-achievement-export";
const achievementExportStoreName = "settings";
const achievementExportSessionInterval = 30 * 60 * 1000;
let achievementExportDirectory = null;
let achievementExportFileName = "";
let lastAchievementExportAt = 0;

function openAchievementExportDatabase() {
  return new Promise(function (resolve, reject) {
    const request = indexedDB.open(achievementExportDatabaseName, 1);
    request.onupgradeneeded = function () {
      if (!request.result.objectStoreNames.contains(achievementExportStoreName)) {
        request.result.createObjectStore(achievementExportStoreName);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadStoredAchievementDirectory() {
  const database = await openAchievementExportDatabase();
  return new Promise(function (resolve, reject) {
    const transaction = database.transaction(achievementExportStoreName, "readonly");
    const request = transaction.objectStore(achievementExportStoreName).get("directory");
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function storeAchievementDirectory(directory) {
  const database = await openAchievementExportDatabase();
  return new Promise(function (resolve, reject) {
    const transaction = database.transaction(achievementExportStoreName, "readwrite");
    transaction.objectStore(achievementExportStoreName).put(directory, "directory");
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

async function loadStoredAchievementExportSession() {
  const database = await openAchievementExportDatabase();
  return new Promise(function (resolve, reject) {
    const transaction = database.transaction(achievementExportStoreName, "readonly");
    const request = transaction.objectStore(achievementExportStoreName).get("export-session");
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

async function storeAchievementExportSession() {
  const database = await openAchievementExportDatabase();
  return new Promise(function (resolve, reject) {
    const transaction = database.transaction(achievementExportStoreName, "readwrite");
    transaction.objectStore(achievementExportStoreName).put({
      fileName: achievementExportFileName,
      lastExportAt: lastAchievementExportAt
    }, "export-session");
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
}

async function ensureAchievementExportDirectory() {
  if (!window.showDirectoryPicker) {
    throw new Error("Выбор папки поддерживается в Google Chrome или Microsoft Edge");
  }
  if (achievementExportDirectory) {
    const permission = await achievementExportDirectory.queryPermission({ mode: "readwrite" });
    if (permission === "granted") return achievementExportDirectory;
    if (await achievementExportDirectory.requestPermission({ mode: "readwrite" }) === "granted") {
      return achievementExportDirectory;
    }
  }
  achievementExportDirectory = await window.showDirectoryPicker({ mode: "readwrite" });
  achievementExportFileName = "";
  lastAchievementExportAt = 0;
  await storeAchievementDirectory(achievementExportDirectory);
  await storeAchievementExportSession();
  return achievementExportDirectory;
}

async function getAchievementExportRows() {
  const { data, error } = await supabaseClient
    .from("achievements")
    .select("*")
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

async function writeAchievementsExcel(directory) {
  const achievements = await getAchievementExportRows();
  const rows = achievements.map(function (achievement) {
    const row = {};
    achievementColumns.forEach(function ([key, label]) {
      row[label] = key === "cost" ? achievement[key] : formatAchievementCell(key, achievement[key]);
    });
    return row;
  });
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: achievementColumns.map(([, label]) => label)
  });
  worksheet["!cols"] = achievementColumns.map(function ([, label]) {
    const longest = Math.max(label.length, ...rows.map(row => String(row[label] ?? "").length));
    return { wch: Math.min(Math.max(longest + 2, 12), 42) };
  });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Достижения");
  const content = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const now = new Date();
  const twoDigits = value => String(value).padStart(2, "0");
  const nowTimestamp = now.getTime();
  let createdNewFile = false;
  if (
    !achievementExportFileName ||
    !lastAchievementExportAt ||
    nowTimestamp - lastAchievementExportAt > achievementExportSessionInterval
  ) {
    createdNewFile = true;
    achievementExportFileName = "База достижений " +
      twoDigits(now.getDate()) + "-" +
      twoDigits(now.getMonth() + 1) + "-" +
      now.getFullYear() + " " +
      twoDigits(now.getHours()) + "-" +
      twoDigits(now.getMinutes()) + "-" +
      twoDigits(now.getSeconds()) + ".xlsx";
  }
  const fileHandle = await directory.getFileHandle(achievementExportFileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
  lastAchievementExportAt = nowTimestamp;
  await storeAchievementExportSession();
  return {
    count: achievements.length,
    createdNewFile,
    fileName: achievementExportFileName
  };
}

async function syncAchievementExportIfReady() {
  if (!achievementExportDirectory) return { status: "folder-not-selected" };
  if (await achievementExportDirectory.queryPermission({ mode: "readwrite" }) !== "granted") {
    return { status: "permission-required" };
  }
  try {
    const result = await writeAchievementsExcel(achievementExportDirectory);
    return { status: "saved", ...result };
  } catch (error) {
    console.warn("Не удалось автоматически обновить Excel", error);
    return { status: "error", error };
  }
}

Promise.all([loadStoredAchievementDirectory(), loadStoredAchievementExportSession()])
  .then(function ([directory, session]) {
    achievementExportDirectory = directory;
    achievementExportFileName = session?.fileName || "";
    lastAchievementExportAt = Number(session?.lastExportAt) || 0;
    if (directory) {
      achievementExportMessage.textContent = "Выбрана папка: " + directory.name;
      achievementExportSummary.textContent = "Выбрана папка: " + directory.name;
      finishAchievementsButton.textContent = "Изменить папку";
    }
  })
  .catch(error => console.warn("Не удалось восстановить настройки экспорта", error));

finishAchievementsButton.addEventListener("click", async function () {
  finishAchievementsButton.disabled = true;
  achievementExportMessage.textContent = "Выберите папку для сохранения файлов...";
  try {
    if (!window.showDirectoryPicker) {
      throw new Error("Выбор папки поддерживается в Google Chrome или Microsoft Edge");
    }
    achievementExportDirectory = await window.showDirectoryPicker({ mode: "readwrite" });
    achievementExportFileName = "";
    lastAchievementExportAt = 0;
    await storeAchievementDirectory(achievementExportDirectory);
    await storeAchievementExportSession();
    achievementExportPanel.classList.remove("needs-attention");
    achievementExportMessage.textContent = "Выбрана папка: " + achievementExportDirectory.name;
    achievementExportSummary.textContent = "Выбрана папка: " + achievementExportDirectory.name;
    finishAchievementsButton.textContent = "Изменить папку";
  } catch (error) {
    if (error.name !== "AbortError") achievementExportMessage.textContent = "Ошибка выбора папки: " + error.message;
    else achievementExportMessage.textContent = "Выбор папки отменён";
  } finally {
    finishAchievementsButton.disabled = false;
  }
});

function achievementValue(id) {
  const value = document.querySelector(id).value.trim();
  return value || null;
}

function formatAchievementCell(key, value) {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "cost") {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "KZT",
      currencyDisplay: "narrowSymbol",
      maximumFractionDigits: 2
    }).format(value);
  }
  if (key === "event_date" || key === "event_end_date") {
    return new Date(value + "T00:00:00").toLocaleDateString("ru-RU");
  }
  return String(value);
}

function fillAchievementForm(achievement) {
  selectedAchievementStudent = achievementStudents.find(item => item.id === achievement.student_id) || {
    id: achievement.student_id,
    last_name: achievement.last_name,
    first_name: achievement.first_name,
    class_name: achievement.class_name
  };
  achievementLastName.value = achievement.last_name || "";
  achievementFirstName.value = achievement.first_name || "";
  achievementClass.value = achievement.class_name || "";
  selectedAchievementEvent = achievementEvents.find(item => item.id === achievement.event_id) || {
    id: achievement.event_id,
    name: achievement.event_name
  };
  achievementEventName.value = achievement.event_name || "";
  selectedAchievementSubject = achievement.subject
    ? achievementSubjects.find(item => item.id === achievement.subject_id || item.name === achievement.subject) || { id: achievement.subject_id, name: achievement.subject }
    : null;
  achievementSubject.value = achievement.subject || "";
  selectedAchievementOrder = achievement.order_reference
    ? achievementOrders.find(item => item.name === achievement.order_reference) || { name: achievement.order_reference }
    : null;
  achievementOrder.value = achievement.order_reference || "";
  document.querySelector("#achievement-cost").value = achievement.cost ?? "";
  achievementLevel.value = achievement.achievement_level || "";
  syncAchievementStageOptions();
  achievementStage.value = achievement.event_stage || "";
  selectedAchievementType = achievementTypes.find(item => item.name === achievement.project_name) || { name: achievement.project_name };
  achievementType.value = achievement.project_name || "";
  document.querySelector("#achievement-academic-type").value = achievement.academic_type || "";
  selectedAchievementResult = achievementResults.find(item => item.name === achievement.result) || { name: achievement.result };
  achievementResult.value = achievement.result || "";
  document.querySelector("#achievement-format").value = achievement.event_format || "";
  achievementSupervisor.value = achievement.supervisor_name || "";
  chooseAchievementSupervisor();
  achievementOrganizerReference.selected = achievement.organizers ? { name: achievement.organizers } : null;
  achievementOrganizers.value = achievement.organizers || "";
  achievementCountryReference.selected = achievement.country ? { name: achievement.country } : null;
  achievementCountry.value = achievement.country || "";
  achievementCityReference.selected = achievement.city ? { name: achievement.city } : null;
  achievementCity.value = achievement.city || "";
  achievementStartDate.value = achievement.event_date || "";
  achievementEndDate.value = achievement.event_end_date || achievement.event_date || "";
  document.querySelector("#achievement-link").value = achievement.link_url || "";
  syncAchievementDateRange();
  saveAchievementFormDraft();
}

function stopAchievementEditing() {
  editingAchievementId = null;
  saveAchievementButton.textContent = "Сохранить достижение";
  cancelAchievementEditButton.hidden = true;
}

async function loadAchievements() {
  achievementsList.textContent = "Загрузка...";

  const { data: achievements, error } = await supabaseClient
    .from("achievements")
    .select("*")
    .order("event_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (error) {
    achievementsList.textContent = "Ошибка: " + error.message;
    return;
  }

  if (!achievements.length) {
    achievementsList.textContent = "Достижений пока нет";
    return;
  }

  const table = document.createElement("table");
  table.className = "achievement-table";
  const head = document.createElement("thead");
  const headRow = document.createElement("tr");

  achievementColumns.forEach(function ([, label]) {
    const cell = document.createElement("th");
    cell.scope = "col";
    cell.textContent = label;
    headRow.append(cell);
  });
  const actionsHead = document.createElement("th");
  actionsHead.scope = "col";
  actionsHead.textContent = "Действия";
  headRow.append(actionsHead);
  head.append(headRow);

  const body = document.createElement("tbody");
  achievements.forEach(function (achievement) {
    const row = document.createElement("tr");
    achievementColumns.forEach(function ([key]) {
      const cell = document.createElement("td");
      if (key === "link_url" && achievement[key]) {
        const link = document.createElement("a");
        link.href = achievement[key];
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Открыть";
        cell.append(link);
      } else {
        cell.textContent = formatAchievementCell(key, achievement[key]);
      }
      row.append(cell);
    });

    const actionsCell = document.createElement("td");
    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "secondary-button compact-button";
    editButton.textContent = "Редактировать";
    editButton.addEventListener("click", function () {
      fillAchievementForm(achievement);
      editingAchievementId = achievement.id;
      saveAchievementButton.textContent = "Сохранить изменения";
      cancelAchievementEditButton.hidden = false;
      achievementMessage.textContent = "Измените нужные данные и нажмите «Сохранить изменения»";
      achievementForm.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "delete-button compact-button";
    deleteButton.textContent = "Удалить";
    deleteButton.addEventListener("click", async function () {
      if (!confirm("Удалить это достижение?")) return;
      deleteButton.disabled = true;
      const { error: deleteError } = await supabaseClient
        .from("achievements")
        .delete()
        .eq("id", achievement.id);
      if (deleteError) {
        alert("Ошибка удаления: " + deleteError.message);
        deleteButton.disabled = false;
        return;
      }
      row.remove();
      await syncAchievementExportIfReady();
    });
    actionsCell.append(editButton, deleteButton);
    row.append(actionsCell);
    body.append(row);
  });

  table.append(head, body);
  achievementsList.replaceChildren(table);
}

loadAchievementsButton.addEventListener("click", loadAchievements);

copyLastAchievementButton.addEventListener("click", async function () {
  copyLastAchievementButton.disabled = true;
  achievementMessage.textContent = "Загружаем последнюю запись...";

  const { data: rows, error } = await supabaseClient
    .from("achievements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  copyLastAchievementButton.disabled = false;
  if (error) {
    achievementMessage.textContent = "Ошибка: " + error.message;
    return;
  }
  if (!rows?.length) {
    achievementMessage.textContent = "В базе пока нет достижений";
    return;
  }

  const last = rows[0];
  stopAchievementEditing();
  fillAchievementForm(last);
  achievementMessage.textContent = "Данные последней записи перенесены. Измените нужные поля и сохраните новое достижение";
  achievementLastName.focus();
});

cancelAchievementEditButton.addEventListener("click", function () {
  achievementForm.reset();
  achievementFormDraft = null;
  syncAchievementStageOptions();
  syncAchievementDateRange();
  resetAchievementStudentSelection();
  stopAchievementEditing();
  achievementMessage.textContent = "Редактирование отменено";
});

achievementForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const { data: sessionData } = await supabaseClient.auth.getSession();
  if (!sessionData.session) {
    achievementMessage.textContent = "Сначала войдите в аккаунт";
    return;
  }

  chooseAchievementStudent();
  if (!selectedAchievementStudent) {
    achievementMessage.textContent = "Выберите существующего ученика из подсказок";
    (achievementLastName.value.trim() ? achievementFirstName : achievementLastName).focus();
    return;
  }
  chooseAchievementEvent();
  if (!selectedAchievementEvent) {
    achievementMessage.textContent = "Выберите мероприятие из справочника";
    achievementEventName.focus();
    showEventSuggestions();
    return;
  }
  chooseAchievementOrder();
  if (achievementOrder.value.trim() && !selectedAchievementOrder) {
    achievementMessage.textContent = "Выберите приказ из списка или добавьте новый";
    achievementOrder.focus();
    showAchievementOrderSuggestions();
    return;
  }
  chooseAchievementSubject();
  if (achievementSubject.value.trim() && !selectedAchievementSubject) {
    achievementMessage.textContent = "Выберите предмет из справочника или добавьте новый";
    achievementSubject.focus();
    showSubjectSuggestions();
    return;
  }
  const levelRank = achievementScopeOrder.indexOf(achievementLevel.value);
  const stageRank = achievementScopeOrder.indexOf(achievementStage.value);
  if (stageRank > levelRank) {
    achievementMessage.textContent = "Этап не может быть выше уровня мероприятия";
    achievementStage.focus();
    return;
  }
  chooseAchievementType();
  if (!selectedAchievementType) {
    achievementMessage.textContent = "Выберите вид достижения из списка или добавьте новый";
    achievementType.focus();
    showAchievementTypeSuggestions();
    return;
  }
  chooseAchievementResult();
  if (achievementResult.value.trim() && !selectedAchievementResult) {
    achievementMessage.textContent = "Выберите результат из списка или добавьте новый";
    achievementResult.focus();
    showAchievementResultSuggestions();
    return;
  }
  if (achievementSupervisor.value.trim() && !selectedAchievementSupervisor) {
    achievementMessage.textContent = "Выберите руководителя из списка учителей";
    achievementSupervisor.focus();
    showSupervisorSuggestions();
    return;
  }
  chooseLocationReference(achievementOrganizerReference);
  if (achievementOrganizers.value.trim() && !achievementOrganizerReference.selected) {
    achievementMessage.textContent = "Выберите организатора из списка или добавьте нового";
    achievementOrganizers.focus();
    showLocationSuggestions(achievementOrganizerReference);
    return;
  }
  chooseLocationReference(achievementCountryReference);
  if (achievementCountry.value.trim() && !achievementCountryReference.selected) {
    achievementMessage.textContent = "Выберите страну из списка или добавьте новую";
    achievementCountry.focus();
    showLocationSuggestions(achievementCountryReference);
    return;
  }
  chooseLocationReference(achievementCityReference);
  if (achievementCity.value.trim() && !achievementCityReference.selected) {
    achievementMessage.textContent = "Выберите город из списка или добавьте новый";
    achievementCity.focus();
    showLocationSuggestions(achievementCityReference);
    return;
  }
  if (
    achievementStartDate.value &&
    achievementEndDate.value &&
    achievementEndDate.value < achievementStartDate.value
  ) {
    achievementMessage.textContent = "Дата окончания не может быть раньше даты начала";
    achievementEndDate.focus();
    return;
  }

  if (!achievementExportDirectory) {
    achievementExportMessage.textContent = "Сначала выберите папку для сохранения Excel-файлов";
    achievementExportPanel.classList.add("needs-attention");
    achievementExportDetails.open = true;
    achievementExportPanel.scrollIntoView({ behavior: "smooth", block: "center" });
    finishAchievementsButton.focus();
    return;
  }

  const costValue = document.querySelector("#achievement-cost").value;
  const achievement = {
    user_id: sessionData.session.user.id,
    student_id: selectedAchievementStudent.id,
    event_id: selectedAchievementEvent.id,
    subject_id: selectedAchievementSubject ? selectedAchievementSubject.id : null,
    last_name: selectedAchievementStudent.last_name,
    first_name: selectedAchievementStudent.first_name,
    class_name: selectedAchievementStudent.class_name,
    event_name: selectedAchievementEvent.name,
    order_reference: selectedAchievementOrder ? selectedAchievementOrder.name : null,
    cost: costValue === "" ? null : Number(costValue),
    subject: selectedAchievementSubject ? selectedAchievementSubject.name : null,
    achievement_level: achievementValue("#achievement-level"),
    event_stage: achievementValue("#achievement-stage"),
    project_name: selectedAchievementType.name,
    academic_type: achievementValue("#achievement-academic-type"),
    event_format: achievementValue("#achievement-format"),
    result: selectedAchievementResult ? selectedAchievementResult.name : null,
    supervisor_name: selectedAchievementSupervisor
      ? selectedAchievementSupervisor.last_name + " " + selectedAchievementSupervisor.first_name
      : null,
    organizers: achievementOrganizerReference.selected ? achievementOrganizerReference.selected.name : null,
    event_date: achievementValue("#achievement-date"),
    event_end_date: achievementValue("#achievement-end-date"),
    link_url: achievementValue("#achievement-link"),
    country: achievementCountryReference.selected ? achievementCountryReference.selected.name : null,
    city: achievementCityReference.selected ? achievementCityReference.selected.name : null
  };

  const wasEditing = Boolean(editingAchievementId);
  saveAchievementButton.disabled = true;
  achievementMessage.textContent = wasEditing ? "Сохраняем изменения..." : "Сохраняем...";
  const saveRequest = wasEditing
    ? supabaseClient.from("achievements").update(achievement).eq("id", editingAchievementId)
    : supabaseClient.from("achievements").insert(achievement);
  const { error } = await saveRequest;
  saveAchievementButton.disabled = false;

  if (error) {
    achievementMessage.textContent = "Ошибка: " + error.message;
    return;
  }

  achievementForm.reset();
  achievementFormDraft = null;
  syncAchievementStageOptions();
  syncAchievementDateRange();
  resetAchievementStudentSelection();
  selectedAchievementEvent = null;
  closeSuggestionMenu(achievementEventName, achievementEventNames);
  selectedAchievementOrder = null;
  closeSuggestionMenu(achievementOrder, achievementOrdersMenu);
  selectedAchievementSubject = null;
  closeSuggestionMenu(achievementSubject, achievementSubjectNames);
  selectedAchievementType = null;
  closeSuggestionMenu(achievementType, achievementTypesMenu);
  selectedAchievementResult = null;
  closeSuggestionMenu(achievementResult, achievementResultsMenu);
  selectedAchievementSupervisor = null;
  closeSuggestionMenu(achievementSupervisor, achievementSupervisors);
  achievementOrganizerReference.selected = null;
  closeSuggestionMenu(achievementOrganizers, achievementOrganizersMenu);
  achievementCountryReference.selected = null;
  closeSuggestionMenu(achievementCountry, achievementCountriesMenu);
  achievementCityReference.selected = null;
  closeSuggestionMenu(achievementCity, achievementCitiesMenu);
  stopAchievementEditing();
  loadAchievements();
  const exportResult = await syncAchievementExportIfReady();
  const savedText = wasEditing ? "Изменения сохранены." : "Достижение сохранено.";
  if (exportResult.status === "saved") {
    achievementMessage.textContent = exportResult.createdNewFile
      ? savedText + " Создан новый Excel-файл: " + exportResult.fileName
      : savedText + " Excel-файл обновлён: " + exportResult.fileName;
  } else if (exportResult.status === "folder-not-selected" || exportResult.status === "permission-required") {
    achievementMessage.textContent = savedText + " Выберите папку для сохранения Excel-файлов";
  } else {
    achievementMessage.textContent = savedText + " Excel обновить не удалось";
  }
});

async function restoreSession() {
  const { data } =
    await supabaseClient.auth.getSession();

  updateAuthView(data.session);
}

restoreSession();

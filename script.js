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
  adminTabs.forEach(function (tab) {
    const selected = tab === selectedTab;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    document.getElementById(tab.getAttribute("aria-controls")).hidden = !selected;
  });
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
const achievementEventName = document.querySelector("#achievement-event-name");
const achievementEventNames = document.querySelector("#achievement-event-names");
const eventsExcelFile = document.querySelector("#events-excel-file");
const uploadEventsButton = document.querySelector("#upload-events-button");
const eventForm = document.querySelector("#event-form");
const newEventName = document.querySelector("#new-event-name");
const addEventButton = document.querySelector("#add-event-button");
const eventManagerMessage = document.querySelector("#event-manager-message");

let achievementStudents = [];
let selectedAchievementStudent = null;
let achievementEvents = [];
let selectedAchievementEvent = null;

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
  updateAchievementLastNameSuggestions();
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

function updateAchievementLastNameSuggestions() {
  if (document.activeElement === achievementLastName) showLastNameSuggestions();
}

function closeSuggestionMenu(input, menu) {
  menu.hidden = true;
  menu.replaceChildren();
  input.setAttribute("aria-expanded", "false");
}

function renderSuggestionMenu(input, menu, items, onSelect) {
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
      menu.append(option);
    });
  }
  menu.hidden = false;
  input.setAttribute("aria-expanded", "true");
}

function showLastNameSuggestions() {
  const query = achievementLastName.value.trim().toLocaleLowerCase("ru");
  const lastNames = [...new Set(achievementStudents.map(student => student.last_name))]
    .filter(Boolean)
    .filter(lastName => lastName.toLocaleLowerCase("ru").includes(query))
    .sort((a, b) => a.localeCompare(b, "ru"));
  renderSuggestionMenu(
    achievementLastName,
    achievementLastNames,
    lastNames.map(lastName => ({ label: lastName })),
    item => {
      achievementLastName.value = item.label;
      chooseAchievementLastName(false);
      achievementFirstName.focus();
      showFirstNameSuggestions();
    }
  );
}

function showFirstNameSuggestions() {
  const lastName = achievementLastName.value.trim().toLocaleLowerCase("ru");
  const query = achievementFirstName.value.trim().toLocaleLowerCase("ru");
  const matches = achievementStudents
    .filter(student => student.last_name.toLocaleLowerCase("ru") === lastName)
    .filter(student => student.first_name.toLocaleLowerCase("ru").includes(query))
    .sort((a, b) => a.first_name.localeCompare(b.first_name, "ru"));
  renderSuggestionMenu(
    achievementFirstName,
    achievementFirstNames,
    matches.map(student => ({
      label: student.first_name,
      detail: student.class_name,
      student: student
    })),
    item => {
      achievementFirstName.value = item.student.first_name;
      selectedAchievementStudent = item.student;
      achievementClass.value = item.student.class_name;
    }
  );
}

function resetAchievementStudentSelection(clearLastName = false) {
  selectedAchievementStudent = null;
  if (clearLastName) achievementLastName.value = "";
  achievementFirstName.value = "";
  achievementFirstName.disabled = true;
  achievementFirstName.placeholder = "Сначала выберите фамилию";
  closeSuggestionMenu(achievementLastName, achievementLastNames);
  closeSuggestionMenu(achievementFirstName, achievementFirstNames);
  achievementClass.value = "";
}

function chooseAchievementLastName(showSuggestions = true) {
  selectedAchievementStudent = null;
  achievementClass.value = "";
  achievementFirstName.value = "";
  const lastName = achievementLastName.value.trim().toLocaleLowerCase("ru");
  const matches = achievementStudents.filter(function (student) {
    return student.last_name.toLocaleLowerCase("ru") === lastName;
  });
  achievementFirstName.disabled = matches.length === 0;
  achievementFirstName.placeholder = matches.length ? "Выберите имя" : "Сначала выберите фамилию";
  closeSuggestionMenu(achievementFirstName, achievementFirstNames);
  if (showSuggestions) showLastNameSuggestions();
}

function chooseAchievementFirstName() {
  const lastName = achievementLastName.value.trim().toLocaleLowerCase("ru");
  const firstName = achievementFirstName.value.trim().toLocaleLowerCase("ru");
  selectedAchievementStudent = achievementStudents.find(function (student) {
    return student.last_name.toLocaleLowerCase("ru") === lastName &&
      student.first_name.toLocaleLowerCase("ru") === firstName;
  }) || null;
  achievementClass.value = selectedAchievementStudent
    ? selectedAchievementStudent.class_name
    : "";
}

achievementLastName.addEventListener("input", () => chooseAchievementLastName(true));
achievementLastName.addEventListener("focus", showLastNameSuggestions);
achievementFirstName.addEventListener("input", function () {
  chooseAchievementFirstName();
  showFirstNameSuggestions();
});
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
    matches.map(item => ({ label: item.name, event: item })),
    item => {
      achievementEventName.value = item.event.name;
      selectedAchievementEvent = item.event;
    }
  );
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

eventForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const userId = await getCurrentUserId(eventManagerMessage);
  if (!userId) return;
  const name = newEventName.value.trim();
  addEventButton.disabled = true;
  eventManagerMessage.textContent = "Сохраняем мероприятие...";
  const { error } = await supabaseClient
    .from("achievement_events")
    .upsert({ user_id: userId, name: name }, { onConflict: "user_id,name" });
  addEventButton.disabled = false;
  if (error) {
    eventManagerMessage.textContent = "Ошибка: " + error.message;
    return;
  }
  eventForm.reset();
  eventManagerMessage.textContent = "Мероприятие добавлено";
  loadAchievementEvents();
});

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

const achievementColumns = [
  ["last_name", "Ф"],
  ["first_name", "И"],
  ["class_name", "Класс"],
  ["event_name", "Наименование мероприятия"],
  ["order_reference", "Приказ"],
  ["cost", "Стоимость"],
  ["subject", "Предмет"],
  ["achievement_level", "Уровень"],
  ["event_stage", "Этап"],
  ["project_name", "Название проекта"],
  ["academic_type", "Academic / Non Academic"],
  ["event_format", "Формат"],
  ["result", "Место / результат"],
  ["supervisor_name", "ФИО руководителя"],
  ["organizers", "Организаторы"],
  ["event_date", "Дата проведения"],
  ["link_url", "Ссылка"],
  ["city", "Город"]
];

function achievementValue(id) {
  const value = document.querySelector(id).value.trim();
  return value || null;
}

function formatAchievementCell(key, value) {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "cost") {
    return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(value);
  }
  if (key === "event_date") {
    return new Date(value + "T00:00:00").toLocaleDateString("ru-RU");
  }
  return String(value);
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
    });
    actionsCell.append(deleteButton);
    row.append(actionsCell);
    body.append(row);
  });

  table.append(head, body);
  achievementsList.replaceChildren(table);
}

loadAchievementsButton.addEventListener("click", loadAchievements);

achievementForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const { data: sessionData } = await supabaseClient.auth.getSession();
  if (!sessionData.session) {
    achievementMessage.textContent = "Сначала войдите в аккаунт";
    return;
  }

  chooseAchievementFirstName();
  if (!selectedAchievementStudent) {
    achievementMessage.textContent = "Выберите существующего ученика из подсказок";
    achievementFirstName.focus();
    return;
  }
  chooseAchievementEvent();
  if (!selectedAchievementEvent) {
    achievementMessage.textContent = "Выберите мероприятие из справочника";
    achievementEventName.focus();
    showEventSuggestions();
    return;
  }

  const costValue = document.querySelector("#achievement-cost").value;
  const achievement = {
    user_id: sessionData.session.user.id,
    student_id: selectedAchievementStudent.id,
    event_id: selectedAchievementEvent.id,
    last_name: selectedAchievementStudent.last_name,
    first_name: selectedAchievementStudent.first_name,
    class_name: selectedAchievementStudent.class_name,
    event_name: selectedAchievementEvent.name,
    order_reference: achievementValue("#achievement-order"),
    cost: costValue === "" ? null : Number(costValue),
    subject: achievementValue("#achievement-subject"),
    achievement_level: achievementValue("#achievement-level"),
    event_stage: achievementValue("#achievement-stage"),
    project_name: achievementValue("#achievement-project-name"),
    academic_type: achievementValue("#achievement-academic-type"),
    event_format: achievementValue("#achievement-format"),
    result: achievementValue("#achievement-result"),
    supervisor_name: achievementValue("#achievement-supervisor"),
    organizers: achievementValue("#achievement-organizers"),
    event_date: achievementValue("#achievement-date"),
    link_url: achievementValue("#achievement-link"),
    city: achievementValue("#achievement-city")
  };

  saveAchievementButton.disabled = true;
  achievementMessage.textContent = "Сохраняем...";
  const { error } = await supabaseClient.from("achievements").insert(achievement);
  saveAchievementButton.disabled = false;

  if (error) {
    achievementMessage.textContent = "Ошибка: " + error.message;
    return;
  }

  achievementForm.reset();
  resetAchievementStudentSelection();
  selectedAchievementEvent = null;
  closeSuggestionMenu(achievementEventName, achievementEventNames);
  achievementMessage.textContent = "Достижение сохранено";
  loadAchievements();
});

async function restoreSession() {
  const { data } =
    await supabaseClient.auth.getSession();

  updateAuthView(data.session);
}

restoreSession();

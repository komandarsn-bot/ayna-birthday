const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
const uploadButton = document.querySelector("#upload-button");
const excelFile = document.querySelector("#excel-file");
const birthdayList = document.querySelector("#birthday-list");
const emailInput = document.querySelector("#email");
const passwordInput = document.querySelector("#password");
const signupButton = document.querySelector("#signup-button");
const loginButton = document.querySelector("#login-button");
const authMessage = document.querySelector("#auth-message");

const authSection =
  document.querySelector("#auth-section");

const appContent =
  document.querySelector("#app-content");

const currentUserEmail =
  document.querySelector("#current-user-email");

const logoutButton =
  document.querySelector("#logout-button");

const createScreenButton =
  document.querySelector("#create-screen-button");

const screenUrl =
  document.querySelector("#screen-url");

const loadPeopleButton =
  document.querySelector("#load-people-button");

const deleteAllButton =
  document.querySelector("#delete-all-button");

const peopleList =
  document.querySelector("#people-list");

const manualFullName =
  document.querySelector("#manual-full-name");

const manualBirthDate =
  document.querySelector("#manual-birth-date");

const manualPosition =
  document.querySelector("#manual-position");

const addPersonButton =
  document.querySelector("#add-person-button");

const manualPersonMessage =
  document.querySelector("#manual-person-message");

const newsTitle = document.querySelector("#news-title");
const newsBody = document.querySelector("#news-body");
const newsImage = document.querySelector("#news-image");
const newsLink = document.querySelector("#news-link");
const newsQrText = document.querySelector("#news-qr-text");
const addNewsButton = document.querySelector("#add-news-button");
const loadNewsButton = document.querySelector("#load-news-button");
const newsMessage = document.querySelector("#news-message");
const newsList = document.querySelector("#news-list");

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

function updateAuthView(session) {
  const isLoggedIn = Boolean(session);

  authSection.hidden = isLoggedIn;
  appContent.hidden = !isLoggedIn;

  if (isLoggedIn) {
    currentUserEmail.textContent =
      session.user.email;
    loadNewsButton.click();
  } else {
    currentUserEmail.textContent = "";
    screenUrl.hidden = true;
    screenUrl.textContent = "";
  }
}

signupButton.addEventListener("click", async function () {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (email === "" || password === "") {
    authMessage.textContent = "Введите почту и пароль";
    return;
  }

  authMessage.textContent = "Создаём аккаунт...";

  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password
  });

  if (error) {
    authMessage.textContent = "Ошибка: " + error.message;
    return;
  }

  if (data.session) {
    authMessage.textContent = "Регистрация выполнена. Вы вошли в аккаунт.";
    updateAuthView(data.session);
  } else {
    authMessage.textContent =
      "Регистрация выполнена. Проверьте письмо для подтверждения почты.";
  }
});


loginButton.addEventListener("click", async function () {
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (email === "" || password === "") {
    authMessage.textContent = "Введите почту и пароль";
    return;
  }

  authMessage.textContent = "Выполняется вход...";

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

  if (error) {
    authMessage.textContent = "Ошибка: " + error.message;
    return;
  }

  authMessage.textContent =
    "Вы вошли как " + data.user.email;
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
    (a.full_name || "").localeCompare(b.full_name || "", "ru")
  );
}

loadNewsButton.addEventListener("click", async function () {
  newsList.textContent = "Загрузка...";
  const { data: news, error } = await supabaseClient
    .from("news")
    .select("id, title, body, image_path, image_paths, link_url, qr_text, created_at")
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

    const image = document.createElement("img");
    const imagePaths = getNewsImagePaths(item);
    image.src = getNewsImageUrl(imagePaths[0]);
    image.alt = "";
    image.loading = "lazy";

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
      if (!newsList.children.length) newsList.textContent = "Публикаций пока нет";
    });

    row.append(image, content, deleteButton);
    newsList.append(row);
  });
});

addNewsButton.addEventListener("click", async function () {
  const title = newsTitle.value.trim();
  const body = newsBody.value.trim();
  const files = Array.from(newsImage.files);
  const linkUrl = newsLink.value.trim();
  const qrText = newsQrText.value.trim();

  if (!title || !body || !files.length) {
    newsMessage.textContent = "Заполните заголовок, текст и выберите фотографии";
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

    newsMessage.textContent = "Сохраняем публикацию...";
    const { error: insertError } = await supabaseClient.from("news").insert({
      user_id: userId,
      title: title,
      body: body,
      image_path: uploadedPaths[0],
      image_paths: uploadedPaths,
      link_url: linkUrl || null,
      qr_text: qrText || null
    });

    if (insertError) {
      await supabaseClient.storage.from("news-images").remove(uploadedPaths);
      throw insertError;
    }

    newsTitle.value = "";
    newsBody.value = "";
    newsImage.value = "";
    newsLink.value = "";
    newsQrText.value = "";
    newsMessage.textContent = "Публикация добавлена";
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

addPersonButton.addEventListener(
  "click",
  async function () {
    const fullName = manualFullName.value.trim();
    const birthDate = manualBirthDate.value;
    const position = manualPosition.value.trim();

    if (fullName === "" || birthDate === "") {
      manualPersonMessage.textContent =
        "Заполните имя и дату рождения";
      return;
    }

    const { data: sessionData } =
      await supabaseClient.auth.getSession();

    if (!sessionData.session) {
      manualPersonMessage.textContent =
        "Сначала войдите в аккаунт";
      return;
    }

    addPersonButton.disabled = true;
    manualPersonMessage.textContent = "Сохраняем...";

    try {
    const { error } = await supabaseClient
      .from("people")
      .upsert(
        {
          user_id: sessionData.session.user.id,
          full_name: fullName,
          birth_date: birthDate,
          position: position
        },
        {
          onConflict: "user_id,full_name,birth_date"
        }
      );

    addPersonButton.disabled = false;

    if (error) {
      manualPersonMessage.textContent =
        "Ошибка: " + error.message;
      return;
    }

    manualFullName.value = "";
    manualBirthDate.value = "";
    manualPosition.value = "";
    manualPersonMessage.textContent =
      "Человек успешно добавлен";

    loadPeopleButton.click();
    } catch (error) {
      manualPersonMessage.textContent =
        "Не удалось сохранить запись. Проверьте интернет и повторите попытку.";
    } finally {
      addPersonButton.disabled = false;
    }
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

    birthdayList.textContent =
      "Сегодня именинников нет";

    deleteAllButton.textContent = "Удалить всех";
deleteAllButton.disabled = false;
  }
);

uploadButton.addEventListener("click", async function () {
  if (excelFile.files.length === 0) {
    alert("Сначала выберите Excel-файл");
    return;
  }

  const selectedFile = excelFile.files[0];
  const fileData = await selectedFile.arrayBuffer();

  const workbook = XLSX.read(fileData, {
  cellDates: true
});
  const firstSheetName = workbook.SheetNames[0];
  const firstSheet = workbook.Sheets[firstSheetName];

  const people = XLSX.utils.sheet_to_json(firstSheet);

  const { data: sessionData } =
  await supabaseClient.auth.getSession();

if (!sessionData.session) {
  alert("Сначала войдите в аккаунт");
  return;
}

const validPeople = people.filter(function (person) {
  const hasName = Boolean(person["Имя"]);
  const hasDate = person["Дата рождения"] instanceof Date;

  return hasName && hasDate;
});

const databaseRows = validPeople.map(function (person) {
  return {
    user_id: sessionData.session.user.id,
    full_name: person["Имя"],
    birth_date: formatDateForDatabase(person["Дата рождения"]),
    position: person["Класс/должность"] || ""
  };
});

const { error: saveError } = await supabaseClient
  .from("people")
  .upsert(databaseRows, {
  onConflict: "user_id,full_name,birth_date"
});

if (saveError) {
  alert("Ошибка сохранения: " + saveError.message);
  return;
}

alert(`В базу сохранено записей: ${databaseRows.length}`);

const today = new Date();

const birthdaysToday = validPeople.filter(function (person) {
  const birthday = person["Дата рождения"];

  const sameDay = birthday.getDate() === today.getDate();
  const sameMonth = birthday.getMonth() === today.getMonth();

  return sameDay && sameMonth;
});

birthdayList.innerHTML = "";

if (birthdaysToday.length === 0) {
  birthdayList.textContent = "Сегодня именинников нет";
  return;
}

birthdaysToday.forEach(function (person) {
  const personCard = document.createElement("div");
  personCard.classList.add("birthday-person");

  const personName = document.createElement("h3");
  personName.textContent = person["Имя"];

  const personPosition = document.createElement("p");
  personPosition.textContent = person["Класс/должность"];

  personCard.append(personName, personPosition);
  birthdayList.append(personCard);
});
});

async function restoreSession() {
  const { data } =
    await supabaseClient.auth.getSession();

  updateAuthView(data.session);
}

restoreSession();

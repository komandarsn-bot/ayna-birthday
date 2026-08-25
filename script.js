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

const createScreenButton =
  document.querySelector("#create-screen-button");

const screenUrl =
  document.querySelector("#screen-url");

const loadPeopleButton =
  document.querySelector("#load-people-button");

const peopleList =
  document.querySelector("#people-list");

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
});

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

    people.forEach(function (person) {
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
      row.append(information);
      peopleList.append(row);
    });
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
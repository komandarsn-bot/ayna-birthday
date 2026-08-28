const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const tvBirthdayList =
  document.querySelector("#tv-birthday-list");
const slideCounter = document.querySelector("#slide-counter");
const screenDate = document.querySelector("#screen-date");
const screenTitle = document.querySelector("#screen-title");
const screenDescription = document.querySelector("#screen-description");

const urlParameters =
  new URLSearchParams(window.location.search);

const screenKey = urlParameters.get("key");

let currentBirthdays = [];
let currentIndex = 0;
let rotationTimer;
let isLoading = false;

function updateScreenDate() {
  const today = new Date();
  screenDate.textContent = today.toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric"
  });
  screenDate.dateTime = [today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")].join("-");
}

function showScreenState(title, description) {
  const card = document.createElement("article");
  card.classList.add("tv-person", "state-card");
  const label = document.createElement("p");
  label.classList.add("card-eyebrow");
  label.textContent = "ЭКРАН ПОЗДРАВЛЕНИЙ";
  const heading = document.createElement("h2");
  heading.textContent = title;
  const detail = document.createElement("p");
  detail.classList.add("state-description");
  detail.textContent = description;
  card.append(label, heading, detail);
  tvBirthdayList.replaceChildren(card);
  slideCounter.textContent = "AYNA · ХОРОШЕГО ДНЯ";
  screenTitle.textContent = "Каждый день — особенный";
  screenDescription.textContent = "Здесь живут тёплые слова и добрые пожелания.";
}

function showCurrentBirthday() {
  const person = currentBirthdays[currentIndex];
  const card = document.createElement("article");
  card.classList.add("tv-person");

  const label = document.createElement("p");
  label.classList.add("card-eyebrow");
  label.textContent = "СЕГОДНЯ ПОЗДРАВЛЯЕМ";

  const monogram = document.createElement("div");
  monogram.classList.add("person-monogram");
  monogram.setAttribute("aria-hidden", "true");
  monogram.textContent = (person.full_name || "").trim().split(/\s+/)
    .slice(0, 2).map(part => Array.from(part)[0] || "").join("").toUpperCase();

  const name = document.createElement("h2");
  name.textContent = person.full_name;
  if ((person.full_name || "").length > 28) name.classList.add("long-name");

  const position = document.createElement("p");
  position.classList.add("person-position");
  position.textContent = person.person_position || "";

  const greeting = document.createElement("p");
  greeting.classList.add("tv-greeting");
  greeting.textContent = "Счастья, вдохновения и прекрасных открытий!";

  card.append(label, monogram, name);
  if (person.person_position) card.append(position);
  card.append(greeting);

  if (currentBirthdays.length > 1) {
    const progress = document.createElement("div");
    progress.classList.add("card-progress");
    progress.setAttribute("aria-hidden", "true");
    progress.append(document.createElement("span"));
    card.append(progress);
  }

  slideCounter.textContent = "ПОЗДРАВЛЕНИЕ " +
    String(currentIndex + 1).padStart(2, "0") + " / " +
    String(currentBirthdays.length).padStart(2, "0");
  screenTitle.innerHTML = "С днём<br><em>рождения!</em>";
  screenDescription.innerHTML = "Сегодня — ваш день.<br>Пусть он станет началом прекрасного года.";
  tvBirthdayList.replaceChildren(card);
}

function updateBirthdayCards(birthdays) {
  // Обновление данных раз в минуту не прерывает текущий показ.
  if (JSON.stringify(birthdays) === JSON.stringify(currentBirthdays) &&
      birthdays.length > 0) {
    return;
  }

  clearInterval(rotationTimer);
  currentBirthdays = birthdays;
  currentIndex = 0;

  if (birthdays.length === 0) {
    showScreenState("Сегодня именинников нет", "Новые поздравления появятся здесь в нужный день.");
    return;
  }

  showCurrentBirthday();

  if (birthdays.length > 1) {
    rotationTimer = setInterval(function () {
      currentIndex = (currentIndex + 1) % currentBirthdays.length;
      showCurrentBirthday();
    }, 5000);
  }
}

async function loadBirthdays() {
  updateScreenDate();
  if (!screenKey) {
    showScreenState("Откройте ссылку для телевизора", "Получите её в личном кабинете Ayna: в этой ссылке отсутствует код экрана.");
    return;
  }

  if (isLoading) return;
  isLoading = true;

  try {
  const { data: birthdays, error } =
    await supabaseClient.rpc(
      "get_screen_birthdays",
      {
        p_access_token: screenKey
      }
    );

  if (error) {
    throw error;
  }

  updateBirthdayCards(birthdays || []);
  } catch (error) {
    // При временном сбое продолжаем показывать загруженные карточки.
    if (currentBirthdays.length === 0) {
      showScreenState("Восстанавливаем связь", "Не удалось загрузить данные. Повторим попытку через минуту.");
    }
  } finally {
    isLoading = false;
  }
}

loadBirthdays();

setInterval(loadBirthdays, 60000);

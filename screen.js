const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const tvBirthdayList = document.querySelector("#tv-birthday-list");
const screenDate = document.querySelector("#screen-date");
const screenClock = document.querySelector("#screen-clock");
const birthdayTitle = document.querySelector("#birthday-title");
const screenKey = new URLSearchParams(window.location.search).get("key");

let currentBirthdays = [];
let currentIndex = 0;
let rotationTimer;
let transitionTimer;
let isLoading = false;
let hasLoadedData = false;

function updateScreenDate() {
  const today = new Date();
  screenDate.textContent = today.toLocaleDateString("ru-RU", {
    day: "numeric", month: "long"
  });
  screenDate.dateTime = [today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")].join("-");
  // Берём реальное время устройства: задержки таймера не накапливаются.
  const time = [today.getHours(), today.getMinutes(), today.getSeconds()]
    .map(value => String(value).padStart(2, "0")).join(":");
  screenClock.textContent = time;
  screenClock.dateTime = time;
}

function showScreenState(title, description) {
  clearTimeout(transitionTimer);
  birthdayTitle.hidden = true;
  const card = document.createElement("article");
  card.classList.add("tv-person", "state-card");
  const heading = document.createElement("h1");
  heading.textContent = title;
  card.append(heading);
  if (description) {
    const detail = document.createElement("p");
    detail.classList.add("state-description");
    detail.textContent = description;
    card.append(detail);
  }
  tvBirthdayList.replaceChildren(card);
}

function showCurrentBirthday() {
  const person = currentBirthdays[currentIndex];
  const card = document.createElement("article");
  card.classList.add("tv-person");

  const name = document.createElement("h2");
  name.textContent = person.full_name;
  if ((person.full_name || "").length > 28) name.classList.add("long-name");
  card.append(name);

  if (person.person_position) {
    const position = document.createElement("p");
    position.classList.add("person-position");
    position.textContent = person.person_position;
    card.append(position);
  }
  tvBirthdayList.replaceChildren(card);
}

function showNextBirthday() {
  clearTimeout(transitionTimer);
  const currentCard = tvBirthdayList.firstElementChild;
  const reduceMotion = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function finishTransition() {
    currentIndex = (currentIndex + 1) % currentBirthdays.length;
    showCurrentBirthday();
  }

  if (!currentCard || reduceMotion) {
    finishTransition();
    return;
  }

  // Сначала полностью скрываем старое имя, затем показываем новое.
  currentCard.classList.add("is-leaving");
  transitionTimer = setTimeout(finishTransition, 650);
}

function updateBirthdayCards(birthdays) {
  // Одинаковый порядок ответа не зависит от порядка строк в базе.
  birthdays = birthdays.map(person => ({
    full_name: person.full_name,
    person_position: person.person_position || ""
  })).sort((a, b) => {
    const first = a.full_name + "\u0000" + a.person_position;
    const second = b.full_name + "\u0000" + b.person_position;
    return first < second ? -1 : first > second ? 1 : 0;
  });
  // Не перерисовываем карточки, если в базе ничего не изменилось.
  if (JSON.stringify(birthdays) === JSON.stringify(currentBirthdays) &&
      hasLoadedData) return;

  const previousPerson = currentBirthdays[currentIndex];
  clearInterval(rotationTimer);
  clearTimeout(transitionTimer);
  currentBirthdays = birthdays;
  hasLoadedData = true;
  currentIndex = Math.max(0, birthdays.findIndex(person =>
    previousPerson && person.full_name === previousPerson.full_name &&
    person.person_position === previousPerson.person_position
  ));

  if (birthdays.length === 0) {
    showScreenState("Сегодня именинников нет");
    return;
  }

  birthdayTitle.hidden = false;
  showCurrentBirthday();
  if (birthdays.length > 1) {
    rotationTimer = setInterval(showNextBirthday, 5000);
  }
}

async function loadBirthdays() {
  updateScreenDate();
  if (!screenKey) {
    showScreenState("Откройте ссылку для телевизора", "Получите её в личном кабинете: в этой ссылке отсутствует код экрана.");
    return;
  }

  if (isLoading) return;
  isLoading = true;
  try {
    const { data: birthdays, error } = await supabaseClient.rpc(
      "get_screen_birthdays", { p_access_token: screenKey }
    );
    if (error) throw error;
    updateBirthdayCards(birthdays || []);
  } catch (error) {
    // При временном сбое продолжаем показывать загруженные карточки.
    if (currentBirthdays.length === 0) {
      hasLoadedData = false;
      showScreenState("Восстанавливаем связь", "Повторим попытку через несколько секунд.");
    }
  } finally {
    isLoading = false;
  }
}

loadBirthdays();
setInterval(updateScreenDate, 1000);
setInterval(loadBirthdays, 5000);

window.addEventListener("online", loadBirthdays);
window.addEventListener("focus", loadBirthdays);
document.addEventListener("visibilitychange", function () {
  if (!document.hidden) loadBirthdays();
});

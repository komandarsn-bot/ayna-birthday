const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const tvBirthdayList = document.querySelector("#tv-birthday-list");
const screenDate = document.querySelector("#screen-date");
const screenKey = new URLSearchParams(window.location.search).get("key");

let currentBirthdays = [];
let currentIndex = 0;
let rotationTimer;
let transitionTimer;
let isLoading = false;

function updateScreenDate() {
  const today = new Date();
  screenDate.textContent = today.toLocaleDateString("ru-RU", {
    day: "numeric", month: "long"
  });
  screenDate.dateTime = [today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")].join("-");
}

function showScreenState(title, description) {
  clearTimeout(transitionTimer);
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

  const title = document.createElement("h1");
  title.classList.add("birthday-title");
  title.textContent = "С днём рождения!";

  const name = document.createElement("h2");
  name.textContent = person.full_name;
  if ((person.full_name || "").length > 28) name.classList.add("long-name");
  card.append(title, name);

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
  // Обновление данных раз в минуту не прерывает текущий показ.
  if (JSON.stringify(birthdays) === JSON.stringify(currentBirthdays) &&
      birthdays.length > 0) return;

  clearInterval(rotationTimer);
  clearTimeout(transitionTimer);
  currentBirthdays = birthdays;
  currentIndex = 0;

  if (birthdays.length === 0) {
    showScreenState("Сегодня именинников нет");
    return;
  }

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
      showScreenState("Восстанавливаем связь", "Повторим попытку через минуту.");
    }
  } finally {
    isLoading = false;
  }
}

loadBirthdays();
setInterval(loadBirthdays, 60000);

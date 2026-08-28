const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const tvBirthdayList =
  document.querySelector("#tv-birthday-list");

const urlParameters =
  new URLSearchParams(window.location.search);

const screenKey = urlParameters.get("key");

let currentBirthdays = [];
let currentIndex = 0;
let rotationTimer;
let isLoading = false;

function showCurrentBirthday() {
  const person = currentBirthdays[currentIndex];
  const card = document.createElement("article");
  card.classList.add("tv-person");

  const name = document.createElement("h2");
  name.textContent = person.full_name;

  const position = document.createElement("p");
  position.textContent = person.person_position || "";

  const greeting = document.createElement("p");
  greeting.classList.add("tv-greeting");
  greeting.textContent = "Сегодня день рождения! Поздравляем!";

  card.append(name, position, greeting);
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
    tvBirthdayList.textContent = "Сегодня именинников нет";
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
  if (!screenKey) {
    tvBirthdayList.textContent =
      "У ссылки отсутствует код экрана";
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
      tvBirthdayList.textContent = "Не удалось загрузить данные. Повторяем через минуту.";
    }
  } finally {
    isLoading = false;
  }
}

loadBirthdays();

setInterval(loadBirthdays, 60000);

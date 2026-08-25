const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const tvBirthdayList =
  document.querySelector("#tv-birthday-list");

const urlParameters =
  new URLSearchParams(window.location.search);

const screenKey = urlParameters.get("key");

async function loadBirthdays() {
  if (!screenKey) {
    tvBirthdayList.textContent =
      "У ссылки отсутствует код экрана";
    return;
  }

  const { data: birthdays, error } =
    await supabaseClient.rpc(
      "get_screen_birthdays",
      {
        p_access_token: screenKey
      }
    );

  if (error) {
    tvBirthdayList.textContent =
      "Не удалось загрузить данные: " +
      error.message;
    return;
  }

  tvBirthdayList.innerHTML = "";

  if (birthdays.length === 0) {
    tvBirthdayList.textContent =
      "Сегодня именинников нет";
    return;
  }

  birthdays.forEach(function (person) {
    const card = document.createElement("article");
    card.classList.add("tv-person");

    const name = document.createElement("h2");
    name.textContent = person.full_name;

    const position = document.createElement("p");
    position.textContent = person.person_position;

    card.append(name, position);
    tvBirthdayList.append(card);
  });
}

loadBirthdays();

setInterval(loadBirthdays, 60000);
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const tvBirthdayList = document.querySelector("#tv-birthday-list");
const screenDate = document.querySelector("#screen-date");
const screenClock = document.querySelector("#screen-clock");
const birthdayTitle = document.querySelector("#birthday-title");
const screenKey = new URLSearchParams(window.location.search).get("key");

let birthdays = [], newsItems = [];
let activeKind = null, activeIndex = 0;
let slideTimer, transitionTimer, isLoading = false;

function updateScreenDate() {
  const now = new Date();
  screenDate.textContent = now.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
  screenDate.dateTime = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()].map(value => String(value).padStart(2, "0")).join(":");
  screenClock.textContent = time;
  screenClock.dateTime = time;
}

function imageUrl(path) {
  return supabaseClient.storage.from("news-images").getPublicUrl(path).data.publicUrl;
}

function showScreenState(title, description) {
  clearTimeout(slideTimer);
  clearTimeout(transitionTimer);
  activeKind = null;
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

function renderBirthday(person) {
  birthdayTitle.hidden = false;
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

function renderNews(item) {
  birthdayTitle.hidden = true;
  const card = document.createElement("article");
  card.classList.add("news-card");
  const image = document.createElement("img");
  image.src = imageUrl(item.image_path);
  image.alt = item.title;
  const content = document.createElement("div");
  content.classList.add("news-card-content");
  const label = document.createElement("p");
  label.classList.add("news-label");
  label.textContent = "Новости школы";
  const title = document.createElement("h2");
  title.textContent = item.title;
  const body = document.createElement("p");
  body.classList.add("news-body");
  body.textContent = item.body;
  content.append(label, title, body);
  card.append(image, content);
  tvBirthdayList.replaceChildren(card);
}

function renderCurrentSlide() {
  if (activeKind === "birthday") renderBirthday(birthdays[activeIndex]);
  if (activeKind === "news") renderNews(newsItems[activeIndex]);
}

function scheduleNextSlide() {
  clearTimeout(slideTimer);
  slideTimer = setTimeout(transitionToNextSlide, activeKind === "news" ? 10000 : 5000);
}

function chooseNextSlide() {
  if (activeKind === "birthday") {
    if (activeIndex + 1 < birthdays.length) activeIndex += 1;
    else if (newsItems.length) { activeKind = "news"; activeIndex = 0; }
    else activeIndex = 0;
  } else if (activeKind === "news") {
    if (activeIndex + 1 < newsItems.length) activeIndex += 1;
    else if (birthdays.length) { activeKind = "birthday"; activeIndex = 0; }
    else activeIndex = 0;
  }
}

function transitionToNextSlide() {
  clearTimeout(transitionTimer);
  const currentCard = tvBirthdayList.firstElementChild;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function finish() {
    chooseNextSlide();
    renderCurrentSlide();
    scheduleNextSlide();
  }
  if (!currentCard || reduceMotion) { finish(); return; }
  currentCard.classList.add("is-leaving");
  transitionTimer = setTimeout(finish, 650);
}

function startSequence() {
  clearTimeout(slideTimer);
  clearTimeout(transitionTimer);
  if (birthdays.length) activeKind = "birthday";
  else if (newsItems.length) activeKind = "news";
  else { showScreenState("Сегодня пока нет новых публикаций"); return; }
  activeIndex = 0;
  renderCurrentSlide();
  scheduleNextSlide();
}

function updateBirthdays(data) {
  const normalized = data.map(person => ({
    full_name: person.full_name,
    person_position: person.person_position || ""
  })).sort((a, b) => (a.full_name + a.person_position).localeCompare(b.full_name + b.person_position, "ru"));
  const changed = JSON.stringify(normalized) !== JSON.stringify(birthdays);
  const oldPerson = activeKind === "birthday" ? birthdays[activeIndex] : null;
  birthdays = normalized;
  if (!activeKind || (activeKind === "birthday" && !birthdays.length)) startSequence();
  else if (changed && activeKind === "birthday") {
    activeIndex = Math.max(0, birthdays.findIndex(person => oldPerson && person.full_name === oldPerson.full_name && person.person_position === oldPerson.person_position));
    renderCurrentSlide();
    scheduleNextSlide();
  }
}

function updateNews(data) {
  const normalized = data.map(item => ({
    id: item.news_id,
    title: item.news_title,
    body: item.news_body,
    image_path: item.news_image_path,
    created_at: item.news_created_at
  }));
  const changed = JSON.stringify(normalized) !== JSON.stringify(newsItems);
  const currentId = activeKind === "news" && newsItems[activeIndex] ? newsItems[activeIndex].id : null;
  newsItems = normalized;
  if (!activeKind || (activeKind === "news" && !newsItems.length)) startSequence();
  else if (changed && activeKind === "news") {
    activeIndex = Math.max(0, newsItems.findIndex(item => item.id === currentId));
    renderCurrentSlide();
    scheduleNextSlide();
  }
}

async function loadContent() {
  updateScreenDate();
  if (!screenKey) { showScreenState("Откройте ссылку для телевизора", "В этой ссылке отсутствует код экрана."); return; }
  if (isLoading) return;
  isLoading = true;
  try {
    const [birthdayResult, newsResult] = await Promise.all([
      supabaseClient.rpc("get_screen_birthdays", { p_access_token: screenKey }),
      supabaseClient.rpc("get_screen_news", { p_access_token: screenKey })
    ]);
    if (!birthdayResult.error) updateBirthdays(birthdayResult.data || []);
    if (!newsResult.error) updateNews(newsResult.data || []);
    if (birthdayResult.error && newsResult.error && !activeKind) showScreenState("Восстанавливаем связь", "Повторим попытку через несколько секунд.");
  } finally {
    isLoading = false;
  }
}

loadContent();
setInterval(updateScreenDate, 1000);
setInterval(loadContent, 5000);
window.addEventListener("online", loadContent);
window.addEventListener("focus", loadContent);
document.addEventListener("visibilitychange", function () { if (!document.hidden) loadContent(); });

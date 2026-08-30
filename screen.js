const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const tvBirthdayList = document.querySelector("#tv-birthday-list");
const screenDate = document.querySelector("#screen-date");
const screenClock = document.querySelector("#screen-clock");
const birthdayTitle = document.querySelector("#birthday-title");
const screenKey = new URLSearchParams(window.location.search).get("key");

let birthdays = [], newsItems = [];
let activeKind = null, activeIndex = 0;
let activeNewsSlide = 0;
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

function splitTextIntoSlides(text, maximumLength = 360) {
  const normalized = String(text || "").trim().replace(/\s+/g, " ");
  if (!normalized) return [""];
  const parts = [];
  let currentPart = "";
  normalized.split(" ").forEach(function (word) {
    const candidate = currentPart ? currentPart + " " + word : word;
    if (currentPart && candidate.length > maximumLength) {
      parts.push(currentPart);
      currentPart = word;
    } else {
      currentPart = candidate;
    }
  });
  if (currentPart) parts.push(currentPart);
  return parts;
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

  const imagePath = item.image_paths.length
    ? item.image_paths[activeNewsSlide % item.image_paths.length]
    : "";
  const image = document.createElement("img");
  if (imagePath) image.src = imageUrl(imagePath);
  image.alt = item.title;
  const content = document.createElement("div");
  content.classList.add("news-card-content");
  const label = document.createElement("p");
  label.classList.add("news-label");
  label.textContent = "Афиша";
  const title = document.createElement("h2");
  title.textContent = item.title;
  const body = document.createElement("p");
  body.classList.add("news-body");
  body.textContent = item.text_parts[activeNewsSlide % item.text_parts.length];
  content.append(label, title, body);

  const meta = document.createElement("div");
  meta.classList.add("news-meta");
  if (item.slide_count > 1) {
    const counter = document.createElement("span");
    counter.classList.add("news-counter");
    counter.textContent = `${activeNewsSlide + 1} / ${item.slide_count}`;
    meta.append(counter);
  }

  let qrTarget = null;
  if (item.link_url) {
    const qrBlock = document.createElement("div");
    qrBlock.classList.add("news-qr");
    qrTarget = document.createElement("div");
    qrTarget.classList.add("news-qr-code");
    const caption = document.createElement("span");
    caption.textContent = "Наведите камеру для регистрации";
    qrBlock.append(qrTarget, caption);
    meta.append(qrBlock);
  }
  if (meta.children.length) content.append(meta);
  card.append(image, content);
  tvBirthdayList.replaceChildren(card);

  if (qrTarget && window.QRCode) {
    new QRCode(qrTarget, {
      text: item.link_url,
      width: 150,
      height: 150,
      colorDark: "#30305f",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M
    });
  }
}

function renderCurrentSlide() {
  if (activeKind === "birthday") renderBirthday(birthdays[activeIndex]);
  if (activeKind === "news") renderNews(newsItems[activeIndex]);
}

function scheduleNextSlide() {
  clearTimeout(slideTimer);
  slideTimer = setTimeout(transitionToNextSlide, 5000);
}

function chooseNextSlide() {
  if (activeKind === "birthday") {
    if (activeIndex + 1 < birthdays.length) activeIndex += 1;
    else if (newsItems.length) { activeKind = "news"; activeIndex = 0; activeNewsSlide = 0; }
    else activeIndex = 0;
  } else if (activeKind === "news") {
    const currentNews = newsItems[activeIndex];
    if (currentNews && activeNewsSlide + 1 < currentNews.slide_count) {
      activeNewsSlide += 1;
    } else if (activeIndex + 1 < newsItems.length) {
      activeIndex += 1;
      activeNewsSlide = 0;
    } else if (birthdays.length) {
      activeKind = "birthday";
      activeIndex = 0;
      activeNewsSlide = 0;
    } else {
      activeIndex = 0;
      activeNewsSlide = 0;
    }
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
  activeNewsSlide = 0;
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
  const normalized = data.map(function (item) {
    const imagePaths = Array.isArray(item.news_image_paths) && item.news_image_paths.length
      ? item.news_image_paths.filter(Boolean)
      : (item.news_image_path ? [item.news_image_path] : []);
    const textParts = splitTextIntoSlides(item.news_body);
    return {
      id: item.news_id,
      title: item.news_title,
      body: item.news_body,
      image_paths: imagePaths,
      text_parts: textParts,
      slide_count: Math.max(imagePaths.length, textParts.length, 1),
      link_url: item.news_link_url || "",
      created_at: item.news_created_at
    };
  });
  const changed = JSON.stringify(normalized) !== JSON.stringify(newsItems);
  const currentId = activeKind === "news" && newsItems[activeIndex] ? newsItems[activeIndex].id : null;
  newsItems = normalized;
  if (!activeKind || (activeKind === "news" && !newsItems.length)) startSequence();
  else if (changed && activeKind === "news") {
    activeIndex = Math.max(0, newsItems.findIndex(item => item.id === currentId));
    activeNewsSlide = Math.min(activeNewsSlide, newsItems[activeIndex].slide_count - 1);
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

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

function splitTextIntoSlides(text, maximumLength = 320) {
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

function fillQrContent(content, item) {
  content.replaceChildren();
  content.classList.add("news-qr-content");
  const instruction = document.createElement("p");
  instruction.classList.add("news-qr-instruction");
  instruction.textContent = "Наведите камеру телефона";
  const qrTarget = document.createElement("div");
  qrTarget.classList.add("news-qr-code");
  const action = document.createElement("p");
  action.classList.add("news-qr-action");
  action.textContent = item.qr_text || "Подробнее и регистрация";
  content.append(instruction, qrTarget, action);
  return qrTarget;
}

function drawQrCode(qrTarget, linkUrl) {
  if (!qrTarget || !window.QRCode) return;
  new QRCode(qrTarget, {
    text: linkUrl,
    width: 250,
    height: 250,
    colorDark: "#30305f",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.M
  });
}

function renderNews(item) {
  birthdayTitle.hidden = true;
  const slide = item.slides[activeNewsSlide] || item.slides[0];
  const card = document.createElement("article");
  card.classList.add("news-slide", `news-${slide.type}-slide`);

  const title = document.createElement("h2");
  title.textContent = item.title;

  let qrTarget = null;
  if (slide.type === "photo") {
    const image = document.createElement("img");
    image.classList.add("news-photo");
    image.src = imageUrl(slide.path);
    image.alt = item.title;
    const nextSlide = item.slides[activeNewsSlide + 1];
    if (nextSlide && nextSlide.type === "photo") {
      const preloadImage = new Image();
      preloadImage.src = imageUrl(nextSlide.path);
    }
    const caption = document.createElement("div");
    caption.classList.add("news-photo-caption");
    caption.append(title);
    card.append(image, caption);
  } else if (slide.type === "text") {
    card.classList.add("news-info-slide");
    const header = document.createElement("div");
    header.classList.add("news-static-header");
    header.append(title);
    const content = document.createElement("div");
    content.classList.add("news-info-content", "news-text-content");
    const body = document.createElement("p");
    body.classList.add("news-body");
    body.textContent = slide.text;
    content.append(body);
    card.append(header, content);
  } else {
    card.classList.add("news-info-slide");
    const header = document.createElement("div");
    header.classList.add("news-static-header");
    header.append(title);
    const content = document.createElement("div");
    content.classList.add("news-info-content");
    qrTarget = fillQrContent(content, item);
    card.append(header, content);
  }

  if (item.slide_count > 1) {
    const counter = document.createElement("span");
    counter.classList.add("news-counter");
    counter.textContent = `${activeNewsSlide + 1} / ${item.slide_count}`;
    card.append(counter);
  }
  tvBirthdayList.replaceChildren(card);

  drawQrCode(qrTarget, item.link_url);
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

  const currentNews = activeKind === "news" ? newsItems[activeIndex] : null;
  const currentNewsSlide = currentNews ? currentNews.slides[activeNewsSlide] : null;
  const nextNewsSlide = currentNews ? currentNews.slides[activeNewsSlide + 1] : null;
  const changesOnlyPhoto = currentNewsSlide && nextNewsSlide &&
    currentNewsSlide.type === "photo" && nextNewsSlide.type === "photo";
  const changesOnlyText = currentNewsSlide && nextNewsSlide &&
    currentNewsSlide.type === "text" && nextNewsSlide.type === "text";
  const changesTextToQr = currentNewsSlide && nextNewsSlide &&
    currentNewsSlide.type === "text" && nextNewsSlide.type === "qr";

  if (changesOnlyPhoto && currentCard) {
    const currentImage = currentCard.querySelector(".news-photo");
    const counter = currentCard.querySelector(".news-counter");
    if (currentImage) {
      if (!reduceMotion) currentImage.classList.add("is-changing");
      transitionTimer = setTimeout(function () {
        activeNewsSlide += 1;
        currentImage.src = imageUrl(nextNewsSlide.path);
        if (counter) counter.textContent = `${activeNewsSlide + 1} / ${currentNews.slide_count}`;
        requestAnimationFrame(function () {
          currentImage.classList.remove("is-changing");
        });
        scheduleNextSlide();
      }, reduceMotion ? 0 : 500);
      return;
    }
  }

  if (changesOnlyText && currentCard) {
    const currentBody = currentCard.querySelector(".news-body");
    const counter = currentCard.querySelector(".news-counter");
    if (currentBody) {
      if (!reduceMotion) currentBody.classList.add("is-changing");
      transitionTimer = setTimeout(function () {
        activeNewsSlide += 1;
        currentBody.textContent = nextNewsSlide.text;
        if (counter) counter.textContent = `${activeNewsSlide + 1} / ${currentNews.slide_count}`;
        requestAnimationFrame(function () {
          currentBody.classList.remove("is-changing");
        });
        scheduleNextSlide();
      }, reduceMotion ? 0 : 500);
      return;
    }
  }

  if (changesTextToQr && currentCard) {
    const currentContent = currentCard.querySelector(".news-info-content");
    const counter = currentCard.querySelector(".news-counter");
    if (currentContent) {
      if (!reduceMotion) currentContent.classList.add("is-changing");
      transitionTimer = setTimeout(function () {
        activeNewsSlide += 1;
        currentCard.classList.remove("news-text-slide");
        currentCard.classList.add("news-qr-slide");
        currentContent.classList.remove("news-text-content");
        const qrTarget = fillQrContent(currentContent, currentNews);
        drawQrCode(qrTarget, currentNews.link_url);
        if (counter) counter.textContent = `${activeNewsSlide + 1} / ${currentNews.slide_count}`;
        requestAnimationFrame(function () {
          currentContent.classList.remove("is-changing");
        });
        scheduleNextSlide();
      }, reduceMotion ? 0 : 500);
      return;
    }
  }

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
    const slides = imagePaths.map(path => ({ type: "photo", path }));
    textParts.filter(Boolean).forEach(text => slides.push({ type: "text", text }));
    if (item.news_link_url) slides.push({ type: "qr" });
    if (!slides.length) slides.push({ type: "text", text: "" });
    return {
      id: item.news_id,
      title: item.news_title,
      body: item.news_body,
      image_paths: imagePaths,
      text_parts: textParts,
      slides: slides,
      slide_count: slides.length,
      link_url: item.news_link_url || "",
      qr_text: item.news_qr_text || "",
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

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

function setNewsBodyContent(body, text) {
  body.replaceChildren();
  const paragraphs = String(text || "")
    .split(/\r?\n+/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean);
  (paragraphs.length ? paragraphs : [""]).forEach(function (paragraphText) {
    const paragraph = document.createElement("p");
    paragraph.textContent = paragraphText;
    body.append(paragraph);
  });
}

function fillNewsContent(content, item, slide) {
  content.className = "news-info-content";
  content.replaceChildren();

  if (slide.type === "photo") {
    content.classList.add("news-photo-content");
    const image = document.createElement("img");
    image.classList.add("news-photo");
    image.src = imageUrl(slide.path);
    image.alt = item.title;
    content.append(image);
    return { image };
  }

  if (slide.type === "text") {
    content.classList.add("news-text-content");
    const body = document.createElement("div");
    body.classList.add("news-body");
    setNewsBodyContent(body, slide.text);
    content.append(body);
    return { body };
  }

  const qrTarget = fillQrContent(content, item);
  return { qrTarget };
}

function fitNewsText(body, container) {
  if (!body || !container) return;
  const availableHeight = Math.max(1, container.clientHeight - 4);
  let minimumSize = 10;
  const title = tvBirthdayList.querySelector(".news-static-header h2");
  const titleSize = title ? parseFloat(getComputedStyle(title).fontSize) : 54;
  let maximumSize = Math.max(minimumSize, Math.min(36, titleSize * 0.72));
  let bestSize = minimumSize;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidateSize = (minimumSize + maximumSize) / 2;
    body.style.fontSize = candidateSize + "px";
    if (body.scrollHeight <= availableHeight && body.scrollWidth <= container.clientWidth) {
      bestSize = candidateSize;
      minimumSize = candidateSize;
    } else {
      maximumSize = candidateSize;
    }
  }
  body.style.fontSize = Math.floor(bestSize) + "px";
}

function refitCurrentNewsText() {
  if (activeKind !== "news") return;
  const currentNews = newsItems[activeIndex];
  const currentSlide = currentNews && currentNews.slides[activeNewsSlide];
  if (!currentSlide || currentSlide.type !== "text") return;
  requestAnimationFrame(function () {
    fitNewsText(
      tvBirthdayList.querySelector(".news-body"),
      tvBirthdayList.querySelector(".news-info-content")
    );
  });
}

function renderNews(item) {
  birthdayTitle.hidden = true;
  const slide = item.slides[activeNewsSlide] || item.slides[0];
  const card = document.createElement("article");
  card.classList.add("news-slide", "news-info-slide", `news-${slide.type}-slide`);

  const title = document.createElement("h2");
  title.textContent = item.title;
  const header = document.createElement("div");
  header.classList.add("news-static-header");
  header.append(title);
  const content = document.createElement("div");
  const renderedContent = fillNewsContent(content, item, slide);
  card.append(header, content);

  const nextSlide = item.slides[activeNewsSlide + 1];
  if (nextSlide && nextSlide.type === "photo") {
    const preloadImage = new Image();
    preloadImage.src = imageUrl(nextSlide.path);
  }

  if (item.slide_count > 1) {
    const counter = document.createElement("span");
    counter.classList.add("news-counter");
    counter.textContent = `${activeNewsSlide + 1} / ${item.slide_count}`;
    card.append(counter);
  }
  tvBirthdayList.replaceChildren(card);

  drawQrCode(renderedContent.qrTarget, item.link_url);
  if (renderedContent.body) fitNewsText(renderedContent.body, content);
}

function renderCurrentSlide() {
  if (activeKind === "birthday") renderBirthday(birthdays[activeIndex]);
  if (activeKind === "news") renderNews(newsItems[activeIndex]);
}

function scheduleNextSlide() {
  clearTimeout(slideTimer);
  const currentNews = activeKind === "news" ? newsItems[activeIndex] : null;
  const currentSlide = currentNews ? currentNews.slides[activeNewsSlide] : null;
  let duration = 5000;
  if (currentSlide && currentSlide.type === "text") duration = 15000;
  if (currentSlide && currentSlide.type === "qr") duration = 10000;
  slideTimer = setTimeout(transitionToNextSlide, duration);
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

  if (changesOnlyPhoto && currentCard) {
    const currentImage = currentCard.querySelector(".news-photo");
    const counter = currentCard.querySelector(".news-counter");
    if (currentImage) {
      if (!reduceMotion) currentImage.classList.add("is-changing");
      transitionTimer = setTimeout(function () {
        activeNewsSlide += 1;
        currentImage.src = imageUrl(nextNewsSlide.path);
        const followingSlide = currentNews.slides[activeNewsSlide + 1];
        if (followingSlide && followingSlide.type === "photo") {
          const preloadImage = new Image();
          preloadImage.src = imageUrl(followingSlide.path);
        }
        if (counter) counter.textContent = `${activeNewsSlide + 1} / ${currentNews.slide_count}`;
        requestAnimationFrame(function () {
          currentImage.classList.remove("is-changing");
        });
        scheduleNextSlide();
      }, reduceMotion ? 0 : 500);
      return;
    }
  }

  if (currentNewsSlide && nextNewsSlide && currentCard) {
    const currentContent = currentCard.querySelector(".news-info-content");
    const counter = currentCard.querySelector(".news-counter");
    if (currentContent) {
      if (!reduceMotion) currentContent.classList.add("is-changing");
      transitionTimer = setTimeout(function () {
        activeNewsSlide += 1;
        currentCard.classList.remove("news-photo-slide", "news-text-slide", "news-qr-slide");
        currentCard.classList.add(`news-${nextNewsSlide.type}-slide`);
        const renderedContent = fillNewsContent(currentContent, currentNews, nextNewsSlide);
        if (!reduceMotion) currentContent.classList.add("is-changing");
        drawQrCode(renderedContent.qrTarget, currentNews.link_url);
        if (renderedContent.body) fitNewsText(renderedContent.body, currentContent);
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
    const textParts = [String(item.news_body || "").trim()];
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
window.addEventListener("resize", refitCurrentNewsText);
document.addEventListener("visibilitychange", function () { if (!document.hidden) loadContent(); });

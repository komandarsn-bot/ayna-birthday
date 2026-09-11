(function () {
  "use strict";
  const STORAGE_KEY = "ayna_admin_language";
  const kk = {
    "Панель управления":"Басқару панелі","Вход в личный кабинет":"Жеке кабинетке кіру","Логин":"Логин","Пароль":"Құпиясөз","Войти":"Кіру","Администратор":"Әкімші","Выйти":"Шығу",
    "Разделы личного кабинета":"Жеке кабинет бөлімдері","Достижения":"Жетістіктер","Публикации":"Жарияланымдар","Дни рождения":"Туған күндер","Настройки":"Баптаулар",
    "ТВ-экран":"ТД-экран","Открыть экран":"Экранды ашу","Копировать ссылку":"Сілтемені көшіру","Расписание смен":"Ауысым кестесі","Настроить":"Баптау","Скрыть":"Жасыру",
    "Количество смен":"Ауысым саны","1 смена":"1 ауысым","2 смены":"2 ауысым","3 смены":"3 ауысым","День недели":"Апта күні","Понедельник":"Дүйсенбі","Вторник":"Сейсенбі","Среда":"Сәрсенбі","Четверг":"Бейсенбі","Пятница":"Жұма","Суббота":"Сенбі","Воскресенье":"Жексенбі","Редактировать":"Өңдеу","Сохранить расписание":"Кестені сақтау",
    "Содержимое ТВ-экрана":"ТД-экран мазмұны","Объявления":"Хабарландырулар","События":"Іс-шаралар","Рейтинг учеников":"Оқушылар рейтингі","Сохранить":"Сақтау",
    "Начисление баллов":"Ұпай есептеу","Уровень":"Деңгей","1 место":"1 орын","или абсолютный чемпион":"немесе абсолютті чемпион","2 место":"2 орын","3 место":"3 орын","Номинация":"Номинация","или грамота":"немесе грамота","Сертификат":"Сертификат","Школьный этап":"Мектеп кезеңі","Районный этап":"Аудандық кезең","Городской этап":"Қалалық кезең","Республиканский этап":"Республикалық кезең","Международный этап":"Халықаралық кезең","Сохранить баллы":"Ұпайларды сақтау",
    "Параметры рейтинга":"Рейтинг параметрлері","Период рейтинга":"Рейтинг кезеңі","Текущая неделя":"Ағымдағы апта","Текущий месяц":"Ағымдағы ай","Текущая четверть":"Ағымдағы тоқсан","Текущий учебный год":"Ағымдағы оқу жылы","За всё время":"Барлық уақыт",
    "Учебные периоды":"Оқу кезеңдері","1 четверть":"1 тоқсан","2 четверть":"2 тоқсан","3 четверть":"3 тоқсан","4 четверть":"4 тоқсан","С":"Басталуы","По":"Аяқталуы","Сохранить даты":"Күндерді сақтау",
    "Состав школы":"Мектеп құрамы","Общий список учеников и учителей для всех разделов системы.":"Жүйенің барлық бөлімдеріне арналған оқушылар мен мұғалімдердің бірыңғай тізімі.","Ученики":"Оқушылар","Учителя":"Мұғалімдер","Загрузить":"Жүктеу","Фамилия":"Тегі","Имя":"Аты","Отчество":"Әкесінің аты","Класс":"Сынып","Дата рождения":"Туған күні","Добавить ученика":"Оқушыны қосу","Должность":"Лауазымы","Пол":"Жынысы","Выберите":"Таңдаңыз","Добавить учителя":"Мұғалімді қосу","Excel: «Фамилия», «Имя», «Отчество», «Класс», «Дата рождения».":"Excel: «Тегі», «Аты», «Әкесінің аты», «Сынып», «Туған күні».","Excel: «Фамилия», «Имя», «Отчество», «Должность», «Дата рождения», «Пол».":"Excel: «Тегі», «Аты», «Әкесінің аты», «Лауазымы», «Туған күні», «Жынысы».",
    "Справочник мероприятий":"Іс-шаралар анықтамалығы","Столбец Excel: «Наименование мероприятия».":"Excel бағаны: «Іс-шара атауы».","Сохранение достижений в Excel":"Жетістіктерді Excel-ге сақтау","Папка для сохранения":"Сақтау қалтасы","Не выбрана":"Таңдалмаған","Не выбрано":"Таңдалмаған","Выберите папку для автоматического сохранения Excel-файлов.":"Excel файлдарын автоматты түрде сақтау үшін қалтаны таңдаңыз.","Выбрать папку":"Қалтаны таңдау","Изменить папку":"Қалтаны өзгерту","Обновить":"Жаңарту","Удалить всех":"Барлығын жою","Удалить":"Жою",
    "Добавить публикацию":"Жарияланым қосу","Добавьте фотографии, текст и при необходимости ссылку. Публикация сразу появится в ТВ-цикле.":"Фотосуреттерді, мәтінді және қажет болса сілтемені қосыңыз. Жарияланым ТД-циклде бірден пайда болады.","Вид публикации":"Жарияланым түрі","Событие":"Іс-шара","Объявление":"Хабарландыру","Заголовок":"Тақырып","Текст":"Мәтін","Текст публикации":"Жарияланым мәтіні","Чтобы выделить текст жирным, поставьте звёздочки: *важный текст*":"Мәтінді қалың қаріппен белгілеу үшін жұлдызшаларды қойыңыз: *маңызды мәтін*","Фотографии (до 8; при редактировании можно оставить пустым)":"Фотосуреттер (8-ге дейін; өңдеу кезінде бос қалдыруға болады)","Ссылка для QR-кода":"QR-код сілтемесі","Ссылка для QR-кода (необязательно)":"QR-код сілтемесі (міндетті емес)","Текст возле QR-кода (необязательно)":"QR-код жанындағы мәтін (міндетті емес)","Сколько дней показывать публикацию":"Жарияланымды қанша күн көрсету керек","Опубликовать":"Жариялау","Отменить редактирование":"Өңдеуден бас тарту","Опубликованные материалы":"Жарияланған материалдар","Обновить список":"Тізімді жаңарту","Загрузка публикаций…":"Жарияланымдар жүктелуде…","Активировать":"Белсендіру","Деактивировать":"Өшіру","Активна":"Белсенді","Деактивирована":"Өшірілген",
    "Загрузка…":"Жүктелуде…","Загрузка...":"Жүктелуде...","Сохраняем...":"Сақталуда...","Удаляем...":"Жойылуда...","Ошибка":"Қате","Действия":"Әрекеттер","Открыть":"Ашу","Сбросить":"Тазарту","Поиск":"Іздеу","Поиск ученика":"Оқушыны іздеу","Все классы":"Барлық сыныптар","Смена":"Ауысым","Все смены":"Барлық ауысымдар","1 смена · 8–11 классы":"1 ауысым · 8–11 сыныптар","2 смена · 5–7 классы":"2 ауысым · 5–7 сыныптар","Начало периода":"Кезеңнің басталуы","Окончание периода":"Кезеңнің аяқталуы",
    "Баллы учеников":"Оқушылар ұпайлары","Место":"Орын","Ученик":"Оқушы","Баллы":"Ұпайлар","База достижений":"Жетістіктер базасы","Вернуться в админ-панель":"Әкімшілік панельге оралу","Фильтры достижений":"Жетістіктер сүзгілері","Фильтры по всем параметрам":"Барлық параметрлер бойынша сүзгілер",
    "Наименование мероприятия":"Іс-шара атауы","Приказ":"Бұйрық","Стоимость":"Құны","Стоимость, ₸":"Құны, ₸","Предмет":"Пән","Международный":"Халықаралық","Республиканский":"Республикалық","Городской":"Қалалық","Районный":"Аудандық","Школьный":"Мектепішілік","Этап":"Кезең","Сначала выберите уровень":"Алдымен деңгейді таңдаңыз","Вид достижения":"Жетістік түрі","Место / результат":"Орын / нәтиже","Баллы за достижение":"Жетістік ұпайы","Формат":"Формат","Офлайн":"Офлайн","Онлайн":"Онлайн","ФИО руководителя":"Жетекшінің аты-жөні","Организаторы":"Ұйымдастырушылар","Период проведения":"Өткізу кезеңі","Начало":"Басталуы","Окончание":"Аяқталуы","Ссылка":"Сілтеме","Страна":"Ел","Город":"Қала","Добавить достижение":"Жетістік қосу","Сохранить достижение":"Жетістікті сақтау","Сохранить изменения":"Өзгерістерді сақтау","Заполнить из последней записи":"Соңғы жазбадан толтыру","Сохранённые достижения":"Сақталған жетістіктер","Открыть на отдельной странице":"Жеке бетте ашу","Отмена":"Бас тарту","Бесплатно":"Тегін","Платно":"Ақылы","Все":"Барлығы","Загрузка данных…":"Деректер жүктелуде…","← Вернуться в админ-панель":"← Әкімшілік панельге оралу",
    "Язык платформы":"Платформа тілі","Русский":"Русский","Қазақша":"Қазақша"
  };
  const titles = {"Панель управления - Ayna":"Басқару панелі - Ayna","Достижения - Ayna":"Жетістіктер - Ayna","Рейтинг учеников - Ayna":"Оқушылар рейтингі - Ayna"};
  let language = localStorage.getItem(STORAGE_KEY) === "kk" ? "kk" : "ru";
  let applying = false;
  function translatePhrase(value) {
    if (language !== "kk") return value;
    const text = String(value || "").trim();
    if (kk[text]) return kk[text];
    return text.replace(/^Показано записей: (\d+) из (\d+)$/, "Көрсетілген жазбалар: $1 / $2").replace(/^Учеников с баллами: (\d+)$/, "Ұпайы бар оқушылар: $1").replace(/^Загружено записей: (\d+)$/, "Жүктелген жазбалар: $1").replace(/^Ошибка: /, "Қате: ").replace(/^Удалить запись: /, "Жазбаны жою: ").replace(/^Удалить это достижение\?$/, "Бұл жетістікті жою керек пе?");
  }
  function translateTextNode(node) {
    if (!node.nodeValue || !node.nodeValue.trim()) return;
    const current = node.nodeValue, clean = current.trim();
    if (!node.__aynaSource || clean !== node.__aynaRendered) node.__aynaSource = clean;
    const rendered = language === "kk" ? translatePhrase(node.__aynaSource) : node.__aynaSource;
    node.__aynaRendered = rendered;
    const nextValue = current.match(/^\s*/)[0] + rendered + current.match(/\s*$/)[0];
    if (node.nodeValue !== nextValue) node.nodeValue = nextValue;
  }
  function translateElement(element) {
    if (!(element instanceof Element) || element.matches("script,style,[data-i18n-skip]")) return;
    ["placeholder","title","aria-label"].forEach(function (attribute) {
      if (!element.hasAttribute(attribute)) return;
      const key = "ayna" + attribute.replace(/[^a-z]/gi, ""), current = element.getAttribute(attribute);
      if (!element.dataset[key] || current !== element.dataset[key + "Rendered"]) element.dataset[key] = current;
      const rendered = language === "kk" ? translatePhrase(element.dataset[key]) : element.dataset[key];
      element.dataset[key + "Rendered"] = rendered; if (current !== rendered) element.setAttribute(attribute, rendered);
    });
    Array.from(element.childNodes).forEach(function (node) { if (node.nodeType === Node.TEXT_NODE) translateTextNode(node); else if (node.nodeType === Node.ELEMENT_NODE) translateElement(node); });
  }
  function applyLanguage() {
    applying = true; document.documentElement.lang = language === "kk" ? "kk" : "ru";
    const originalTitle = document.documentElement.dataset.ruTitle || document.title; document.documentElement.dataset.ruTitle = originalTitle;
    document.title = language === "kk" ? (titles[originalTitle] || translatePhrase(originalTitle)) : originalTitle;
    translateElement(document.body); const select = document.querySelector("#admin-language-select"); if (select) select.value = language; applying = false;
  }
  function createSwitcher() {
    if (document.querySelector("#admin-language-select")) return;
    const wrapper = document.createElement("label"); wrapper.className = "admin-language-switcher";
    wrapper.innerHTML = '<span>Язык платформы</span><select id="admin-language-select" aria-label="Язык платформы"><option value="ru">Русский</option><option value="kk">Қазақша</option></select>';
    const host = document.querySelector(".cabinet-actions") || document.querySelector(".page-header-actions") || document.querySelector(".cabinet-header") || document.querySelector("header");
    if (host) {
      const logout = host.querySelector("#logout-button");
      if (logout) host.insertBefore(wrapper, logout); else host.prepend(wrapper);
    } else document.body.prepend(wrapper);
    wrapper.querySelector("select").addEventListener("change", function (event) { language = event.target.value === "kk" ? "kk" : "ru"; localStorage.setItem(STORAGE_KEY, language); applyLanguage(); });
  }
  const nativeAlert = window.alert.bind(window), nativeConfirm = window.confirm.bind(window);
  window.alert = value => nativeAlert(language === "kk" ? translatePhrase(value) : value); window.confirm = value => nativeConfirm(language === "kk" ? translatePhrase(value) : value);
  window.aynaI18n = { t: translatePhrase, getLanguage: () => language, apply: applyLanguage };
  function start() { createSwitcher(); applyLanguage(); new MutationObserver(function (mutations) { if (applying) return; applying = true; mutations.forEach(function (mutation) { if (mutation.type === "characterData") translateTextNode(mutation.target); mutation.addedNodes.forEach(function (node) { if (node.nodeType === Node.TEXT_NODE) translateTextNode(node); else if (node.nodeType === Node.ELEMENT_NODE) translateElement(node); }); }); applying = false; }).observe(document.body, {childList:true,subtree:true,characterData:true}); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

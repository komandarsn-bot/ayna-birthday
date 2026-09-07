const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const columns = [
  ["last_name", "Ф"], ["first_name", "И"], ["class_name", "Класс"],
  ["event_name", "Наименование мероприятия"], ["order_reference", "Приказ"],
  ["cost", "Стоимость, ₸"], ["subject", "Предмет"], ["achievement_level", "Уровень"],
  ["event_stage", "Этап"], ["project_name", "Вид достижения"],
  ["academic_type", "Academic / Non Academic"], ["event_format", "Формат"],
  ["result", "Место / результат"], ["supervisor_name", "ФИО руководителя"],
  ["organizers", "Организаторы"], ["event_date", "Начало"],
  ["event_end_date", "Окончание"], ["link_url", "Ссылка"], ["country", "Страна"], ["city", "Город"]
];

const tableWrap = document.querySelector("#table-wrap");
const recordsCount = document.querySelector("#records-count");
const searchInput = document.querySelector("#table-search");
const columnFilters = document.querySelector("#column-filters");
let records = [];
let sortKey = "event_date";
let sortDirection = "desc";

function formatValue(key, value) {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "cost") return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "KZT", maximumFractionDigits: 2 }).format(value);
  if (key === "event_date" || key === "event_end_date") return new Date(value + "T00:00:00").toLocaleDateString("ru-RU");
  return String(value);
}

function buildColumnFilters() {
  const selectedValues = new Map(Array.from(columnFilters.querySelectorAll("select"), select => [select.dataset.key, select.value]));
  const controls = columns.map(([key, label]) => {
    const wrapper = document.createElement("label");
    wrapper.textContent = label;
    const select = document.createElement("select");
    select.dataset.key = key;
    select.append(new Option("Все", ""));
    Array.from(new Set(records.map(item => item[key]).filter(value => value !== null && value !== undefined && value !== "")))
      .sort((a, b) => String(a).localeCompare(String(b), "ru", { numeric: true }))
      .forEach(value => select.append(new Option(formatValue(key, value), String(value))));
    select.value = selectedValues.get(key) || "";
    select.addEventListener("input", render);
    wrapper.append(select);
    return wrapper;
  });
  columnFilters.replaceChildren(...controls);
}

function visibleRecords() {
  const query = searchInput.value.trim().toLocaleLowerCase("ru");
  return records.filter(item => {
    const text = columns.map(([key]) => item[key] ?? "").join(" ").toLocaleLowerCase("ru");
    if (query && !text.includes(query)) return false;
    return Array.from(columnFilters.querySelectorAll("select")).every(select =>
      !select.value || String(item[select.dataset.key] ?? "") === select.value
    );
  }).sort((a, b) => {
    const left = a[sortKey] ?? "";
    const right = b[sortKey] ?? "";
    const result = typeof left === "number" && typeof right === "number"
      ? left - right : String(left).localeCompare(String(right), "ru", { numeric: true });
    return sortDirection === "asc" ? result : -result;
  });
}

function render() {
  const visible = visibleRecords();
  recordsCount.textContent = "Показано записей: " + visible.length + " из " + records.length;
  if (!visible.length) { tableWrap.textContent = records.length ? "По выбранным фильтрам записей нет" : "Достижений пока нет"; return; }
  const table = document.createElement("table");
  const headRow = document.createElement("tr");
  columns.forEach(([key, label]) => {
    const th = document.createElement("th");
    const button = document.createElement("button");
    button.className = "sort-button";
    button.textContent = label + (sortKey === key ? (sortDirection === "asc" ? " ↑" : " ↓") : "");
    button.addEventListener("click", () => { if (sortKey === key) sortDirection = sortDirection === "asc" ? "desc" : "asc"; else { sortKey = key; sortDirection = "asc"; } render(); });
    th.append(button); headRow.append(th);
  });
  const thead = document.createElement("thead"); thead.append(headRow);
  const tbody = document.createElement("tbody");
  visible.forEach(item => {
    const row = document.createElement("tr");
    columns.forEach(([key]) => {
      const td = document.createElement("td");
      if (key === "link_url" && item[key]) { const link = document.createElement("a"); link.href = item[key]; link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "Открыть"; td.append(link); }
      else td.textContent = formatValue(key, item[key]);
      row.append(td);
    });
    tbody.append(row);
  });
  table.append(thead, tbody); tableWrap.replaceChildren(table);
}

async function load() {
  tableWrap.textContent = "Загрузка данных…";
  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) { location.replace("index.html"); return; }
  const { data, error } = await client.from("achievements").select("*").order("event_date", { ascending: false });
  if (error) { tableWrap.textContent = "Ошибка: " + error.message; return; }
  records = data || [];
  buildColumnFilters();
  render();
}

searchInput.addEventListener("input", render);
document.querySelector("#reset-filters").addEventListener("click", () => {
  searchInput.value = "";
  columnFilters.querySelectorAll("select").forEach(select => { select.value = ""; });
  render();
});
document.querySelector("#refresh-table").addEventListener("click", load);
load();

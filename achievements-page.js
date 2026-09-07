const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const columns = [
  ["last_name", "Фамилия"], ["first_name", "Имя"], ["class_name", "Класс"],
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
  const selectedValues = new Map(Array.from(columnFilters.querySelectorAll("[data-key]"), control => [control.dataset.key, control.value]));
  const controls = columns.filter(([key]) => key !== "link_url").map(([key, label]) => {
    const wrapper = document.createElement("label");
    wrapper.textContent = key === "event_date" ? "Период: с" : key === "event_end_date" ? "Период: по" : label;
    let control;
    if (key === "event_date" || key === "event_end_date") {
      control = document.createElement("input");
      control.type = "date";
    } else {
      control = document.createElement("select");
      control.append(new Option("Все", ""));
      if (key === "cost") {
        control.append(new Option("Бесплатно", "free"), new Option("Платно", "paid"));
      } else {
        Array.from(new Set(records.map(item => item[key]).filter(value => value !== null && value !== undefined && value !== "")))
          .sort((a, b) => String(a).localeCompare(String(b), "ru", { numeric: true }))
          .forEach(value => control.append(new Option(formatValue(key, value), String(value))));
      }
    }
    control.dataset.key = key;
    control.value = selectedValues.get(key) || "";
    control.addEventListener("input", render);
    wrapper.append(control);
    return wrapper;
  });
  columnFilters.replaceChildren(...controls);
}

function visibleRecords() {
  const query = searchInput.value.trim().toLocaleLowerCase("ru");
  return records.filter(item => {
    const text = columns.map(([key]) => item[key] ?? "").join(" ").toLocaleLowerCase("ru");
    if (query && !text.includes(query)) return false;
    return Array.from(columnFilters.querySelectorAll("[data-key]")).every(control => {
      if (!control.value) return true;
      const key = control.dataset.key;
      if (key === "cost") {
        const paid = Number(item.cost || 0) > 0;
        return control.value === "paid" ? paid : !paid;
      }
      if (key === "event_date") return (item.event_end_date || item.event_date || "") >= control.value;
      if (key === "event_end_date") return (item.event_date || item.event_end_date || "") <= control.value;
      return String(item[key] ?? "") === control.value;
    });
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
  columnFilters.querySelectorAll("[data-key]").forEach(control => { control.value = ""; });
  render();
});
document.querySelector("#refresh-table").addEventListener("click", load);
load();

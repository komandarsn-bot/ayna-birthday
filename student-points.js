const pointsClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const tableContainer = document.querySelector("#points-table");
const countLabel = document.querySelector("#points-count");
const searchControl = document.querySelector("#points-search");
const classControl = document.querySelector("#class-filter");
let pointRows = [];

function normalized(value) {
  return String(value || "").trim().toLocaleLowerCase("ru");
}

function visibleRows() {
  const search = normalized(searchControl.value);
  return pointRows.filter(item => {
    if (classControl.value && item.class_name !== classControl.value) return false;
    return !search || normalized(`${item.last_name} ${item.first_name} ${item.class_name}`).includes(search);
  });
}

function renderPoints() {
  const rows = visibleRows();
  countLabel.textContent = `Учеников с баллами: ${rows.length}`;
  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = pointRows.length ? "По выбранным параметрам учеников нет" : "Начисленных баллов пока нет";
    tableContainer.replaceChildren(empty);
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `<thead><tr><th class="place">Место</th><th>Ученик</th><th>Класс</th><th class="achievements-column">Достижений</th><th class="points">Баллы</th></tr></thead>`;
  const body = document.createElement("tbody");
  rows.forEach(item => {
    const row = document.createElement("tr");
    row.dataset.place = item.place;
    const place = document.createElement("td");
    place.className = "place";
    const placeMark = document.createElement("span");
    placeMark.className = item.place <= 3 ? "top-place" : "";
    placeMark.textContent = String(item.place).padStart(2, "0");
    place.append(placeMark);

    const name = document.createElement("td");
    name.className = "student-name";
    name.textContent = `${item.last_name} ${item.first_name}`;
    const classCell = document.createElement("td");
    classCell.textContent = item.class_name || "—";
    const count = document.createElement("td");
    count.className = "achievements-column";
    count.textContent = item.achievements_count;
    const points = document.createElement("td");
    points.className = "points";
    points.textContent = item.total_points;
    row.append(place, name, classCell, count, points);
    body.append(row);
  });
  table.append(body);
  tableContainer.replaceChildren(table);
}

function fillClassFilter() {
  const current = classControl.value;
  const classes = Array.from(new Set(pointRows.map(item => item.class_name).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, "ru", { numeric: true }));
  classControl.replaceChildren(new Option("Все классы", ""), ...classes.map(value => new Option(value, value)));
  classControl.value = classes.includes(current) ? current : "";
}

async function loadPoints() {
  tableContainer.textContent = "Загрузка данных…";
  const { data: sessionData } = await pointsClient.auth.getSession();
  if (!sessionData.session) { location.replace("index.html"); return; }

  const { data, error } = await pointsClient
    .from("student_points_totals")
    .select("student_id,last_name,first_name,class_name,achievements_count,total_points")
    .gt("total_points", 0)
    .order("total_points", { ascending: false })
    .order("last_name", { ascending: true });

  if (error) {
    tableContainer.textContent = `Ошибка загрузки баллов: ${error.message}`;
    countLabel.textContent = "Не удалось загрузить данные";
    return;
  }

  let previousPoints = null;
  let currentPlace = 0;
  pointRows = (data || []).map(item => {
    if (Number(item.total_points) !== previousPoints) currentPlace += 1;
    previousPoints = Number(item.total_points);
    return { ...item, place: currentPlace };
  });
  fillClassFilter();
  renderPoints();
}

searchControl.addEventListener("input", renderPoints);
classControl.addEventListener("change", renderPoints);
document.querySelector("#reset-points").addEventListener("click", () => {
  searchControl.value = "";
  classControl.value = "";
  renderPoints();
});
document.querySelector("#refresh-points").addEventListener("click", loadPoints);
window.addEventListener("storage", event => {
  if (event.key === "ayna-achievements-updated") loadPoints();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) loadPoints();
});
setInterval(() => {
  if (!document.hidden) loadPoints();
}, 30000);
loadPoints();

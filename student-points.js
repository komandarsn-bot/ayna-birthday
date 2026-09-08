const pointsClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const tableContainer = document.querySelector("#points-table");
const countLabel = document.querySelector("#points-count");
const searchControl = document.querySelector("#points-search");
const classControl = document.querySelector("#class-filter");
const shiftControl = document.querySelector("#shift-filter");
const periodStartControl = document.querySelector("#period-start");
const periodEndControl = document.querySelector("#period-end");
let pointRows = [];
let pointEntries = [];
let students = [];
let achievementsById = new Map();
let sourceSignature = "";
let pointsLoading = false;

function normalized(value) {
  return String(value || "").trim().toLocaleLowerCase("ru");
}

function classGrade(className) {
  const match = String(className || "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

function matchesShift(className) {
  if (!shiftControl.value) return true;
  const grade = classGrade(className);
  if (shiftControl.value === "1") return grade >= 8 && grade <= 11;
  return grade >= 5 && grade <= 7;
}

function matchesPeriod(entry) {
  const achievement = achievementsById.get(entry.achievement_id);
  if (!periodStartControl.value && !periodEndControl.value) return true;
  if (!achievement) return false;
  const start = achievement.event_date || achievement.event_end_date;
  const end = achievement.event_end_date || achievement.event_date;
  if (!start || !end) return false;
  if (periodStartControl.value && end < periodStartControl.value) return false;
  if (periodEndControl.value && start > periodEndControl.value) return false;
  return true;
}

function rebuildPointRows() {
  const studentsById = new Map(students.map(student => [student.id, student]));
  const totals = new Map();
  pointEntries.forEach(entry => {
    const student = studentsById.get(entry.student_id);
    if (!student || !matchesShift(student.class_name) || !matchesPeriod(entry)) return;
    if (classControl.value && student.class_name !== classControl.value) return;
    const total = totals.get(student.id) || { achievements_count: 0, total_points: 0 };
    total.achievements_count += 1;
    total.total_points += Number(entry.points) || 0;
    totals.set(student.id, total);
  });

  const ranked = students
    .filter(student => totals.has(student.id) && totals.get(student.id).total_points > 0)
    .map(student => ({ ...student, ...totals.get(student.id) }))
    .sort((a, b) => b.total_points - a.total_points || a.last_name.localeCompare(b.last_name, "ru") || a.first_name.localeCompare(b.first_name, "ru"));

  let previousPoints = null;
  let currentPlace = 0;
  pointRows = ranked.map(item => {
    if (item.total_points !== previousPoints) currentPlace += 1;
    previousPoints = item.total_points;
    return { ...item, place: currentPlace };
  });
  renderPoints();
}

function visibleRows() {
  const search = normalized(searchControl.value);
  return pointRows.filter(item => !search || normalized(`${item.last_name} ${item.first_name} ${item.class_name}`).includes(search));
}

function renderPoints() {
  const rows = visibleRows();
  countLabel.textContent = `Учеников с баллами: ${rows.length}`;
  if (!rows.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = pointEntries.length ? "По выбранным параметрам учеников нет" : "Начисленных баллов пока нет";
    tableContainer.replaceChildren(empty);
    return;
  }

  const table = document.createElement("table");
  table.innerHTML = `<thead><tr><th class="place">Место</th><th>Ученик</th><th>Класс</th><th class="achievements-column">Достижений</th><th class="points">Баллы</th></tr></thead>`;
  const body = document.createElement("tbody");
  rows.forEach(item => {
    const row = document.createElement("tr");
    const place = document.createElement("td");
    place.className = "place";
    place.textContent = item.place;
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
  const studentIds = new Set(pointEntries.map(item => item.student_id));
  const classes = Array.from(new Set(students.filter(item => studentIds.has(item.id)).map(item => item.class_name).filter(Boolean)))
    .sort((a, b) => a.localeCompare(b, "ru", { numeric: true }));
  classControl.replaceChildren(new Option("Все классы", ""), ...classes.map(value => new Option(value, value)));
  classControl.value = classes.includes(current) ? current : "";
}

async function loadPoints(silent = false) {
  if (pointsLoading) return;
  pointsLoading = true;
  if (!silent) tableContainer.textContent = "Загрузка данных…";
  const { data: sessionData } = await pointsClient.auth.getSession();
  if (!sessionData.session) { pointsLoading = false; location.replace("index.html"); return; }

  const [pointsResult, studentsResult, achievementsResult] = await Promise.all([
    pointsClient.from("student_achievement_points").select("student_id,achievement_id,points").order("achievement_id"),
    pointsClient.from("students").select("id,last_name,first_name,class_name").order("id"),
    pointsClient.from("achievements").select("id,event_date,event_end_date").order("id")
  ]);
  const failed = [pointsResult, studentsResult, achievementsResult].find(result => result.error);
  if (failed) {
    if (!silent) {
      tableContainer.textContent = `Ошибка загрузки баллов: ${failed.error.message}`;
      countLabel.textContent = "Не удалось загрузить данные";
    }
    pointsLoading = false;
    return;
  }

  const nextSignature = JSON.stringify([
    pointsResult.data,
    studentsResult.data,
    achievementsResult.data
  ]);
  if (silent && sourceSignature === nextSignature) {
    pointsLoading = false;
    return;
  }
  sourceSignature = nextSignature;
  pointEntries = pointsResult.data || [];
  students = studentsResult.data || [];
  achievementsById = new Map((achievementsResult.data || []).map(item => [item.id, item]));
  fillClassFilter();
  rebuildPointRows();
  pointsLoading = false;
}

searchControl.addEventListener("input", renderPoints);
[classControl, shiftControl, periodStartControl, periodEndControl].forEach(control => control.addEventListener("change", rebuildPointRows));
document.querySelector("#reset-points").addEventListener("click", () => {
  searchControl.value = "";
  classControl.value = "";
  shiftControl.value = "";
  periodStartControl.value = "";
  periodEndControl.value = "";
  rebuildPointRows();
});
document.querySelector("#refresh-points").addEventListener("click", () => loadPoints(false));
window.addEventListener("storage", event => {
  if (event.key === "ayna-achievements-updated") loadPoints(true);
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) loadPoints(true);
});
setInterval(() => {
  if (!document.hidden) loadPoints(true);
}, 30000);
loadPoints(false);

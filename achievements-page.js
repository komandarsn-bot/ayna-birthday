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
let students = [];
let referenceLists = {};
let sortKey = "event_date";
let sortDirection = "desc";
const scopeOrder = ["Международный", "Республиканский", "Городской", "Районный", "Школьный"];

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

function makeEditControl(key, value) {
  let control;
  const selectValues = {
    achievement_level: scopeOrder,
    event_stage: scopeOrder,
    academic_type: ["ACADEMIC", "NON ACADEMIC"],
    event_format: ["Офлайн", "Онлайн"]
  };
  if (selectValues[key]) {
    control = document.createElement("select");
    control.append(new Option("Не выбрано", ""));
    selectValues[key].forEach(option => control.append(new Option(option, option)));
  } else {
    control = document.createElement("input");
    control.type = key === "cost" ? "number" : key === "event_date" || key === "event_end_date" ? "date" : key === "link_url" ? "url" : "text";
    if (key === "cost") { control.min = "0"; control.step = "0.01"; }
  }
  control.className = "inline-edit-control";
  control.dataset.key = key;
  control.value = value ?? "";
  if (referenceLists[key]) {
    const list = document.createElement("datalist");
    list.id = "reference-" + key + "-" + Math.random().toString(36).slice(2);
    referenceLists[key].forEach(item => {
      const option = document.createElement("option");
      option.value = item.name;
      list.append(option);
    });
    control.setAttribute("list", list.id);
    control.referenceListElement = list;
  }
  return control;
}

function startInlineEdit(row, item) {
  const cells = Array.from(row.children);
  const studentListId = "student-options-" + item.id;
  const studentInput = document.createElement("input");
  studentInput.className = "inline-edit-control student-edit-control";
  studentInput.setAttribute("list", studentListId);
  studentInput.value = item.last_name + " " + item.first_name;
  const studentList = document.createElement("datalist");
  studentList.id = studentListId;
  students.forEach(student => {
    const option = document.createElement("option");
    option.value = student.last_name + " " + student.first_name;
    option.label = student.class_name;
    studentList.append(option);
  });
  cells[0].replaceChildren(studentInput, studentList);
  const firstNameInput = makeEditControl("first_name", item.first_name);
  const classInput = makeEditControl("class_name", item.class_name);
  firstNameInput.readOnly = true;
  classInput.readOnly = true;
  cells[1].replaceChildren(firstNameInput);
  cells[2].replaceChildren(classInput);

  function chooseStudent() {
    const value = studentInput.value.trim().toLocaleLowerCase("ru");
    const selected = students.find(student =>
      (student.last_name + " " + student.first_name).toLocaleLowerCase("ru") === value ||
      (student.first_name + " " + student.last_name).toLocaleLowerCase("ru") === value
    );
    studentInput.dataset.studentId = selected?.id || "";
    firstNameInput.value = selected?.first_name || "";
    classInput.value = selected?.class_name || "";
  }
  studentInput.addEventListener("input", chooseStudent);
  chooseStudent();

  columns.slice(3).forEach(([key], index) => {
    const control = makeEditControl(key, item[key]);
    cells[index + 3].replaceChildren(control, ...(control.referenceListElement ? [control.referenceListElement] : []));
  });
  const actionsCell = cells[cells.length - 1];
  const saveButton = document.createElement("button");
  saveButton.textContent = "Сохранить";
  const cancelButton = document.createElement("button");
  cancelButton.className = "secondary";
  cancelButton.textContent = "Отменить";
  cancelButton.addEventListener("click", render);
  saveButton.addEventListener("click", async () => {
    chooseStudent();
    const selectedStudent = students.find(student => String(student.id) === studentInput.dataset.studentId);
    if (!selectedStudent) { alert("Выберите ученика из подсказок"); studentInput.focus(); return; }
    const update = {
      student_id: selectedStudent.id,
      last_name: selectedStudent.last_name,
      first_name: selectedStudent.first_name,
      class_name: selectedStudent.class_name
    };
    const requiredReferenceKeys = ["event_name", "project_name", "result", "supervisor_name", "organizers", "country", "city"];
    let invalidReferenceControl = null;
    row.querySelectorAll(".inline-edit-control[data-key]").forEach(control => {
      const key = control.dataset.key;
      if (key === "first_name" || key === "class_name") return;
      if (referenceLists[key] && control.value) {
        const match = referenceLists[key].find(reference => reference.name.toLocaleLowerCase("ru") === control.value.trim().toLocaleLowerCase("ru"));
        if (!match) invalidReferenceControl = control;
        if (key === "event_name" && match) update.event_id = match.id;
        if (key === "subject" && match) update.subject_id = match.id;
      }
      if (referenceLists[key] && requiredReferenceKeys.includes(key) && !control.value) invalidReferenceControl = control;
      update[key] = key === "cost" ? (control.value === "" ? null : Number(control.value)) : (control.value || null);
    });
    if (invalidReferenceControl) {
      alert("Выберите значение из подсказок базы данных");
      invalidReferenceControl.focus();
      return;
    }
    if (!update.subject) update.subject_id = null;
    const levelRank = scopeOrder.indexOf(update.achievement_level);
    const stageRank = scopeOrder.indexOf(update.event_stage);
    if (stageRank > levelRank) { alert("Этап не может быть выше уровня мероприятия"); return; }
    saveButton.disabled = true;
    saveButton.textContent = "Сохраняем...";
    const { error } = await client.from("achievements").update(update).eq("id", item.id);
    if (error) { alert("Ошибка: " + error.message); saveButton.disabled = false; saveButton.textContent = "Сохранить"; return; }
    try { localStorage.setItem("ayna-achievements-updated", String(Date.now())); } catch (_error) {}
    Object.assign(item, update);
    buildColumnFilters();
    render();
  });
  actionsCell.replaceChildren(saveButton, cancelButton);
  studentInput.focus();
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
  const actionsHead = document.createElement("th");
  actionsHead.textContent = "Действия";
  headRow.append(actionsHead);
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
    const actions = document.createElement("td");
    actions.className = "row-actions";
    const editButton = document.createElement("button");
    editButton.className = "secondary";
    editButton.textContent = "Редактировать";
    editButton.addEventListener("click", () => startInlineEdit(row, item));
    actions.append(editButton);
    row.append(actions);
    tbody.append(row);
  });
  table.append(thead, tbody); tableWrap.replaceChildren(table);
}

async function load() {
  tableWrap.textContent = "Загрузка данных…";
  const { data: sessionData } = await client.auth.getSession();
  if (!sessionData.session) { location.replace("index.html"); return; }
  const [achievementsResult, studentsResult, eventsResult, ordersResult, subjectsResult, typesResult, resultsResult, teachersResult, organizersResult, countriesResult, citiesResult] = await Promise.all([
    client.from("achievements").select("*").order("event_date", { ascending: false }),
    client.from("students").select("id,last_name,first_name,class_name").order("last_name"),
    client.from("achievement_events").select("id,name").order("name"),
    client.from("achievement_orders").select("id,name").order("name"),
    client.from("achievement_subjects").select("id,name").order("name"),
    client.from("achievement_types").select("id,name").order("name"),
    client.from("achievement_results").select("id,name").order("name"),
    client.from("teachers").select("id,last_name,first_name").order("last_name"),
    client.from("achievement_organizers").select("id,name").order("name"),
    client.from("achievement_countries").select("id,name").order("name"),
    client.from("achievement_cities").select("id,name").order("name")
  ]);
  const { data, error } = achievementsResult;
  if (error) { tableWrap.textContent = "Ошибка: " + error.message; return; }
  if (studentsResult.error) { tableWrap.textContent = "Ошибка загрузки учеников: " + studentsResult.error.message; return; }
  records = data || [];
  students = studentsResult.data || [];
  const referenceResults = [eventsResult, ordersResult, subjectsResult, typesResult, resultsResult, teachersResult, organizersResult, countriesResult, citiesResult];
  const referenceError = referenceResults.find(result => result.error)?.error;
  if (referenceError) { tableWrap.textContent = "Ошибка загрузки справочников: " + referenceError.message; return; }
  referenceLists = {
    event_name: eventsResult.data || [],
    order_reference: ordersResult.data || [],
    subject: subjectsResult.data || [],
    project_name: typesResult.data || [],
    result: resultsResult.data || [],
    supervisor_name: (teachersResult.data || []).map(teacher => ({ id: teacher.id, name: teacher.last_name + " " + teacher.first_name })),
    organizers: organizersResult.data || [],
    country: countriesResult.data || [],
    city: citiesResult.data || []
  };
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

(function () {
  "use strict";

  const lookalikes = {
    "А": "A", "В": "B", "С": "C", "Е": "E", "Н": "H", "К": "K",
    "М": "M", "О": "O", "Р": "P", "Т": "T", "Х": "X", "У": "Y"
  };

  function normalize(value) {
    const text = String(value ?? "").trim().replace(/\s+/g, " ");
    const match = /^(\d{1,2})\s*([\p{L}])$/u.exec(text);
    if (!match) return text;
    const letter = match[2].toLocaleUpperCase("ru");
    return Number(match[1]) + " " + (lookalikes[letter] || letter);
  }

  function normalizeShiftMap(value) {
    const result = {};
    for (const [name, shift] of Object.entries(value || {})) {
      const canonical = normalize(name);
      if (canonical && !Object.hasOwn(result, canonical)) result[canonical] = shift;
    }
    return result;
  }

  window.AynaClass = Object.freeze({ normalize, normalizeShiftMap });
})();

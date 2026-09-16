(function () {
  "use strict";
  function ensureToastRegion() {
    let region = document.querySelector(".ayna-toast-region");
    if (region) return region;
    region = document.createElement("div");
    region.className = "ayna-toast-region";
    region.setAttribute("aria-live", "polite");
    document.body.append(region);
    return region;
  }
  function notify(message, type, duration) {
    const toast = document.createElement("div");
    toast.className = "ayna-toast" + (type ? " is-" + type : "");
    const text = document.createElement("span");
    text.textContent = String(message || "");
    const close = document.createElement("button");
    close.type = "button";
    close.setAttribute("aria-label", "Закрыть уведомление");
    close.textContent = "×";
    const remove = function () { toast.remove(); };
    close.addEventListener("click", remove);
    toast.append(document.createElement("span"), text, close);
    ensureToastRegion().append(toast);
    window.setTimeout(remove, duration || (type === "error" ? 7000 : 4200));
  }
  function confirmAction(message, options) {
    const settings = options || {};
    return new Promise(function (resolve) {
      const dialog = document.createElement("dialog");
      dialog.className = "ayna-dialog";
      dialog.innerHTML = '<div class="ayna-dialog__body"><h2 class="ayna-dialog__title"></h2><p class="ayna-dialog__message"></p></div><div class="ayna-dialog__actions"><button type="button" class="ayna-dialog__cancel">Отмена</button><button type="button" class="ayna-dialog__confirm">Подтвердить</button></div>';
      dialog.querySelector(".ayna-dialog__title").textContent = settings.title || "Подтвердите действие";
      dialog.querySelector(".ayna-dialog__message").textContent = String(message || "");
      const cancel = dialog.querySelector(".ayna-dialog__cancel");
      const confirm = dialog.querySelector(".ayna-dialog__confirm");
      confirm.textContent = settings.confirmText || (settings.danger ? "Удалить" : "Подтвердить");
      if (settings.danger) confirm.classList.add("is-danger");
      let finished = false;
      const finish = function (value) { if (finished) return; finished = true; dialog.close(); dialog.remove(); resolve(value); };
      cancel.addEventListener("click", function () { finish(false); });
      confirm.addEventListener("click", function () { finish(true); });
      dialog.addEventListener("cancel", function (event) { event.preventDefault(); finish(false); });
      dialog.addEventListener("click", function (event) { if (event.target === dialog) finish(false); });
      document.body.append(dialog);
      dialog.showModal();
      confirm.focus();
    });
  }
  function withTimeout(promise, timeoutMs, message) {
    const timeout = Number(timeoutMs) > 0 ? Number(timeoutMs) : 20000;
    return Promise.race([promise, new Promise(function (_, reject) { window.setTimeout(function () { reject(new Error(message || "Сервер не ответил вовремя. Попробуйте ещё раз.")); }, timeout); })]);
  }
  window.AynaUI = { notify: notify, confirm: confirmAction, withTimeout: withTimeout };
  window.alert = function (message) { notify(message, /ошиб|не удалось/i.test(String(message)) ? "error" : "warning"); };
})();

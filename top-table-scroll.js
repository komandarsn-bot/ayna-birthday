(function () {
  const selector = ".achievement-table-wrap, .scoring-table-wrap, .table-wrap";

  function connectTableScroller(tableWrap) {
    if (tableWrap.dataset.topScrollerReady === "true") return;
    tableWrap.dataset.topScrollerReady = "true";

    const topScroller = document.createElement("div");
    topScroller.className = "table-top-scroll";
    topScroller.setAttribute("aria-label", "Горизонтальная прокрутка таблицы");
    const track = document.createElement("div");
    track.className = "table-top-scroll-track";
    topScroller.append(track);
    tableWrap.before(topScroller);

    let syncing = false;
    function update() {
      const table = tableWrap.querySelector("table");
      const contentWidth = table ? table.scrollWidth : tableWrap.scrollWidth;
      track.style.width = Math.max(contentWidth, tableWrap.clientWidth) + "px";
      topScroller.hidden = !table || contentWidth <= tableWrap.clientWidth + 1;
      if (!syncing) topScroller.scrollLeft = tableWrap.scrollLeft;
    }

    topScroller.addEventListener("scroll", () => {
      if (syncing) return;
      syncing = true;
      tableWrap.scrollLeft = topScroller.scrollLeft;
      syncing = false;
    });
    tableWrap.addEventListener("scroll", () => {
      if (syncing) return;
      syncing = true;
      topScroller.scrollLeft = tableWrap.scrollLeft;
      syncing = false;
    });

    new MutationObserver(update).observe(tableWrap, { childList: true, subtree: true });
    if (window.ResizeObserver) new ResizeObserver(update).observe(tableWrap);
    window.addEventListener("resize", update);
    update();
  }

  document.querySelectorAll(selector).forEach(connectTableScroller);
})();

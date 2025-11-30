// content-get-selection.js
(() => {
  const sel = window.getSelection().toString() || "";
  const title = document.title || "";
  const url = location.href || "";
  return { text: sel, title, url };
})();

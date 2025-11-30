// options.js
document.addEventListener("DOMContentLoaded", async () => {
  const fields = ["notionToken", "notionParentId", "notionParentIsDatabase", "openaiKey", "defaultTags", "premiumEnabled"];
  const els = {};
  fields.forEach(f => els[f] = document.getElementById(f));

  // load
  chrome.storage.local.get(fields, items => {
    fields.forEach(f => {
      if (typeof items[f] === "undefined") return;
      if (typeof els[f].checked === "boolean") {
        els[f].checked = !!items[f];
      } else {
        els[f].value = Array.isArray(items[f]) ? items[f].join(",") : items[f];
      }
    });
  });

  document.getElementById("saveBtn").addEventListener("click", () => {
    const payload = {
      notionToken: els.notionToken.value || "",
      notionParentId: els.notionParentId.value || "",
      notionParentIsDatabase: !!els.notionParentIsDatabase.checked,
      openaiKey: els.openaiKey.value || "",
      defaultTags: (els.defaultTags.value || "").split(",").map(s => s.trim()).filter(Boolean),
      premiumEnabled: !!els.premiumEnabled.checked
    };
    chrome.storage.local.set(payload, () => {
      alert("Settings saved.");
    });
  });

  document.getElementById("clearBtn").addEventListener("click", () => {
    if (!confirm("Clear all stored settings?")) return;
    chrome.storage.local.clear(() => {
      alert("Cleared.");
      location.reload();
    });
  });
});

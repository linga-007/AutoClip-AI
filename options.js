// AutoClip Options - Enhanced UX (Notion-only)
document.addEventListener("DOMContentLoaded", async () => {
  const fields = ["notionToken", "notionParentId", "notionParentIsDatabase"];
  const els = {};
  fields.forEach(f => els[f] = document.getElementById(f));

  const saveBtn = document.getElementById("saveBtn");
  const clearBtn = document.getElementById("clearBtn");
  const statusEl = document.getElementById("status");

  // Utility functions
  function showStatus(message, type = "success", duration = 3000) {
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = "flex";

    if (duration > 0) {
      setTimeout(() => {
        statusEl.style.display = "none";
      }, duration);
    }
  }

  function setLoading(button, loading) {
    if (loading) {
      button.disabled = true;
      button.dataset.originalText = button.innerHTML;
      button.innerHTML = '<span class="btn-icon">⏳</span> Saving...';
    } else {
      button.disabled = false;
      button.innerHTML = button.dataset.originalText;
    }
  }

  function validateForm() {
    const errors = [];

    // Required fields validation
    if (!els.notionToken.value.trim()) {
      errors.push("Notion Integration Token is required");
      els.notionToken.classList.add("error");
    } else {
      els.notionToken.classList.remove("error");
    }

    if (!els.notionParentId.value.trim()) {
      errors.push("Notion Parent Page/Database ID is required");
      els.notionParentId.classList.add("error");
    } else {
      els.notionParentId.classList.remove("error");
    }

    // Token format validation
    // if (els.notionToken.value.trim() && !els.notionToken.value.startsWith("secret_")) {
    //   errors.push("Notion token should start with 'secret_'");
    //   els.notionToken.classList.add("error");
    // }

    return errors;
  }

  // Load saved settings
  chrome.storage.local.get(fields, items => {
    fields.forEach(f => {
      if (typeof items[f] === "undefined") return;
      if (typeof els[f].checked === "boolean") {
        els[f].checked = !!items[f];
      } else {
        els[f].value = Array.isArray(items[f]) ? items[f].join(", ") : items[f];
      }
    });
  });

  // Save settings with validation and better UX
  saveBtn.addEventListener("click", () => {
    // Clear any previous status
    statusEl.style.display = "none";

    // Validate form
    const errors = validateForm();
    if (errors.length > 0) {
      showStatus(`Please fix the following errors:\n• ${errors.join("\n• ")}`, "error", 5000);
      return;
    }

    // Set loading state
    setLoading(saveBtn, true);

    const payload = {
      notionToken: els.notionToken.value.trim(),
      notionParentId: els.notionParentId.value.trim(),
      notionParentIsDatabase: !!els.notionParentIsDatabase.checked
    };

    chrome.storage.local.set(payload, () => {
      if (chrome.runtime.lastError) {
        showStatus("Error saving settings: " + chrome.runtime.lastError.message, "error");
      } else {
        showStatus("✅ Settings saved successfully!", "success");
      }
      setLoading(saveBtn, false);
    });
  });

  // Clear all settings with confirmation
  clearBtn.addEventListener("click", () => {
    if (!confirm("⚠️ Are you sure you want to clear all settings?\n\nThis will remove your Notion integration, API keys, and all preferences.")) {
      return;
    }

    setLoading(clearBtn, true);
    statusEl.style.display = "none";

    chrome.storage.local.clear(() => {
      if (chrome.runtime.lastError) {
        showStatus("Error clearing settings: " + chrome.runtime.lastError.message, "error");
        setLoading(clearBtn, false);
      } else {
        showStatus("🗑️ All settings cleared successfully!", "success");
        setTimeout(() => {
          location.reload();
        }, 1500);
      }
    });
  });

  // Real-time validation feedback
  const requiredInputs = [els.notionToken, els.notionParentId];
  requiredInputs.forEach(input => {
    input.addEventListener("input", () => {
      if (input.value.trim()) {
        input.classList.remove("error");
      }
    });

    input.addEventListener("blur", () => {
      if (!input.value.trim()) {
        input.classList.add("error");
      }
    });
  });

  // Token format validation
  els.notionToken.addEventListener("input", () => {
    const value = els.notionToken.value.trim();
    if (value) {
      els.notionToken.classList.add("error");
    } else {
      els.notionToken.classList.remove("error");
    }
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + S to save
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      saveBtn.click();
    }
  });

  // Show helpful hint on first load if no settings are configured
  chrome.storage.local.get(fields, items => {
    const hasAnySettings = fields.some(f => {
      if (typeof items[f] === "boolean") return items[f];
      if (Array.isArray(items[f])) return items[f].length > 0;
      return items[f] && items[f].trim();
    });

    if (!hasAnySettings) {
      setTimeout(() => {
        showStatus("👋 Welcome! Configure your Notion integration to get started.", "success", 5000);
      }, 1000);
    }
  });
});

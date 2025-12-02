// background.js - Minimal: save ONLY the selected text to Notion (no metadata)
// - Normalizes pasted Notion IDs/URLs
// - Creates a child page (or database row if database_id chosen)
// - Page body contains exactly the selected text (paragraph block)

const CONTEXT_MENU_ID = "quick-highlight-save-to-notion";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Save to Notion",
    contexts: ["selection"]
  });
});

// execute content script to read selection, title & url
async function getSelectionInfo(tabId) {
  const result = await chrome.scripting.executeScript({
    target: { tabId },
    files: ['content-get-selection.js']
  });
  return result?.[0]?.result || { text: "", title: "", url: "" };
}

async function fetchFromStorage(keys = []) {
  return new Promise(resolve => {
    chrome.storage.local.get(keys, items => resolve(items));
  });
}

// normalize Notion id - accepts full URLs, Title-<32hex>, 32hex or dashed uuid
function normalizeNotionId(raw) {
  if (!raw) return null;
  raw = raw.toString().trim();

  // if it's a full URL, extract last path segment
  try {
    const u = new URL(raw);
    const parts = u.pathname.split('/');
    raw = parts[parts.length - 1] || raw;
  } catch (e) {
    // not a URL - continue
  }

  // strip query/fragment
  raw = raw.split(/[?#]/)[0];

  // If it ends with 32 hex chars, extract that
  const m = raw.match(/[0-9a-fA-F]{32}$/);
  if (m) raw = m[0];

  // if already dashed uuid, return lowercased
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(raw)) {
    return raw.toLowerCase();
  }

  // if plain 32 hex, insert dashes
  const cleaned = raw.replace(/[^0-9a-fA-F]/g, '');
  if (/^[0-9a-fA-F]{32}$/.test(cleaned)) {
    return [
      cleaned.slice(0,8),
      cleaned.slice(8,12),
      cleaned.slice(12,16),
      cleaned.slice(16,20),
      cleaned.slice(20)
    ].join('-').toLowerCase();
  }

  // fallback - return original
  return raw;
}

// Create children blocks: selected text split by lines, each line as a separate paragraph block
function makeNotionChildrenBlocks({ selection }) {
  const children = [];
  const textContent = selection || "";

  // Split text by newlines and create separate paragraph blocks for each line
  const lines = textContent.split('\n').filter(line => line.trim().length > 0);

  lines.forEach(line => {
    children.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          { type: "text", text: { content: line.trim() } }
        ]
      }
    });
  });

  // If no non-empty lines, add an empty paragraph to avoid empty content
  if (children.length === 0) {
    children.push({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [
          { type: "text", text: { content: "" } }
        ]
      }
    });
  }

  return children;
}

// Create a Notion entry:
// - If parent is a DATABASE  -> create a new page in the database (required by Notion)
// - If parent is a PAGE      -> append blocks directly to that page (no extra sub-page)
async function createNotionPage(notionToken, parentId, isDatabase, selection) {
  let endpoint;
  let method = "POST";
  let body;

  if (isDatabase) {
    // Minimal database write: use `Name` title property. If your DB requires other props, you must add them.
    const timestamp = new Date().toLocaleString();
    const titleValue = `Highlight - ${timestamp}`;

    endpoint = "https://api.notion.com/v1/pages";
    body = {
      parent: { database_id: parentId },
      properties: {
        Name: {
          title: [{ text: { content: titleValue } }]
        }
      },
      children: makeNotionChildrenBlocks({ selection })
    };
  } else {
    // Parent is a normal page: just append the text blocks directly to it
    endpoint = `https://api.notion.com/v1/blocks/${parentId}/children`;
    method = "PATCH";
    body = {
      children: makeNotionChildrenBlocks({ selection })
    };
  }

  const resp = await fetch(endpoint, {
    method,
    headers: {
      "Authorization": `Bearer ${notionToken}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error("Notion API error: " + text);
  }
  return resp.json();
}

function downloadMarkdown(filename, markdown) {
  const blob = new Blob([markdown], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  chrome.downloads.download({ url, filename }, () => {
    URL.revokeObjectURL(url);
  });
}

function makeMarkdown({ selection }) {
  // Very minimal fallback file: only the selection text
  const md = selection || "";
  return md;
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) return;

  try {
    const sel = await getSelectionInfo(tab.id);
    const storage = await fetchFromStorage([
      "notionToken", "notionParentId", "notionParentIsDatabase"
    ]);

    const notionTokenRaw = storage.notionToken || "";
    const notionParentIdRaw = storage.notionParentId || "";
    const notionParentIsDatabase = !!storage.notionParentIsDatabase;

    const notionToken = notionTokenRaw;
    const notionParentId = normalizeNotionId(notionParentIdRaw);

    const selection = (sel.text || "").trim();
    if (!selection) {
      // nothing selected
      chrome.notifications?.create?.({
        type: "basic",
        iconUrl: "icons/icon48.png",
        title: "Nothing selected",
        message: "Please select some text before using Save to Notion."
      });
      return;
    }

    // If Notion token and parent provided, attempt to save
    if (notionToken && notionParentId) {
      try {
        await createNotionPage(notionToken, notionParentId, notionParentIsDatabase, selection);
        chrome.notifications?.create?.({
          type: "basic",
          iconUrl: "icons/icon48.png",
          title: "Saved to Notion",
          message: "Selection saved."
        });
        return;
      } catch (e) {
        console.error("Failed to save to Notion", e);
        // fall through to local fallback
      }
    }

    // Fallback: create a markdown download (only selection) and attempt to copy to clipboard
    const md = makeMarkdown({ selection });
    const fname = `highlight-${new Date().toISOString().replace(/[:.]/g, "-")}.md`;
    downloadMarkdown(fname, md);

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (text) => navigator.clipboard.writeText(text),
        args: [md]
      });
    } catch (e) {
      // ignore clipboard failures
    }

    chrome.notifications?.create?.({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Saved locally",
      message: "No Notion target configured — saved markdown and copied to clipboard."
    });

  } catch (err) {
    console.error("Error saving highlight", err);
    chrome.notifications?.create?.({
      type: "basic",
      iconUrl: "icons/icon48.png",
      title: "Save failed",
      message: "See extension console for details."
    });
  }
});

# AutoClip AI — Chrome Extension

AutoClip AI lets you right‑click any selected text in Chrome and send it straight to a Notion page or database.

## Install from Chrome Web Store
1. Open the **Chrome Web Store**.
2. Search for **“AutoClip AI”**.
3. Click **Add to Chrome** → **Add extension**.
4. After installation, optionally pin the extension from the Chrome toolbar for quick access.

## Set up Notion connection
1. In Chrome, right‑click the AutoClip AI icon in the toolbar and choose **Options**  
   *(or go to `chrome://extensions` → **Details** → **Extension options`)*.
2. In the options page:
   - **Integration Token**  
     - Go to `https://www.notion.so/my-integrations`.  
     - Create a new internal integration and copy the **Internal Integration Token**.  
     - Paste it into the **Integration Token** field.
   - **Parent Page / Database ID**  
     - Open the Notion page or database where you want to save highlights.  
     - Copy the ID from the URL (the long string in the address bar).  
     - Paste it into the **Parent Page/Database ID** field.
   - **This is a database (not a page)**  
     - Leave **unchecked** if you are saving directly into a normal Notion page (highlights are appended as blocks).  
     - Check it if the ID is a **database** and you want each highlight as a new row.
3. Click **Save Settings**.

## Use AutoClip AI
1. Select any text on a webpage.
2. Right‑click and choose **Save to Notion**.
3. If the parent is:
   - A **page**: the selected text is appended as one or more paragraph blocks directly into that page (no extra sub‑page).
   - A **database**: a new entry is created in the database with your selected text as the content.
4. If Notion is not configured, AutoClip AI falls back to saving a local markdown file and copying the text to your clipboard.

## Security
- Your Notion token and IDs are stored only in `chrome.storage.local`, which is private to the extension on your machine.  
- Treat your integration token as a secret; you can always revoke it from `https://www.notion.so/my-integrations`.
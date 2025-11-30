# Quick Highlight & Save — Chrome Extension

## Install (developer mode)
1. Open `chrome://extensions`.
2. Enable "Developer mode".
3. Click "Load unpacked" and select this `quick-highlight-save` folder.

## Get Notion integration token
1. Go to https://www.notion.so/my-integrations
2. Create an integration and copy the "Internal Integration Token"
3. Invite the integration to the page or database you want to write into.
4. Copy the page ID (or database ID) and paste into options.

## Optional: Get OpenAI API key
1. Create an API key at https://platform.openai.com/
2. Paste it into the extension options to enable AI-powered summaries.

## Usage
1. Select text on any webpage.
2. Right-click → **Save to Notion**
3. If configured, it will create a new page in your Notion. Otherwise it will download a markdown file and copy the text to clipboard.

## Security
- Tokens are stored in `chrome.storage.local` (private to extension). Treat them as secrets.
- For production / store distribution: implement OAuth flows with Notion (server-side) rather than storing tokens client-side.


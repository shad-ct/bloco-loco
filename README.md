# Smart History Blocker

This extension is built with Manifest V3 and is compatible with both **Google Chrome** and **Microsoft Edge**.

## 📦 Installation Instructions

### Google Chrome
1. Open `chrome://extensions` in your address bar.
2. Toggle **Developer mode** on in the top right corner.
3. Click the **Load unpacked** button.
4. Select the `extension` folder from this project.

### Microsoft Edge
1. Open `edge://extensions` in your address bar.
2. Toggle **Developer mode** on (usually in the left sidebar or bottom left).
3. Click **Load unpacked**.
4. Select the `extension` folder from this project.

## 🔑 Setup
1. Click the extension icon in the browser toolbar.
2. You will be asked for a **Gemini API Key**.
3. Get a key from [Google AI Studio](https://aistudio.google.com/app/apikey).
4. Paste it into the extension and click **Save**.

## 🧩 Compatibility Note
This extension uses the `chrome.*` namespace APIs (e.g., `chrome.runtime`, `chrome.storage`), which are fully supported by Microsoft Edge for compatibility. No code changes are required to run this in Edge.

# Smart History Blocker & Categorizer

A powerful browser extension that uses Google's Gemini AI to categorize your browsing history and block distracting content. Compatible with **Google Chrome**, **Microsoft Edge**, and other Chromium-based browsers.

## ✨ Features

*   **AI-Powered Categorization**: Automatically categorizes your history into topics like Education, Entertainment, Coding, Social Media, etc.
*   **Smart Blocking**:
    *   **Block by Category**: Toggle entire categories off (e.g., block all "Entertainment" sites).
    *   **Block by Title**: Block specific pages based on keywords in their title.
    *   **Block by Site**: Block entire domains (e.g., `youtube.com`).
*   **Privacy Focused**: Your API key is stored locally on your device.

## 🚀 Installation Guide

### 1. Get the Code
If you haven't already, download or clone this repository to your computer.

### 2. Load into Browser

#### Google Chrome
1.  Open Chrome and navigate to `chrome://extensions`.
2.  Enable **Developer mode** (toggle in the top-right corner).
3.  Click the **Load unpacked** button.
4.  Select the `extension` folder from this project.

#### Microsoft Edge
1.  Open Edge and navigate to `edge://extensions`.
2.  Enable **Developer mode** (toggle in the sidebar or bottom-left).
3.  Click **Load unpacked**.
4.  Select the `extension` folder from this project.

### 3. Setup API Key
1.  Click the extension icon in your browser toolbar (puzzle piece icon).
2.  You will be prompted to enter a **Gemini API Key**.
3.  [Get a free API Key from Google AI Studio](https://aistudio.google.com/app/apikey).
4.  Paste the key and click **Save**.

## 📦 How to Export (Pack) for Distribution

If you want to share this extension as a single `.crx` file or upload it to the Web Store:

1.  Go to `chrome://extensions` (or `edge://extensions`).
2.  Click the **Pack extension** button.
3.  **Extension root directory**: Browse and select the `extension` folder.
4.  **Private key file**: Leave blank for the first time (Chrome will generate one for you).
5.  Click **Pack Extension**.
6.  You will get two files:
    *   `extension.crx`: The installable extension file.
    *   `extension.pem`: Your private key (keep this safe! You need it to update the extension later).

## 🛠️ Troubleshooting

*   **"Gemini API Error"**: Ensure your API key is valid and you have internet access.
*   **Extension not blocking?**: Try refreshing the page or restarting the browser. Some changes require a page reload to take effect.
*   **Edge Compatibility**: If blocking feels slow, ensure you are using the "Block Site" feature for domain-level blocking, which is faster.

## 📄 License
This project is open source. Feel free to modify and improve it!

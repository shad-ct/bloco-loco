document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const reason = params.get('reason') || "Unknown Reason";
  const detected = params.get('detected') || "";

  document.getElementById('reasonText').textContent = `${reason} (${detected})`;

  document.getElementById('bypassBtn').addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'addBypass' }, (response) => {
      if (response && response.success) {
        window.history.back();
        // Fallback if back doesn't work or is empty
        setTimeout(() => {
            window.close();
        }, 500);
      }
    });
  });
});
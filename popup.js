document.addEventListener('DOMContentLoaded', () => {
  const apiKeyScreen = document.getElementById('apiKeyScreen');
  const mainApp = document.getElementById('mainApp');
  const apiKeyInput = document.getElementById('apiKeyInput');
  const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
  const changeApiKeyLink = document.getElementById('changeApiKey');
  
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  const categorizeBtn = document.getElementById('categorizeBtn');
  const historyList = document.getElementById('historyList');
  const categoryFilter = document.getElementById('categoryFilter');
  const refreshHistoryBtn = document.getElementById('refreshHistoryBtn');
  
  const categoryBlockList = document.getElementById('categoryBlockList');
  const blockTitleInput = document.getElementById('blockTitleInput');
  const addBlockTitleBtn = document.getElementById('addBlockTitleBtn');
  const blockedTitlesList = document.getElementById('blockedTitlesList');

  const currentDomainSpan = document.getElementById('currentDomain');
  const blockCurrentSiteBtn = document.getElementById('blockCurrentSiteBtn');
  const blockSiteInput = document.getElementById('blockSiteInput');
  const addBlockSiteBtn = document.getElementById('addBlockSiteBtn');
  const blockedSitesList = document.getElementById('blockedSitesList');

  const ALL_CATEGORIES = ["Education", "Entertainment", "Gaming", "News", "Social Media", "Adult", "Sports", "Shopping", "Coding", "Productivity", "Others"];

  // Check API Key
  chrome.storage.local.get(['apiKey', 'blockedCategories', 'blockedTitles', 'blockedSites'], (result) => {
    if (result.apiKey) {
      showMainApp();
      loadBlockSettings(result);
    } else {
      apiKeyScreen.classList.remove('hidden');
    }
  });

  // Save API Key
  saveApiKeyBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    if (key) {
      chrome.runtime.sendMessage({ action: 'setApiKey', key }, () => {
        showMainApp();
      });
    }
  });

  // Change API Key
  changeApiKeyLink.addEventListener('click', () => {
    chrome.storage.local.remove('apiKey', () => {
      mainApp.classList.add('hidden');
      apiKeyScreen.classList.remove('hidden');
    });
  });

  function showMainApp() {
    apiKeyScreen.classList.add('hidden');
    mainApp.classList.remove('hidden');
    loadHistory();
    renderCategoryToggles();
    renderBlockedTitles();
    renderBlockedSites();
    detectCurrentSite();
  }

  // Tabs
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // History Logic
  categorizeBtn.addEventListener('click', () => {
    categorizeBtn.textContent = "Categorizing... (this may take a while)";
    categorizeBtn.disabled = true;
    chrome.runtime.sendMessage({ action: 'categorizeHistory', days: 7 }, (response) => {
      categorizeBtn.textContent = "Categorize Last 7 Days";
      categorizeBtn.disabled = false;
      if (response.items) {
        renderHistory(response.items);
      }
    });
  });

  refreshHistoryBtn.addEventListener('click', loadHistory);

  function loadHistory() {
    chrome.storage.local.get(['titleCache'], (result) => {
      // We can't easily get the full history list from cache alone, 
      // so we might need to ask background to fetch history again using cache.
      // For simplicity, let's just trigger a fetch without re-categorizing everything (background handles cache).
      chrome.runtime.sendMessage({ action: 'categorizeHistory', days: 7 }, (response) => {
        if (response.items) {
          renderHistory(response.items);
        }
      });
    });
  }

  function renderHistory(items) {
    historyList.innerHTML = '';
    const filter = categoryFilter.value;
    
    // Populate Filter if empty
    if (categoryFilter.options.length === 1) {
      ALL_CATEGORIES.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categoryFilter.appendChild(opt);
      });
    }

    const filtered = filter === 'all' ? items : items.filter(i => i.category === filter);

    if (filtered.length === 0) {
      historyList.innerHTML = '<div class="empty-state">No items found.</div>';
      return;
    }

    filtered.forEach(item => {
      const div = document.createElement('div');
      div.className = 'history-item';
      div.innerHTML = `
        <div class="history-title" title="${item.title}">${item.title}</div>
        <div class="history-url" title="${item.url}">${item.url}</div>
        <span class="badge">${item.category}</span>
      `;
      historyList.appendChild(div);
    });
  }

  categoryFilter.addEventListener('change', loadHistory);

  // Block Logic
  function loadBlockSettings(data) {
    // Initial load handled by render functions reading storage
  }

  function detectCurrentSite() {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        try {
          const url = new URL(tabs[0].url);
          const domain = url.hostname;
          currentDomainSpan.textContent = domain;
          
          blockCurrentSiteBtn.onclick = () => {
            addBlockedSite(domain);
          };
        } catch (e) {
          currentDomainSpan.textContent = "Unknown";
        }
      }
    });
  }

  function addBlockedSite(site) {
    if (!site) return;
    chrome.storage.local.get(['blockedSites'], (result) => {
      const sites = result.blockedSites || [];
      if (!sites.includes(site)) {
        sites.push(site);
        chrome.storage.local.set({ blockedSites: sites }, () => {
          renderBlockedSites();
          if (blockSiteInput) blockSiteInput.value = '';
        });
      }
    });
  }

  function renderBlockedSites() {
    chrome.storage.local.get(['blockedSites'], (result) => {
      const sites = result.blockedSites || [];
      blockedSitesList.innerHTML = '';
      
      sites.forEach((site, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span>${site}</span>
          <button class="delete-btn" data-index="${index}">🗑️</button>
        `;
        blockedSitesList.appendChild(li);
      });

      blockedSitesList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.dataset.index);
          sites.splice(idx, 1);
          chrome.storage.local.set({ blockedSites: sites }, renderBlockedSites);
        });
      });
    });
  }

  addBlockSiteBtn.addEventListener('click', () => {
    addBlockedSite(blockSiteInput.value.trim());
  });

  function renderCategoryToggles() {
    chrome.storage.local.get(['blockedCategories'], (result) => {
      const blocked = result.blockedCategories || {};
      categoryBlockList.innerHTML = '';
      
      ALL_CATEGORIES.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'toggle-item';
        const isBlocked = !!blocked[cat];
        div.innerHTML = `
          <span>${cat}</span>
          <label class="switch">
            <input type="checkbox" ${isBlocked ? 'checked' : ''} data-cat="${cat}">
            <span class="slider round"></span>
          </label>
        `;
        categoryBlockList.appendChild(div);
      });

      // Add listeners
      categoryBlockList.querySelectorAll('input').forEach(input => {
        input.addEventListener('change', (e) => {
          const cat = e.target.dataset.cat;
          blocked[cat] = e.target.checked;
          chrome.storage.local.set({ blockedCategories: blocked });
        });
      });
    });
  }

  function renderBlockedTitles() {
    chrome.storage.local.get(['blockedTitles'], (result) => {
      const titles = result.blockedTitles || [];
      blockedTitlesList.innerHTML = '';
      
      titles.forEach((title, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span>${title}</span>
          <button class="delete-btn" data-index="${index}">🗑️</button>
        `;
        blockedTitlesList.appendChild(li);
      });

      blockedTitlesList.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.dataset.index);
          titles.splice(idx, 1);
          chrome.storage.local.set({ blockedTitles: titles }, renderBlockedTitles);
        });
      });
    });
  }

  addBlockTitleBtn.addEventListener('click', () => {
    const title = blockTitleInput.value.trim();
    if (title) {
      chrome.storage.local.get(['blockedTitles'], (result) => {
        const titles = result.blockedTitles || [];
        if (!titles.includes(title)) {
          titles.push(title);
          chrome.storage.local.set({ blockedTitles: titles }, () => {
            blockTitleInput.value = '';
            renderBlockedTitles();
          });
        }
      });
    }
  });
});
document.addEventListener('DOMContentLoaded', function () {
  initIPCheck();
  initNavbar();
  initThemeToggle();
  initChat();
  initColorPalette();
  initClock();
});

// 1. IP 檢查與阻擋
function initIPCheck() {
  fetch('https://ipapi.co/json/')
    .then(res => res.json())
    .then(data => {
      document.getElementById('ip-address').textContent = data.ip;
      if (data.country !== 'TW') showIPBlock(data);
    })
    .catch(() => showIPBlock(null));
}
function showIPBlock(data) {
  const ipBlock = document.getElementById('ip-block');
  ipBlock.querySelector('.block-msg').textContent = data ? '訪問失敗' : '系統錯誤';
  ipBlock.querySelector('.ip-detail').innerHTML = data
    ? `IP 位置: ${data.ip}<br>國家: ${data.country_name} (${data.country})`
    : '';
  ipBlock.querySelector('.block-detail').textContent = data
    ? '請使用台灣 IP 或 VPN 訪問'
    : '無法驗證您的區域，請稍後再試';
  ipBlock.style.display = 'block';
  document.querySelector('main').style.display = 'none';
  document.getElementById('darkModeToggle').style.display = 'none';
}

// 2. 導覽列切換
function initNavbar() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      if (this.classList.contains('active')) return;
      navLinks.forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');
      switchSection(this.getAttribute('href'));
    });
  });
  window.addEventListener('popstate', () => switchSection(window.location.hash || '#home-section'));
  switchSection(window.location.hash || '#home-section');
}
function switchSection(hash) {
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active', 'fade-out'));
  document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
  const target = document.querySelector(hash);
  if (target) {
    target.classList.add('active');
    const nav = document.querySelector(`.nav-link[href="${hash}"]`);
    if (nav) nav.classList.add('active');
    document.title = {
      '#home-section': '首頁 | 系統名稱',
      '#chat-section': '對話框 | 系統名稱',
      '#team-section': '團隊介紹 | 系統名稱',
      '#login-section': '登入 | 系統名稱'
    }[hash] || '系統名稱';
    history.pushState({}, '', hash);
  }
}

// 3. 亮/暗模式切換
function initThemeToggle() {
  const checkbox = document.getElementById('checkbox');
  const body = document.body;
  checkbox.addEventListener('change', () => {
    body.classList.toggle('dark-mode', checkbox.checked);
    body.classList.toggle('light-mode', !checkbox.checked);
  });
  body.classList.add('light-mode');
}

// 4. 對話框功能
function initChat() {
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const fileUpload = document.getElementById('file-upload');
  const chatHistory = document.getElementById('chat-history');
  const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';

  async function handleSend() {
    const message = messageInput.value.trim();
    if (!message) return;
    addMessage('user', message);
    messageInput.value = '';
    addMessage('system', '請稍等', true);
    try {
      const gptReply = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: message }]
        })
      }).then(res => res.json());
      if (gptReply?.choices?.[0]) {
        addMessage('system', `${getCurrentTime()} ${gptReply.choices[0].message.content}`);
      } else {
        addMessage('system', `${getCurrentTime()} 發生錯誤，請重新確認內容`);
      }
    } catch {
      addMessage('system', `${getCurrentTime()} 發生錯誤，請重新確認內容`);
    }
  }

  function addMessage(type, content, isTemp = false) {
    if (!isTemp) {
      const tempMsg = document.getElementById('temp-msg');
      if (tempMsg) tempMsg.remove();
    }
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}-message`;
    if (isTemp) msgDiv.id = 'temp-msg';
    msgDiv.innerHTML = content;
    if (!isTemp && type === 'user') {
      const timestamp = document.createElement('div');
      timestamp.className = 'timestamp';
      timestamp.textContent = getCurrentTime();
      msgDiv.appendChild(timestamp);
    }
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  function getCurrentTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  }

  messageInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSend(); });
  sendBtn.addEventListener('click', handleSend);

  fileUpload.addEventListener('change', function (e) {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      const isValid = file.name.endsWith('.docx') || file.name.endsWith('.csv');
      addMessage('system', `檔案檢測: ${file.name}`, true);
      setTimeout(() => {
        addMessage('system', isValid
          ? `${getCurrentTime()} 「${file.name}」 上傳成功`
          : `${getCurrentTime()} 發生錯誤，請重新確認內容`);
      }, 500);
    }
  });
}

// 5. 主題色調色盤
function initColorPalette() {
  const colorMap = {
    red: "#e74c3c", orange: "#ffa500", yellow: "#ffe066",
    green: "#4caf50", blue: "#4f8cff", purple: "#a259e6"
  };
  function applyTheme(colorKey) {
    document.documentElement.style.setProperty('--accent', colorMap[colorKey]);
  }
  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
      this.classList.add('selected');
      applyTheme(this.dataset.color);
    });
  });
  const selectedBtn = document.querySelector('.color-btn.selected');
  if (selectedBtn) applyTheme(selectedBtn.dataset.color);
}

// 6. 時鐘顯示
function initClock() {
  const digitMap = {
    0: [1, 1, 1, 1, 1, 1, 0], 1: [0, 1, 1, 0, 0, 0, 0],
    2: [1, 1, 0, 1, 1, 0, 1], 3: [1, 1, 1, 1, 0, 0, 1],
    4: [0, 1, 1, 0, 0, 1, 1], 5: [1, 0, 1, 1, 0, 1, 1],
    6: [1, 0, 1, 1, 1, 1, 1], 7: [1, 1, 1, 0, 0, 0, 0],
    8: [1, 1, 1, 1, 1, 1, 1], 9: [1, 1, 1, 1, 0, 1, 1]
  };
  function createDigit(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    ['a', 'b', 'c', 'd', 'e', 'f', 'g'].forEach(seg => {
      const div = document.createElement('div');
      div.className = `segment segment-${seg}`;
      container.appendChild(div);
    });
  }
  ['hour1', 'hour2', 'min1', 'min2'].forEach(createDigit);
  function updateDigit(containerId, number) {
    const segments = document.querySelectorAll(`#${containerId} .segment`);
    digitMap[number].forEach((state, i) => {
      segments[i].classList.toggle('active', state === 1);
    });
  }
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  function updateWeekday() {
    const today = new Date();
    const weekdayElem = document.querySelector('.weekday');
    if (weekdayElem) weekdayElem.textContent = weekdays[today.getDay()];
  }
  function updateClock() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    updateDigit('hour1', parseInt(hours[0], 10));
    updateDigit('hour2', parseInt(hours[1], 10));
    updateDigit('min1', parseInt(minutes[0], 10));
    updateDigit('min2', parseInt(minutes[1], 10));
    updateWeekday();
  }
  updateClock();
  setInterval(updateClock, 1000);
}


document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.img-protect-wrapper').forEach(wrapper => {
    wrapper.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      alert('圖片受保護，無法下載');
    });
  });
});
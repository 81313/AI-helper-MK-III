document.addEventListener('DOMContentLoaded', function() {
  // IP 檢查與阻擋機制
  // IP 檢查與阻擋 (修正後版本)
fetch('https://ipapi.co/json/')
.then(res => {
  if (!res.ok) throw new Error('API Error');
  return res.json();
})
.then(data => {
  document.getElementById('ip-address').textContent = data.ip;
  
  if (data.country !== 'TW') {
    // 顯示錯誤訊息
    const ipBlock = document.getElementById('ip-block');
    ipBlock.querySelector('.block-msg').textContent = '訪問失敗';
    ipBlock.querySelector('.ip-detail').innerHTML = `
      IP 位置: ${data.ip}<br>
      國家: ${data.country_name} (${data.country})
    `;
    ipBlock.querySelector('.block-detail').textContent = '請使用台灣 IP 或 VPN 訪問';
    ipBlock.style.display = 'block';
    
    // 隱藏主要內容
    document.querySelector('main').style.display = 'none';
    document.getElementById('darkModeToggle').style.display = 'none';
  }
})
.catch(error => {
  console.error('IP 檢查失敗:', error);
  const ipBlock = document.getElementById('ip-block');
  ipBlock.querySelector('.block-msg').textContent = '系統錯誤';
  ipBlock.querySelector('.block-detail').textContent = '無法驗證您的區域，請稍後再試';
  ipBlock.style.display = 'block';
  
  document.querySelector('main').style.display = 'none';
  document.getElementById('darkModeToggle').style.display = 'none';
});


  // 導覽列切換功能
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      if (this.classList.contains('active')) return;
      
      document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
      this.classList.add('active');
      
      const targetId = this.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      const currentSection = document.querySelector('.page-section.active');
      
      if (currentSection) {
        currentSection.classList.remove('active');
        currentSection.classList.add('fade-out');
        setTimeout(() => {
          currentSection.classList.remove('fade-out');
          targetSection.classList.add('active');
        }, 400);
      } else {
        targetSection.classList.add('active');
      }
      
      // 動態設定標題
      const pageTitles = {
        '#home-section': '首頁 | 系統名稱',
        '#chat-section': '對話框 | 系統名稱',
        '#team-section': '團隊介紹 | 系統名稱',
        '#login-section': '登入 | 系統名稱'
      };
      document.title = pageTitles[targetId] || '系統名稱';
      history.pushState({}, '', targetId);
    });
  });

  // 處理瀏覽器返回按鈕
  window.addEventListener('popstate', function() {
    const currentHash = window.location.hash || '#home-section';
    const targetSection = document.querySelector(currentHash);
    
    document.querySelectorAll('.page-section').forEach(section => {
      section.classList.remove('active', 'fade-out');
    });
    
    document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
    
    if (targetSection) {
      targetSection.classList.add('active');
      const nav = document.querySelector(`.nav-link[href="${currentHash}"]`);
      if (nav) nav.classList.add('active');
    }
  });

  // 首次載入時根據 hash 顯示正確區塊
  (function initPage() {
    const currentHash = window.location.hash || '#home-section';
    const targetSection = document.querySelector(currentHash);
    
    document.querySelectorAll('.page-section').forEach(section => {
      section.classList.remove('active', 'fade-out');
    });
    
    document.querySelectorAll('.nav-link').forEach(nav => nav.classList.remove('active'));
    
    if (targetSection) {
      targetSection.classList.add('active');
      const nav = document.querySelector(`.nav-link[href="${currentHash}"]`);
      if (nav) nav.classList.add('active');
    }
  })();

  // 亮/暗模式切換
  document.addEventListener('DOMContentLoaded',(event) =>{
    const checkbox = document.getElementById('checkbox');
    const body = document.body;

    checkbox.addEventListener('change' , () => {
        if(checkbox.checked) {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
        }else {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode')
        }
    });

    //Set default theme
    body.classList.add('light-mode');
});

  // 對話框功能
  const messageInput = document.getElementById('message-input');
  const sendBtn = document.getElementById('send-btn');
  const fileUpload = document.getElementById('file-upload');
  const chatHistory = document.getElementById('chat-history');

  // 請替換為你的 OpenAI API Key (正式環境請改用後端轉發)
  const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY';

  async function handleSend() {
    const message = messageInput.value.trim();
    if (message) {
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
            messages: [{role: "user", content: message}]
          })
        }).then(res => res.json());

        if(gptReply?.choices?.[0]) {
          addMessage('system', `${getCurrentTime()} ${gptReply.choices[0].message.content}`);
        } else {
          addMessage('system', `${getCurrentTime()} 發生錯誤，請重新確認內容`);
        }
      } catch(e) {
        addMessage('system', `${getCurrentTime()} 發生錯誤，請重新確認內容`);
      }
    }
  }

  fileUpload.addEventListener('change', function(e) {
    if (e.target.files[0]) {
      const file = e.target.files[0];
      const isValid = file.name.endsWith('.docx') || file.name.endsWith('.csv');
      addMessage('system', `檔案檢測: ${file.name}`, true);
      setTimeout(() => {
        addMessage('system', isValid ?
          `${getCurrentTime()} 「${file.name}」 上傳成功` :
          `${getCurrentTime()} 發生錯誤，請重新確認內容`);
      }, 500);
    }
  });

  function addMessage(type, content, isTemp = false) {
    const tempMsg = document.getElementById('temp-msg');
    if (!isTemp && tempMsg) tempMsg.remove();
    
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${type}-message`;
    if (isTemp) msgDiv.id = 'temp-msg';
    msgDiv.innerHTML = content;
    
    if (!isTemp) {
      const timestamp = document.createElement('div');
      timestamp.className = 'timestamp';
      timestamp.textContent = type === 'system' ? '' : getCurrentTime();
      msgDiv.appendChild(timestamp);
    }
    
    chatHistory.appendChild(msgDiv);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  function getCurrentTime() {
    const now = new Date();
    return `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}:${now.getSeconds().toString().padStart(2,'0')}`;
  }

  messageInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') handleSend();
  });
  sendBtn.addEventListener('click', handleSend);
});

// 調色盤功能

// 主題色對應表
const colorMap = {
  red: "#e74c3c",
  orange: "#ffa500",
  yellow: "#ffe066",
  green: "#4caf50",
  blue: "#4f8cff",
  purple: "#a259e6"
};

// 切換主題色
function applyTheme(colorKey) {
  const accent = colorMap[colorKey];
  document.documentElement.style.setProperty('--accent', accent);
}

// 調色盤點擊事件
document.querySelectorAll('.color-btn').forEach(btn => {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('selected'));
    this.classList.add('selected');
    const colorKey = this.dataset.color;
    applyTheme(colorKey);
  });
});

// 頁面載入時設置預設顏色
window.addEventListener('DOMContentLoaded', () => {
  const selectedBtn = document.querySelector('.color-btn.selected');
  if (selectedBtn) {
    applyTheme(selectedBtn.dataset.color);
  }
});

document.addEventListener('DOMContentLoaded', (event) => {
  const checkbox = document.getElementById('checkbox');
  const body = document.body;
  
  checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
      body.classList.remove('light-mode');
      body.classList.add('dark-mode');
      
    } else {
      body.classList.remove('dark-mode');
      body.classList.add('light-mode');
      
    }
  });

  //Set default theme
  body.classList.add('light-mode');
});
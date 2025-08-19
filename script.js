// DOM元素
const apiKeyInput = document.getElementById('apiKey');
const saveApiKeyBtn = document.getElementById('saveApiKey');
const sourceLanguageSelect = document.getElementById('sourceLanguage');
const targetLanguageSelect = document.getElementById('targetLanguage');
const swapLanguagesBtn = document.getElementById('swapLanguages');
const sourceTextArea = document.getElementById('sourceText');
const targetTextArea = document.getElementById('targetText');
const translateBtn = document.getElementById('translateBtn');
const clearSourceBtn = document.getElementById('clearSource');
const copyResultBtn = document.getElementById('copyResult');
const modelSelect = document.getElementById('modelSelect');
const customModelContainer = document.getElementById('customModelContainer');
const customModelInput = document.getElementById('customModelInput');
const themeToggle = document.getElementById('themeToggle');

// 检查并加载保存的API密钥
const savedApiKey = localStorage.getItem('openrouterApiKey');
if (savedApiKey) {
  apiKeyInput.value = savedApiKey;
}

// 检查并加载保存的模型选择
const savedModel = localStorage.getItem('selectedModel');
if (savedModel) {
  modelSelect.value = savedModel;
  // 如果是自定义模型，显示自定义模型输入框
  if (savedModel === 'custom') {
    customModelContainer.style.display = 'block';
    // 加载保存的自定义模型名称
    const savedCustomModel = localStorage.getItem('customModel');
    if (savedCustomModel) {
      customModelInput.value = savedCustomModel;
    }
  }
}

// 检查并加载保存的主题偏好
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
} else {
  document.body.classList.remove('dark-mode');
  themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
}

// 主题切换功能
themeToggle.addEventListener('click', () => {
  if (document.body.classList.contains('dark-mode')) {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  } else {
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  }
});

// 自定义模型选择逻辑
modelSelect.addEventListener('change', () => {
  const selectedModel = modelSelect.value;
  localStorage.setItem('selectedModel', selectedModel);
  
  if (selectedModel === 'custom') {
    customModelContainer.style.display = 'block';
  } else {
    customModelContainer.style.display = 'none';
  }
});

// 保存自定义模型名称
customModelInput.addEventListener('input', () => {
  localStorage.setItem('customModel', customModelInput.value.trim());
});

// 保存API密钥到localStorage
saveApiKeyBtn.addEventListener('click', () => {
  const apiKey = apiKeyInput.value.trim();
  if (apiKey) {
    localStorage.setItem('openrouterApiKey', apiKey);
    showToast('API密钥已保存', 'success');
  } else {
    showToast('请输入有效的API密钥', 'warning');
  }
});

// 交换语言
swapLanguagesBtn.addEventListener('click', () => {
  const sourceLang = sourceLanguageSelect.value;
  const targetLang = targetLanguageSelect.value;
  sourceLanguageSelect.value = targetLang;
  targetLanguageSelect.value = sourceLang;

  // 如果已有翻译内容，也交换文本
  const sourceText = sourceTextArea.value;
  const targetText = targetTextArea.value;
  if (targetText) {
    sourceTextArea.value = targetText;
    targetTextArea.value = sourceText;
  }
});

// 清除源文本
clearSourceBtn.addEventListener('click', () => {
  sourceTextArea.value = '';
  targetTextArea.value = '';
  sourceTextArea.focus();
});

// 复制翻译结果
copyResultBtn.addEventListener('click', () => {
  if (targetTextArea.value) {
    navigator.clipboard.writeText(targetTextArea.value)
      .then(() => {
        showToast('翻译结果已复制到剪贴板', 'success');
      })
      .catch(err => {
        showToast('复制失败: ' + err, 'error');
      });
  }
});

// 翻译功能
translateBtn.addEventListener('click', async () => {
  const apiKey = localStorage.getItem('openrouterApiKey');
  if (!apiKey) {
    showToast('请先输入并保存OpenRouter API密钥', 'warning');
    return;
  }

  const sourceText = sourceTextArea.value.trim();
  if (!sourceText) {
    showToast('请输入要翻译的文本', 'warning');
    return;
  }

  const sourceLang = sourceLanguageSelect.value;
  const targetLang = targetLanguageSelect.value;

  // 显示加载状态
  translateBtn.disabled = true;
  translateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 翻译中...';
  targetTextArea.value = '翻译中...';

  try {
    const result = await translateText(sourceText, sourceLang, targetLang, apiKey);
    targetTextArea.value = result;
    showToast('翻译完成', 'success');
  } catch (error) {
    targetTextArea.value = '';
    showToast('翻译失败: ' + error.message, 'error');
    console.error('Translation error:', error);
  } finally {
    // 恢复按钮状态
    translateBtn.disabled = false;
    translateBtn.innerHTML = '<i class="fas fa-arrow-right"></i> 翻译';
  }
});

// 调用OpenRouter API进行翻译
async function translateText(text, sourceLang, targetLang, apiKey) {
  const prompt = `Translate the following text from ${sourceLang} to ${targetLang}. Keep the meaning intact and maintain the original formatting. Do not add any explanations or additional text.

Text to translate:
${text}`;

  // 确定要使用的模型
  let modelToUse = modelSelect.value;
  if (modelToUse === 'custom') {
    const customModel = customModelInput.value.trim();
    if (!customModel) {
      throw new Error('请输入有效的自定义模型名称');
    }
    modelToUse = customModel;
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelToUse,
      messages: [{
        role: 'user',
        content: prompt
      }],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}

// 显示提示消息
function showToast(message, type = 'info') {
  // 检查是否已存在toast元素，如果有则移除
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  // 创建新的toast元素
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // 显示toast
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // 3秒后隐藏toast
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// 监听文本输入，按下Ctrl+Enter进行翻译
sourceTextArea.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') {
    translateBtn.click();
  }
});
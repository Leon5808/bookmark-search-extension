// 存储所有书签数据
let allBookmarks = [];
// 存储文件夹数据
let folders = [];
// 存储最近访问的书签
let historyBookmarks = [];

// 语言切换功能
let currentLanguage = 'zh'; // 默认语言为中文

// 语言配置
const translations = {
  'zh': {
    title: '书签查找器',
    placeholder: '输入书签名称',
    historyTitle: '最近访问',
    noHistory: '暂无历史记录',
    clearButton: '清空',
    noResults: '没有找到匹配的书签'
  },
  'en': {
    title: 'MarkFinder',
    placeholder: 'Enter bookmark name',
    historyTitle: 'Recently Visited',
    noHistory: 'No history records',
    clearButton: 'Clear',
    noResults: 'No matching bookmarks found'
  }
};

// 历史记录最大数量
const MAX_HISTORY_ITEMS = 10;

// 添加书签到历史记录
function addToHistory(bookmark) {
  console.log("添加到历史记录:", bookmark.title);
  
  // 确保书签对象有必要的属性
  if (!bookmark.id || !bookmark.title || !bookmark.url) {
    console.error("书签对象缺少必要属性:", bookmark);
    return;
  }
  
  // 从存储中获取现有历史记录
  chrome.storage.local.get('historyBookmarks', function(data) {
    let history = data.historyBookmarks || [];
    
    console.log("当前历史记录:", history);
    
    // 检查是否已存在相同记录，如果有则移除
    history = history.filter(item => item.id !== bookmark.id);
    
    // 确保保存文件夹信息
    const bookmarkToSave = {
      id: bookmark.id,
      title: bookmark.title,
      url: bookmark.url,
      folderName: bookmark.folderName || '' // 确保保存文件夹名称
    };
    
    // 添加新记录到数组开头
    history.unshift(bookmarkToSave);
    
    // 限制数组长度
    if (history.length > MAX_HISTORY_ITEMS) {
      history = history.slice(0, MAX_HISTORY_ITEMS);
    }
    
    // 更新全局变量
    historyBookmarks = history;
    
    // 保存回存储
    chrome.storage.local.set({historyBookmarks: history}, function() {
      console.log("历史记录已保存，当前数量:", history.length);
      console.log("保存的历史记录:", history);
      
      // 如果历史记录容器当前可见，则更新显示
      if (document.querySelector('.history-container').style.display !== 'none') {
        displayHistory();
      }
    });
  });
}

// 加载历史记录
function loadHistory() {
  console.log("加载历史记录...");
  chrome.storage.local.get('historyBookmarks', function(data) {
    console.log("获取到的历史记录:", data.historyBookmarks);
    
    if (data.historyBookmarks && data.historyBookmarks.length > 0) {
      historyBookmarks = data.historyBookmarks;
      displayHistory();
    } else {
      console.log("没有历史记录，创建默认提示");
      // 如果没有历史记录，显示提示信息
      const historyList = document.getElementById('history-list');
      historyList.innerHTML = `<div class="no-history">${translations[currentLanguage].noHistory || '暂无历史记录'}</div>`;
      document.querySelector('.history-container').style.display = 'block';
    }
  });
}

// 显示历史记录
function displayHistory() {
  console.log("显示历史记录...");
  const historyContainer = document.querySelector('.history-container');
  const historyList = document.getElementById('history-list');
  
  // 确保容器可见
  historyContainer.style.display = 'block';
  
  // 更新标题
  document.querySelector('.history-title').textContent = translations[currentLanguage].historyTitle;
  
  // 清空列表
  historyList.innerHTML = '';
  
  console.log("历史记录数量:", historyBookmarks.length);
  
  // 添加每个历史记录项
  historyBookmarks.forEach(bookmark => {
    const historyItem = createHistoryItem(bookmark);
    historyList.appendChild(historyItem);
  });
}

// 创建历史记录项元素
function createHistoryItem(bookmark) {
  const item = document.createElement('div');
  item.className = 'history-item';
  
  // 获取网站图标
  const iconUrl = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=16`;
  
  // 创建历史记录内容，添加文件夹标签
  item.innerHTML = `
    <img class="history-icon" src="${iconUrl}" alt="">
    <div class="history-content">
      <div class="history-name">${bookmark.title}</div>
      <div class="history-url">${bookmark.url}</div>
    </div>
    ${bookmark.folderName ? `<div class="tag-container"><div class="folder-tag">${bookmark.folderName}</div></div>` : ''}
  `;
  
  // 添加点击事件
  item.addEventListener('click', function() {
    // 打开书签链接
    chrome.tabs.create({ url: bookmark.url });
    // 更新历史记录
    addToHistory(bookmark);
  });
  
  return item;
}

// 搜索函数
function performSearch() {
  const query = document.getElementById('search-input').value.toLowerCase().trim();
  const searchResultsContainer = document.querySelector('.search-results-container');
  const historyContainer = document.querySelector('.history-container');
  
  if (query === '') {
    // 当搜索框为空时，隐藏搜索结果，显示历史记录
    searchResultsContainer.style.display = 'none';
    historyContainer.style.display = 'block';
    loadHistory(); // 加载并显示历史记录
    return;
  }
  
  // 过滤书签
  let filteredBookmarks = allBookmarks.filter(bookmark => {
    return bookmark.title.toLowerCase().includes(query) || 
           bookmark.url.toLowerCase().includes(query);
  });
  
  // 显示搜索结果，隐藏历史记录
  historyContainer.style.display = 'none';
  searchResultsContainer.style.display = 'block';
  
  // 显示搜索结果
  const searchResults = document.getElementById('search-results');
  searchResults.innerHTML = '';
  
  if (filteredBookmarks.length === 0) {
    // 没有搜索结果，使用无背景的样式
    searchResults.innerHTML = `<div class="no-results">${translations[currentLanguage].noResults}</div>`;
    
    // 确保历史记录模块完全隐藏
    historyContainer.style.display = 'none';
    
    // 添加延迟检查，确保历史记录容器保持隐藏状态
    setTimeout(() => {
      const historyContainer = document.querySelector('.history-container');
      if (historyContainer) {
        historyContainer.style.display = 'none';
        console.log('历史记录容器已隐藏');
      }
    }, 100);
    
    return;
  }
  
  // 显示搜索结果
  filteredBookmarks.forEach(bookmark => {
    const bookmarkElement = createBookmarkElement(bookmark);
    searchResults.appendChild(bookmarkElement);
  });
}

// 创建书签元素
function createBookmarkElement(bookmark) {
  const bookmarkItem = document.createElement('div');
  bookmarkItem.className = 'bookmark-item';
  
  // 获取网站图标
  const iconUrl = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=16`;
  
  // 创建书签内容
  bookmarkItem.innerHTML = `
    <img class="bookmark-icon" src="${iconUrl}" alt="">
    <div class="bookmark-content">
      <div class="bookmark-name">${bookmark.title}</div>
      <div class="bookmark-url">${bookmark.url}</div>
    </div>
    ${bookmark.folderName ? `<div class="tag-container"><div class="folder-tag">${bookmark.folderName}</div></div>` : ''}
  `;
  
  // 添加点击事件
  bookmarkItem.addEventListener('click', function() {
    console.log("点击书签:", bookmark.title);
    
    // 确保书签对象有id属性
    if (!bookmark.id) {
      bookmark.id = Date.now().toString(); // 如果没有id，生成一个唯一id
    }
    
    // 添加到历史记录
    addToHistory({
      id: bookmark.id,
      title: bookmark.title,
      url: bookmark.url,
      folderName: bookmark.folderName
    });
    
    // 打开书签链接
    chrome.tabs.create({ url: bookmark.url });
  });
  
  return bookmarkItem;
}

// 更新语言
function updateLanguage(lang) {
  currentLanguage = lang;
  
  // 更新UI文本
  document.querySelector('h1').textContent = translations[lang].title;
  document.getElementById('search-input').placeholder = translations[lang].placeholder;
  
  // 更新历史记录标题
  document.querySelector('.history-title').textContent = translations[lang].historyTitle;
  
  // 更新清空按钮文本
  document.getElementById('clear-history').textContent = translations[lang].clearButton;
  
  // 如果当前显示"暂无历史记录"，也需要更新它
  const noHistoryElement = document.querySelector('.no-history');
  if (noHistoryElement) {
    noHistoryElement.textContent = translations[lang].noHistory;
  }
  
  // 如果当前显示"没有找到匹配的书签"，也需要更新它
  const noResultsElement = document.querySelector('.no-results');
  if (noResultsElement) {
    noResultsElement.textContent = translations[lang].noResults;
  }
  
  // 保存语言设置
  chrome.storage.local.set({preferredLanguage: lang});
}

// 初始化语言设置
function initLanguage() {
  chrome.storage.local.get('preferredLanguage', function(data) {
    if (data.preferredLanguage) {
      currentLanguage = data.preferredLanguage;
    } else {
      // 默认使用中文
      currentLanguage = 'zh';
    }
    updateLanguage(currentLanguage);
  });
}

// 加载书签数据
function loadBookmarks() {
  chrome.bookmarks.getTree(function(bookmarkTreeNodes) {
    // 处理书签树
    processBookmarkNodes(bookmarkTreeNodes[0], '');
    
    // 初始化搜索
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', performSearch);
    
    // 初始加载历史记录
    loadHistory();
  });
}

// 处理书签节点
function processBookmarkNodes(node, parentFolderName) {
  if (node.children) {
    // 如果是文件夹
    const folderName = node.title || parentFolderName;
    
    // 处理子节点
    node.children.forEach(child => {
      processBookmarkNodes(child, folderName);
    });
  } else if (node.url) {
    // 如果是书签
    allBookmarks.push({
      id: node.id,
      title: node.title,
      url: node.url,
      folderName: parentFolderName // 确保保存文件夹名称
    });
  }
}

// 清除历史记录
function clearHistory() {
  console.log("清除历史记录...");
  chrome.storage.local.remove('historyBookmarks', function() {
    console.log("历史记录已清除");
    historyBookmarks = [];
    
    // 显示翻译后的"暂无历史记录"提示
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = `<div class="no-history">${translations[currentLanguage].noHistory}</div>`;
    document.querySelector('.history-container').style.display = 'block';
  });
}

// 当文档加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  console.log("文档加载完成");
  
  // 初始化语言设置
  initLanguage();
  
  // 加载书签数据
  loadBookmarks();
  
  // 添加语言切换按钮的点击事件
  document.getElementById('language-toggle').addEventListener('click', function() {
    // 切换语言
    const newLang = currentLanguage === 'zh' ? 'en' : 'zh';
    updateLanguage(newLang);
  });
  
  // 初始化容器显示状态 - 确保历史记录容器默认显示
  document.querySelector('.search-results-container').style.display = 'none';
  document.querySelector('.history-container').style.display = 'block';
  
  // 确保清空图标初始状态为隐藏
  document.getElementById('clear-search-icon').style.display = 'none';
  
  // 添加搜索框事件
  const searchInput = document.getElementById('search-input');
  searchInput.addEventListener('input', function() {
    // 当搜索框为空时，显示历史记录
    if (this.value === '') {
      document.querySelector('.search-results-container').style.display = 'none';
      document.querySelector('.history-container').style.display = 'block';
      loadHistory(); // 重新加载历史记录以显示最新状态
      // 隐藏清空图标
      document.getElementById('clear-search-icon').style.display = 'none';
    } else {
      performSearch();
      // 显示清空图标
      document.getElementById('clear-search-icon').style.display = 'flex';
    }
  });
  
  // 添加清空图标点击事件
  document.getElementById('clear-search-icon').addEventListener('click', function() {
    // 清空搜索框
    const searchInput = document.getElementById('search-input');
    searchInput.value = '';
    // 隐藏清空图标
    this.style.display = 'none';
    // 显示历史记录
    document.querySelector('.search-results-container').style.display = 'none';
    document.querySelector('.history-container').style.display = 'block';
    loadHistory();
    // 让搜索框重新获得焦点
    searchInput.focus();
  });
  
  // 添加键盘导航功能
  let selectedIndex = -1; // 当前选中的书签索引
  
  document.addEventListener('keydown', function(e) {
    const searchResultsContainer = document.querySelector('.search-results-container');
    const historyContainer = document.querySelector('.history-container');
    
    // 处理Escape键 - 清空搜索框
    if (e.key === 'Escape') {
      const searchInput = document.getElementById('search-input');
      if (searchInput.value !== '') {
        searchInput.value = '';
        document.getElementById('clear-search-icon').style.display = 'none';
        searchResultsContainer.style.display = 'none';
        historyContainer.style.display = 'block';
        loadHistory();
        // 重置选中状态
        selectedIndex = -1;
        document.querySelectorAll('.selected').forEach(item => {
          item.classList.remove('selected');
        });
        return;
      }
    }
    
    // 处理搜索结果的键盘导航
    if (searchResultsContainer.style.display === 'block') {
      const bookmarkItems = document.querySelectorAll('#search-results .bookmark-item');
      
      // 如果没有搜索结果，不处理键盘导航
      if (bookmarkItems.length === 0) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault(); // 防止页面滚动
          // 向下选择下一个书签
          if (selectedIndex < bookmarkItems.length - 1) {
            if (selectedIndex >= 0) {
              bookmarkItems[selectedIndex].classList.remove('selected');
            }
            selectedIndex++;
            bookmarkItems[selectedIndex].classList.add('selected');
            bookmarkItems[selectedIndex].scrollIntoView({ block: 'nearest' });
          }
          break;
          
        case 'ArrowUp':
          e.preventDefault(); // 防止页面滚动
          // 向上选择上一个书签
          if (selectedIndex > 0) {
            bookmarkItems[selectedIndex].classList.remove('selected');
            selectedIndex--;
            bookmarkItems[selectedIndex].classList.add('selected');
            bookmarkItems[selectedIndex].scrollIntoView({ block: 'nearest' });
          }
          break;
          
        case 'Enter':
          // 如果有选中的书签，则跳转
          if (selectedIndex >= 0 && selectedIndex < bookmarkItems.length) {
            e.preventDefault(); // 防止表单提交
            // 模拟点击选中的书签
            bookmarkItems[selectedIndex].click();
          }
          break;
          
        case 'Escape':
          // 清除选中状态
          if (selectedIndex >= 0) {
            bookmarkItems[selectedIndex].classList.remove('selected');
            selectedIndex = -1;
          }
          break;
      }
    }
    // 处理历史记录的键盘导航
    else if (historyContainer.style.display === 'block') {
      const historyItems = document.querySelectorAll('#history-list .history-item');
      
      // 如果没有历史记录，不处理键盘导航
      if (historyItems.length === 0) return;
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault(); // 防止页面滚动
          // 向下选择下一个历史记录
          if (selectedIndex < historyItems.length - 1) {
            if (selectedIndex >= 0) {
              historyItems[selectedIndex].classList.remove('selected');
            }
            selectedIndex++;
            historyItems[selectedIndex].classList.add('selected');
            historyItems[selectedIndex].scrollIntoView({ block: 'nearest' });
          }
          break;
          
        case 'ArrowUp':
          e.preventDefault(); // 防止页面滚动
          // 向上选择上一个历史记录
          if (selectedIndex > 0) {
            historyItems[selectedIndex].classList.remove('selected');
            selectedIndex--;
            historyItems[selectedIndex].classList.add('selected');
            historyItems[selectedIndex].scrollIntoView({ block: 'nearest' });
          }
          break;
          
        case 'Enter':
          // 如果有选中的历史记录，则跳转
          if (selectedIndex >= 0 && selectedIndex < historyItems.length) {
            e.preventDefault(); // 防止表单提交
            // 模拟点击选中的历史记录
            historyItems[selectedIndex].click();
          }
          break;
          
        case 'Escape':
          // 清除选中状态
          if (selectedIndex >= 0) {
            historyItems[selectedIndex].classList.remove('selected');
            selectedIndex = -1;
          }
          break;
      }
    }
  });
  
  // 当执行新搜索时，重置选中索引
  searchInput.addEventListener('input', function() {
    selectedIndex = -1;
    
    // 清除所有选中状态
    document.querySelectorAll('.selected').forEach(item => {
      item.classList.remove('selected');
    });
  });
  
  // 当搜索框获得焦点时，重置选中索引
  searchInput.addEventListener('focus', function() {
    selectedIndex = -1;
    
    // 清除所有选中状态
    document.querySelectorAll('.selected').forEach(item => {
      item.classList.remove('selected');
    });
  });
  
  // 立即加载历史记录
  loadHistory();
  
  // 添加清空按钮的事件监听
  document.getElementById('clear-history').addEventListener('click', function() {
    clearHistory();
  });
});
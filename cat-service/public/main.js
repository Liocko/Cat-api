const showHistoryBtn = document.getElementById('showHistory');
const historyPanel = document.getElementById('historyPanel');
const historyList = document.getElementById('historyList');

showHistoryBtn.addEventListener('click', async () => {
  if (historyPanel.style.display === 'block') {
    historyPanel.style.display = 'none';
    showHistoryBtn.style.background = '#fff';
    showHistoryBtn.style.borderColor = '#bbb';
    showHistoryBtn.textContent = 'История';
    return;
  }
  historyPanel.style.display = 'block';
  showHistoryBtn.style.background = '#e0f7fa';
  showHistoryBtn.style.borderColor = '#2ec4b6';
  showHistoryBtn.textContent = 'Скрыть историю';
  historyList.innerHTML = '<li>Загрузка...</li>';
  const history = await fetch('/api/cat/history').then(r => r.json());
  const top = await fetch('/api/cat/top').then(r => r.json());
  historyList.innerHTML = '';

  // Найти лидера по лайкам
  const leader = top.length > 0 ? top[0] : null;
  if (leader) {
    historyList.innerHTML += `<li style="margin-bottom:18px; border-bottom:2px solid #e67e22; padding-bottom:10px; background:#fffbe6;">
      <img src="${leader.url}" alt="cat" style="max-width:120px; max-height:80px; vertical-align:middle; border-radius:10px; margin-right:12px; border:2px solid #e67e22;">
      <span style="font-size:1.1em; font-weight:bold; color:#e67e22;">Лидер по лайкам</span>
      <span style="margin-left:18px; color:#e74c3c; font-weight:bold;">❤️ ${leader.likes}</span>
    </li>`;
  }

  // История просмотров (без дублирования лидера)
  history.forEach(cat => {
    if (leader && cat.url === leader.url) return; // не дублируем лидера
    const likes = (top.find(c => c.url === cat.url)?.likes) || 0;
    historyList.innerHTML += `<li style="margin-bottom:18px; border-bottom:1px solid #eee; padding-bottom:10px;">
      <img src="${cat.url}" alt="cat" style="max-width:120px; max-height:80px; vertical-align:middle; border-radius:10px; margin-right:12px;">
      <span style="font-size:1.1em;">Просмотров: ${cat.shown}</span>
      <span style="margin-left:18px; color:#e74c3c;">❤️ ${likes}</span>
    </li>`;
  });
});


let currentCatId = null;
let currentCatUrl = null;

document.getElementById('showCat').addEventListener('click', async () => {
  const img = document.getElementById('catImg');
  const stats = document.getElementById('catStats');
  img.style.display = 'none';
  stats.style.display = 'none';
  try {
    const res = await fetch('/api/cat');
    const data = await res.json();
    if (data.url && data.id) {
      img.src = data.url;
      img.style.display = 'block';
      stats.style.display = 'block';
      currentCatId = data.id;
      currentCatUrl = data.url;
      updateStats(data.id, data.url);
    } else {
      alert('Не удалось получить котика :(');
    }
  } catch {
    alert('Ошибка при получении котика!');
  }
});

async function updateStats(id, url) {
  const [history, top] = await Promise.all([
    fetch('/api/cat/history').then(r => r.json()),
    fetch('/api/cat/top').then(r => r.json())
  ]);
  let views = 0, likes = 0;
  const hist = history.find(c => c.id === id);
  if (hist) views = hist.shown;
  const topCat = top.find(c => c.id === id);
  if (topCat) likes = topCat.likes;
  document.getElementById('views').textContent = `Просмотров: ${views}`;
  document.getElementById('likes').textContent = `Лайков: ${likes}`;
}

document.getElementById('likeBtn').addEventListener('click', async () => {
  if (!currentCatId) return;
  await fetch(`/api/cat/${currentCatId}/like`, {
    method: 'POST'
  });
  updateStats(currentCatId, currentCatUrl);
});

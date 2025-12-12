// Функция обработки ошибки загрузки изображения (должна быть глобальной)
window.handleImageError = function () {
  const img = document.getElementById("catImg");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const loadingText = document.getElementById("loadingText");

  if (img) {
    img.style.display = "none";
  }

  // Скрываем индикатор загрузки
  if (loadingSpinner) loadingSpinner.style.display = "none";
  if (loadingText) loadingText.style.display = "none";

  const errorDiv = document.createElement("div");
  errorDiv.style.cssText =
    "color: #e74c3c; margin-top: 20px; padding: 15px; background: #ffebee; border-radius: 12px; border: 2px solid #e74c3c; max-width: 420px; margin-left: auto; margin-right: auto;";
  errorDiv.innerHTML =
    "😿 Не удалось загрузить изображение котика. Попробуйте еще раз!";

  // Удаляем предыдущую ошибку если есть
  const existingError = document.querySelector(".image-error-message");
  if (existingError) existingError.remove();

  errorDiv.className = "image-error-message";
  document.body.appendChild(errorDiv);

  // Удаляем ошибку через 5 секунд
  setTimeout(() => {
    if (errorDiv.parentNode) errorDiv.remove();
  }, 5000);
};

const showHistoryBtn = document.getElementById("showHistory");
const historyPanel = document.getElementById("historyPanel");
const historyList = document.getElementById("historyList");

showHistoryBtn.addEventListener("click", async () => {
  if (historyPanel.style.display === "block") {
    historyPanel.style.display = "none";
    showHistoryBtn.style.background = "#fff";
    showHistoryBtn.style.borderColor = "#bbb";
    showHistoryBtn.textContent = "История";
    return;
  }
  historyPanel.style.display = "block";
  showHistoryBtn.style.background = "#e0f7fa";
  showHistoryBtn.style.borderColor = "#2ec4b6";
  showHistoryBtn.textContent = "Скрыть историю";
  historyList.innerHTML = "<li>Загрузка...</li>";
  const history = await fetch("/api/cat/history").then((r) => r.json());
  const top = await fetch("/api/cat/top").then((r) => r.json());
  historyList.innerHTML = "";

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
  history.forEach((cat) => {
    if (leader && cat.url === leader.url) return; // не дублируем лидера
    const likes = top.find((c) => c.url === cat.url)?.likes || 0;
    historyList.innerHTML += `<li style="margin-bottom:18px; border-bottom:1px solid #eee; padding-bottom:10px;">
      <img src="${cat.url}" alt="cat" style="max-width:120px; max-height:80px; vertical-align:middle; border-radius:10px; margin-right:12px;">
      <span style="font-size:1.1em;">Просмотров: ${cat.shown}</span>
      <span style="margin-left:18px; color:#e74c3c;">❤️ ${likes}</span>
    </li>`;
  });
});

let currentCatId = null;
let currentCatUrl = null;
let lastLoadedCatId = null; // id котика, который реально был показан

document.getElementById("showCat").addEventListener("click", async () => {
  const img = document.getElementById("catImg");
  const stats = document.getElementById("catStats");
  const showCatBtn = document.getElementById("showCat");
  const loadingSpinner = document.getElementById("loadingSpinner");
  const loadingText = document.getElementById("loadingText");

  // Показываем загрузку
  img.style.display = "none";
  stats.style.display = "none";
  loadingSpinner.style.display = "block";
  loadingText.style.display = "block";
  showCatBtn.textContent = "⏳ Загружаем котика...";
  showCatBtn.disabled = true;

  let loaded = false;
  try {
    const res = await fetch("/api/cat");
    const data = await res.json();

    if (data.error) {
      throw new Error(data.error);
    }

    if (data.url && data.id) {
      // Устанавливаем src и ждем загрузки изображения
      await new Promise((resolve, reject) => {
        let finished = false;
        const timeout = setTimeout(() => {
          if (!finished) {
            finished = true;
            reject(new Error("Таймаут загрузки изображения"));
          }
        }, 15000); // 15 секунд таймаут

        img.onload = () => {
          if (!finished) {
            finished = true;
            clearTimeout(timeout);
            loaded = true;
            resolve();
          }
        };
        img.onerror = () => {
          if (!finished) {
            finished = true;
            clearTimeout(timeout);
            loaded = false;
            reject(new Error("Ошибка загрузки изображения"));
          }
        };
        img.src = data.url;
      });

      if (loaded) {
        currentCatId = data.id;
        currentCatUrl = data.url;
        lastLoadedCatId = data.id;
        // Показываем изображение с анимацией
        img.style.display = "block";
        img.classList.add("cat-image-appear");
        stats.style.display = "block";
        // Показываем кнопку лайка для нормального изображения
        const likeBtn = document.getElementById("likeBtn");
        if (likeBtn) {
          likeBtn.style.display = "inline-block";
        }
        // Убираем класс анимации после завершения
        setTimeout(() => {
          img.classList.remove("cat-image-appear");
        }, 800);
        await updateStats(data.id, data.url);
      } else {
        // Не обновляем currentCatId, не показываем кнопку лайка
        currentCatId = null;
        currentCatUrl = null;
        const likeBtn = document.getElementById("likeBtn");
        if (likeBtn) likeBtn.style.display = "none";
        throw new Error("Не удалось загрузить изображение котика");
      }
    } else {
      throw new Error("Не удалось получить данные котика");
    }
  } catch (error) {
    console.error("Ошибка при получении котика:", error);
    // Показываем ошибку
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText =
      "color: #e74c3c; margin-top: 20px; padding: 15px; background: #ffebee; border-radius: 12px; border: 2px solid #e74c3c; max-width: 420px; margin-left: auto; margin-right: auto;";
    errorDiv.innerHTML = "😿 Не удалось загрузить котика. Попробуйте еще раз!";
    // Удаляем предыдущие сообщения
    const existingError = document.querySelector(".error-message");
    if (existingError) existingError.remove();
    errorDiv.className = "error-message";
    document.body.appendChild(errorDiv);
    // Удаляем ошибку через 5 секунд
    setTimeout(() => {
      if (errorDiv.parentNode) errorDiv.remove();
    }, 5000);
  } finally {
    // Скрываем индикатор загрузки
    loadingSpinner.style.display = "none";
    loadingText.style.display = "none";
    // Восстанавливаем кнопку
    showCatBtn.textContent = "Показать котика";
    showCatBtn.disabled = false;
  }
});

async function updateStats(id, url) {
  try {
    console.log(`📊 Обновляем статистику для котика ${id}...`);
    // Получаем актуальные данные по котику
    const res = await fetch(`/api/cat/${id}`);
    let views = 0,
      likes = 0;
    if (res.ok) {
      const cat = await res.json();
      if (cat && typeof cat.shown === "number") views = cat.shown;
      if (cat && typeof cat.likes === "number") likes = cat.likes;
      console.log(
        `✅ Получено из /api/cat/${id}: просмотров=${views}, лайков=${likes}`,
      );
    } else {
      console.log(`❌ Котик ${id} не найден через /api/cat/${id}`);
    }
    // Обновляем отображение
    const viewsElement = document.getElementById("views");
    const likesElement = document.getElementById("likes");
    if (viewsElement) {
      viewsElement.textContent = `Просмотров: ${views}`;
      console.log(`✅ Обновлен счетчик просмотров: ${views}`);
    }
    if (likesElement) {
      likesElement.textContent = `Лайков: ${likes}`;
      console.log(`✅ Обновлен счетчик лайков: ${likes}`);
    }
    console.log(
      `📊 Итоговая статистика для котика ${id}: просмотров=${views}, лайков=${likes}`,
    );
  } catch (error) {
    console.error("❌ Ошибка при обновлении статистики:", error);
  }
}

document.getElementById("likeBtn").addEventListener("click", async () => {
  if (!currentCatId) {
    alert("Сначала покажите котика!");
    return;
  }
  // Не даём лайкать, если картинка не загрузилась
  if (lastLoadedCatId !== currentCatId) {
    alert("Сначала дождитесь загрузки котика!");
    return;
  }

  const likeBtn = document.getElementById("likeBtn");

  // Визуальная обратная связь сразу
  likeBtn.textContent = "❤️ Лайк!";
  likeBtn.style.background = "#ffebee";
  likeBtn.style.borderColor = "#e74c3c";
  likeBtn.disabled = true;
  likeBtn.classList.add("like-pulse");

  try {
    // Отправляем лайк
    const response = await fetch(`/api/cat/${currentCatId}/like`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    // Обновляем статистику
    await updateStats(currentCatId, currentCatUrl);

    console.log(`Лайк успешно поставлен для котика ${currentCatId}`);
  } catch (error) {
    console.error("Ошибка при лайке:", error);
    // Показываем ошибку пользователю
    alert("Ошибка при постановке лайка. Попробуйте еще раз.");
  } finally {
    // Восстанавливаем кнопку через секунду
    setTimeout(() => {
      likeBtn.textContent = "❤️ Лайк";
      likeBtn.style.background = "#fff";
      likeBtn.style.borderColor = "#bbb";
      likeBtn.disabled = false;
      likeBtn.classList.remove("like-pulse");
    }, 1000);
  }
});

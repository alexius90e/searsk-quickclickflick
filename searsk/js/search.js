document.addEventListener('DOMContentLoaded', () => {
  const searchSource = document.querySelector(".search__source");
  const searchSourceIcon = document.querySelector(".search__source-toggler-icon");
  const searchSection = document.querySelector(".search");
  const suggestSection = document.querySelector(".search__suggest");
  const searchButton = searchSection.querySelector("div.search__input-buttons > button.search__input-button.search__input-button_search");
  const askAiButton = searchSection.querySelector("div.search__input-buttons > button.search__input-button.search__input-button_ai");
  const searchInput = searchSection.querySelector("#mainSearch");
  const recentContainer = searchSection.querySelector(".recent");

  // Функции для работы с localStorage
  const getFromStorage = (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Ошибка при чтении из localStorage:', error);
      return null;
    }
  };

  const setToStorage = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Ошибка при записи в localStorage:', error);
    }
  };

  // Кнопка "Ask AI"
  askAiButton.addEventListener("click", (event) => {
    const q = encodeURIComponent(searchInput.value);
    if (q.trim() === '') {
      return false;
    }
    const url = `ask.html?start=${q}`;
    location.href = url;
  });

  // Кнопка "Search"
  searchButton.addEventListener("click", (event) => {
    const q = encodeURIComponent(searchInput.value);
    if (q.trim() === '') {
      return false;
    }
    const url = `serp.html?keyword=${q}`;
    location.href = url;
  });

  // Обработка нажатия Enter в поле ввода
  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") searchButton.click();
  });

  // Подсказки при вводе текста
  searchInput.addEventListener("input", async function () {
    suggestSection.classList.add("active");
    const maxSuggestLen = 6;
    const q = encodeURIComponent(searchInput.value);
    const req = await fetch(`https://suggestqueries.google.com/complete/search?output=firefox&q=${q}`);
    const json = await req.json();
    suggestSection.querySelectorAll("li").forEach((x) => x.remove());
    if (json[1].length > maxSuggestLen) json[1].length = maxSuggestLen;
    json[1].forEach((x) => {
      const li = document.createElement("li");
      li.className = "search__suggest-list-item";
      li.dataset.source = x;
      li.innerHTML = `<svg aria-hidden="true" focusable="false" role="img" viewBox="0 0 16 16" width="16" height="16" fill="currentColor" class="octicon octicon-search" style="display: inline-block; user-select: none; vertical-align: text-bottom; overflow: visible;"><path d="M10.68 11.74a6 6 0 0 1-7.922-8.982 6 6 0 0 1 8.982 7.922l3.04 3.04a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215ZM11.5 7a4.499 4.499 0 1 0-8.997 0A4.499 4.499 0 0 0 11.5 7Z"></path></svg><span style="margin-left: .5rem;">${x}</span>`;
      li.onclick = function (e) {
        searchInput.value = li.dataset.source;
        suggestSection.classList.remove("active");
      };
      suggestSection.querySelector(".search__suggest-list").appendChild(li);
    });
  });

  // Загрузка недавних сайтов
  const loadRecentSites = async () => {
    const shortcuts = getFromStorage("shortcuts") || [];

    // Очистка контейнера
    recentContainer.innerHTML = '';

    // Добавление ярлыков из localStorage
    shortcuts.forEach(({ url, title }) => {
      const box = document.createElement("div");
      box.className = "recent__box";
      box.onclick = () => window.open(url);

      const img = document.createElement("img");
      img.className = "recent__img";
      img.src = `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=URL&size=32&url=${new URL(url).origin}`;

      const content = document.createElement("div");
      content.className = "recent__content";

      const header = document.createElement("h1");
      header.className = "recent__header";
      header.innerText = title;

      box.appendChild(img);
      content.appendChild(header);
      box.appendChild(content);

      recentContainer.appendChild(box);
    });

    // Добавление кнопки "+"
    const addBox = document.createElement("div");
    addBox.className = "recent__box";
    addBox.style = "font-size: 4rem; text-align: center; vertical-align: middle; padding: 0; color: #666666;";
    addBox.innerText = "+";
    addBox.onclick = () => document.querySelector(".modal__bg").click();
    recentContainer.appendChild(addBox);
  };

  // Загрузка недавних сайтов при загрузке страницы
  loadRecentSites();

  // Обработка модального окна для добавления ярлыков
  document.querySelector(".modal__button").addEventListener("click", async (event) => {
    const title = document.querySelector(".modal__input.title");
    const url = document.querySelector(".modal__input.url");

    if (!title.value.trim()) {
      title.style.border = "1px solid red";
      return;
    }
    if (!url.value.trim() || !url.value.startsWith("http")) {
      url.style.border = "1px solid red";
      return;
    }

    const storage = getFromStorage("shortcuts") || [];
    if (storage.length >= 11) {
      storage.shift(); // Удаляем первый элемент, если превышено ограничение
    }
    storage.push({ url: url.value, title: title.value });
    setToStorage("shortcuts", storage);

    location.reload();
  });

  // Открытие/закрытие модального окна
  document.querySelector(".modal__bg").addEventListener("click", (event) => {
    event.target.classList.toggle("active");
    document.querySelector(".modal").classList.toggle("active");
  });

  // Сброс стилей при вводе текста
  document.querySelector(".modal__input.title").addEventListener("input", (e) => (e.target.style.border = ""));
  document.querySelector(".modal__input.url").addEventListener("input", (e) => (e.target.style.border = ""));
});
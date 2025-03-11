document.addEventListener('DOMContentLoaded', () => {
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

  const chatElement = document.querySelector('.ask-main__content');
  const askBtn = document.querySelector('.ask-main__button');
  const askInput = document.querySelector('.ask-main__input');
  const clearBtn = document.querySelector('#clear');

  if (!chatElement || !askBtn || !askInput) {
    console.error('Не найдены необходимые элементы на странице!');
    return;
  }

  let chatHistory = [];
  const Gpt = {};
  Gpt.token = '';

  async function ask(text) {
    drawChatMessage(text, 'user', 0);
    pushToHistory({
      type: 'user',
      text: text,
    });
    var botMsg = drawChatMessage('', 'bot', 500);
    botMsg.querySelector(
      '.message__content'
    ).innerHTML = `<svg height="24" width="40" class="loader">
    <circle class="dot" cx="10" cy="15" r="3" />
    <circle class="dot" cx="20" cy="15" r="3" />
    <circle class="dot" cx="30" cy="15" r="3" />
  </svg>`;

    botMsg.scrollIntoView({ behavior: 'smooth' });

    var answer = await Gpt.official(text);
    if (!!!answer) {
      botMsg.remove();
      botMsg = drawChatMessage(
        'Server error. Please, try again later.',
        'bot',
        0
      );
      return;
    }
    botMsg.remove();
    botMsg = drawChatMessage(answer, 'bot', 0);
    botMsg.scrollIntoView({ behavior: 'smooth' });
    pushToHistory({
      type: 'bot',
      text: answer,
    });
  }

  async function pushToHistory(obj) {
    await getFromHistory();
    chatHistory.push(obj);
    await setToStorage('aiChatHistory', chatHistory);
  }

  async function getFromHistory() {
    const storage = getFromStorage('aiChatHistory');
    chatHistory = storage || [];
    while (chatHistory.length >= 20) chatHistory.shift();
  }

  function drawChatMessage(text, from, animateDelay) {
    const msg = document.createElement('div');
    msg.className = 'animate message ' + from;
    const msgText = document.createElement('p');
    msgText.className = 'message__content';
    msgText.innerText = text;
    msg.appendChild(msgText);
    chatElement.appendChild(msg);
    setTimeout(() => {
      msg.classList.remove('animate');
    }, animateDelay);
    return msg;
  }

  Gpt.official = async function (text) {
    try {
      const myHeaders = new Headers();
      myHeaders.append('Authorization', 'Bearer ');
      myHeaders.append('HTTP-Referer', 'https://searsk.com'); // Ваш сайт
      myHeaders.append('X-Title', 'Searsh or Ask'); // Название вашего сайта
      myHeaders.append('Content-Type', 'application/json');

      const raw = JSON.stringify({
        model: 'deepseek/deepseek-r1-distill-llama-8b',
        messages: [
          {
            role: 'user',
            content: text,
          },
        ],
      });

      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow',
      };

      const req = await fetch('https://openrouter.ai/api/v1/chat/completions', requestOptions);
      if (!req.ok) {
        console.error('Ошибка запроса:', req.status, req.statusText);
        return null;
      }

      const json = await req.json();
      return json.choices[0].message.content;
    } catch (error) {
      console.error('Ошибка при вызове API:', error);
      return null;
    }
  };

  askBtn.addEventListener('click', async (event) => {
    const text = askInput.value.trim();
    if (!text) return;
    askInput.value = '';
    await ask(text);
  });

  askInput.addEventListener('keydown', async function (e) {
    if (e.key === 'Enter') askBtn.click();
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      // Очищаем историю из localStorage
      localStorage.removeItem('aiChatHistory');
      // Очищаем содержимое чата
      chatElement.innerHTML = '';
    });
  }

  (async function () {
    await getFromHistory();

    chatHistory.forEach((x) => {
      drawChatMessage(x.text, x.type, 0);
    });
    if (document.querySelectorAll('.message').length > 0) {
      document
        .querySelectorAll('.message')
        [document.querySelectorAll('.message').length - 1].scrollIntoView();
    }

    const urlParams = new URLSearchParams(window.location.search);
    const firstMessage = urlParams.get('start');
    if (!!firstMessage) ask(firstMessage);
  })();
});
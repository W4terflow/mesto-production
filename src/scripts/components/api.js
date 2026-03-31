// src/scripts/components/api.js

const isDev = import.meta.env.DEV;

// Получаем токен и базовый URL
const baseUrl = isDev ? '/api' : import.meta.env.VITE_API_BASE_URL;
const token = import.meta.env.VITE_API_TOKEN;

// Выводим для отладки (потом удалить)
console.log('🔧 Режим разработки:', isDev);
console.log('🔧 Базовый URL:', baseUrl);
console.log('🔧 Токен существует:', !!token);
console.log('🔧 Токен (первые 20 символов):', token?.substring(0, 20) + '...');

const config = {
  baseUrl: baseUrl, // Используем переменную baseUrl
  headers: {
    authorization: token,
    "Content-Type": "application/json",
  },
};

const getResponseData = (res) => {
  console.log('📊 [getResponseData] Статус:', res.status);
  console.log('📊 [getResponseData] URL:', res.url);
  console.log('📊 [getResponseData] OK:', res.ok);
  console.log('📊 [getResponseData] Content-Type:', res.headers.get('content-type'));
  
  if (!res.ok) {
    console.error('❌ Ошибка ответа:', res.status, res.statusText);
    return Promise.reject(`Ошибка: ${res.status}`);
  }
  
  console.log('📊 [getResponseData] Начинаем читать текст...');
  
  // Добавляем таймаут 10 секунд
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Timeout: ответ не получен за 10 секунд')), 10000);
  });
  
  return Promise.race([
    res.text(),
    timeoutPromise
  ])
    .then(text => {
      console.log('📄 [getResponseData] Получен текст, длина:', text?.length);
      console.log('📄 [getResponseData] Первые 200 символов:', text?.substring(0, 200));
      
      if (!text || text.trim() === '') {
        console.log('⚠️ [getResponseData] Пустой ответ');
        return [];
      }
      
      try {
        const data = JSON.parse(text);
        console.log('✅ [getResponseData] JSON успешно разобран');
        console.log('✅ [getResponseData] Тип данных:', Array.isArray(data) ? 'массив' : 'объект');
        if (Array.isArray(data)) {
          console.log('✅ [getResponseData] Количество элементов:', data.length);
        }
        return data;
      } catch (e) {
        console.error('❌ [getResponseData] Ошибка парсинга JSON:', e);
        console.error('❌ [getResponseData] Текст:', text);
        return [];
      }
    })
    .catch(err => {
      console.error('❌ [getResponseData] Ошибка чтения:', err);
      return [];
    });
};

// ========== РАБОТА С ПОЛЬЗОВАТЕЛЕМ ==========

export const getUserInfo = () => {
  console.log('📡 GET /users/me');
  return fetch(`${config.baseUrl}/users/me`, {
    headers: config.headers,
  }).then(getResponseData);
};

export const setUserInfo = ({ name, about }) => {
  console.log('📡 PATCH /users/me');
  return fetch(`${config.baseUrl}/users/me`, {
    method: "PATCH",
    headers: config.headers,
    body: JSON.stringify({ name, about }),
  }).then(getResponseData);
};

export const updateAvatar = ({ avatar }) => {
  console.log('📡 PATCH /users/me/avatar');
  return fetch(`${config.baseUrl}/users/me/avatar`, {
    method: "PATCH",
    headers: config.headers,
    body: JSON.stringify({ avatar }),
  }).then(getResponseData);
};

// ========== РАБОТА С КАРТОЧКАМИ ==========

export const getCardList = () => {
  console.log('📡 GET /cards');
  
  // Создаем AbortController для управления запросом
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.log('⚠️ Таймаут запроса, отменяем...');
    controller.abort();
  }, 10000); // 10 секунд таймаут
  
  return fetch(`${config.baseUrl}/cards`, {
    headers: config.headers,
    signal: controller.signal
  })
    .then(res => {
      clearTimeout(timeoutId);
      console.log('✅ Ответ получен, статус:', res.status);
      return res.json();
    })
    .then(data => {
      console.log('✅ JSON разобран, карточек:', data?.length);
      return Array.isArray(data) ? data : [];
    })
    .catch(err => {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        console.error('❌ Запрос прерван по таймауту');
      } else {
        console.error('❌ Ошибка:', err);
      }
      return [];
    });
};

export const addCard = ({ name, link }) => {
  console.log('📡 POST /cards');
  return fetch(`${config.baseUrl}/cards`, {
    method: "POST",
    headers: config.headers,
    body: JSON.stringify({ name, link }),
  }).then(getResponseData);
};

export const deleteCard = (cardId) => {
  console.log(`📡 DELETE /cards/${cardId}`);
  return fetch(`${config.baseUrl}/cards/${cardId}`, {
    method: "DELETE",
    headers: config.headers,
  }).then(getResponseData);
};

// ========== РАБОТА С ЛАЙКАМИ ==========

export const changeLikeCardStatus = (cardId, isLiked) => {
  const method = isLiked ? "DELETE" : "PUT";
  console.log(`📡 ${method} /cards/likes/${cardId}`);
  return fetch(`${config.baseUrl}/cards/likes/${cardId}`, {
    method: method,
    headers: config.headers,
  }).then(getResponseData);
};

// ========== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ==========

export const isCardOwner = (card, userId) => {
  return card.owner._id === userId;
};

export const isCardLikedByUser = (card, userId) => {
  return card.likes.some(like => like._id === userId);
};

export const getLikesCount = (card) => {
  return card.likes.length;
};

export default {
  getUserInfo,
  setUserInfo,
  updateAvatar,
  getCardList,
  addCard,
  deleteCard,
  changeLikeCardStatus,
  isCardOwner,
  isCardLikedByUser,
  getLikesCount,
};

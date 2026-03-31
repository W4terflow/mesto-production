/*
  Файл index.js является точкой входа в наше приложение
  и только он должен содержать логику инициализации нашего приложения
  используя при этом импорты из других файлов

  Из index.js не допускается что то экспортировать
*/

import { 
  getUserInfo, 
  setUserInfo, 
  updateAvatar, 
  getCardList, 
  addCard, 
  deleteCard, 
  changeLikeCardStatus,
  isCardOwner,
  isCardLikedByUser,
  getLikesCount
} from "./components/api.js";
import { createCardElement } from "./components/card.js";
import { openModalWindow, closeModalWindow, setCloseModalWindowEventListeners } from "./components/modal.js";

console.log('=== ДИАГНОСТИКА ===');
console.log('URL страницы:', window.location.href);
console.log('VITE_API_TOKEN:', import.meta.env.VITE_API_TOKEN ? 'есть' : 'нет');
console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);

// Глобальная переменная для хранения ID текущего пользователя
let currentUserId = null;

// DOM узлы
const placesWrap = document.querySelector(".places__list");
const profileFormModalWindow = document.querySelector(".popup_type_edit");
const profileForm = profileFormModalWindow.querySelector(".popup__form");
const profileTitleInput = profileForm.querySelector(".popup__input_type_name");
const profileDescriptionInput = profileForm.querySelector(".popup__input_type_description");

const cardFormModalWindow = document.querySelector(".popup_type_new-card");
const cardForm = cardFormModalWindow.querySelector(".popup__form");
const cardNameInput = cardForm.querySelector(".popup__input_type_card-name");
const cardLinkInput = cardForm.querySelector(".popup__input_type_url");

const imageModalWindow = document.querySelector(".popup_type_image");
const imageElement = imageModalWindow.querySelector(".popup__image");
const imageCaption = imageModalWindow.querySelector(".popup__caption");

const openProfileFormButton = document.querySelector(".profile__edit-button");
const openCardFormButton = document.querySelector(".profile__add-button");

const profileTitle = document.querySelector(".profile__title");
const profileDescription = document.querySelector(".profile__description");
const profileAvatar = document.querySelector(".profile__image");

const avatarFormModalWindow = document.querySelector(".popup_type_edit-avatar");
const avatarForm = avatarFormModalWindow.querySelector(".popup__form");
const avatarInput = avatarForm.querySelector(".popup__input");

// ========== ОБРАБОТЧИКИ ДЛЯ КАРТОЧЕК ==========

const handlePreviewPicture = ({ name, link }) => {
  imageElement.src = link;
  imageElement.alt = name;
  imageCaption.textContent = name;
  openModalWindow(imageModalWindow);
};

const handleLikeClick = (cardId, likeButton, likeCountElement, isLiked) => {
  changeLikeCardStatus(cardId, isLiked)
    .then((updatedCard) => {
      // Обновляем состояние лайка
      const newIsLiked = isCardLikedByUser(updatedCard, currentUserId);
      
      // Меняем иконку лайка
      if (newIsLiked) {
        likeButton.classList.add("card__like-button_is-active");
      } else {
        likeButton.classList.remove("card__like-button_is-active");
      }
      
      // Обновляем счётчик лайков
      likeCountElement.textContent = getLikesCount(updatedCard);
    })
    .catch((err) => {
      console.log("Ошибка при изменении лайка:", err);
    });
};

const handleDeleteCardClick = (cardId, cardElement) => {
  deleteCard(cardId)
    .then(() => {
      cardElement.remove();
    })
    .catch((err) => {
      console.log("Ошибка при удалении карточки:", err);
    });
};

// Функция для отрисовки карточки
const renderCard = (cardData) => {
  const cardElement = createCardElement(
    cardData,
    {
      onPreviewPicture: handlePreviewPicture,
      onLikeClick: handleLikeClick,
      onDeleteClick: handleDeleteCardClick,
    },
    currentUserId,
    isCardOwner(cardData, currentUserId),
    isCardLikedByUser(cardData, currentUserId)
  );
  placesWrap.append(cardElement);
};

// ========== ОБРАБОТЧИКИ ФОРМ ==========

const handleProfileFormSubmit = (evt) => {
  evt.preventDefault();
  
  const submitButton = evt.submitter;
  const originalText = submitButton.textContent;
  
  // Меняем текст кнопки и блокируем её
  submitButton.textContent = "Сохранение...";
  submitButton.disabled = true;
  
  setUserInfo({
    name: profileTitleInput.value,
    about: profileDescriptionInput.value,
  })
    .then((userData) => {
      profileTitle.textContent = userData.name;
      profileDescription.textContent = userData.about;
      closeModalWindow(profileFormModalWindow);
    })
    .catch((err) => {
      console.log("Ошибка при обновлении профиля:", err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    });
};

const handleAvatarFormSubmit = (evt) => {
  evt.preventDefault();
  
  const submitButton = evt.submitter;
  const originalText = submitButton.textContent;
  
  submitButton.textContent = "Сохранение...";
  submitButton.disabled = true;
  
  updateAvatar({ avatar: avatarInput.value })
    .then((userData) => {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      closeModalWindow(avatarFormModalWindow);
    })
    .catch((err) => {
      console.log("Ошибка при обновлении аватара:", err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    });
};

const handleCardFormSubmit = (evt) => {
  evt.preventDefault();
  
  const submitButton = evt.submitter;
  const originalText = submitButton.textContent;
  
  console.log('📝 Текущий userId:', currentUserId);

  submitButton.textContent = "Создание...";
  submitButton.disabled = true;
  
  addCard({
    name: cardNameInput.value,
    link: cardLinkInput.value,
  })
    .then((newCard) => {
      const cardElement = createCardElement(
        newCard,
        {
          onPreviewPicture: handlePreviewPicture,
          onLikeClick: handleLikeClick,
          onDeleteClick: handleDeleteCardClick,
        },
        currentUserId,
        isCardOwner(newCard, currentUserId),
        isCardLikedByUser(newCard, currentUserId)
      );
      placesWrap.prepend(cardElement);
      closeModalWindow(cardFormModalWindow);
      cardForm.reset();
    })
    .catch((err) => {
      console.log("Ошибка при добавлении карточки:", err);
    })
    .finally(() => {
      submitButton.textContent = originalText;
      submitButton.disabled = false;
    });
};

// ========== ИНИЦИАЛИЗАЦИЯ ==========

console.log('🚀 Начинаем загрузку данных...');

// Загружаем данные пользователя
getUserInfo()
  .then((userData) => {
    console.log("✅ Данные пользователя загружены:", userData);
    console.log("  Имя:", userData.name);
    console.log("  Описание:", userData.about);
    console.log("  Аватар:", userData.avatar);
    console.log("  ID:", userData._id);
    
    currentUserId = userData._id;
    
    // Обновляем DOM
    profileTitle.textContent = userData.name;
    profileDescription.textContent = userData.about;
    
    if (profileAvatar) {
      profileAvatar.style.backgroundImage = `url(${userData.avatar})`;
      console.log("✅ Аватар обновлен на странице");
    }
  })
  .catch((err) => {
    console.error("❌ Ошибка загрузки пользователя:", err);
    // Показываем сообщение пользователю
    profileTitle.textContent = "Ошибка загрузки";
    profileDescription.textContent = "Не удалось загрузить профиль";
  });

// Загружаем карточки
getCardList()
  .then((cards) => {
    console.log("✅ Карточки загружены, количество:", cards?.length);
    
    if (cards && cards.length > 0) {
      console.log("Первая карточка:", cards[0]);
      cards.forEach((card, index) => {
        console.log(`  Отрисовка карточки ${index + 1}:`, card.name);
        renderCard(card);
      });
      console.log(`✅ Отрисовано ${cards.length} карточек`);
    } else {
      console.log("Нет карточек для отображения");
      // Показываем сообщение, что карточек нет
      const emptyMessage = document.createElement('li');
      emptyMessage.textContent = 'Пока нет карточек. Добавьте первую!';
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.padding = '40px';
      placesWrap.appendChild(emptyMessage);
    }
  })
  .catch((err) => {
    console.error("❌ Ошибка загрузки карточек:", err);
    // Показываем сообщение об ошибке
    const errorMessage = document.createElement('li');
    errorMessage.textContent = 'Не удалось загрузить карточки. Проверьте подключение.';
    errorMessage.style.color = 'red';
    errorMessage.style.textAlign = 'center';
    errorMessage.style.padding = '40px';
    placesWrap.appendChild(errorMessage);
  });


// ========== НАСТРОЙКА ОБРАБОТЧИКОВ СОБЫТИЙ ==========

profileForm.addEventListener("submit", handleProfileFormSubmit);
cardForm.addEventListener("submit", handleCardFormSubmit);
avatarForm.addEventListener("submit", handleAvatarFormSubmit);

openProfileFormButton.addEventListener("click", () => {
  profileTitleInput.value = profileTitle.textContent;
  profileDescriptionInput.value = profileDescription.textContent;
  openModalWindow(profileFormModalWindow);
});

profileAvatar.addEventListener("click", () => {
  avatarForm.reset();
  openModalWindow(avatarFormModalWindow);
});

openCardFormButton.addEventListener("click", () => {
  cardForm.reset();
  openModalWindow(cardFormModalWindow);
});

// Настраиваем обработчики закрытия попапов
const allPopups = document.querySelectorAll(".popup");
allPopups.forEach((popup) => {
  setCloseModalWindowEventListeners(popup);
});

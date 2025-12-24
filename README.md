# Westwood Frontend

Angular приложение с архитектурой, включающей NgRx, сервисы, guards и shared компоненты.

## Структура проекта

```
src/app/
├── core/                           # Основная бизнес-логика
│   ├── constants/                  # Константы (API endpoints)
│   ├── guards/                     # Route guards для авторизации
│   │   ├── auth.guard.ts          # Guard для защищенных маршрутов
│   │   └── guest.guard.ts         # Guard для публичных маршрутов
│   ├── interceptors/               # HTTP interceptors
│   ├── models/                     # Интерфейсы и модели данных
│   │   └── user.model.ts          # Модели пользователя и авторизации
│   ├── services/                   # Сервисы (API, бизнес-логика)
│   │   ├── auth.service.ts        # Сервис авторизации
│   │   ├── http-interceptor.service.ts  # HTTP interceptor для токенов
│   │   └── app-init.service.ts    # Сервис инициализации приложения
│   ├── store/                      # NgRx store
│   │   ├── auth/                   # Auth модуль
│   │   │   ├── auth.actions.ts    # Actions
│   │   │   ├── auth.reducer.ts    # Reducer
│   │   │   ├── auth.effects.ts    # Effects
│   │   │   ├── auth.selectors.ts  # Selectors
│   │   │   └── index.ts
│   │   ├── app.state.ts           # Глобальное состояние
│   │   ├── app.reducer.ts         # Корневой reducer
│   │   └── app.effects.ts         # Глобальные effects
│   └── utils/                      # Утилиты
│       └── storage.util.ts        # Работа с localStorage
│
├── shared/                          # Переиспользуемые компоненты
│   ├── components/                 # Общие компоненты
│   │   ├── button/                # Кнопка с различными стилями
│   │   ├── input/                 # Input с валидацией
│   │   ├── loader/                # Индикатор загрузки
│   │   └── index.ts
│   ├── directives/                 # Директивы
│   │   ├── click-outside.directive.ts
│   │   └── index.ts
│   └── pipes/                      # Пайпы
│       ├── truncate.pipe.ts
│       └── index.ts
│
├── layouts/                         # Макеты страниц
│   ├── main-layout/                # Основной макет
│   ├── header/                     # Хедер с навигацией
│   ├── footer/                     # Футер
│   └── sidebar/                    # Боковая панель навигации
│
└── features/                        # Feature модули
    ├── auth/                       # Авторизация
    │   ├── auth.routes.ts         # Маршруты модуля
    │   └── pages/
    │       ├── login-page/        # Страница входа
    │       └── register-page/     # Страница регистрации
    ├── home/                       # Главная страница
    │   └── pages/
    │       └── home-page/
    └── profile/                    # Профиль пользователя
        └── pages/
            └── profile-page/
```

## Технологии

- **Angular 17** (Standalone components)
- **NgRx** (Store, Effects, DevTools)
- **RxJS** (Реактивное программирование)
- **TypeScript** (Строгая типизация)

## Установка

```bash
npm install
```

## Запуск

```bash
npm start
```

Приложение будет доступно по адресу `http://localhost:4200`

## Основные особенности

### NgRx Store
- Разделение состояния на модули (auth)
- Actions, Reducers, Effects и Selectors для каждого модуля
- Интеграция с Redux DevTools

### Guards
- `authGuard` - защита маршрутов для авторизованных пользователей
- `guestGuard` - защита маршрутов для неавторизованных пользователей

### Сервисы
- `AuthService` - работа с авторизацией
- `AuthInterceptor` - HTTP interceptor для добавления токена

### Shared компоненты
- `ButtonComponent` - кнопка с различными стилями
- `InputComponent` - input с валидацией
- `LoaderComponent` - индикатор загрузки

## Архитектура

Проект следует принципам:
- Модульная архитектура
- Разделение ответственности
- Переиспользуемые компоненты
- Централизованное управление состоянием через NgRx
- Типобезопасность через TypeScript


# Angular Material - Кастомизация темы

## Как легко изменить графику приложения

Все настройки темы находятся в файле `src/styles.scss`.

### Быстрая смена цвета

В файле `src/styles.scss` найдите строку:

```scss
$primary-palette: mat.define-palette(mat.$indigo-palette);
```

И замените на любой из доступных цветов:

- `mat.$indigo-palette` - Синий (текущий)
- `mat.$blue-palette` - Голубой
- `mat.$teal-palette` - Бирюзовый (зеленоватый)
- `mat.$purple-palette` - Фиолетовый
- `mat.$pink-palette` - Розовый
- `mat.$amber-palette` - Янтарный
- `mat.$orange-palette` - Оранжевый
- `mat.$red-palette` - Красный
- `mat.$teal-palette` - Бирюзовый
- `mat.$cyan-palette` - Циан

Пример:
```scss
$primary-palette: mat.define-palette(mat.$green-palette); // Зеленая тема
```

### Темная тема

Чтобы переключиться на темную тему, замените:

```scss
$theme: mat.define-light-theme(...);
```

на:

```scss
$theme: mat.define-dark-theme(...);
```

### Кастомные цвета

Для создания полностью кастомной цветовой схемы, создайте свою палитру:

```scss
$custom-primary: (
  50: #e3f2fd,
  100: #bbdefb,
  // ... другие оттенки
  500: #2196f3, // Основной цвет
  // ... контрастные цвета для текста
);

$primary-palette: mat.define-palette($custom-primary);
```

### Используемые компоненты Angular Material

В sidebar используются следующие компоненты Material:

- `MatSidenav` - основной контейнер sidebar
- `MatList` - список навигационных элементов
- `MatIcon` - иконки (Material Icons)
- `MatButton` - кнопки
- `MatToolbar` - панель инструментов (header)
- `MatTooltip` - подсказки
- `MatDivider` - разделители

### Material Icons

Иконки используются из [Material Icons](https://fonts.google.com/icons). 

Доступные иконки: https://fonts.google.com/icons

Пример использования в меню:
```typescript
menuItems = [
  { label: 'Главная', icon: 'home', route: '/home' },
  { label: 'Профиль', icon: 'person', route: '/profile' },
  { label: 'Настройки', icon: 'settings', route: '/settings' }
]
```

### Преимущества Angular Material

1. **Единый стиль** - все компоненты следуют Material Design
2. **Легкая кастомизация** - меняйте тему в одном месте
3. **Готовые компоненты** - не нужно писать стили с нуля
4. **Адаптивность** - автоматическая поддержка мобильных устройств
5. **Accessibility** - встроенная поддержка доступности (ARIA)
6. **Анимации** - плавные переходы из коробки

### Дополнительные ресурсы

- [Angular Material Documentation](https://material.angular.io/)
- [Material Design Guidelines](https://material.io/design)
- [Material Icons](https://fonts.google.com/icons)


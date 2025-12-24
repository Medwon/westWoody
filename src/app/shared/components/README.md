# UI Компоненты

Полный набор переиспользуемых UI компонентов для проекта.

## Доступные компоненты

### 1. Button (Кнопка)
```typescript
import { ButtonComponent } from '@shared/components';

// Базовое использование
<app-button buttonType="primary">Нажми меня</app-button>

// С дополнительными опциями
<app-button 
  buttonType="primary" 
  size="large" 
  [loading]="isLoading"
  [disabled]="isDisabled"
  (onClick)="handleClick($event)">
  Сохранить
</app-button>

// Типы: 'primary' | 'secondary' | 'danger' | 'success' | 'outline' | 'ghost'
// Размеры: 'small' | 'medium' | 'large'
```

### 2. Input (Поле ввода)
```typescript
import { InputComponent } from '@shared/components';

// Базовое использование
<app-input 
  id="name"
  label="Имя"
  placeholder="Введите имя"
  [(ngModel)]="name"
></app-input>

// С валидацией
<app-input
  id="email"
  label="Email"
  type="email"
  placeholder="email@example.com"
  [required]="true"
  [errorMessage]="emailError"
  formControlName="email"
></app-input>

// С префиксом/суффиксом
<app-input
  id="price"
  label="Цена"
  type="number"
  prefix="$"
  suffix="USD"
  [showCharCount]="true"
  [maxLength]="100"
></app-input>
```

### 3. Card (Карточка)
```typescript
import { CardComponent } from '@shared/components';

// Базовое использование
<app-card>
  <p>Содержимое карточки</p>
</app-card>

// С заголовком
<app-card [showHeader]="true" headerText="Заголовок">
  <p>Содержимое</p>
</app-card>

// С шапкой и футером через ng-content
<app-card [hoverable]="true" [shadow]="true">
  <div cardHeader>
    <h3>Заголовок</h3>
  </div>
  <p>Содержимое</p>
  <div cardFooter>
    <app-button>Действие</app-button>
  </div>
</app-card>
```

### 4. Badge (Бейдж)
```typescript
import { BadgeComponent } from '@shared/components';

// Базовое использование
<app-badge badgeType="primary">Новое</app-badge>

// Разные типы
<app-badge badgeType="success">Успешно</app-badge>
<app-badge badgeType="danger">Ошибка</app-badge>
<app-badge badgeType="warning">Внимание</app-badge>

// С точкой
<app-badge badgeType="primary" [dot]="true">Новое</app-badge>

// Типы: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info'
// Размеры: 'small' | 'medium' | 'large'
```

### 5. IconButton (Иконковая кнопка)
```typescript
import { IconButtonComponent } from '@shared/components';

// Базовое использование
<app-icon-button icon="➕" (onClick)="addItem()"></app-icon-button>

// Разные типы
<app-icon-button 
  icon="🗑️" 
  iconButtonType="danger"
  size="large"
  tooltip="Удалить"
  (onClick)="delete()">
</app-icon-button>

// Типы: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
```

### 6. Tooltip (Подсказка)
```typescript
import { TooltipComponent } from '@shared/components';

// Базовое использование
<app-tooltip text="Это подсказка" position="top">
  <span>Наведите курсор</span>
</app-tooltip>

// Позиции: 'top' | 'bottom' | 'left' | 'right'
```

### 7. Table (Таблица)
```typescript
import { TableComponent, TableColumn } from '@shared/components';

// В компоненте
columns: TableColumn[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Имя', sortable: true },
  { key: 'status', label: 'Статус' }
];

data = [
  { id: 1, name: 'Иван', status: 'Активен' },
  { id: 2, name: 'Мария', status: 'Неактивен' }
];

// В шаблоне
<app-table 
  [columns]="columns"
  [data]="data"
  [striped]="true"
  [hoverable]="true"
  [bordered]="true"
  emptyMessage="Нет данных">
</app-table>
```

### 8. Skeleton (Скелетон загрузки)
```typescript
import { SkeletonComponent } from '@shared/components';

// Текст
<app-skeleton type="text" width="200px"></app-skeleton>

// Круг (для аватаров)
<app-skeleton type="circle" width="50px" height="50px"></app-skeleton>

// Прямоугольник
<app-skeleton type="rectangle" width="100%" height="200px"></app-skeleton>

// Типы: 'text' | 'circle' | 'rectangle'
```

### 9. Loader (Загрузчик)
```typescript
import { LoaderComponent } from '@shared/components';

// Полноэкранный overlay
<app-loader [visible]="isLoading" [text]="'Загрузка...'" [showText]="true"></app-loader>

// Инлайн загрузчик
<app-loader 
  [visible]="isLoading" 
  [overlay]="false"
  size="small">
</app-loader>

// Размеры: 'small' | 'medium' | 'large'
```

### 10. LoginForm (Форма входа)
```typescript
import { LoginFormComponent } from '@shared/components';

// В шаблоне
<app-login-form
  title="Вход в систему"
  subtitle="Введите ваши учетные данные"
  [loading]="isLoading"
  [showRememberMe]="true"
  [showForgotPassword]="true"
  [showRegisterLink]="true"
  (submitForm)="onLogin($event)"
  (forgotPassword)="onForgotPassword()"
  (registerClick)="onRegister()">
</app-login-form>

// В компоненте
onLogin(credentials: { email: string; password: string; rememberMe: boolean }) {
  console.log(credentials);
}
```

## Экспорт всех компонентов

Все компоненты экспортируются из `index.ts`:

```typescript
import { 
  ButtonComponent, 
  InputComponent, 
  CardComponent,
  BadgeComponent,
  IconButtonComponent,
  TooltipComponent,
  TableComponent,
  SkeletonComponent,
  LoaderComponent,
  LoginFormComponent
} from '@shared/components';
```

## Особенности

- Все компоненты являются **standalone**
- Полная поддержка **TypeScript** с типами
- **Кастомизируемые** через Input свойства
- **Accessible** (доступность)
- **Responsive** (адаптивные)
- Используют современный CSS с плавными переходами


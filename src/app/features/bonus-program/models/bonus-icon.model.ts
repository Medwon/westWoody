/**
 * Enum типов иконок для бонусных программ.
 * Используется для сохранения на бекенде и рендеринга в Angular.
 */
export enum BonusIconType {
  WALLET = 'wallet',
  PARTY = 'party',
  CAKE = 'cake',
  SHARE = 'share',
  GIFT = 'gift',
  PERCENT = 'percent',
  HEART = 'heart',
  TROPHY = 'trophy'
}

/**
 * Интерфейс для описания иконки бонусной программы
 */
export interface BonusIconConfig {
  id: BonusIconType;
  label: string;
  svg: string;
}

/**
 * Маппинг типов иконок на их SVG-представление
 */
export const BONUS_ICON_SVG_MAP: Record<BonusIconType, string> = {
  [BonusIconType.WALLET]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
    <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" stroke-width="1.2"/>
    <path d="M16 12h2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M2 10h20" stroke="currentColor" stroke-width="1.2"/>
  </svg>`,

  [BonusIconType.PARTY]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
    <path d="M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6L12 2z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
  </svg>`,

  [BonusIconType.CAKE]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
    <path d="M20 21H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1z" stroke="currentColor" stroke-width="1.2"/>
    <path d="M3 16h18" stroke="currentColor" stroke-width="1.2"/>
    <path d="M12 12V9m-4 3V10m8 2V10" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
    <circle cx="8" cy="6" r="1" stroke="currentColor" stroke-width="1.2"/>
    <circle cx="12" cy="6" r="1" stroke="currentColor" stroke-width="1.2"/>
    <circle cx="16" cy="6" r="1" stroke="currentColor" stroke-width="1.2"/>
  </svg>`,

  [BonusIconType.SHARE]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
    <circle cx="18" cy="5" r="2.5" stroke="currentColor" stroke-width="1.2"/>
    <circle cx="6" cy="12" r="2.5" stroke="currentColor" stroke-width="1.2"/>
    <circle cx="18" cy="19" r="2.5" stroke="currentColor" stroke-width="1.2"/>
    <path d="M8.5 13.5l7 4M15.5 6.5l-7 4" stroke="currentColor" stroke-width="1.2"/>
  </svg>`,

  [BonusIconType.GIFT]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
    <path d="M20 12v9H4v-9" stroke="currentColor" stroke-width="1.2"/>
    <rect x="2" y="7" width="20" height="5" rx="1" stroke="currentColor" stroke-width="1.2"/>
    <path d="M12 22V7" stroke="currentColor" stroke-width="1.2"/>
    <path d="M12 7c-2-2-4-2.5-4-4.5a2 2 0 0 1 4 0c0 1.5-2 2-4 4.5" stroke="currentColor" stroke-width="1.2"/>
    <path d="M12 7c2-2 4-2.5 4-4.5a2 2 0 0 0-4 0c0 1.5 2 2 4 4.5" stroke="currentColor" stroke-width="1.2"/>
  </svg>`,

  [BonusIconType.PERCENT]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
    <circle cx="9" cy="9" r="2" stroke="currentColor" stroke-width="1.2"/>
    <circle cx="15" cy="15" r="2" stroke="currentColor" stroke-width="1.2"/>
    <path d="M5 19L19 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`,

  [BonusIconType.HEART]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="1.2"/>
  </svg>`,

  [BonusIconType.TROPHY]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
    <path d="M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2" stroke="currentColor" stroke-width="1.2"/>
    <path d="M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2" stroke="currentColor" stroke-width="1.2"/>
    <path d="M12 15a6 6 0 0 0 6-6V3H6v6a6 6 0 0 0 6 6z" stroke="currentColor" stroke-width="1.2"/>
    <path d="M12 15v3m-4 3h8m-6 0v-3m4 3v-3" stroke="currentColor" stroke-width="1.2"/>
  </svg>`
};

/**
 * Маппинг типов иконок на их человекочитаемые названия (на русском)
 */
export const BONUS_ICON_LABELS: Record<BonusIconType, string> = {
  [BonusIconType.WALLET]: 'Кошелёк',
  [BonusIconType.PARTY]: 'Звезда',
  [BonusIconType.CAKE]: 'Торт',
  [BonusIconType.SHARE]: 'Поделиться',
  [BonusIconType.GIFT]: 'Подарок',
  [BonusIconType.PERCENT]: 'Процент',
  [BonusIconType.HEART]: 'Сердце',
  [BonusIconType.TROPHY]: 'Трофей'
};

/**
 * Список всех доступных иконок для выбора
 */
export const AVAILABLE_BONUS_ICONS: BonusIconConfig[] = Object.values(BonusIconType).map(iconType => ({
  id: iconType,
  label: BONUS_ICON_LABELS[iconType],
  svg: BONUS_ICON_SVG_MAP[iconType]
}));

/**
 * Получить SVG иконки по типу
 */
export function getBonusIconSvg(iconType: BonusIconType): string {
  return BONUS_ICON_SVG_MAP[iconType] ?? BONUS_ICON_SVG_MAP[BonusIconType.GIFT];
}

/**
 * Получить label иконки по типу
 */
export function getBonusIconLabel(iconType: BonusIconType): string {
  return BONUS_ICON_LABELS[iconType] ?? BONUS_ICON_LABELS[BonusIconType.GIFT];
}

/**
 * Проверить, является ли строка валидным типом иконки
 */
export function isValidBonusIconType(value: string): value is BonusIconType {
  return Object.values(BonusIconType).includes(value as BonusIconType);
}

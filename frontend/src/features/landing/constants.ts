import { APP_ROUTES } from '../../shared/constants';
import type { FooterGroup } from './types';

// Anchors of the landing sections: the header, the footer and the sections themselves use the same ids.
export const LANDING_SECTION_ID = {
  TOP: 'top',
  CALCULATOR: 'calc',
  HOW_IT_WORKS: 'how',
  TRACKING: 'tracking',
  FEATURES: 'features',
  FAQ: 'faq',
} as const;

export const LANDING_NAV_ITEMS = [
  { id: LANDING_SECTION_ID.CALCULATOR, label: 'Расчёт' },
  { id: LANDING_SECTION_ID.HOW_IT_WORKS, label: 'Как это работает' },
  { id: LANDING_SECTION_ID.TRACKING, label: 'Отслеживание' },
  { id: LANDING_SECTION_ID.FEATURES, label: 'Возможности' },
  { id: LANDING_SECTION_ID.FAQ, label: 'Вопросы' },
] as const;

export const LANDING_TEXTS = {
  LOGO_LABEL: 'SwiftDrop, на главную',
  NAV_LABEL: 'Разделы страницы',
  SIGN_IN: 'Войти',
  SIGN_UP: 'Регистрация',
  PROFILE: 'Профиль',
  OPEN_MENU: 'Открыть меню',
  CLOSE_MENU: 'Закрыть меню',
  HERO_TITLE: 'Курьерская доставка по городу, которую видно на карте',
  FOOTER_TAGLINE: 'Курьерская доставка по городу с отслеживанием на карте.',
  COPYRIGHT_OWNER: 'SwiftDrop',
} as const;

// Footer: the column titles and links of the desktop layout.
export const LANDING_FOOTER_GROUPS: readonly FooterGroup[] = [
  {
    title: 'Сервис',
    links: [
      { label: 'Расчёт стоимости', anchor: LANDING_SECTION_ID.CALCULATOR, showOnMobile: true },
      { label: 'Как это работает', anchor: LANDING_SECTION_ID.HOW_IT_WORKS, showOnMobile: true },
      { label: 'Отслеживание', anchor: LANDING_SECTION_ID.TRACKING, showOnMobile: false },
      { label: 'Возможности', anchor: LANDING_SECTION_ID.FEATURES, showOnMobile: false },
    ],
  },
  {
    title: 'Аккаунт',
    links: [
      { label: 'Войти', route: APP_ROUTES.AUTH, showOnMobile: false },
      // The page for creating an order does not exist yet, so for now the link leads to the sign-in.
      { label: 'Оформить заказ', route: APP_ROUTES.AUTH, showOnMobile: false },
      { label: 'Вопросы', anchor: LANDING_SECTION_ID.FAQ, showOnMobile: true },
    ],
  },
  {
    title: 'Документы',
    links: [
      { label: 'Условия использования', route: APP_ROUTES.TERMS, showOnMobile: true },
      { label: 'Политика конфиденциальности', route: APP_ROUTES.PRIVACY, showOnMobile: true },
    ],
  },
];

// Mobile menu
export const LANDING_MOBILE_MENU_ID = 'landing-mobile-menu';
// The same single breakpoint as `lg` in index.css (1024px).
export const LANDING_DESKTOP_MEDIA_QUERY = '(min-width: 64rem)';
export const ESCAPE_KEY = 'Escape';

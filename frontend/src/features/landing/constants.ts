import { APP_ROUTES } from '../../shared/constants';
import { AUTH_TAB, AUTH_TAB_QUERY_PARAM } from '../auth/constants';
import type { FooterGroup, RoutePointKind } from './types';

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

// Sign-up opens the auth page on its registration tab.
export const LANDING_SIGN_UP_ROUTE = `${APP_ROUTES.AUTH}?${AUTH_TAB_QUERY_PARAM}=${AUTH_TAB.REGISTER}`;

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
  HERO_LEAD: 'Укажите адреса на карте, узнайте цену заранее и следите за курьером до самой двери.',
  ORDER: 'Оформить заказ',
  HOW_IT_WORKS: 'Как это работает',
  CALC_TITLE: 'Рассчитайте стоимость',
  CALC_SUBTITLE: 'Результат обновляется по мере ввода.',
  CALC_CAPTION: 'Точную цену покажем перед оплатой.',
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

// Route points
export const ROUTE_POINT = {
  PICKUP: 'pickup',
  DELIVERY: 'delivery',
} as const;

export const ROUTE_POINT_LABELS: Record<RoutePointKind, string> = {
  [ROUTE_POINT.PICKUP]: 'Откуда',
  [ROUTE_POINT.DELIVERY]: 'Куда',
};

// Map: the city center and the zoom range (12 shows the whole city core)
export const MAP_CENTER: [number, number] = [53.9006, 27.559];
export const MAP_ZOOM = {
  DEFAULT: 12,
  MIN: 9,
  MAX: 18,
} as const;

// Mapbox raster tiles (Static Tiles API) of its light and dark styles, one for each theme.
// A tile is 512px, so Leaflet has to shift the zoom by -1.
export const MAP_TILES = {
  BASE_URL: 'https://api.mapbox.com/styles/v1',
  LIGHT_STYLE: 'mapbox/light-v11',
  DARK_STYLE: 'mapbox/dark-v11',
  TILE_SIZE: 512,
  ZOOM_OFFSET: -1,
} as const;

export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noreferrer">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>';

// A marker is a 10px dot (design system, section 15) inside a 44px touch area.
export const MAP_MARKER_HIT_SIZE = 44;
// Distance from the marker center to the tag above it.
export const MAP_MARKER_TAG_OFFSET = 14;

// Class names used by route-map.css
export const MAP_CLASS = {
  MARKER: 'route-marker',
  DOT: 'route-marker__dot',
  DOT_PICKUP: 'route-marker__dot--pickup',
  DOT_DELIVERY: 'route-marker__dot--delivery',
  TAG: 'route-tag',
  LINE: 'route-line',
} as const;

export const MAP_TEXTS = {
  REGION_LABEL: 'Карта города: отметьте точки «Откуда» и «Куда»',
  HINT_PICKUP: 'Отметьте точку «Откуда»',
  HINT_DELIVERY: 'Отметьте точку «Куда»',
  ZOOM_IN: 'Приблизить',
  ZOOM_OUT: 'Отдалить',
  EXPAND: 'Развернуть карту',
  COLLAPSE: 'Свернуть карту',
  REMOVE_POINT: 'Убрать точку',
} as const;

export const ROUTE_POINT_ORDER = [ROUTE_POINT.PICKUP, ROUTE_POINT.DELIVERY] as const;

export const ADDRESS_PLACEHOLDER = 'Улица и номер дома';
// Shown while the address of a point set on the map is looked up, and when it has none.
export const POINT_ON_MAP_TEXT = 'Точка на карте';

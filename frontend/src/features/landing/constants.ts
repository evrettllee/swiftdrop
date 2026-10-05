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
  CTA: 'cta',
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

// Route points
export const ROUTE_POINT = {
  PICKUP: 'pickup',
  DELIVERY: 'delivery',
} as const;

export const ROUTE_POINT_LABELS: Record<RoutePointKind, string> = {
  [ROUTE_POINT.PICKUP]: 'Откуда',
  [ROUTE_POINT.DELIVERY]: 'Куда',
};

// Map: the zoom range (12 shows the whole city core)
export const MAP_ZOOM = {
  DEFAULT: 12,
  MIN: 9,
  MAX: 18,
  FOCUS: 15,
  FIT_MAX: 16,
} as const;

// Space between the points and the edge of the map when it is fitted to them: the tags and the
// controls must not cover the points.
export const MAP_FIT_PADDING = 64;
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

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

// The frame of the map in its place in the page; the placeholder of a missing map uses it too.
export const MAP_PLACED_CLASS =
  'absolute inset-0 overflow-hidden rounded-lg border border-border bg-field';

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
  UNAVAILABLE: 'Карта временно недоступна',
  // Shown to a developer only (the dev server), not to a visitor.
  UNAVAILABLE_DEV_HINT: 'Задайте VITE_MAPBOX_TOKEN в файле .env в корне репозитория.',
} as const;

export const ROUTE_POINT_ORDER = [ROUTE_POINT.PICKUP, ROUTE_POINT.DELIVERY] as const;

export const ADDRESS_PLACEHOLDER = 'Улица и номер дома';
// Shown while the address of a point set on the map is looked up, and when it has none.
export const POINT_ON_MAP_TEXT = 'Точка на карте';

export const HOW_IT_WORKS = {
  TITLE: 'Четыре шага от адреса до двери',
  LEAD: 'Заказ занимает пару минут. Дальше сервис сам подбирает курьера, а вы следите за доставкой.',
  LEAD_SHORT: 'Заказ занимает пару минут. Дальше сервис сам подбирает курьера.',
  // `shortText` is shown on a phone, `text` on a desktop.
  STEPS: [
    {
      title: 'Укажите адреса',
      text: 'Отметьте точки забора и доставки на карте и опишите посылку: вес, размеры, хрупкость.',
      shortText: 'Отметьте точки на карте и опишите посылку: вес, размеры, хрупкость.',
    },
    {
      title: 'Оплатите заказ',
      text: 'Платите банковской картой онлайн. Цена фиксируется при оформлении и после оплаты не меняется.',
      shortText: 'Банковской картой онлайн. Цена фиксируется при оформлении.',
    },
    {
      title: 'Курьер заберёт посылку',
      text: 'Заказ предлагается курьеру с подходящим транспортом, который быстрее всех доберётся до точки забора.',
      shortText: 'Заказ предлагается курьеру с подходящим транспортом.',
    },
    {
      title: 'Назовите код при получении',
      text: 'Получатель называет четырёхзначный код, курьер вводит его и подтверждает доставку.',
      shortText: 'Курьер вводит четырёхзначный код и подтверждает доставку.',
    },
  ],
} as const;

export const TRACKING = {
  TITLE: 'Курьер на карте в реальном времени',
  LEAD: 'Видно, где курьер, на каком этапе заказ и когда посылка будет у адресата.',
  MAP_LABEL: 'Карта: курьер движется к адресу доставки',
  FEATURES: [
    {
      id: 'eta',
      title: 'Время прибытия',
      text: 'Прогноз пересчитывается, пока курьер в пути.',
    },
    {
      id: 'position',
      title: 'Позиция на карте',
      text: 'Сколько минут осталось курьеру до адреса доставки.',
    },
    {
      id: 'chat',
      title: 'Чат по заказу',
      text: 'Договоритесь о деталях с курьером, не выходя из заказа.',
    },
  ],
  // An example order that only shows how the tracking looks, it is not real data.
  DEMO: {
    ORDER: 'Заказ №2847',
    DATE: '5 октября, 14:02',
    STATUS: 'В пути',
    ROUTE: 'пр-т Независимости, 18 → ул. Притыцкого, 29',
    COURIER_INITIALS: 'АК',
    COURIER_NAME: 'Артём К.',
    VEHICLE: 'Велосипед',
    RATING: '4,9',
    ARRIVAL_IN: '8 мин',
    ARRIVAL_AT: 'Курьер будет примерно в 14:32',
    MESSAGE: 'Написать',
  },
} as const;

export const FEATURES = {
  TITLE: 'Что умеет сервис',
  LEAD: 'Проверка транспорта, код при вручении, чат и повтор заказа работают без настройки.',
  TRANSPORT: {
    TITLE: 'Транспорт под вашу посылку',
    TEXT: 'Сервис сверяет вес и размеры с возможностями курьера. Тяжёлая или хрупкая посылка не достанется тому, кто её не довезёт.',
    TEXT_SHORT:
      'Сервис сверяет вес и размеры с возможностями курьера: пешком, велосипед, самокат, легковой, грузовой.',
    VEHICLES: [
      { id: 'walk', label: 'Пешком' },
      { id: 'bicycle', label: 'Велосипед' },
      { id: 'scooter', label: 'Самокат' },
      { id: 'car', label: 'Легковой' },
      { id: 'truck', label: 'Грузовой' },
    ],
    // The vehicle that is highlighted in the example.
    ACTIVE_VEHICLE: 'bicycle',
  },
  CODE: {
    TITLE: 'Код при вручении',
    TEXT: 'Посылка уходит получателю только после ввода кода.',
    DIGITS: ['4', '8', '2', '7'],
  },
  CHAT: {
    TITLE: 'Чат с курьером',
    TEXT: 'Короткие ответы отправляются одним нажатием.',
    INCOMING: 'Я у двери',
    OUTGOING: 'Сейчас выйду',
  },
  REPEAT: {
    TITLE: 'Повтор заказа',
    TEXT: 'Прошлый заказ открывается в форме с теми же адресами и параметрами.',
    ORDER: '№2831',
    STATUS: 'Доставлен',
    ACTION: 'Повторить',
  },
  RATING: {
    TITLE: 'Оценка курьера',
    TEXT: 'После доставки поставьте оценку: она войдёт в рейтинг курьера.',
    VALUE: 4,
    MAX: 5,
    LABEL: 'Оценка 4 из 5',
  },
} as const;

export const FAQ = {
  TITLE: 'Частые вопросы',
  OPEN_BY_DEFAULT_INDEX: 0,
  ITEMS: [
    {
      id: 'price',
      question: 'Как считается стоимость?',
      answer:
        'Цена зависит от расстояния по маршруту, веса и размеров посылки, за хрупкую посылку есть доплата. При высоком спросе цена может вырасти, причину мы покажем до оплаты.',
    },
    {
      id: 'courier',
      question: 'Какой курьер получит мой заказ?',
      answer:
        'Система сама выбирает свободного курьера, который быстрее всего довезёт посылку и чей транспорт подходит по весу и размерам. Курьеру предлагают заказ на 30 секунд. Если он не ответил, предложение уходит следующему. Если никто не взял заказ, его назначит менеджер.',
    },
    {
      id: 'zone',
      question: 'Что, если адрес вне зоны обслуживания?',
      answer:
        'Забрать и доставить посылку можно только в пределах зон обслуживания. Если один из адресов за их границей, расчёт покажет об этом сообщение, и заказ оформить не получится.',
    },
    {
      id: 'cancel',
      question: 'Можно ли отменить заказ?',
      answer:
        'Да, заказ можно отменить в личном кабинете. Там же его можно повторить, если нужна такая же доставка ещё раз.',
    },
    {
      id: 'code',
      question: 'Зачем нужен код при получении?',
      answer:
        'Это четыре цифры, которые вы видите в заказе. Курьер вводит их при вручении, и только после этого доставка считается завершённой. Так посылку не отдадут не тому человеку.',
    },
  ],
} as const;

export const CTA_TEXTS = {
  TITLE: 'Оформите первый заказ',
  LEAD: 'Войдите через Google или Яндекс либо создайте аккаунт по почте.',
  LEAD_EXTRA: 'Адреса и посылку можно указать сразу после входа.',
  BUTTON: 'Оформить заказ',
} as const;

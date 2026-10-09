import { UI_TEXTS } from '@/shared/config';

// The header, the mobile menu and the footer name the sections the same way.
export const SECTION_LABELS = {
  CALCULATOR: 'Расчёт',
  HOW_IT_WORKS: 'Как это работает',
  TRACKING: 'Отслеживание',
  FEATURES: 'Возможности',
  FAQ: 'Вопросы',
} as const;

export const LANDING_TEXTS = {
  NAV_LABEL: 'Разделы страницы',
  SIGN_IN: UI_TEXTS.SIGN_IN,
  SIGN_UP: UI_TEXTS.SIGN_UP,
  PROFILE: UI_TEXTS.PROFILE,
  OPEN_MENU: 'Открыть меню',
  CLOSE_MENU: 'Закрыть меню',
  HERO_TITLE: 'Курьерская доставка по городу, которую видно на карте',
  FOOTER_TAGLINE: 'Курьерская доставка по городу с отслеживанием на карте.',
  COPYRIGHT_SIGN: '©',
  COPYRIGHT_OWNER: 'SwiftDrop',
  HERO_LEAD: 'Укажите адреса на карте, узнайте цену заранее и следите за курьером до самой двери.',
  ORDER: 'Оформить заказ',
  HOW_IT_WORKS: SECTION_LABELS.HOW_IT_WORKS,
  CALC_TITLE: 'Рассчитайте стоимость',
  CALC_SUBTITLE: 'Результат обновляется по мере ввода.',
  CALC_CAPTION: 'Точную цену покажем перед оплатой.',
} as const;

// The price block of the calculator
export const CALCULATOR_TEXTS = {
  ESTIMATE_LABEL: 'Ориентировочная стоимость',
  IN_ZONE: 'Оба адреса в зоне обслуживания',
  APPROX: '≈',
  DISTANCE_SUFFIX: 'км по маршруту',
  DURATION_SUFFIX: 'мин в пути',
} as const;

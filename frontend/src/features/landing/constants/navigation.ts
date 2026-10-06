import { APP_ROUTES } from '../../../shared/constants/routes';
import { UI_TEXTS } from '../../../shared/constants/texts';
import { AUTH_TAB, AUTH_TAB_QUERY_PARAM } from '../../auth/constants/page';
import type { FooterGroup } from '../types';
import { LANDING_TEXTS, SECTION_LABELS } from './texts';

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
  { id: LANDING_SECTION_ID.CALCULATOR, label: SECTION_LABELS.CALCULATOR },
  { id: LANDING_SECTION_ID.HOW_IT_WORKS, label: SECTION_LABELS.HOW_IT_WORKS },
  { id: LANDING_SECTION_ID.TRACKING, label: SECTION_LABELS.TRACKING },
  { id: LANDING_SECTION_ID.FEATURES, label: SECTION_LABELS.FEATURES },
  { id: LANDING_SECTION_ID.FAQ, label: SECTION_LABELS.FAQ },
] as const;

// Sign-up opens the auth page on its registration tab.
export const LANDING_SIGN_UP_ROUTE = `${APP_ROUTES.AUTH}?${AUTH_TAB_QUERY_PARAM}=${AUTH_TAB.REGISTER}`;

// Footer: the column titles and links of the desktop layout.
export const LANDING_FOOTER_GROUPS: readonly FooterGroup[] = [
  {
    title: 'Сервис',
    links: [
      { label: 'Расчёт стоимости', anchor: LANDING_SECTION_ID.CALCULATOR, showOnMobile: true },
      {
        label: SECTION_LABELS.HOW_IT_WORKS,
        anchor: LANDING_SECTION_ID.HOW_IT_WORKS,
        showOnMobile: true,
      },
      { label: SECTION_LABELS.TRACKING, anchor: LANDING_SECTION_ID.TRACKING, showOnMobile: false },
      { label: SECTION_LABELS.FEATURES, anchor: LANDING_SECTION_ID.FEATURES, showOnMobile: false },
    ],
  },
  {
    title: 'Аккаунт',
    links: [
      { label: LANDING_TEXTS.SIGN_IN, route: APP_ROUTES.AUTH, showOnMobile: false },
      // The page for creating an order does not exist yet, so for now the link leads to the sign-in.
      { label: LANDING_TEXTS.ORDER, route: APP_ROUTES.AUTH, showOnMobile: false },
      { label: SECTION_LABELS.FAQ, anchor: LANDING_SECTION_ID.FAQ, showOnMobile: true },
    ],
  },
  {
    title: 'Документы',
    links: [
      { label: UI_TEXTS.TERMS_TITLE, route: APP_ROUTES.TERMS, showOnMobile: true },
      { label: UI_TEXTS.PRIVACY_TITLE, route: APP_ROUTES.PRIVACY, showOnMobile: true },
    ],
  },
];

export const STAND = {
  FRONTEND_PORT: 5174,
  BACKEND_PORT: 8081,
  COURIER_EMAIL: 'stand-courier@swiftdrop.test',
  COURIER_PASSWORD: 'Stand-Courier-2026',
  WEBHOOK_SECRET: 'whsec_swiftdrop_e2e_stand',
} as const;

export const STAND_FRONTEND_URL = `http://localhost:${STAND.FRONTEND_PORT}`;
export const STAND_BACKEND_URL = `http://localhost:${STAND.BACKEND_PORT}`;

export const STAND_ENV = {
  E2E_COURIER_EMAIL: STAND.COURIER_EMAIL,
  E2E_COURIER_PASSWORD: STAND.COURIER_PASSWORD,
  E2E_STRIPE_WEBHOOK_SECRET: STAND.WEBHOOK_SECRET,
} as const;

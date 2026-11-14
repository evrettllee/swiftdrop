export const SERVICE_NAME_VALUES = ['osrm', 'nbrb', 'mail', 'stripe', 'server'] as const;

export type ServiceName = (typeof SERVICE_NAME_VALUES)[number];

export const SERVICE_NAME = {
  OSRM: 'osrm',
  NBRB: 'nbrb',
  MAIL: 'mail',
  STRIPE: 'stripe',
  SERVER: 'server',
} as const satisfies Record<string, ServiceName>;

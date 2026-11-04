export const ORDER_OUTCOME_TEXTS = {
  deliveredAt: (time: string) => `Доставлен в ${time}`,
  cancelledByStaff: (time: string, name: string) => `Отменён сотрудником в ${time}, ${name}`,
  cancelledByClient: (time: string) => `Отменён клиентом в ${time}`,
  cancelledBySystem: (time: string) => `Отменён автоматически в ${time}`,
  cancelledAt: (time: string) => `Отменён в ${time}`,
} as const;

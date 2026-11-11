export const CHAT_TEXTS = {
  MESSAGES: 'Сообщения',
  EMPTY: 'Сообщений пока нет',
  QUICK_REPLIES: 'Быстрые ответы',
  PLACEHOLDER: 'Сообщение',
  CLOSE: 'Закрыть чат',
  BACK: 'К заказу',
  CLOSED: 'Заказ завершён, писать больше нельзя',
  SEND_FAILED: 'Не удалось отправить сообщение. Попробуйте ещё раз',
  REPLY: 'Ответить',
  incoming: (text: string) => `Новое сообщение: ${text}`,
} as const;

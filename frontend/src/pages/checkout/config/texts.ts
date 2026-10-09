import { NAME_MAX_LENGTH, NAME_MIN_LENGTH, PHONE_EXAMPLE } from '@/shared/lib/person-validation';
import { APARTMENT_MAX_LENGTH } from './checkout-form';

export const CHECKOUT_TEXTS = {
  PAGE_TITLE: 'Новый заказ',
  SECTION_ROUTE: 'Маршрут',
  SECTION_RECIPIENT: 'Получатель',
  SECTION_PACKAGE: 'Посылка',
  SECTION_SUMMARY: 'Стоимость',
  APARTMENT: 'Квартира или офис',
  APARTMENT_PLACEHOLDER: 'Необязательно',
  RECIPIENT_NAME: 'Имя и фамилия',
  RECIPIENT_PHONE: 'Телефон',
  SUBMIT: 'Перейти к оплате',
  demandTitle: (coefficient: string) => `Повышенный спрос ×${coefficient}`,
  DEMAND_TEXT:
    'Сейчас много заказов, поэтому цена выше обычной. Коэффициент закрепится за заказом на момент оплаты.',
  ADDRESS_REQUIRED: 'Выберите адрес из подсказок или отметьте точку на карте',
  HOUSE_REQUIRED: 'Выберите адрес с номером дома',
  PACKAGE_INVALID: 'Проверьте вес и размеры посылки',
} as const;

export const CHECKOUT_VALIDATION_MESSAGES = {
  RECIPIENT_NAME_REQUIRED: 'Введите имя и фамилию получателя',
  RECIPIENT_NAME_TOO_SHORT: `Имя получателя должно содержать минимум ${NAME_MIN_LENGTH} символа`,
  RECIPIENT_NAME_TOO_LONG: `Имя получателя должно содержать не больше ${NAME_MAX_LENGTH} символов`,
  RECIPIENT_NAME_INVALID: 'Имя получателя может содержать только буквы, пробел, дефис и апостроф',
  RECIPIENT_PHONE_REQUIRED: 'Введите телефон получателя',
  RECIPIENT_PHONE_INVALID: `Введите номер полностью, например ${PHONE_EXAMPLE}`,
  APARTMENT_TOO_LONG: `Квартира или офис: не больше ${APARTMENT_MAX_LENGTH} символов`,
} as const;

export const COURIER_VEHICLE_TEXTS = {
  PAGE_TITLE: 'Ваш транспорт',
  NO_VEHICLE: 'Укажите транспорт, чтобы выйти на линию',
  TYPE_LEGEND: 'Тип транспорта',
  REGISTRATION_TITLE: 'Автомобиль',
  BRAND: 'Марка',
  MODEL: 'Модель',
  LICENSE_PLATE: 'Госномер',
  LICENSE_PLATE_HINT: 'Как на номерном знаке, например 1234 AB-7',
  SUBMIT: 'Сохранить транспорт',
  NO_FRAGILE: 'Без хрупких посылок',
  weightLimit: (kilograms: number) => `до ${kilograms} кг`,
} as const;

// The same texts as the validation of the backend, so a message does not change after the request.
export const VEHICLE_VALIDATION_MESSAGES = {
  TYPE_INVALID: 'Выберите тип транспорта',
  BRAND_REQUIRED: 'Укажите марку',
  brandTooLong: (max: number) => `Марка должна содержать не больше ${max} символов`,
  MODEL_REQUIRED: 'Укажите модель',
  modelTooLong: (max: number) => `Модель должна содержать не больше ${max} символов`,
  PLATE_REQUIRED: 'Укажите госномер',
  PLATE_INVALID: 'Введите госномер как на номерном знаке, например 1234 AB-7',
} as const;

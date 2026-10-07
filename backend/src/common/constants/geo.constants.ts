export const LATITUDE_MIN = -90;
export const LATITUDE_MAX = 90;
export const LONGITUDE_MIN = -180;
export const LONGITUDE_MAX = 180;

export const GEO_VALIDATION_MESSAGES = {
  LATITUDE_INVALID: `Широта должна быть числом от ${LATITUDE_MIN} до ${LATITUDE_MAX}`,
  LONGITUDE_INVALID: `Долгота должна быть числом от ${LONGITUDE_MIN} до ${LONGITUDE_MAX}`,
} as const;

import { BY_PHONE_FORMAT, BY_PHONE_PATTERN } from '../config/order-details-format';

// For example "+375 29 123-45-67"
export function formatPhone(phone: string): string {
  return phone.replace(BY_PHONE_PATTERN, BY_PHONE_FORMAT);
}

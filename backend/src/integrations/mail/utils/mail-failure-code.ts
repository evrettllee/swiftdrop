import { MailDeliveryError } from '../errors/mail-delivery.error';

export function mailFailureCodeOf(error: unknown): string {
  if (error instanceof MailDeliveryError) {
    return error.code;
  }

  return error instanceof Error ? error.name : typeof error;
}

export class MailDeliveryError extends Error {
  constructor(readonly code: string) {
    super(`Mail delivery failed: ${code}`);
    this.name = MailDeliveryError.name;
  }
}

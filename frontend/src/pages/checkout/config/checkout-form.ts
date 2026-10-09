// The names of the fields of the recipient form.
export const CHECKOUT_FIELD = {
  RECIPIENT_NAME: 'recipientName',
  RECIPIENT_PHONE: 'recipientPhone',
  PICKUP_APARTMENT: 'pickupApartment',
  DELIVERY_APARTMENT: 'deliveryApartment',
} as const;

// Must match APARTMENT_MAX_LENGTH of the backend (the addresses table).
export const APARTMENT_MAX_LENGTH = 20;

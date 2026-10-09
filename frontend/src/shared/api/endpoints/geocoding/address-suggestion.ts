import { z } from 'zod';

const contextNameSchema = z.object({ name: z.string() });

// The parts of the address that Mapbox v6 gives in `properties.context`. A street without a house
// has no `address`, a point outside a city may have no `place`; every part is optional.
const contextSchema = z
  .object({
    address: z
      .object({ address_number: z.string().optional(), street_name: z.string().optional() })
      .optional(),
    street: contextNameSchema.optional(),
    place: contextNameSchema.optional(),
    locality: contextNameSchema.optional(),
  })
  .optional();

// One feature of the Mapbox response, turned right away into a suggestion of ours.
export const addressSuggestionSchema = z
  .object({
    properties: z.object({
      mapbox_id: z.string(),
      name: z.string(),
      place_formatted: z.string().optional(),
      coordinates: z.object({ latitude: z.number(), longitude: z.number() }),
      context: contextSchema,
    }),
  })
  .transform(({ properties }) => ({
    id: properties.mapbox_id,
    // The street and the house number: this goes into the address field.
    name: properties.name,
    // The postcode and the city: this is shown under the name in the list of suggestions.
    details: properties.place_formatted ?? '',
    point: {
      latitude: properties.coordinates.latitude,
      longitude: properties.coordinates.longitude,
    },
    // The separate parts, which an order needs; null when Mapbox does not know a part.
    parts: {
      city: properties.context?.place?.name ?? properties.context?.locality?.name ?? null,
      street: properties.context?.address?.street_name ?? properties.context?.street?.name ?? null,
      house: properties.context?.address?.address_number ?? null,
    },
  }));

export type AddressSuggestion = z.infer<typeof addressSuggestionSchema>;

export type AddressParts = AddressSuggestion['parts'];

export const geocodingResponseSchema = z.object({
  features: z.array(addressSuggestionSchema),
});

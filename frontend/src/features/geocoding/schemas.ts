import { z } from 'zod';

// One feature of the Mapbox response, turned right away into a suggestion of ours.
export const addressSuggestionSchema = z
  .object({
    properties: z.object({
      mapbox_id: z.string(),
      name: z.string(),
      place_formatted: z.string().optional(),
      coordinates: z.object({ latitude: z.number(), longitude: z.number() }),
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
  }));

export type AddressSuggestion = z.infer<typeof addressSuggestionSchema>;

export const geocodingResponseSchema = z.object({
  features: z.array(addressSuggestionSchema),
});

// Settings of the client that come from the Vite env (the .env file in the repository root).
// The Mapbox token is public by design: the account limits it to our own addresses.
// Outside Vite (the end-to-end tests load the texts of the app in Node) there is no env at all.
export const MAPBOX_TOKEN: string = (import.meta.env?.VITE_MAPBOX_TOKEN ?? '').trim();

// Without the token the map and the address search cannot work, so they do not send requests.
export const IS_MAPBOX_CONFIGURED: boolean = MAPBOX_TOKEN !== '';

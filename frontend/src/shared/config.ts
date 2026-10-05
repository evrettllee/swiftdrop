// Settings of the client that come from the Vite env (the .env file in the repository root).
// The Mapbox token is public by design: the account limits it to our own addresses.
export const MAPBOX_TOKEN: string = import.meta.env.VITE_MAPBOX_TOKEN ?? '';

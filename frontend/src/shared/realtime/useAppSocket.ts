import { useLayoutEffect } from 'react';
import { connectAppSocket } from './app-socket';

// Keeps the socket open while the component is there (the cabinet of the courier: offers may come
// on any of its pages). A layout effect, so the status never shows the closed socket of the
// previous visit.
export function useAppSocket(): void {
  useLayoutEffect(() => connectAppSocket(), []);
}

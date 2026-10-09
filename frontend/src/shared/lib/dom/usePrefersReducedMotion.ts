import { useSyncExternalStore } from 'react';
import { REDUCED_MOTION_QUERY } from '@/shared/config';
import { matchesMediaQuery, subscribeToMediaQuery } from './media-query';

function subscribeToReducedMotion(onChange: () => void): () => void {
  return subscribeToMediaQuery(REDUCED_MOTION_QUERY, onChange);
}

function readReducedMotion(): boolean {
  return matchesMediaQuery(REDUCED_MOTION_QUERY);
}

// Leaflet animates zoom and moves in JavaScript, so the CSS `motion-reduce:` variant does not reach it.
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeToReducedMotion, readReducedMotion);
}

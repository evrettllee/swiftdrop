import { createHash, randomBytes } from 'node:crypto';
import {
  TOKEN_HASH_ALGORITHM,
  TOKEN_HASH_ENCODING,
  URL_SAFE_ENCODING,
} from '../constants/tokens.constants';

export function generateOpaqueToken(bytes: number): string {
  return randomBytes(bytes).toString(URL_SAFE_ENCODING);
}

export function hashOpaqueToken(token: string): string {
  return createHash(TOKEN_HASH_ALGORITHM).update(token).digest(TOKEN_HASH_ENCODING);
}

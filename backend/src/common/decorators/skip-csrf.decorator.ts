import { SetMetadata } from '@nestjs/common';
import { CSRF_SKIP_KEY } from '../constants/csrf.constants';

// For endpoints that are called by another server, not by a browser, and that check
// the sender in their own way, for example by a signature.
export const SkipCsrf = () => SetMetadata(CSRF_SKIP_KEY, true);

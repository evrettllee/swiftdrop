import { Skeleton } from '@/shared/ui/skeleton';
import { SET_PASSWORD_TEXTS } from '../config/texts';

export function LinkSkeleton() {
  return (
    <div
      role="status"
      aria-label={SET_PASSWORD_TEXTS.LOADING_LABEL}
      className="flex flex-col gap-4"
    >
      <Skeleton className="h-8 w-3/4 rounded-sm" />
      <Skeleton className="h-12 w-full rounded-sm" />
      <Skeleton className="h-11 w-full rounded-md" />
      <Skeleton className="h-11 w-full rounded-md" />
      <Skeleton className="h-11 w-full rounded-md" />
    </div>
  );
}

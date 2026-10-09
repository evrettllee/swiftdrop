import { Spinner } from '@/shared/ui/spinner';

export function PageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <Spinner />
    </div>
  );
}

import { Spinner } from '@/shared/ui/spinner';

// Fills the main area of a layout (a column) and stands in its center.
export function ContentLoader() {
  return (
    <div className="grid flex-1 place-items-center">
      <Spinner />
    </div>
  );
}

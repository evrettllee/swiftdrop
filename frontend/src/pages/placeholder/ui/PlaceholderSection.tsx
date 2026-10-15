import { PlaceholderContent } from './PlaceholderContent';

type PlaceholderSectionProps = {
  title: string;
  homeTo: string;
};

// A page that is not made yet, inside the frame of an account area: it fills the main area and
// stands in its center.
export function PlaceholderSection({ title, homeTo }: PlaceholderSectionProps) {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-4 text-center">
      <PlaceholderContent title={title} homeTo={homeTo} />
    </div>
  );
}

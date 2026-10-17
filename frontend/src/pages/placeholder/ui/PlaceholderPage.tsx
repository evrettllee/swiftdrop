import { PlaceholderContent } from './PlaceholderContent';

type PlaceholderPageProps = {
  title: string;
};

// A page that is not made yet, on its own, without a frame around it.
export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 py-8 text-center">
      <PlaceholderContent title={title} />
    </main>
  );
}

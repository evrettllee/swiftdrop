import { APP_ROUTES } from '../../shared/constants';
import { LinkButton } from '../../shared/ui/Button';
import { APP_TEXTS, PLACEHOLDER_TEXTS } from '../constants';

type PlaceholderPageProps = {
  title: string;
};

export function PlaceholderPage({ title }: PlaceholderPageProps) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-4 py-8 text-center">
      <h1 className="text-heading-md font-semibold">{title}</h1>
      <p className="text-fg-secondary">{PLACEHOLDER_TEXTS.HINT}</p>
      <LinkButton to={APP_ROUTES.HOME}>{APP_TEXTS.BACK_HOME}</LinkButton>
    </main>
  );
}
